import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// --- 機能別ハンドラのインポート ---
import { registerConnectionCheckerHandlers } from './features/connection-checker.handler';
import { registerBackupEditorHandlers } from './features/backup-editor.handler';
import { registerLicenseActivatorHandlers } from './features/license-activator.handler';
import { registerSettingsHandlers } from './features/settings.handler';

const isDev = !app.isPackaged;
const loadURL = isDev ? null : require('electron-serve')({
  directory: path.join(app.getAppPath(), '../app'),
});

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1028,
    height: 850,
    resizable: true, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenu(null);
  
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
  registerSettingsHandlers(); // 新しいハンドラを登録

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===================================================================
// アプリケーションライフサイクル
// ===================================================================
// このイベントは、appがreadyになった後、ウィンドウが作られる前に設定するのが確実
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // 証明書エラーを許可するかどうかのロジック
  const parsedUrl = new URL(url);
  // localhostまたは127.0.0.1からの接続であれば、証明書エラーを無視して接続を許可する
  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
    event.preventDefault(); 
    callback(true);
  } else {
    callback(false);
  }
});

// Windows統合認証の自動ログインを無効化する 
app.on('login', (event, webContents, details, authInfo, callback) => {
  // 'login' イベントは、NTLM認証やBasic認証などのプロンプトが表示される前に発生する。
  // ここでイベントのデフォルトの動作をキャンセルすることで、
  // OSによる自動認証や認証ダイアログの表示を防ぐ。
  event.preventDefault();
  
  console.log(`[Login Request] Canceled automatic login for: ${details.url}`);
  // コールバックを引数なしで呼び出すか、明示的にキャンセルするために
  // callback(undefined, undefined) のように呼び出すことで、認証プロセスを終了させる。
  // これにより、サーバーは通常、認証失敗時のページ（多くはログインフォーム）を返す。
});

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