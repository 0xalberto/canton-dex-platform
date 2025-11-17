@echo off
echo.
echo ╔════════════════════════════════════════════════╗
echo ║     CANTONDEX - HACKATHON DEMO LAUNCHER       ║
echo ╚════════════════════════════════════════════════╝
echo.
echo Opening all 4 frontend applications...
echo.

timeout /t 1 /nobreak >nul

echo [1/4] Opening Trading Terminal (React)...
start http://localhost:5174
timeout /t 2 /nobreak >nul

echo [2/4] Opening Compliance Dashboard (Vue)...
start http://localhost:3003
timeout /t 2 /nobreak >nul

echo [3/4] Opening Admin Panel (Next.js)...
start http://localhost:3001
timeout /t 2 /nobreak >nul

echo [4/4] Opening Custody Portal (Angular)...
start http://localhost:4300
timeout /t 1 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════
echo ✓ All demos opened in your browser!
echo ═══════════════════════════════════════════════
echo.
echo DEMO TIPS:
echo  - Show each app for 45 seconds
echo  - Highlight different tech stacks
echo  - Explain Canton Network privacy features
echo  - Emphasize full-stack capabilities
echo.
echo Press any key to exit...
pause >nul
