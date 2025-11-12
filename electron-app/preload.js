const { contextBridge, ipcRenderer } = require('electron');

// Expose API URL to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => ipcRenderer.invoke('get-api-url')
});
