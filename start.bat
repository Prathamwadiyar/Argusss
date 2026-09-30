@echo off
echo ======================================================================
echo  SIH26155: AI-Driven Multi-Vendor Network Security Compliance Auditor
echo ======================================================================
echo.
echo Starting FastAPI Backend Server on http://localhost:8000 ...
start "SIH Backend Server" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "SIH Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo [OK] Both servers launched!
echo - Frontend UI: http://localhost:5173
echo - Backend API ^& Docs: http://localhost:8000/docs
echo.
