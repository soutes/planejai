@echo off
start "planejAI - API" cmd /k "cd /d "%~dp0apps\api" && npm run dev"
start "planejAI - Web" cmd /k "cd /d "%~dp0apps\web" && npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:3000
