const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let apiProcess;

const API_URL = 'http://localhost:5000';

function getResourcePath(relativePath) {
  // In production, unpacked files are in app.asar.unpacked
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    // Check if .asar.unpacked exists
    const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
    const fullPath = path.join(unpackedPath, relativePath);

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }

    // Fallback to regular app path
    return path.join(appPath, relativePath);
  }

  // In development, use __dirname
  return path.join(__dirname, relativePath);
}

function startBackendAPI() {
  // Get API path from unpacked resources
  const apiPath = getResourcePath('api');
  const apiExecutable = process.platform === 'win32'
    ? path.join(apiPath, 'CollaborativeWhiteboard.API.exe')
    : path.join(apiPath, 'CollaborativeWhiteboard.API');

  // Database should be in user data directory (writable)
  const userDataPath = app.getPath('userData');
  const databaseDir = path.join(userDataPath, 'database');

  // Create database directory if it doesn't exist
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  const databasePath = path.join(databaseDir, 'whiteboard.db');

  const env = {
    ...process.env,
    ASPNETCORE_URLS: API_URL,
    DATABASE_PATH: databasePath,
    ASPNETCORE_ENVIRONMENT: 'Production'
  };

  console.log('Starting backend API...');
  console.log('API executable:', apiExecutable);
  console.log('Database path:', databasePath);
  console.log('API exists:', fs.existsSync(apiExecutable));

  if (!fs.existsSync(apiExecutable)) {
    console.error('API executable not found!');
    console.error('Looking in:', apiPath);
    console.error('Files in directory:', fs.readdirSync(apiPath).join(', '));
    return Promise.reject(new Error('API executable not found'));
  }

  // Make executable on Unix systems
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(apiExecutable, '755');
    } catch (err) {
      console.error('Failed to make API executable:', err);
    }
  }

  apiProcess = spawn(apiExecutable, [], {
    env,
    cwd: apiPath
  });

  apiProcess.stdout.on('data', (data) => {
    console.log(`API: ${data}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`API Error: ${data}`);
  });

  apiProcess.on('close', (code) => {
    console.log(`API process exited with code ${code}`);
  });

  apiProcess.on('error', (err) => {
    console.error('Failed to start API process:', err);
  });

  // Give API some time to start
  return new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Collaborative Whiteboard',
    show: false // Don't show until ready
  });

  // Load the Angular app
  const frontendPath = getResourcePath(path.join('frontend', 'index.html'));

  console.log('Loading frontend from:', frontendPath);
  console.log('Frontend exists:', fs.existsSync(frontendPath));

  mainWindow.loadFile(frontendPath).catch(err => {
    console.error('Failed to load frontend:', err);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle API URL request from renderer
ipcMain.handle('get-api-url', () => {
  return API_URL;
});

app.on('ready', async () => {
  try {
    await startBackendAPI();
    createWindow();
  } catch (err) {
    console.error('Failed to start application:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});

app.on('will-quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});
