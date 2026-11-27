# Records narration in a few big requests (many sentences each) and cuts the audio
# into one mp3 per sentence at the pauses between sentences.
# Raw chunk audio is kept in -ChunkDir, so cutting can be redone with -SplitOnly
# without new API requests. The API key is read from a file and never printed.
#
# Example: powershell -File tools\voice-batch.ps1 -Voice Iapetus -Index
param(
  [string]$Lines = 'tools\lines.json',
  [string]$OutDir = 'video\audio',
  [string]$ChunkDir = 'tools\chunks',
  [string]$Voice = 'Iapetus',
  [string]$Model = 'gemini-3.8-flash-tts',
  [string]$Style = 'Warm, clear and friendly male teacher explaining math to 11-12 year old children. Calm, moderate pace, natural intonation, precise standard Bulgarian pronunciation and word stress. Make a clear pause of about one second after every sentence.',
  [string]$KeyFile = 'E:\PROJECTS\gemini-key.txt',
  [int]$MaxChars = 1900,
  [int]$MaxRequests = 9,
  [string]$Chapters = '',
  [string]$CutFile = '',
  [switch]$SplitOnly,
  [switch]$Index
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$IC = [Globalization.CultureInfo]::InvariantCulture
$utf8 = New-Object Text.UTF8Encoding $false
$items = [IO.File]::ReadAllText((Resolve-Path $Lines), [Text.Encoding]::UTF8) | ConvertFrom-Json
New-Item -ItemType Directory -Force $OutDir, $ChunkDir | Out-Null
function F([double]$x) { return $x.ToString('0.###', $IC) }
$CutAt = @{}
if ($CutFile -and (Test-Path $CutFile)) {
  foreach ($l in (Get-Content $CutFile)) { if ($l -match '^\s*([0-9a-f]{8})\s+([\d\.]+)') { $CutAt[$Matches[1]] = [double]::Parse($Matches[2], $IC) } }
}
function Dur($f) { return [double]::Parse((& ffprobe -v error -show_entries format=duration -of csv=p=0 $f).Trim(), $IC) }

# ---------- API ----------
function Find-Audio($o) {
  if ($null -eq $o -or $o -is [string]) { return $null }
  if ($o -is [System.Collections.IEnumerable] -and -not ($o -is [System.Management.Automation.PSCustomObject])) {
    foreach ($x in $o) { $r = Find-Audio $x; if ($r) { return $r } }; return $null
  }
  if ($o -is [System.Management.Automation.PSCustomObject]) {
    foreach ($p in $o.PSObject.Properties) { if ($p.Name -eq 'data' -and $p.Value -is [string] -and $p.Value.Length -gt 2000) { return $p.Value } }
    foreach ($p in $o.PSObject.Properties) { $r = Find-Audio $p.Value; if ($r) { return $r } }
  }
  return $null
}
function Get-Speech($text) {
  $key = ([IO.File]::ReadAllText($KeyFile)).Trim()
  if ($Model -like 'gemini-2.5*' -or $Model -like '*-preview*') {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$($Model):generateContent"
    $body = @{ contents = @(@{ parts = @(@{ text = "Read the following Bulgarian text aloud, exactly as written. Delivery: $Style`n`n$text" }) }); generationConfig = @{ responseModalities = @('AUDIO'); speechConfig = @{ voiceConfig = @{ prebuiltVoiceConfig = @{ voiceName = $Voice } } } } }
  } else {
    $url = 'https://generativelanguage.googleapis.com/v1beta/interactions'
    $body = @{ model = $Model; input = @(@{ type = 'user_input'; content = @(@{ type = 'text'; text = $text; annotations = @(@{ type = 'speech_metadata'; style = $Style }) }) }); response_format = @{ type = 'audio' }; generation_config = @{ speech_config = @(@{ voice = $Voice }) } }
  }
  $bytes = $utf8.GetBytes(($body | ConvertTo-Json -Depth 12 -Compress))
  try {
    $res = Invoke-RestMethod -Method Post -Uri $url -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json; charset=utf-8' -Body $bytes -TimeoutSec 600
  } catch {
    $msg = $_.Exception.Message
    $r = $_.Exception.Response
    if ($r) { try { $sr = New-Object IO.StreamReader($r.GetResponseStream()); $msg = $sr.ReadToEnd() } catch {} }
    throw ('API error: ' + ($msg -replace [regex]::Escape($key), '***'))
  }
  $b64 = Find-Audio $res
  if (-not $b64) {
    $info = $res | ConvertTo-Json -Depth 8 -Compress
    if ($info.Length -gt 700) { $info = $info.Substring(0, 700) }
    throw ('No audio in response: ' + $info)
  }
  return [Convert]::FromBase64String($b64)
}

# ---------- cutting ----------
function Get-Silences($wav, $noise, $minDur) {
  $txt = cmd /c "ffmpeg -hide_banner -nostats -i `"$wav`" -af silencedetect=noise=$($noise)dB:d=$(F $minDur) -f null - 2>&1"
  $list = @(); $s = $null
  foreach ($l in $txt) {
    if ($l -match 'silence_start: ([\d\.]+)') { $s = [double]::Parse($Matches[1], $IC) }
    elseif ($l -match 'silence_end: ([\d\.]+) \| silence_duration: ([\d\.]+)' -and $null -ne $s) {
      $e = [double]::Parse($Matches[1], $IC); $list += [pscustomobject]@{ s = $s; e = $e; d = $e - $s; m = ($s + $e) / 2 }; $s = $null
    }
  }
  return $list
}
function Split-Chunk($wav, $group) {
  $N = $group.Count
  $total = Dur $wav
  if ($N -eq 1) { $cuts = @() } else {
    $all = @(Get-Silences $wav -42 0.12)
    $sp0 = 0.0; $sp1 = $total
    if ($all.Count -and $all[0].s -lt 0.05) { $sp0 = $all[0].e }
    if ($all.Count -and $all[-1].e -gt $total - 0.05) { $sp1 = $all[-1].s }
    $sil = @($all | Where-Object { $_.s -gt $sp0 + 0.2 -and $_.e -lt $sp1 - 0.2 })
    $M = $sil.Count
    if ($M -lt $N - 1) { throw "Only $M pauses found for $N sentences in $wav" }
    # Speaking rate: speech time without the N-1 longest pauses, spread over the characters.
    # Pauses also come after colons and commas, so the cut points are chosen by how well
    # each piece's length fits its sentence, not only by how long the pause is.
    $top = @($sil | Sort-Object d -Descending | Select-Object -First ($N - 1))
    $chars = 0; foreach ($g in $group) { $chars += $g.t.Length }
    $rate = ($sp1 - $sp0 - ($top | Measure-Object d -Sum).Sum) / $chars
    $X = New-Object double[] $N; for ($k = 0; $k -lt $N; $k++) { $X[$k] = $rate * $group[$k].t.Length + 0.1 }
    $S = New-Object double[] $M; $Ee = New-Object double[] $M; $B = New-Object double[] $M
    for ($j = 0; $j -lt $M; $j++) { $S[$j] = $sil[$j].s; $Ee[$j] = $sil[$j].e; $B[$j] = 3.0 * [Math]::Min($sil[$j].d, 1.0) }
    $W = 8.0; $neg = -1e18
    # pinned cuts: "<hash> <seconds>" lines in -CutFile mean "this sentence ends at the pause nearest to that time"
    $pin = New-Object int[] ($N - 1)
    for ($k = 0; $k -lt $N - 1; $k++) {
      $pin[$k] = -1
      if ($CutAt.ContainsKey($group[$k].h)) {
        $t = $CutAt[$group[$k].h]; $bd = 1e9
        for ($j = 0; $j -lt $M; $j++) { $dd = [Math]::Abs($sil[$j].m - $t); if ($dd -lt $bd) { $bd = $dd; $pin[$k] = $j } }
      }
    }
    $best = New-Object 'double[,]' ($N - 1), $M; $from = New-Object 'int[,]' ($N - 1), $M
    for ($k = 0; $k -lt $N - 1; $k++) {
      $lim = 5.0 * $X[$k] + 3.0
      for ($j = 0; $j -lt $M; $j++) {
        $bv = $neg; $ba = -1
        if ($pin[$k] -ge 0 -and $j -ne $pin[$k]) { $best[$k, $j] = $neg; $from[$k, $j] = -1; continue }
        if ($k -eq 0) {
          $d = $S[$j] - $sp0
          if ($d -gt 0.05 -and $d -lt $lim) { $l = [Math]::Log($d / $X[0]); $bv = -$W * $l * $l }
        } else {
          for ($jp = $j - 1; $jp -ge $k - 1; $jp--) {
            $d = $S[$j] - $Ee[$jp]
            if ($d -gt $lim) { break }
            $pv = $best[($k - 1), $jp]
            if ($pv -le $neg / 2 -or $d -le 0.05) { continue }
            $l = [Math]::Log($d / $X[$k]); $v = $pv - $W * $l * $l
            if ($v -gt $bv) { $bv = $v; $ba = $jp }
          }
        }
        if ($bv -gt $neg / 2) { $best[$k, $j] = $bv + $B[$j] } else { $best[$k, $j] = $neg }
        $from[$k, $j] = $ba
      }
    }
    $bj = -1; $bv = $neg
    for ($j = 0; $j -lt $M; $j++) {
      $pv = $best[($N - 2), $j]; $d = $sp1 - $Ee[$j]
      if ($pv -le $neg / 2 -or $d -le 0.05) { continue }
      $l = [Math]::Log($d / $X[$N - 1]); $v = $pv - $W * $l * $l
      if ($v -gt $bv) { $bv = $v; $bj = $j }
    }
    if ($bj -lt 0) { throw "No alignment found for $wav" }
    $pick = New-Object int[] ($N - 1); $j = $bj
    for ($k = $N - 2; $k -ge 0; $k--) { $pick[$k] = $j; $j = $from[$k, $j] }
    $cuts = @($pick | ForEach-Object { $sil[$_] })
  }
  $af = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
  $rows = @()
  for ($i = 0; $i -lt $N; $i++) {
    $a = 0; if ($i -gt 0) { $a = $cuts[$i - 1].m }
    $b = $total; if ($i -lt $N - 1) { $b = $cuts[$i].m }
    $mp3 = Join-Path $OutDir ($group[$i].h + '.mp3')
    & ffmpeg -y -loglevel error -ss (F $a) -to (F $b) -i $wav -af $af -ac 1 -ar 24000 -b:a 56k $mp3
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg cut failed" }
    $d = Dur $mp3
    $p = 0; if ($i -lt $N - 1) { $p = $cuts[$i].d }
    $rows += [pscustomobject]@{ h = $group[$i].h; d = $d; rate = $d / $group[$i].t.Length; pause = $p; t = $group[$i].t; a = $a; b = $b }
  }
  $med = ($rows | Sort-Object rate | Select-Object -Index ([int][Math]::Floor($rows.Count / 2))).rate
  $bad = 0
  foreach ($r in $rows) {
    $q = $r.rate / $med; $flag = ''
    if ($q -gt 1.5 -or $q -lt 0.6) { $flag = ' <== CHECK length'; $bad++ }
    elseif ($r.pause -gt 0 -and $r.pause -lt 0.3) { $flag = ' <== CHECK short pause'; $bad++ }
    $txt = $r.t; if ($txt.Length -gt 50) { $txt = $txt.Substring(0, 50) }
    Write-Host ("  {0}  {1,5}s  x{2}  pause {3}s  [{6}-{7}]  {4}{5}" -f $r.h, (F $r.d), (F $q), (F $r.pause), $txt, $flag, (F $r.a), (F $r.b))
  }
  return $bad
}

# ---------- plan chunks ----------
$want = $items
if ($Chapters) { $cs = $Chapters.Split(',') | ForEach-Object { [int]$_ }; $want = @($items | Where-Object { $cs -contains [int]$_.c }) }
$chunks = @(); $cur = @(); $len = 0
foreach ($it in $want) {
  $have = Test-Path (Join-Path $OutDir ($it.h + '.mp3'))
  if ($have -and -not $SplitOnly) { if ($cur.Count) { $chunks += , $cur; $cur = @(); $len = 0 }; continue }
  $newCh = $cur.Count -and [int]$cur[-1].c -ne [int]$it.c
  if ($cur.Count -and (($len + $it.t.Length -gt $MaxChars) -or ($newCh -and $len -gt $MaxChars * 0.55))) { $chunks += , $cur; $cur = @(); $len = 0 }
  $cur += $it; $len += $it.t.Length + 2
}
if ($cur.Count) { $chunks += , $cur }
Write-Host "Chunks: $($chunks.Count)  (sentences: $(($chunks | ForEach-Object { $_.Count }) -join ', '))"

$req = 0; $flags = 0; $quota = $false
if ($SplitOnly) {
  # re-cut every saved chunk: its name holds the first sentence hash and the sentence count
  $chunks = @()
  foreach ($f in (Get-ChildItem $ChunkDir -Filter "chunk-*-$Voice.wav" | Sort-Object LastWriteTime)) {
    if ($f.Name -notmatch '^chunk-([0-9a-f]{8})-(\d+)-') { continue }
    $i0 = -1; for ($i = 0; $i -lt $items.Count; $i++) { if ($items[$i].h -eq $Matches[1]) { $i0 = $i; break } }
    if ($i0 -lt 0) { continue }
    $g = @($items[$i0..($i0 + [int]$Matches[2] - 1)])
    if ($Chapters -and -not ($g | Where-Object { $cs -contains [int]$_.c })) { continue }
    $chunks += , $g
  }
}
for ($ci = 0; $ci -lt $chunks.Count; $ci++) {
  $g = $chunks[$ci]
  $wav = Join-Path $ChunkDir ('chunk-' + $g[0].h + '-' + $g.Count + '-' + $Voice + '.wav')
  $chars = 0; foreach ($x in $g) { $chars += $x.t.Length }
  if (-not (Test-Path $wav)) {
    if ($SplitOnly) { continue }
    $ok = $false
    for ($try = 0; $try -lt 2 -and -not $ok; $try++) {
      if ($req -ge $MaxRequests) { break }
      Write-Host ("[chunk {0}/{1}] {2} sentences, {3} chars ..." -f ($ci + 1), $chunks.Count, $g.Count, $chars)
      $text = ($g | ForEach-Object { $_.t }) -join "`n`n"
      try { $raw = Get-Speech $text; $req++ }
      catch {
        $req++; $m = $_.Exception.Message
        Write-Host ('  request failed: ' + $m)
        if ($m -match 'RESOURCE_EXHAUSTED|"code":\s*429') { $quota = $true; break }
        continue
      }
      $isWav = $raw.Length -gt 12 -and [Text.Encoding]::ASCII.GetString($raw, 0, 4) -eq 'RIFF'
      if ($isWav) { [IO.File]::WriteAllBytes($wav, $raw) }
      else { $pcm = $wav + '.pcm'; [IO.File]::WriteAllBytes($pcm, $raw); & ffmpeg -y -loglevel error -f s16le -ar 24000 -ac 1 -i $pcm $wav; Remove-Item $pcm }
      # a reply far shorter than the text needs is a cut-off answer: keep it aside and ask again
      $got = Dur $wav
      if ($got -lt 0.05 * $chars) { Write-Host ("  audio too short ({0} s for {1} chars), retrying" -f (F $got), $chars); Move-Item -Force $wav ($wav + '.short') }
      else { $ok = $true }
    }
    if ($quota) { Write-Host 'Stopping: the daily free limit of this model is used up'; break }
    if (-not $ok) { Write-Host "Stopping: chunk not recorded (request limit $MaxRequests or repeated failures)"; break }
  }
  Write-Host ("[split {0}] {1}  ({2} s)" -f ($ci + 1), (Split-Path $wav -Leaf), (F (Dur $wav)))
  try { $flags += Split-Chunk $wav $g } catch { Write-Host ('  SPLIT FAILED: ' + $_.Exception.Message); $flags += $g.Count }
}

if ($Index) {
  $clips = [ordered]@{}
  foreach ($it in $items) { $mp3 = Join-Path $OutDir ($it.h + '.mp3'); if (Test-Path $mp3) { $clips[$it.h] = [Math]::Round((Dur $mp3), 3) } }
  $idx = [ordered]@{ voice = $Voice; model = $Model; clips = $clips }
  [IO.File]::WriteAllText((Join-Path $OutDir 'index.json'), ($idx | ConvertTo-Json -Depth 5), $utf8)
  Write-Host "index.json: $($clips.Count) of $($items.Count) clips"
}
Write-Host "requests used: $req   flagged: $flags"

