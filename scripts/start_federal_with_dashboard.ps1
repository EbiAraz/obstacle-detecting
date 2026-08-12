param(
    [string]$TrainId = "TRAIN-FED-001",
    [int]$ServerPort = 5000,
    [int]$DashboardPort = 5001,
    [string]$ServerHost = "localhost",
    [int]$WebViewPort = 5173,
    [bool]$UseWebView = $false,
    [int]$StreamlitPort = 8501,
    [bool]$UseStreamlit = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

$distIndex = Join-Path $projectRoot "dist\index.html"
if (-not (Test-Path $distIndex)) {
    Write-Host "[0/8] Frontend bundle missing. Building dashboard UI (npm run build)..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Frontend build failed. Run 'npm run build' manually and fix errors."
        exit 1
    }
}

$rootIndex = Join-Path $projectRoot "index.html"
Copy-Item -Path $distIndex -Destination $rootIndex -Force

$distAssetsDir = Join-Path $projectRoot "dist\assets"
$staticDir = Join-Path $projectRoot "static"
$staticAssetsDir = Join-Path $staticDir "assets"
New-Item -ItemType Directory -Path $staticAssetsDir -Force | Out-Null

Copy-Item -Path (Join-Path $distAssetsDir "*") -Destination $staticAssetsDir -Force

$distJs = Get-ChildItem -Path $distAssetsDir -Filter "index-*.js" | Select-Object -First 1
$distCss = Get-ChildItem -Path $distAssetsDir -Filter "index-*.css" | Select-Object -First 1
if (-not $distJs -or -not $distCss) {
    Write-Host "ERROR: Could not find built dashboard JS/CSS in dist/assets."
    exit 1
}

$jsContent = Get-Content -Path $distJs.FullName -Raw
$jsContent = $jsContent -replace "/assets/", "/static/assets/"
Set-Content -Path (Join-Path $staticDir "dashboard.js") -Value $jsContent -Encoding utf8

$cssContent = Get-Content -Path $distCss.FullName -Raw
$cssContent = $cssContent -replace "/assets/", "/static/assets/"
Set-Content -Path (Join-Path $staticDir "dashboard.css") -Value $cssContent -Encoding utf8

if ($UseStreamlit) {
    & python -c "import streamlit" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[0/8] Streamlit not found. Installing streamlit..."
        & python -m pip install streamlit
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to install streamlit."
            exit 1
        }
    }
}

if ($UseWebView) {
    $distIndex = Join-Path $projectRoot "dist\index.html"
    if (-not (Test-Path $distIndex)) {
        Write-Host "[0/8] Frontend bundle missing. Building web dashboard assets (npm run build)..."
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Frontend build failed. Fix npm build issues and retry."
            exit 1
        }
    }
}

function Test-PortOpen {
    param(
        [string]$TargetHost,
        [int]$TargetPort,
        [int]$TimeoutMs = 500
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect($TargetHost, $TargetPort, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            $client.Close()
            return $false
        }
        $client.EndConnect($async)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param(
        [string]$TargetHost,
        [int]$TargetPort,
        [int]$MaxSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($MaxSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortOpen -TargetHost $TargetHost -TargetPort $TargetPort) {
            return $true
        }
        Start-Sleep -Milliseconds 300
    }
    return $false
}

$serverCmd = "Set-Location '$projectRoot'; python server.py --host $ServerHost --port $ServerPort"
$clientCmd = "Set-Location '$projectRoot'; python client.py --train-id $TrainId --start-delay 0 --server-host $ServerHost --server-port $ServerPort"
$dashboardCmd = "Set-Location '$projectRoot'; python dashboard.py"
$webViewCmd = "Set-Location '$projectRoot'; npm run dev -- --host 127.0.0.1 --port $WebViewPort --strictPort"
$streamlitCmd = "Set-Location '$projectRoot'; python -m streamlit run scripts/streamlit_dashboard.py --server.port $StreamlitPort --server.headless true --browser.gatherUsageStats false"

Write-Host "[1/6] Starting federal server in a new PowerShell window..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $serverCmd
)

Write-Host "[2/6] Waiting for server readiness on ${ServerHost}:${ServerPort} ..."
if (-not (Wait-ForPort -TargetHost $ServerHost -TargetPort $ServerPort -MaxSeconds 90)) {
    Write-Host "ERROR: Server was not ready within timeout."
    exit 1
}
Write-Host "Server ready on ${ServerHost}:${ServerPort}"

Write-Host "[3/6] Starting client in another PowerShell window..."
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $clientCmd
)

if ($UseStreamlit) {
    Write-Host "[4/8] Starting Streamlit dashboard on 127.0.0.1:${StreamlitPort} ..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $streamlitCmd
    )

    Write-Host "Waiting for Streamlit readiness on 127.0.0.1:${StreamlitPort} ..."
    if (Wait-ForPort -TargetHost "127.0.0.1" -TargetPort $StreamlitPort -MaxSeconds 90) {
        Write-Host "[5/8] Opening Streamlit dashboard..."
        Start-Process "http://127.0.0.1:${StreamlitPort}"
        Write-Host "[6/8] Streamlit dashboard is running."
        Write-Host "[7/8] Flask and Vite dashboard paths remain optional."
        Write-Host "[8/8] Done. Server, client, and Streamlit dashboard are running."
        exit 0
    }

    Write-Host "WARNING: Streamlit did not become ready. Falling back to existing dashboard paths."
}

if (-not (Test-PortOpen -TargetHost $ServerHost -TargetPort $DashboardPort)) {
    Write-Host "[4/8] Starting dashboard server in another PowerShell window..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $dashboardCmd
    )

    Write-Host "Waiting for dashboard readiness on ${ServerHost}:${DashboardPort} ..."
    if (-not (Wait-ForPort -TargetHost $ServerHost -TargetPort $DashboardPort -MaxSeconds 90)) {
        Write-Host "ERROR: Dashboard was not ready within timeout."
        exit 1
    }
}

if ($UseWebView) {
    Write-Host "[5/8] Starting Vite web view on 127.0.0.1:${WebViewPort} ..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $webViewCmd
    )

    Write-Host "Waiting for web view readiness on 127.0.0.1:${WebViewPort} ..."
    if (Wait-ForPort -TargetHost "127.0.0.1" -TargetPort $WebViewPort -MaxSeconds 60) {
        Write-Host "[6/8] Opening web dashboard web view..."
        Start-Process "http://127.0.0.1:${WebViewPort}"
        Write-Host "[7/8] Web view is running."
        Write-Host "[8/8] Done. Server, client, API dashboard, and web view are running."
        exit 0
    }

    Write-Host "WARNING: Web view did not become ready. Falling back to Flask UI."
}

Write-Host "[7/8] Opening Flask desktop dashboard..."
Start-Process "http://${ServerHost}:${DashboardPort}/"
Write-Host "[8/8] Done. Server, client, and desktop dashboard are running."
