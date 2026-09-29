param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$serverScript = Join-Path $PSScriptRoot "server.ps1"
$logDir = Join-Path $PSScriptRoot "logs"
$logPath = Join-Path $logDir "localhost-watchdog.log"
$mutexName = "Global\AquaBleskLocalhostWatchdog"
$createdNew = $false
$mutex = [System.Threading.Mutex]::new($false, $mutexName, [ref]$createdNew)

if (-not $createdNew) {
  exit 0
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-WatchdogLog {
  param([string]$Message)
  $timestamp = [DateTime]::Now.ToString("yyyy-MM-dd HH:mm:ss")
  Add-Content -LiteralPath $logPath -Value "[$timestamp] $Message" -Encoding UTF8
}

function Test-BackendOnline {
  param([int]$TargetPort)
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$TargetPort/admin/" -TimeoutSec 4
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

try {
  Write-WatchdogLog "watchdog started on port $Port"
  while ($true) {
    if (Test-BackendOnline -TargetPort $Port) {
      Start-Sleep -Seconds 10
      continue
    }
    try {
      Write-WatchdogLog "starting backend"
      & $serverScript -Port $Port
      Write-WatchdogLog "backend stopped, restart in 5 seconds"
    } catch {
      Write-WatchdogLog ("backend crashed: " + $_.Exception.Message)
    }
    Start-Sleep -Seconds 5
  }
} finally {
  if ($mutex) {
    try {
      $mutex.ReleaseMutex() | Out-Null
    } catch {}
    $mutex.Dispose()
  }
}
