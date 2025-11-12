#!/bin/bash
set -e

echo "========================================="
echo "Building Collaborative Whiteboard Desktop App"
echo "========================================="
echo ""

# Detect platform and architecture
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [[ "$PLATFORM" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        RUNTIME="osx-arm64"
    else
        RUNTIME="osx-x64"
    fi
elif [[ "$PLATFORM" == "linux" ]]; then
    RUNTIME="linux-x64"
else
    echo "Unsupported platform: $PLATFORM"
    exit 1
fi

echo "Detected Platform: $PLATFORM"
echo "Runtime: $RUNTIME"
echo ""

# Step 1: Build Angular Frontend
echo "========================================="
echo "Step 1/5: Building Angular Frontend"
echo "========================================="
cd ../AngularProject

if [ ! -d "node_modules" ]; then
    echo "Installing Angular dependencies..."
    npm install
fi

echo "Building Angular app for production..."
npx ng build --configuration production

if [ ! -d "dist/collaborative-whiteboard/browser" ] && [ ! -d "dist/collaborative-whiteboard" ]; then
    echo "Error: Angular build output not found!"
    exit 1
fi

# Step 2: Build .NET API
echo ""
echo "========================================="
echo "Step 2/5: Publishing .NET API"
echo "========================================="
cd ../WebAPI/CollaborativeWhiteboard.API

echo "Publishing .NET API for $RUNTIME..."
dotnet publish -c Release -r $RUNTIME --self-contained true /p:PublishSingleFile=true -o ./publish

if [ ! -f "./publish/CollaborativeWhiteboard.API" ] && [ ! -f "./publish/CollaborativeWhiteboard.API.exe" ]; then
    echo "Error: .NET API publish failed!"
    exit 1
fi

# Step 3: Copy Files to Electron App
echo ""
echo "========================================="
echo "Step 3/5: Copying files to Electron app"
echo "========================================="
cd ../../electron-app

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf frontend api database dist-electron

# Copy Angular build
echo "Copying Angular frontend..."
mkdir -p frontend
if [ -d "../AngularProject/dist/collaborative-whiteboard/browser" ]; then
    cp -r ../AngularProject/dist/collaborative-whiteboard/browser/* frontend/
else
    cp -r ../AngularProject/dist/collaborative-whiteboard/* frontend/
fi

# Copy .NET API
echo "Copying .NET API..."
mkdir -p api
cp -r ../WebAPI/CollaborativeWhiteboard.API/publish/* api/

# Make API executable
chmod +x api/CollaborativeWhiteboard.API 2>/dev/null || true

# Create database directory
echo "Creating database directory..."
mkdir -p database

echo "Files copied successfully!"

# Step 4: Install Electron Dependencies
echo ""
echo "========================================="
echo "Step 4/5: Installing Electron dependencies"
echo "========================================="

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "Dependencies already installed."
fi

# Step 5: Build Electron App
echo ""
echo "========================================="
echo "Step 5/5: Building Electron installer"
echo "========================================="

echo "This may take several minutes..."

if [[ "$PLATFORM" == "darwin" ]]; then
    npm run build:mac
elif [[ "$PLATFORM" == "linux" ]]; then
    npm run build:linux
fi

echo ""
echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo ""
echo "Installer location: electron-app/dist-electron/"
ls -lh dist-electron/ 2>/dev/null || echo "Check dist-electron/ directory for installers"
echo ""
echo "To run in development mode:"
echo "  cd electron-app && npm start"
echo ""
