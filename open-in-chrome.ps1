$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://127.0.0.1:4177"

$serverReady = $false
try {
  $response = Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 1
  $serverReady = $response.StatusCode -eq 200
} catch {
  $serverReady = $false
}

if (-not $serverReady) {
  $nodeCandidates = @(
    "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe",
    (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
  ) | Where-Object { $_ -and (Test-Path $_) }

  $node = $nodeCandidates | Select-Object -First 1

  if ($node) {
    Start-Process -FilePath $node -ArgumentList @("local-server.mjs") -WorkingDirectory $root -WindowStyle Hidden
  } else {
    $serverScript = Join-Path $root "static-server.ps1"
    Start-Process -FilePath powershell.exe -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $serverScript) -WorkingDirectory $root -WindowStyle Hidden
  }

  Start-Sleep -Seconds 2
}

$chromeCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) {
  throw "Chrome or Edge was not found. Open $url manually in a browser that supports Web Speech API."
}

Start-Process -FilePath $browser -ArgumentList @($url)
