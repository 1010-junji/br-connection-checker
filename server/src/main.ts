import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as net from 'net';
import { exec } from 'child_process';

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
    resizable: false,
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
    // execのオプションにエンコーディングを指定する
    const options = {
      // Windowsの場合、'buffer'として受け取り、Shift_JISでデコードする
      // それ以外のOSではデフォルトのまま
      encoding: process.platform === 'win32' ? 'buffer' : 'utf8'
    };

    return new Promise((resolve) => {
      // chcp 65001でUTF-8に変更してからpingを実行
      const command = `chcp 65001 >nul && ping ${host}`;
      exec(command, (error, stdout, stderr) => {
        // stdoutはUTF-8になっている
        const output = stdout + stderr; // エラー出力も結果に含める
        sendProgress(`     pingコマンドの生出力:`);
        output.split('\n').forEach(line => {
          if (line.trim()) {
            sendProgress(`      ${line.trim()}`);
          }
        });

        // 成功判定は、pingの出力内容から判断する
        // "Reply from" や "応答" といった文字列が含まれていれば成功とみなす
        const isAlive = /Reply from|応答/.test(output);
        const resolvedIpMatch = output.match(/\[(.*?)\]/); // IPアドレスを [ ] の中から抽出
        const resolvedIp = resolvedIpMatch ? resolvedIpMatch[1] : 'N/A';

        if (isAlive) {
          sendProgress(`%%OK%%    [ OK ] ${host} (${resolvedIp}) からの応答がありました。\n`);
          resolve(true);
        } else {
          sendProgress(`%%NG%%    [ NG ] ${host} への要求がタイムアウト、または失敗しました。\n`);
          resolve(false);
        }
      });
    });

  } catch (error: any) {
    sendProgress(`%%NG%%    [ NG ] pingコマンドの実行中にエラーが発生しました: ${error.message}\n`);
    return Promise.resolve(false);
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
      // 成功時はシンプルにOK
      sendProgress(`%%OK%%    [ OK ] ${host}:${port} への接続に成功しました。\n`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      // タイムアウトのエビデンス
      sendProgress(`     接続試行がタイムアウトしました (3秒)。\n`);
      sendProgress(`%%NG%%    [ NG ] 接続がタイムアウトしました。ファイアウォールまたはポートが閉じている可能性があります。\n`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err: NodeJS.ErrnoException) => { // 型を明示
      // 接続エラーのエビデンス
      sendProgress(`     エラーコード: ${err.code || 'N/A'}`);
      
      // エラーコードに基づいて、より分かりやすいメッセージを生成
      let message = '';
      switch (err.code) {
        case 'ECONNREFUSED':
          message = '接続がターゲットマシンによって拒否されました。(ポートでサービスが待ち受けていません)';
          break;
        case 'ENOTFOUND':
          message = 'ホスト名が見つかりませんでした。(DNSの名前解決に失敗しました)';
          break;
        case 'EHOSTUNREACH':
          message = 'ターゲットホストに到達できません。(ネットワーク経路の問題の可能性があります)';
          break;
        default:
          message = `接続に失敗しました。(${err.message})`;
          break;
      }
      sendProgress(`%%NG%%    [ NG ] ${message}\n`);
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// ローカルポートのリッスン確認
async function checkLocalPort(port: number): Promise<boolean> {
  sendProgress(`  ・ローカルポート ${port} のリッスン状況を確認中 (netstat)…`);

  return new Promise((resolve) => {
    // 実行するコマンド
    const command = 'netstat -an -p TCP';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        sendProgress(`%%NG%%    [ NG ] netstatコマンドの実行に失敗しました: ${error.message}\n`);
        resolve(false);
        return;
      }
      if (stderr) {
        sendProgress(`%%NG%%    [ NG ] netstatコマンドがエラーを出力しました: ${stderr}\n`);
        resolve(false);
        return;
      }

      // 1. netstatの全出力から、指定ポートを含む行だけを抽出（findstrの再現）
      const lines = stdout.split('\n');
      const relevantLines = lines.filter(line => line.includes(`:${port}`));

      // 2. エビデンスとして、抽出した行を出力
      if (relevantLines.length > 0) {
        sendProgress(`     関連するnetstatの出力:`);
        // 各行の先頭にインデントを付けて見やすくする
        relevantLines.forEach(line => sendProgress(`      ${line.trim()}`));
      } else {
        sendProgress(`     指定されたポートを含むエントリは見つかりませんでした。`);
      }

      // 3. 抽出した行の中に「LISTENING」状態のものが存在するかを判定
      const isListening = relevantLines.some(line => /LISTENING/i.test(line));

      // 4. 最終的な評価結果を出力
      if (isListening) {
        sendProgress(`%%OK%%    [ OK ] ポート ${port} はLISTENING状態です。\n`);
        resolve(true);
      } else {
        if (relevantLines.length > 0) {
          // ポートは使われているが、LISTENINGではない場合
          sendProgress(`%%NG%%    [ NG ] ポート ${port} は使用中ですが、LISTENING状態ではありません。\n`);
        } else {
          // ポートが全く使われていない場合
          sendProgress(`%%NG%%    [ NG ] ポート ${port} は使用されていません。\n`);
        }
        resolve(false);
      }
    });
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
      await checkTcpPort(params.dashost, params.portNumber2);
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