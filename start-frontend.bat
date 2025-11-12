@echo off
echo =========================================
echo Starting Frontend (Angular)
echo =========================================
echo.
echo Make sure backend is running first!
echo (Run start-backend.bat in another terminal)
echo.
echo Frontend will be available at: http://localhost:4200
echo.

cd AngularProject

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

call npm start
