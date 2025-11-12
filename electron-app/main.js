const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let apiProcess;

const API_URL = 'http://localhost:5000';

function startBackendAPI() {
  const apiPath = path.join(__dirname, 'api');
  const apiExecutable = process.platform === 'win32'
    ? path.join(apiPath, 'CollaborativeWhiteboard.API.exe')
    : path.join(apiPath, 'CollaborativeWhiteboard.API');

  const databasePath = path.join(__dirname, 'database', 'whiteboard.db');

  const env = {
    ...process.env,
    ASPNETCORE_URLS: API_URL,
    DATABASE_PATH: databasePath,
    ASPNETCORE_ENVIRONMENT: 'Production'
  };

  console.log('Starting backend API...');
  console.log('API executable:', apiExecutable);
  console.log('Database path:', databasePath);

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

  // Give API some time to start
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
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
    title: 'Collaborative Whiteboard'
  });

  // Load the Angular app
  const frontendPath = path.join(__dirname, 'frontend', 'index.html');
  mainWindow.loadFile(frontendPath);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
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
  await startBackendAPI();
  createWindow();
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
