# Transcribes audio files with a Gemini text model to check what was actually spoken.
# Writes "<file>`t<transcript>" lines to -Out (UTF-8). The key is read from a file and never printed.
param(
  [Parameter(Mandatory = $true)][string[]]$Files,
  [string]$Out = 'tools\transcripts.txt',
  [string]$Model = 'gemini-2.5-flash',
  [string]$KeyFile = 'E:\PROJECTS\gemini-key.txt'
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$utf8 = New-Object Text.UTF8Encoding $false
$key = ([IO.File]::ReadAllText($KeyFile)).Trim()
$Files = @($Files | ForEach-Object { $_ -split ',' } | Where-Object { $_ })
$lines = @()
foreach ($f in $Files) {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $f)))
  $body = @{ contents = @(@{ parts = @(@{ inline_data = @{ mime_type = 'audio/mp3'; data = $b64 } }, @{ text = 'Transcribe this Bulgarian speech exactly, word for word. Write numbers as words, exactly as spoken. Output only the transcript, nothing else.' }) }) }
  $bytes = $utf8.GetBytes(($body | ConvertTo-Json -Depth 8 -Compress))
  try {
    $res = Invoke-RestMethod -Method Post -Uri "https://generativelanguage.googleapis.com/v1beta/models/$($Model):generateContent" -Headers @{ 'x-goog-api-key' = $key } -ContentType 'application/json; charset=utf-8' -Body $bytes -TimeoutSec 300
    $t = ($res.candidates[0].content.parts | ForEach-Object { $_.text }) -join ' '
  } catch {
    $msg = $_.Exception.Message; $r = $_.Exception.Response
    if ($r) { try { $sr = New-Object IO.StreamReader($r.GetResponseStream()); $msg = $sr.ReadToEnd() } catch {} }
    $t = 'ERROR: ' + ($msg -replace [regex]::Escape($key), '***')
  }
  $lines += ((Split-Path $f -Leaf) + "`t" + ($t -replace '\s+', ' ').Trim())
}
[IO.File]::WriteAllLines((Join-Path (Get-Location) $Out), $lines, $utf8)
Write-Host "wrote $($lines.Count) transcripts to $Out"
