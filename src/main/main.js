// Load environment variables from .env file silently
import 'dotenv/config';

import { app, BrowserWindow, ipcMain, Menu, session, shell, dialog, Tray } from 'electron';
import path from 'path';
import Downloader from './downloader.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

// Single instance mechanism
const gotTheLock = app.requestSingleInstanceLock();


// Keep a global reference of the window object
let mainWindow;
let downloader;
let tray;
let dataRequested = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'), // Optional: add an icon
    show: false, // Don't show until ready-to-show
  });

  // Load the app
  if (isDev) {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
    /* mainWindow.loadURL('http://localhost:3000'); */
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    downloader.stopSendingUpdates();
  });

  mainWindow.on('closed', () => {
    console.log("window closed");
    mainWindow = null;
  });

  downloader = new Downloader(mainWindow);
  ipcMain.on('request-download-data', (event) => {
    dataRequested = true;
    downloader.startSendingUpdates();
    if (mainWindow) {
      const folderPath = downloader.store.get("downloadFolder");
      mainWindow.webContents.send('download-folder-updated', folderPath);
    }
  });

  createTray();
}

function createTray() {
  const iconPath = path.join(__dirname, "../assets/icon.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Sila Downloader");
  tray.setContextMenu(contextMenu);

  // Show the app when tray icon is clicked
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      if (dataRequested) {
        downloader.startSendingUpdates();
      }
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try {
    // Handle second instance attempts (after app is ready)
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window instead
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.show();
      }
    });

    // Show dialog for second instance attempts
    if (!gotTheLock) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Sila Downloader',
        message: 'An instance of Sila Downloader is already running.',
        detail: 'Only one instance of the application can run at a time.',
        buttons: ['OK']
      });

      app.quit();
    }

    createWindow();

  } catch (error) {
    console.error("Failed to load extension:", error);
  }
});




// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

/* // Remove the default menu bar
Menu.setApplicationMenu();
 */
ipcMain.on('start-download', (event, projectId, fileId) => {
  downloader.start(projectId, fileId);
});

ipcMain.on('pause-download', (event, projectId, fileId) => {
  downloader.pause(projectId, fileId);
});

ipcMain.on('delete-download', (event, projectId, fileId) => {
  downloader.delete(projectId, fileId);
});

ipcMain.on('download-file', (event, project, file, category) => {
  downloader.download(project, file, category);
});

// Batch operations
ipcMain.on('start-downloads', (event, projectId, fileIds) => {
  downloader.startMany(projectId, fileIds);
});

ipcMain.on('pause-downloads', (event, projectId, fileIds) => {
  downloader.pauseMany(projectId, fileIds);
});

ipcMain.on('delete-downloads', (event, projectId, fileIds) => {
  downloader.deleteMany(projectId, fileIds);
});

ipcMain.on('download-files', (event, project, filesWithCategories) => {
  downloader.downloadMany(project, filesWithCategories);
});

ipcMain.on('open-folder', (event, projectId) => {
  const project = downloader.downloadData[projectId];
  const folderPath = project.folder_path;
  shell.openPath(folderPath);
});

ipcMain.handle('get-download-folder', async () => {
  const folderPath = downloader.store.get("downloadFolder");
  return folderPath;
});

ipcMain.on('set-download-folder', (event, folderPath) => {
  downloader.store.set("downloadFolder", folderPath);
  if (mainWindow) {
    mainWindow.webContents.send('download-folder-updated', folderPath);
  }
});

ipcMain.handle('pick-folder', async () => {
  const folder = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return folder;
});



