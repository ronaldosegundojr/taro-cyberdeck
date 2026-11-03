const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 480,
    useContentSize: true,
    backgroundColor: '#000000',
    title: 'Cyberdeck OS & Tarot Suite',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
    frame: true, 
    resizable: true
  });

  mainWindow.loadFile('index.html');

  // Remove default menu bar
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Register F11 shortcut to toggle full screen
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
    }
  });
});

// Handle IPC messages from web content
ipcMain.on('shutdown-app', () => {
  app.quit();
});

ipcMain.on('reboot-app', () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

