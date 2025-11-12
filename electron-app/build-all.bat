@echo off
setlocal enabledelayedexpansion

echo =========================================
echo Building Collaborative Whiteboard Desktop App
echo =========================================
echo.

REM Detect architecture
set "RUNTIME=win-x64"
if "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "RUNTIME=win-arm64"

echo Detected Platform: Windows
echo Runtime: %RUNTIME%
echo.

REM Step 1: Build Angular Frontend
echo =========================================
echo Step 1/5: Building Angular Frontend
echo =========================================
cd ..\AngularProject

if not exist "node_modules" (
    echo Installing Angular dependencies...
    call npm install
)

echo Building Angular app for production...
call npx ng build --configuration production

if not exist "dist\collaborative-whiteboard" (
    echo Error: Angular build output not found!
    exit /b 1
)

REM Step 2: Build .NET API
echo.
echo =========================================
echo Step 2/5: Publishing .NET API
echo =========================================
cd ..\WebAPI\CollaborativeWhiteboard.API

echo Publishing .NET API for %RUNTIME%...
dotnet publish -c Release -r %RUNTIME% --self-contained true -o .\publish

if not exist ".\publish\CollaborativeWhiteboard.API.exe" (
    echo Error: .NET API publish failed!
    exit /b 1
)

REM Step 3: Copy Files to Electron App
echo.
echo =========================================
echo Step 3/5: Copying files to Electron app
echo =========================================
cd ..\..\electron-app

REM Clean previous builds
echo Cleaning previous builds...
if exist "frontend" rmdir /s /q frontend
if exist "api" rmdir /s /q api
if exist "database" rmdir /s /q database
if exist "dist-electron" rmdir /s /q dist-electron

REM Copy Angular build
echo Copying Angular frontend...
mkdir frontend

if exist "..\AngularProject\dist\collaborative-whiteboard\browser" (
    xcopy /E /I /Y "..\AngularProject\dist\collaborative-whiteboard\browser\*" frontend\
) else (
    xcopy /E /I /Y "..\AngularProject\dist\collaborative-whiteboard\*" frontend\
)

REM Copy .NET API
echo Copying .NET API...
mkdir api
xcopy /E /I /Y "..\WebAPI\CollaborativeWhiteboard.API\publish\*" api\

REM Create database directory
echo Creating database directory...
mkdir database

echo Files copied successfully!

REM Step 4: Install Electron Dependencies
echo.
echo =========================================
echo Step 4/5: Installing Electron dependencies
echo =========================================

if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
) else (
    echo Dependencies already installed.
)

REM Step 5: Build Electron App
echo.
echo =========================================
echo Step 5/5: Building Electron installer
echo =========================================

echo This may take several minutes...
call npm run build:win

echo.
echo =========================================
echo Build completed successfully!
echo =========================================
echo.
echo Installer location: electron-app\dist-electron\
dir dist-electron\ 2>nul || echo Check dist-electron\ directory for installers
echo.
echo To run in development mode:
echo   cd electron-app ^&^& npm start
echo.

endlocal
