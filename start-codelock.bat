@echo off
title CODE//LOCK 2026 Event Server
echo ==========================================================
echo        CODE//LOCK 2026 EVENT PLATFORM CONTROLLER
echo ==========================================================
echo Starting Express Backend on port 5000...
start "CODE//LOCK Backend" cmd /k "cd /d %~dp0backend && npm.cmd run dev"
echo Starting Next.js Frontend on port 3000...
start "CODE//LOCK Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run start"
echo ==========================================================
echo Server online.
echo Participant URL: http://localhost:3000
echo Control Room:    http://localhost:3000/admin
echo Admin Login:     admin / admin123
echo ==========================================================
pause
