# Collaborative Whiteboard - Desktop App

This is the Electron desktop application version with embedded API and SQLite database.

## What You Get

- ✅ **Self-contained desktop app** - Everything bundled together
- ✅ **No database server needed** - Uses embedded SQLite
- ✅ **No web server needed** - API runs locally
- ✅ **Cross-platform** - Works on Windows, macOS, and Linux
- ✅ **Offline capable** - No internet connection required
- ✅ **Easy installation** - Simple installer for each platform

## Prerequisites

- **Node.js 18+** - https://nodejs.org/
- **.NET 8 SDK** - https://dotnet.microsoft.com/download/dotnet/8.0
- **Angular CLI** - `npm install -g @angular/cli`

## Quick Build (Automated)

We provide automated build scripts that do everything for you:

### Windows

**Option 1: Batch Script**
```cmd
cd electron-app
build-all.bat
```

**Option 2: PowerShell**
```powershell
cd electron-app
.\build-all.ps1
```

### Linux / macOS

```bash
cd electron-app
chmod +x build-all.sh
./build-all.sh
```

The script will:
1. ✅ Build Angular frontend for production
2. ✅ Publish self-contained .NET API
3. ✅ Copy all files to electron-app
4. ✅ Install Electron dependencies
5. ✅ Build the installer

**Output:** Installer will be in `electron-app/dist-electron/`

## Manual Build Steps (Advanced)

If you prefer to build manually:

### 1. Build Angular Frontend
```bash
cd AngularProject
npm install
ng build --configuration production
```

### 2. Publish .NET API

**Windows:**
```bash
cd WebAPI/CollaborativeWhiteboard.API
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o ./publish
```

**macOS Intel:**
```bash
dotnet publish -c Release -r osx-x64 --self-contained true /p:PublishSingleFile=true -o ./publish
```

**macOS Apple Silicon:**
```bash
dotnet publish -c Release -r osx-arm64 --self-contained true /p:PublishSingleFile=true -o ./publish
```

**Linux:**
```bash
dotnet publish -c Release -r linux-x64 --self-contained true /p:PublishSingleFile=true -o ./publish
```

### 3. Copy Files to Electron App
```bash
cd ../../electron-app

# Copy Angular build
mkdir -p frontend
cp -r ../AngularProject/dist/collaborative-whiteboard/browser/* frontend/
# Or if no 'browser' folder:
# cp -r ../AngularProject/dist/collaborative-whiteboard/* frontend/

# Copy .NET API
mkdir -p api
cp -r ../WebAPI/CollaborativeWhiteboard.API/publish/* api/

# Create database folder
mkdir -p database
```

### 4. Install Electron Dependencies
```bash
npm install
```

### 5. Test in Development Mode
```bash
npm start
```

### 6. Build Installer
```bash
npm run build          # Build for current platform
npm run build:win      # Build Windows installer
npm run build:mac      # Build macOS DMG
npm run build:linux    # Build Linux AppImage & deb
```

## Installer Output

After building, you'll find installers in `dist-electron/`:

- **Windows**: `Collaborative Whiteboard Setup X.X.X.exe` (~150-200 MB)
- **macOS**: `Collaborative Whiteboard-X.X.X.dmg` (~150-200 MB)
- **Linux**:
  - `Collaborative Whiteboard-X.X.X.AppImage` (~150-200 MB)
  - `collaborative-whiteboard_X.X.X_amd64.deb` (~150-200 MB)

## Installing the App

### Windows
1. Run `Collaborative Whiteboard Setup X.X.X.exe`
2. Follow the installation wizard
3. App will be installed in `%LOCALAPPDATA%\Programs\Collaborative Whiteboard`
4. Desktop shortcut created automatically

### macOS
1. Open the `.dmg` file
2. Drag "Collaborative Whiteboard" to Applications folder
3. Open from Applications or Launchpad

### Linux
**AppImage:**
```bash
chmod +x Collaborative-Whiteboard-*.AppImage
./Collaborative-Whiteboard-*.AppImage
```

**Debian/Ubuntu (.deb):**
```bash
sudo dpkg -i collaborative-whiteboard_*.deb
```

## Using the Desktop App

### First Launch
1. The app will automatically:
   - Start the embedded API server
   - Create SQLite database in app data folder
   - Seed default admin user
   - Open the whiteboard interface

### Default Credentials
- **Username:** `admin`
- **Email:** `admin@whiteboard.com`
- **Password:** `Admin@123`

### Database Location
The SQLite database is stored in:
- **Windows:** `C:\Users\<username>\AppData\Roaming\collaborative-whiteboard-desktop\database\`
- **macOS:** `~/Library/Application Support/collaborative-whiteboard-desktop/database/`
- **Linux:** `~/.config/collaborative-whiteboard-desktop/database/`

## Troubleshooting

### Build Issues

**Error: Angular build failed**
- Delete `AngularProject/node_modules` and `package-lock.json`
- Run `npm install` again
- Retry the build

**Error: .NET publish failed**
- Make sure .NET 8 SDK is installed: `dotnet --version`
- Try: `dotnet restore` then retry

**Error: Electron build failed**
- Delete `electron-app/node_modules`
- Run `npm install` again
- Retry the build

### Runtime Issues

**App doesn't start**
- Check if port 5000 is available
- Look for error logs in console (run from terminal to see logs)

**Database errors**
- Delete the database file and restart the app
- App will recreate the database automatically

**API not connecting**
- The app needs a few seconds to start the API
- Wait 5-10 seconds after launching

## Development Mode

To test without building installer:

```bash
cd electron-app

# Make sure frontend and api folders are populated
# (Run build-all script or manual steps above)

npm start
```

This opens the app in development mode with DevTools enabled.

## Features

All features from the web version:
- ✅ Real-time collaboration
- ✅ Drawing tools (shapes, lines, text, connectors)
- ✅ Sticky notes with colors
- ✅ Frames with custom names
- ✅ Smart snapping and alignment
- ✅ Mini-map navigation
- ✅ Connection handles
- ✅ Infinite canvas
- ✅ Zoom and pan
- ✅ Text labels on connectors

## Customization

### App Icon
Replace these files in `electron-app/`:
- `icon.ico` - Windows icon (256x256)
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512)

### App Name
Edit `electron-app/package.json`:
```json
{
  "name": "your-app-name",
  "productName": "Your App Name",
  "version": "1.0.0"
}
```

### API Port
Edit `electron-app/main.js`:
```javascript
const API_URL = 'http://localhost:5000'; // Change port here
```

## Building for Distribution

### Code Signing (macOS)
For macOS distribution, you need an Apple Developer certificate:
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
npm run build:mac
```

### Code Signing (Windows)
For Windows distribution, you need a code signing certificate:
```bash
npm run build:win
```

## Support

For issues, check:
1. Console/terminal output for errors
2. Ensure all prerequisites are installed
3. Try rebuilding from scratch
4. Check `QUICK-START.md` for local development

## License

MIT
