#Requires -Version 5.1
param(
    [switch]$KeepDb   # dev.ps1 -KeepDb behaelt die DB
)

$ErrorActionPreference = "Stop"
$root  = $PSScriptRoot
$dbDir = Join-Path $root "backend\LoadoutConfigurator.Api"
$feDir = Join-Path $root "frontend"

function Stop-Port {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 400
    }
}

function Wait-Http {
    param([string]$Url, [int]$TimeoutSec = 90)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -lt 500) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

Write-Host ""
Write-Host "  Airsoft Loadout Configurator - Dev Start" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor DarkCyan
Write-Host ""

# 1. Vorherige Prozesse auf den Dev-Ports beenden
Write-Host "[1/5] Stoppe Prozesse auf Port 5154 + 5173 ..." -ForegroundColor Yellow
Stop-Port 5154
Stop-Port 5173

# 2. Datenbank loeschen
if ($KeepDb) {
    Write-Host "[2/5] Datenbank wird behalten (-KeepDb)." -ForegroundColor DarkGray
} else {
    Write-Host "[2/5] Loesche loadout.db ..." -ForegroundColor Yellow
    Get-ChildItem $dbDir -Filter "loadout.db*" -ErrorAction SilentlyContinue |
        Remove-Item -Force
}

# 3. Backend in neuem Fenster starten
Write-Host "[3/5] Starte Backend ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$dbDir'; `$host.UI.RawUI.WindowTitle = 'BACKEND :5154'; dotnet run"

# 4. Warten bis Backend antwortet
Write-Host "[4/5] Warte auf Backend (http://localhost:5154) ..." -ForegroundColor Yellow -NoNewline
$ok = Wait-Http "http://localhost:5154/api/categories" -TimeoutSec 90
if (-not $ok) {
    Write-Host " TIMEOUT" -ForegroundColor Red
    Write-Host "       Backend hat nicht innerhalb von 90 Sekunden geantwortet." -ForegroundColor Red
    exit 1
}
Write-Host " bereit" -ForegroundColor Green

# 5. Frontend in neuem Fenster starten
Write-Host "[5/5] Starte Frontend ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$feDir'; `$host.UI.RawUI.WindowTitle = 'FRONTEND :5173'; npm run dev"

Write-Host "      Warte auf Vite (http://localhost:5173) ..." -ForegroundColor Yellow -NoNewline
$ok = Wait-Http "http://localhost:5173" -TimeoutSec 30
if ($ok) {
    Write-Host " bereit" -ForegroundColor Green
} else {
    Write-Host " (Timeout - Browser wird trotzdem geoeffnet)" -ForegroundColor DarkYellow
}

Write-Host ""
Start-Process "http://localhost:5173"
Write-Host "  http://localhost:5173  -  fertig!" -ForegroundColor Green
Write-Host ""
