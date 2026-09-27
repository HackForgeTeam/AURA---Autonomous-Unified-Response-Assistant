@echo off
echo ================================================
echo  AURA Backend — starting on http://localhost:8000
echo ================================================
echo.

REM Use system python
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
