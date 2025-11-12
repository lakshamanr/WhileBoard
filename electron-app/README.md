# Collaborative Whiteboard - Desktop App

This is the Electron desktop application version with embedded API and SQLite database.

## Build Instructions

### Prerequisites
- Node.js 18+
- .NET 8 SDK
- Angular CLI

### Build Steps

1. **Build Angular Frontend:**
   ```bash
   cd ../AngularProject
   npm install
   ng build --configuration production
   ```

2. **Publish .NET API:**
   ```bash
   cd ../WebAPI/CollaborativeWhiteboard.API
   dotnet publish -c Release -r <runtime> --self-contained true /p:PublishSingleFile=true -o ./publish
   ```

   Replace `<runtime>` with:
   - `win-x64` for Windows
   - `osx-x64` or `osx-arm64` for macOS
   - `linux-x64` for Linux

3. **Copy Files:**
   ```bash
   cd ../../electron-app
   mkdir -p frontend api database
   cp -r ../AngularProject/dist/collaborative-whiteboard/* frontend/
   cp -r ../WebAPI/CollaborativeWhiteboard.API/publish/* api/
   ```

4. **Install Electron Dependencies:**
   ```bash
   npm install
   ```

5. **Run in Development:**
   ```bash
   npm start
   ```

6. **Build Installer:**
   ```bash
   npm run build          # Build for current platform
   npm run build:win      # Build for Windows
   npm run build:mac      # Build for macOS
   npm run build:linux    # Build for Linux
   ```

The installer will be in `dist-electron/` directory.

## Features

- Self-contained desktop app
- No external database server needed (SQLite)
- Embedded .NET API
- Cross-platform support

## Default Login

- Username: `admin`
- Password: `Admin@123`
