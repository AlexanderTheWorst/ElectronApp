const { ipcRenderer, globalShortcut } = require('electron')
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')

const createWindow = () => {
  const win = new BrowserWindow({
    skipTaskbar: false,
    fullscreen: true,
    hasShadow: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      backgroundThrottling: false // Ensures the video keeps running smoothly,
    }
  })

  win.loadFile('index.html');

  win.on('close', (event) => {
    event.preventDefault();
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});