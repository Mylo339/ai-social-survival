$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4177
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
$logPath = Join-Path $root "tmp\static-server.log"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "text/javascript; charset=utf-8" }
    ".mjs" { "text/javascript; charset=utf-8" }
    ".webmanifest" { "application/manifest+json; charset=utf-8" }
    ".svg" { "image/svg+xml" }
    ".png" { "image/png" }
    default { "application/octet-stream" }
  }
}

function Write-HttpResponse {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )

  $stream = $Client.GetStream()
  $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  $stream.Write($Body, 0, $Body.Length)
  $stream.Flush()
}

$listener.Start()
Write-Output "AI Social Survival running at http://127.0.0.1:$port"

try {
  while ($true) {
    $client = $null

    try {
      $client = $listener.AcceptTcpClient()
      $stream = $client.GetStream()
      $buffer = New-Object byte[] 4096
      $read = $stream.Read($buffer, 0, $buffer.Length)

      if ($read -le 0) {
        continue
      }

      $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
      $firstLine = ($requestText -split "`r?`n")[0]
      $parts = $firstLine -split " "

      if ($parts.Length -lt 2) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Bad request")
        Write-HttpResponse $client 400 "Bad Request" "text/plain; charset=utf-8" $body
        continue
      }

      $requestPath = [System.Uri]::UnescapeDataString($parts[1])

      if ($requestPath -eq "/") {
        $requestPath = "/index.html"
      }

      $relativePath = $requestPath.TrimStart("/") -replace "/", "\"
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

      if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $filePath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        Write-HttpResponse $client 404 "Not Found" "text/plain; charset=utf-8" $body
        continue
      }

      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      Write-HttpResponse $client 200 "OK" (Get-ContentType $filePath) $bytes
    } catch {
      $message = "$(Get-Date -Format s) $($_.Exception.Message)"
      Add-Content -Path $logPath -Value $message
    } finally {
      if ($client) {
        $client.Close()
      }
    }
  }
} finally {
  $listener.Stop()
}
