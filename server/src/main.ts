// server/src/main.ts

import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// --- 機能別ハンドラのインポート ---
import { registerConnectionCheckerHandlers } from './features/connection-checker.handler';
import { registerBackupEditorHandlers } from './features/backup-editor.handler';
import { registerLicenseActivatorHandlers } from './features/license-activator.handler';

const isDev = !app.isPackaged;
const loadURL = isDev ? null : require('electron-serve')({
  directory: path.join(app.getAppPath(), '../app'),
});

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    resizable: true, // リサイズ可能に変更
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow);
  }

  // --- すべてのIPCハンドラを登録 ---
  registerConnectionCheckerHandlers(mainWindow);
  registerBackupEditorHandlers(mainWindow);
  registerLicenseActivatorHandlers(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===================================================================
// アプリケーションライフサイクル
// ===================================================================
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});