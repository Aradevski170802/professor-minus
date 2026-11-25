# Generates narration clips with Gemini TTS.
# Usage: powershell -File tools\voice.ps1 -Lines tools\lines.json -OutDir video\audio -Voice Charon -Index
# Lines JSON: [{ "h": "<file name>", "t": "<text>", "v": "<optional voice>" }, ...]
# The API key is read from a file outside the repo and is never printed.
param(
  [Parameter(Mandatory = $true)][string]$Lines,
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Voice = 'Charon',
  [string]$Model = 'gemini-3.8-flash-tts',
  [string]$Style = 'Warm, clear and friendly male teacher explaining math to 11-12 year old children. Calm, moderate pace, natural intonation, precise standard Bulgarian pronunciation and word stress.',
  [string]$KeyFile = 'E:\PROJECTS\gemini-key.txt',
  [switch]$Index,
  [switch]$Force,
  [int]$Limit = 0
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$key = ([IO.File]::ReadAllText($KeyFile)).Trim()
if (-not $key) { throw "Key file is empty: $KeyFile" }
$utf8 = New-Object Text.UTF8Encoding $false
$items = [IO.File]::ReadAllText((Resolve-Path $Lines), [Text.Encoding]::UTF8) | ConvertFrom-Json
New-Item -ItemType Directory -Force $OutDir | Out-Null
$tmp = Join-Path $env:TEMP 'gemini-tts'; New-Item -ItemType Directory -Force $tmp | Out-Null

function Find-Audio($o) {
  if ($null -eq $o) { return $null }
  if ($o -is [string]) { return $null }
  if ($o -is [System.Collections.IEnumerable] -and -not ($o -is [System.Management.Automation.PSCustomObject])) {
    foreach ($x in $o) { $r = Find-Audio $x; if ($r) { return $r } }
    return $null
  }
  if ($o -is [System.Management.Automation.PSCustomObject]) {
    foreach ($p in $o.PSObject.Properties) {
      if ($p.Name -eq 'data' -and $p.Value -is [string] -and $p.Value.Length -gt 2000) {
        $mime = $o.mime_type; if (-not $mime) { $mime = $o.mimeType }
        return @{ data = $p.Value; mime = $mime }
      }
    }
    foreach ($p in $o.PSObject.Properties) { $r = Find-Audio $p.Value; if ($r) { return $r } }
  }
  return $null
}

function Invoke-Json($url, $body) {
  $json = $body | ConvertTo-Json -Depth 12 -Compress
  $bytes = $utf8.GetBytes($json)
  return Invoke-RestMethod -Method Post -Uri $url -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json; charset=utf-8' -Body $bytes -TimeoutSec 180
}

function Get-Speech($text, $voice) {
  if ($Model -like 'gemini-2.5*') {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/$($Model):generateContent"
    $body = @{ contents = @(@{ parts = @(@{ text = "Read the following Bulgarian text aloud. Style: $Style`n`n$text" }) }); generationConfig = @{ responseModalities = @('AUDIO'); speechConfig = @{ voiceConfig = @{ prebuiltVoiceConfig = @{ voiceName = $voice } } } } }
  } else {
    $url = 'https://generativelanguage.googleapis.com/v1beta/interactions'
    $body = @{ model = $Model; input = @(@{ type = 'user_input'; content = @(@{ type = 'text'; text = $text; annotations = @(@{ type = 'speech_metadata'; style = $Style }) }) }); response_format = @{ type = 'audio' }; generation_config = @{ speech_config = @(@{ voice = $voice }) } }
  }
  for ($a = 1; $a -le 8; $a++) {
    try {
      $res = Invoke-Json $url $body
      $au = Find-Audio $res
      if (-not $au) { throw 'No audio in response: ' + (($res | ConvertTo-Json -Depth 6 -Compress).Substring(0, 400)) }
      return $au
    } catch {
      $code = 0; try { $code = [int]$_.Exception.Response.StatusCode } catch {}
      $msg = $_.ErrorDetails.Message; if (-not $msg) { $msg = $_.Exception.Message }
      if (($code -eq 429 -or $code -ge 500) -and $a -lt 8) {
        $wait = 20 * $a; if ($msg -match '"retryDelay"\s*:\s*"(\d+)') { $wait = [int]$Matches[1] + 2 }
        Write-Host "  HTTP $code, waiting $wait s (try $a)"; Start-Sleep -Seconds $wait; continue
      }
      throw "HTTP $code : $msg"
    }
  }
}

$done = 0; $made = 0
foreach ($it in $items) {
  $mp3 = Join-Path $OutDir ($it.h + '.mp3')
  if ((Test-Path $mp3) -and -not $Force) { $done++; continue }
  if ($Limit -gt 0 -and $made -ge $Limit) { break }
  $v = $Voice; if ($it.v) { $v = $it.v }
  Write-Host ("[{0}/{1}] {2} {3}" -f ($done + $made + 1), $items.Count, $it.h, $v)
  $au = Get-Speech $it.t $v
  $raw = [Convert]::FromBase64String($au.data)
  $src = Join-Path $tmp ($it.h + '.bin')
  [IO.File]::WriteAllBytes($src, $raw)
  $isWav = $raw.Length -gt 12 -and [Text.Encoding]::ASCII.GetString($raw, 0, 4) -eq 'RIFF'
  $inArgs = if ($isWav) { @('-i', $src) } else { @('-f', 's16le', '-ar', '24000', '-ac', '1', '-i', $src) }
  $af = 'silenceremove=start_periods=1:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_threshold=-48dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11'
  & ffmpeg -y -loglevel error @inArgs -af $af -ac 1 -ar 24000 -b:a 56k $mp3
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $($it.h)" }
  Remove-Item $src -ErrorAction SilentlyContinue
  $made++
}

if ($Index) {
  $clips = [ordered]@{}
  foreach ($it in $items) {
    $mp3 = Join-Path $OutDir ($it.h + '.mp3')
    if (Test-Path $mp3) {
      $d = (& ffprobe -v error -show_entries format=duration -of csv=p=0 $mp3).Trim()
      $clips[$it.h] = [Math]::Round([double]::Parse($d, [Globalization.CultureInfo]::InvariantCulture), 3)
    }
  }
  $idx = [ordered]@{ voice = $Voice; model = $Model; clips = $clips }
  [IO.File]::WriteAllText((Join-Path $OutDir 'index.json'), ($idx | ConvertTo-Json -Depth 5), $utf8)
  Write-Host "index.json: $($clips.Count) of $($items.Count) clips"
}
Write-Host "made $made, already had $done"
