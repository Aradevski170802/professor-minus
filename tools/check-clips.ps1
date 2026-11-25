# Checks recorded clips. The clips are joined into one file with a spoken marker word
# ("banana", Windows English voice) between them. A Gemini transcription model writes
# down everything it hears, and the text is split at the markers, so each piece
# belongs to exactly one clip. Each piece is then compared with its sentence.
# The API key is read from a file and never printed.
#
# Example: powershell -File tools\check-clips.ps1 -Chapters 0,1
param(
  [string]$Lines = 'tools\lines.json',
  [string]$AudioDir = 'video\audio',
  [string]$Chapters = '',
  [int]$PerRequest = 40,
  [string]$Model = 'gemini-3.5-transcribe',
  [string]$KeyFile = 'E:\PROJECTS\gemini-key.txt',
  [string]$WorkDir = 'tools\check',
  [string]$Out = 'tools\check.txt'
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$utf8 = New-Object Text.UTF8Encoding $false
$items = [IO.File]::ReadAllText((Resolve-Path $Lines), [Text.Encoding]::UTF8) | ConvertFrom-Json
if ($Chapters) { $cs = $Chapters.Split(',') | ForEach-Object { [int]$_ }; $items = @($items | Where-Object { $cs -contains [int]$_.c }) }
$items = @($items | Where-Object { Test-Path (Join-Path $AudioDir ($_.h + '.mp3')) })
New-Item -ItemType Directory -Force $WorkDir | Out-Null
$work = (Resolve-Path $WorkDir).Path

# marker clip: the Bulgarian word for "hen", said by another voice, recorded once
# (24 kHz mono mp3 with 0.6 s of silence around it)
$hen = -join ([char[]](0x043A, 0x043E, 0x043A, 0x043E, 0x0448, 0x043A, 0x0430))
$mk = Join-Path $work 'marker.mp3'
if (-not (Test-Path $mk)) { throw "Missing $mk (the marker word recording)" }

# Numbers come back as digits ("12", "-2 1/4"), so digits and number words are left out
# of the comparison; the words around them still show whether a clip holds its sentence.
$skip = @{}; foreach ($w in ([IO.File]::ReadAllText((Resolve-Path 'tools\numwords.txt'), [Text.Encoding]::UTF8) -split '\s+')) { if ($w) { $skip[$w] = 1 } }
function Words($s) { return @(($s.ToLowerInvariant() -replace '[^\p{L}\s]', ' ' -split '\s+') | Where-Object { $_ -and -not $skip.ContainsKey($_) }) }
function Score($a, $b) {
  $x = Words $a; $y = Words $b
  if (-not $x.Count -and -not $y.Count -and $b.Trim()) { return 1.0 }
  if (-not $x.Count -or -not $y.Count) { return 0.0 }
  $L = New-Object 'int[,]' ($x.Count + 1), ($y.Count + 1)
  for ($i = 1; $i -le $x.Count; $i++) { for ($j = 1; $j -le $y.Count; $j++) {
    if ($x[$i - 1] -eq $y[$j - 1]) { $L[$i, $j] = $L[($i - 1), ($j - 1)] + 1 }
    else { $up = $L[($i - 1), $j]; $lf = $L[$i, ($j - 1)]; if ($up -gt $lf) { $L[$i, $j] = $up } else { $L[$i, $j] = $lf } }
  } }
  return 2.0 * $L[$x.Count, $y.Count] / ($x.Count + $y.Count)
}

$key = ([IO.File]::ReadAllText($KeyFile)).Trim()
$rows = @(); $bad = 0; $n = 0
for ($o = 0; $o -lt $items.Count; $o += $PerRequest) {
  $g = @($items[$o..([Math]::Min($o + $PerRequest, $items.Count) - 1)])
  $list = Join-Path $work 'list.txt'; $joined = Join-Path $work ('joined-' + $o + '.mp3')
  $ls = @(); foreach ($x in $g) { $ls += "file '" + ((Resolve-Path (Join-Path $AudioDir ($x.h + '.mp3'))).Path -replace '\\', '/') + "'"; $ls += "file '" + ($mk -replace '\\', '/') + "'" }
  [IO.File]::WriteAllLines($list, $ls, $utf8)
  & ffmpeg -y -loglevel error -f concat -safe 0 -i $list -ac 1 -ar 24000 -b:a 56k $joined
  if ($LASTEXITCODE -ne 0) { throw 'ffmpeg join failed' }
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($joined))
  $body = @{ contents = @(@{ parts = @(@{ inline_data = @{ mime_type = 'audio/mp3'; data = $b64 } }, @{ text = ('Transcribe this Bulgarian audio exactly, word for word, as spoken. A second voice says the word "' + $hen + '" between sentences: write that word every time it is spoken, so it appears between the sentences. Do not add timestamps. Output only the transcript.') }) }) }
  Write-Host "request: clips $($o + 1)-$($o + $g.Count) of $($items.Count)"
  try {
    $res = Invoke-RestMethod -Method Post -Uri "https://generativelanguage.googleapis.com/v1beta/models/$($Model):generateContent" -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json; charset=utf-8' -Body ($utf8.GetBytes(($body | ConvertTo-Json -Depth 8 -Compress))) -TimeoutSec 600
  } catch {
    $msg = $_.Exception.Message; $r = $_.Exception.Response
    if ($r) { try { $sr = New-Object IO.StreamReader($r.GetResponseStream()); $msg = $sr.ReadToEnd() } catch {} }
    throw ('API error: ' + ($msg -replace [regex]::Escape($key), '***'))
  }
  $txt = (($res.candidates[0].content.parts | ForEach-Object { $_.text }) -join ' ') -replace '\[?\b\d{1,2}:\d{2}(\.\d+)?\b\]?', ' '
  [IO.File]::AppendAllText((Join-Path $work 'raw.txt'), "=== clips $($o + 1)-$($o + $g.Count)`n$txt`n", $utf8)
  $pieces = @([regex]::Split($txt, ('(?i)[\s.!,;:-]*(?:' + $hen + '|kokoshka)[\s.!,;:-]*')) | ForEach-Object { $_.Trim() })
  if ($pieces.Count -and $pieces[-1] -eq '') { $pieces = @($pieces[0..($pieces.Count - 2)]) }
  if ($pieces.Count -ne $g.Count) { Write-Host "  marker count mismatch: $($pieces.Count) pieces for $($g.Count) clips (see raw.txt)" }
  for ($k = 0; $k -lt $g.Count; $k++) {
    $t = ''; if ($k -lt $pieces.Count) { $t = $pieces[$k] }
    $sc = Score $g[$k].t $t; $n++
    $flag = 'ok'; if ($sc -lt 0.8) { $flag = 'CHECK'; $bad++ }
    $rows += ("{0}`t{1}`tc{2}`t{3}`n  expected: {4}`n  heard:    {5}" -f $flag, $g[$k].h, $g[$k].c, $sc.ToString('0.00', [Globalization.CultureInfo]::InvariantCulture), $g[$k].t, $t)
  }
}
[IO.File]::WriteAllLines((Join-Path (Get-Location) $Out), $rows, $utf8)
Write-Host "checked $n clips, $bad below 0.80 -> $Out"
