# Quick Start Guide

## Prerequisites

Install these tools:
- **.NET 8 SDK**: https://dotnet.microsoft.com/download/dotnet/8.0
- **Node.js 18+**: https://nodejs.org/
- **Angular CLI**: `npm install -g @angular/cli`

## Running Locally (with SQLite)

### Step 1: Start Backend

**Linux/macOS:**
```bash
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

The API will start at `http://localhost:5000` with SQLite database.

### Step 2: Start Frontend (in new terminal)

**Linux/macOS:**
```bash
./start-frontend.sh
```

**Windows:**
```cmd
start-frontend.bat
```

The app will open at `http://localhost:4200`.

### Step 3: Login

- **Username:** `admin`
- **Password:** `Admin@123`

## Building Desktop App

See [electron-app/README.md](electron-app/README.md) for Electron desktop build instructions.

## Features

- ✅ SQLite database (no SQL Server needed)
- ✅ Automatic database creation
- ✅ Default admin user
- ✅ Real-time collaboration
- ✅ Drawing tools (shapes, text, connectors)
- ✅ Smart snapping & alignment
- ✅ Mini-map navigation
- ✅ Frames & sticky notes

## Troubleshooting

**Port in use:**
```bash
# Kill process on port 5000
lsof -i :5000  # Linux/macOS
taskkill /F /PID <pid>  # Windows
```

**Database issues:**
```bash
# Delete database and restart
rm WebAPI/CollaborativeWhiteboard.API/whiteboard.db
```

**Node modules issues:**
```bash
cd AngularProject
rm -rf node_modules package-lock.json
npm install
```
