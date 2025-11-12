# Collaborative Whiteboard Desktop App Build Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Building Collaborative Whiteboard Desktop App" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Detect architecture
$runtime = "win-x64"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
    $runtime = "win-arm64"
}

Write-Host "Detected Platform: Windows" -ForegroundColor Cyan
Write-Host "Runtime: $runtime" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Angular Frontend
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Step 1/5: Building Angular Frontend" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Set-Location -Path "..\AngularProject"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Angular dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Building Angular app for production..." -ForegroundColor Yellow
npx ng build --configuration production

$angularBuildPath = "dist\collaborative-whiteboard"
if (-not (Test-Path $angularBuildPath)) {
    Write-Host "Error: Angular build output not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Build .NET API
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Step 2/5: Publishing .NET API" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Set-Location -Path "..\WebAPI\CollaborativeWhiteboard.API"

Write-Host "Publishing .NET API for $runtime..." -ForegroundColor Yellow
dotnet publish -c Release -r $runtime --self-contained true -o .\publish

if (-not (Test-Path ".\publish\CollaborativeWhiteboard.API.exe")) {
    Write-Host "Error: .NET API publish failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Copy Files to Electron App
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Step 3/5: Copying files to Electron app" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Set-Location -Path "..\..\electron-app"

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
Remove-Item -Path "frontend", "api", "database", "dist-electron" -Recurse -Force -ErrorAction SilentlyContinue

# Copy Angular build
Write-Host "Copying Angular frontend..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "frontend" -Force | Out-Null

$browserPath = "..\AngularProject\dist\collaborative-whiteboard\browser"
if (Test-Path $browserPath) {
    Copy-Item -Path "$browserPath\*" -Destination "frontend\" -Recurse -Force
} else {
    Copy-Item -Path "..\AngularProject\dist\collaborative-whiteboard\*" -Destination "frontend\" -Recurse -Force
}

# Copy .NET API
Write-Host "Copying .NET API..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "api" -Force | Out-Null
Copy-Item -Path "..\WebAPI\CollaborativeWhiteboard.API\publish\*" -Destination "api\" -Recurse -Force

# Create database directory
Write-Host "Creating database directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "database" -Force | Out-Null

Write-Host "Files copied successfully!" -ForegroundColor Green

# Step 4: Install Electron Dependencies
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Step 4/5: Installing Electron dependencies" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
}

# Step 5: Build Electron App
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Step 5/5: Building Electron installer" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "This may take several minutes..." -ForegroundColor Yellow
npm run build:win

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installer location: electron-app\dist-electron\" -ForegroundColor Cyan

if (Test-Path "dist-electron") {
    Get-ChildItem -Path "dist-electron" | ForEach-Object {
        Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "To run in development mode:" -ForegroundColor Yellow
Write-Host "  cd electron-app && npm start" -ForegroundColor White
Write-Host ""
