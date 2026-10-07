# CODE//LOCK 2026 — Offline Local Event Runner
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "       CODE//LOCK 2026 EVENT PLATFORM CONTROLLER         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Local Host IP Addresses for participants on private LAN:" -ForegroundColor Cyan

Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | ForEach-Object {
    Write-Host "  -> http://$($_.IPAddress):3000" -ForegroundColor White
}

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Starting Express API Engine on port 5000..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd backend; npm.cmd run dev"

Write-Host "Starting Next.js Frontend on port 3000 (0.0.0.0)..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run start"

Write-Host "Systems initialized." -ForegroundColor Green
Write-Host "Organizer Control Room: http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "Admin Credentials:     admin / admin123" -ForegroundColor Yellow
