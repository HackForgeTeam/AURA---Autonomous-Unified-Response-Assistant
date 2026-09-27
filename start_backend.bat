@echo off
title AURA Backend Service (Port 8000)
cd /d "%~dp0backend"
echo Starting AURA Backend on http://127.0.0.1:8000 ...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
