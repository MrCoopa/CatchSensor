$env:Path = "d:\CatchSensor\NodeJS;d:\CatchSensor\MariaDB\bin;" + $env:Path
Write-Host "Starting CatchSensor Application Locally..." -ForegroundColor Cyan

# Start MariaDB if NOT running
if (!(Get-Process mysqld -ErrorAction SilentlyContinue)) {
    Write-Host "Launching MariaDB..." -ForegroundColor Green
    Start-Process -FilePath "d:\CatchSensor\MariaDB\bin\mysqld.exe" -ArgumentList "--defaults-file=d:\CatchSensor\MariaDB\data\my.ini", "--console" -NoNewWindow
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
