@echo off
echo ====================================
echo   CANTONDEX Backend Starter
echo   Hackathon Quick Start
echo ====================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.9+
    pause
    exit /b 1
)

echo [1/6] Starting API Gateway...
cd cantondex-backend\api-gateway
start "API Gateway" cmd /k "python -m pip install -r requirements.txt >nul 2>&1 && python main.py"
cd ..\..

timeout /t 2 /nobreak >nul

echo [2/6] Starting Compliance Service...
cd cantondex-backend\compliance-service
start "Compliance Service" cmd /k "python -m pip install -r requirements.txt >nul 2>&1 && python compliance_service.py"
cd ..\..

timeout /t 2 /nobreak >nul

echo [3/6] Starting Risk Management...
cd cantondex-backend\risk-management
start "Risk Management" cmd /k "python -m pip install -r requirements.txt >nul 2>&1 && python risk_service.py"
cd ..\..

timeout /t 2 /nobreak >nul

echo [4/6] Starting Settlement Coordinator...
cd cantondex-backend\settlement-coordinator
start "Settlement" cmd /k "python -m pip install -r requirements.txt >nul 2>&1 && python settlement_service.py"
cd ..\..

timeout /t 2 /nobreak >nul

echo [5/6] Starting Notification Service...
cd cantondex-backend\notification-service
start "Notification" cmd /k "python -m pip install -r requirements.txt >nul 2>&1 && python main.py"
cd ..\..

timeout /t 2 /nobreak >nul

echo [6/6] All backend services started!
echo.
echo ====================================
echo   Backend Services Running:
echo   - API Gateway: http://localhost:8000
echo   - Compliance: http://localhost:8001
echo   - Risk Mgmt: http://localhost:8002
echo   - Settlement: http://localhost:8003
echo   - Notification: http://localhost:8004
echo ====================================
echo.
echo Note: Services may take 30-60s to fully initialize
echo Press any key to close this window
pause >nul
