# Poll EAS Android preview build until FINISHED or ERRORED.
# Usage: powershell -File scripts/eas-monitor-android.ps1
param(
  [string]$BuildId = "2ad24658-89d8-489c-9bcd-e9d0e41058ed",
  [string]$LogFile = "$PSScriptRoot\..\eas-monitor.log",
  [string]$ApkOut = "$env:USERPROFILE\Downloads\SHC-customer-preview.apk",
  [int]$IntervalSec = 300
)

$mobileDir = Join-Path $PSScriptRoot "..\apps\mobile-customer"
Set-Location $mobileDir

while ($true) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $json = pnpm dlx eas-cli@latest build:list --platform android --limit 3 --json 2>&1 | Out-String
  Add-Content -Path $LogFile -Value "[$ts] $json"

  if ($json -match '"status":\s*"FINISHED"') {
    Write-Host "[$ts] Build finished — downloading APK to $ApkOut"
    pnpm dlx eas-cli@latest build:download --id $BuildId --output $ApkOut
    exit 0
  }
  if ($json -match '"status":\s*"ERRORED"') {
    Write-Host "[$ts] Build errored — see $LogFile"
    exit 1
  }

  Write-Host "[$ts] Still waiting (poll every ${IntervalSec}s)..."
  Start-Sleep -Seconds $IntervalSec
}
