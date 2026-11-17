@echo off
title PredictRx BD - Full Stack Launcher
echo ========================================================
echo        PredictRx BD - Launching Full Stack System
echo ========================================================
echo.

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "PredictRx Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting React 19 Frontend on http://localhost:5173 ...
start "PredictRx Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo [3/3] Opening PredictRx in your default browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173/analyze

echo ========================================================
echo  PredictRx BD is now running!
echo  - Frontend Web App: http://localhost:5173
echo  - Backend API:      http://127.0.0.1:8000
echo  - Swagger API Docs: http://127.0.0.1:8000/docs
echo  - Pitch Deck:       http://localhost:5173/pitch_deck.html
echo ========================================================
echo  Leave the opened backend & frontend windows running.
echo ========================================================
