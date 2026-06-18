@echo off
cd /d "%~dp0"
start http://localhost:3001
npm run dev -- --port 3001
pause
