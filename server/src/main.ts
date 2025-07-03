import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as net from 'net'; // TCP接続確認用
import * as ping from 'ping'; // Ping確認用

import { channels } from './shared-channels'; // (esbuildを使うのでこのままでOK)

const isDev = !app.isPackaged;
const loadURL = isDev ? null : require('electron-serve')({
  directory: path.join(app.getAppPath(), '../app'),
});

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true
  });

  if (isDev) {
    // 開発モード
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // 本番モード
    loadURL(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===================================================================
// ヘルパー関数群 (疎通確認ロジック)
// ===================================================================

// 進捗をフロントエンドに送信する関数
function sendProgress(log: string) {
  mainWindow?.webContents.send(channels.CHECK_PROGRESS, log + '\n');
}

// Ping疎通確認
async function checkPing(host: string): Promise<boolean> {
  sendProgress(`  ・${host} への Ping応答確認中…`);
  try {
    const res = await ping.promise.probe(host, { timeout: 3 });
    if (res.alive) {
      sendProgress(`%%OK%%    [ OK ] ${host} からの応答がありました。`);
      return true;
    } else {
      sendProgress(`%%NG%%    [ NG ] ${host} への要求がタイムアウトしました。 (Host: ${res.host})`);
      return false;
    }
  } catch (error) {
    sendProgress(`%%NG%%    [ NG ] ${host} へのPing実行中にエラーが発生しました。`);
    return false;
  }
}

// TCPポート疎通確認
async function checkTcpPort(host: string, port: number): Promise<boolean> {
  sendProgress(`  ・${host}:${port} へのTCP接続確認中…`);
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 3000; // 3秒

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      sendProgress(`%%OK%%    [ OK ] ${host}:${port} への接続に成功しました。`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      sendProgress(`%%NG%%    [ NG ] ${host}:${port} への接続がタイムアウトしました。`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      sendProgress(`%%NG%%    [ NG ] ${host}:${port} への接続に失敗しました。 (${err.message})`);
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// ローカルポートのリッスン確認
async function checkLocalPort(port: number): Promise<boolean> {
  sendProgress(`  ・ローカルポート ${port} のリッスン状況を確認中…`);
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      // 「アドレスは既に使用中です (EADDRINUSE)」「その操作を行う権限がありません (EACCES)」
      // などのエラーコードが返ってきた場合は、ポートが使用中と判断する（＝自身が正しいポートで起動している。）
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        sendProgress(`%%OK%%    [ OK ] ポート ${port} は使用中です。(何らかのサービスが起動しています)`);
        resolve(true);
      } else {
        sendProgress(`%%NG%%    [ NG ] ポート ${port} の確認中に予期せぬエラーが発生しました。 (${err.code})`);
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      sendProgress(`%%NG%%    [ NG ] ポート ${port} は現在使用されていません。`);
      resolve(false);
    });
    // ホスト名を省略することで、Node.jsが環境に応じてIPv4/IPv6を適切に判断してチェックする
    // server.listen(port, '0.0.0.0');
    server.listen(port);
  });
}


// ===================================================================
// IPC通信ハンドラ
// ===================================================================

ipcMain.handle(channels.RUN_CHECK, async (event, mode, params) => {
  sendProgress(`------------------------------------------------`);
  sendProgress(`-- ${params.title || mode.toUpperCase()}端末からの疎通確認`);
  sendProgress(`------------------------------------------------`);

  switch (mode) {
    case 'das':
      sendProgress('【DAS端末内】');
      await checkLocalPort(params.portNumber1);
      await checkLocalPort(params.portNumber2);
      sendProgress('\n【DAS -> MC】');
      await checkPing(params.mchost);
      await checkTcpPort(params.mchost, params.mcPort);
      break;

    case 'ds':
      sendProgress('【DS -> MC】');
      await checkPing(params.mchost);
      await checkTcpPort(params.mchost, params.mcport);
      sendProgress('\n【DS -> DAS】');
      await checkPing(params.dashost);
      await checkTcpPort(params.dashost, params.portNumber1);
      break;
      
    case 'kapplets':
      sendProgress('【Kapplets端末内】');
      await checkLocalPort(params.kappletsport);
      sendProgress('\n【Kapplets -> DB】');
      await checkPing(params.dbhost);
      await checkTcpPort(params.dbhost, params.dbport);
      sendProgress('\n【Kapplets -> MC】');
      await checkPing(params.mchost);
      await checkTcpPort(params.mchost, params.mcport);
      break;

    case 'mc':
      sendProgress('【MC端末内】');
      await checkLocalPort(params.mcport);
      sendProgress('\n【MC -> DB】');
      await checkPing(params.dbhost);
      await checkTcpPort(params.dbhost, params.dbport);
      sendProgress('\n【MC -> Kapplets】');
      await checkPing(params.kappletshost);
      await checkTcpPort(params.kappletshost, params.kappletsport);
      sendProgress('\n【MC -> RS】');
      await checkPing(params.rshost);
      await checkTcpPort(params.rshost, params.rsport);
      break;
      
    case 'rs':
      sendProgress('【RS端末内】');
      await checkLocalPort(params.rsport);
      sendProgress('\n【RS -> DB】');
      await checkPing(params.dbhost);
      await checkTcpPort(params.dbhost, params.dbport);
      sendProgress('\n【RS -> MC】');
      await checkPing(params.mchost);
      await checkTcpPort(params.mchost, params.mcport);
      sendProgress('\n【RS -> DAS】');
      await checkPing(params.dashost);
      await checkTcpPort(params.dashost, params.dasport);
      break;

    default:
      sendProgress(`[ERROR] 未知の実行モードです: ${mode}`);
  }

  return { success: true }; // 処理は常に正常終了とする
});


// ログ保存ハンドラ
ipcMain.handle(channels.SAVE_LOG, async (event, logContent) => {
  if (!mainWindow) {
    return { success: false, error: 'メインウィンドウが見つかりません。' };
  }
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'ログファイルを保存',
    defaultPath: `check-log-${Date.now()}.txt`,
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });

  if (canceled || !filePath) {
    return { success: false, error: '保存がキャンセルされました。' };
  }

  try {
    const ipAddress = Object.values(os.networkInterfaces())
      .flat()
      .find(i => i?.family === 'IPv4' && !i.internal)?.address || 'N/A';
      
    const header = [
      '==============================================',
      ` Log File Generated at: ${new Date().toLocaleString()}`,
      ` Computer Name: ${os.hostname()}`,
      ` User: ${os.userInfo().username}`,
      ` IP Address: ${ipAddress}`,
      '==============================================',
      '',
    ].join('\n');

    fs.writeFileSync(filePath, header + logContent);
    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

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