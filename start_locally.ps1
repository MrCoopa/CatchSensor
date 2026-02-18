$env:Path = "d:\CatchSensor\NodeJS;D:\CatchSensor\mariadb_12.2.2\bin;" + $env:Path
Write-Host "Starting CatchSensor Application Locally..." -ForegroundColor Cyan

# Start MariaDB if NOT running
if (!(Get-Process mysqld -ErrorAction SilentlyContinue)) {
    Write-Host "Launching MariaDB (v12.2.2)..." -ForegroundColor Green
    
    # Ensure data directory exists
    if (!(Test-Path "D:\CatchSensor\mariadb_12.2.2\data\Performance_schema")) {
        Write-Host "Initializing Data Directory..." -ForegroundColor Yellow
        Start-Process -FilePath "D:\CatchSensor\mariadb_12.2.2\bin\mysql_install_db.exe" -ArgumentList "--datadir=D:\CatchSensor\mariadb_12.2.2\data" -NoNewWindow -Wait
    }
    
    Start-Process -FilePath "D:\CatchSensor\mariadb_12.2.2\bin\mysqld.exe" -ArgumentList "--console" -NoNewWindow
    Start-Sleep -Seconds 5
}

# Kill old node processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Start Backend
Write-Host "Launching Backend Server..." -ForegroundColor Green
Start-Process -FilePath "d:\CatchSensor\NodeJS\node.exe" -ArgumentList "backend/server.js" -WorkingDirectory "d:\CatchSensor\CatchSensor" -NoNewWindow -PassThru | Out-File -FilePath "backend_service.pid"

# Start Frontend
Write-Host "Launching Frontend Dev Server..." -ForegroundColor Green
Set-Location -Path "d:\CatchSensor\CatchSensor\client"
Start-Process -FilePath "d:\CatchSensor\NodeJS\npm.cmd" -ArgumentList "run dev" -WorkingDirectory "d:\CatchSensor\CatchSensor\client" -NoNewWindow -PassThru | Out-File -FilePath "../frontend_service.pid"

Write-Host "`nServers are starting!" -ForegroundColor Yellow
Write-Host "Backend URL: http://localhost:5000"
Write-Host "Frontend URL: http://localhost:5173"
