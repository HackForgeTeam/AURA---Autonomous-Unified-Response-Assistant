#!/usr/bin/env bash
echo "================================================"
echo " AURA Backend — starting on http://localhost:8000"
echo "================================================"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
