@echo off
title AURA Full Stack Launcher
echo Starting AURA Backend and Frontend Services...
start "AURA Backend" cmd /c "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "AURA Frontend" cmd /c "cd /d %~dp0frontend && npm run dev"
echo Services started!
echo Frontend: http://localhost:5173 (or 5177)
echo Backend:  http://127.0.0.1:8000
