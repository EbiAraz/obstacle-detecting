@echo off
echo.
echo ============================================================
echo         RAILWAY OPERATOR MOBILE DASHBOARD
echo ============================================================
echo.
echo Starting Flask server...
echo.

start /B python -m railway_ai_system.web.dashboard

timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo    MOBILE DASHBOARD IS READY!
echo ============================================================
echo.
echo Access your dashboard:
echo.
echo   Desktop: http://localhost:5001/mobile
echo   Mobile:  http://YOUR_LOCAL_IP:5001/mobile
echo.
echo Opening in browser...
echo.

start http://localhost:5001/mobile

echo.
echo Press any key to exit (server will keep running)...
pause >nul
