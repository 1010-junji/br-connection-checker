import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as net from 'net';
import * as os from 'os';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { channels } from '../shared-channels';


// フロントエンドにログを送信する関数
function sendProgress(win: BrowserWindow | null, log: string) {
  win?.webContents.send(channels.CHECK_PROGRESS, log + '\n');
}

// Ping疎通確認
async function checkPing(win: BrowserWindow | null, host: string, ipFamily: 'any' | 4 | 6): Promise<boolean> {
  sendProgress(win, `  ・${host} への Ping応答確認中…`);

  // ipFamilyに応じてpingコマンドのオプションを決定
  let pingOption = '';
  if (ipFamily === 4) {
    pingOption = '-4';
  } else if (ipFamily === 6) {
    pingOption = '-6';
  }

  try {
    return new Promise((resolve) => {
      const command = `chcp 65001 >nul && ping ${pingOption} ${host}`;
      exec(command, (error, stdout, stderr) => {
        const output = stdout + stderr;
        sendProgress(win, `     pingコマンドの生出力:`);

        output.split('\n').forEach(line => {
          if (line.trim()) sendProgress(win, `      ${line.trim()}`);
        });

        const isAlive = /Reply from|応答/.test(output);
        const resolvedIpMatch = output.match(/\[(.*?)\]/);
        const resolvedIp = resolvedIpMatch ? resolvedIpMatch[1] : 'N/A';

        if (isAlive) {
          sendProgress(win, `%%OK%%    [ OK ] ${host} (${resolvedIp}) からの応答がありました。\n`);
          resolve(true);
        } else {
          sendProgress(win, `%%NG%%    [ NG ] ${host} への要求がタイムアウト、または失敗しました。\n`);
          resolve(false);
        }
      });
    });

  } catch (error: any) {
    sendProgress(win, `%%NG%%    [ NG ] pingコマンドの実行中にエラーが発生しました: ${error.message}\n`);
    return Promise.resolve(false);
  }
}

// TCPポート疎通確認
async function checkTcpPort(win: BrowserWindow | null, host: string, port: number, ipFamily: 'any' | 4 | 6): Promise<boolean> {
  sendProgress(win, `  ・${host}:${port} へのTCP接続確認中…`);
  
  // net.Socketの接続オプションを構築
  const connectOptions: net.SocketConnectOpts = {
    host: host,
    port: port,
  };
  // 'any'でない場合のみfamilyプロパティを設定
  if (ipFamily !== 'any') {
    connectOptions.family = ipFamily;
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      sendProgress(win, `%%OK%%    [ OK ] ${host}:${port} への接続に成功しました。\n`);
      socket.destroy();
      resolve(true);
    });
  
    socket.on('timeout', () => {
      sendProgress(win, `     接続試行がタイムアウトしました (3秒)。\n`);
      sendProgress(win, `%%NG%%    [ NG ] 接続がタイムアウトしました。ファイアウォールまたはポートが閉じている可能性があります。\n`);
      socket.destroy();
      resolve(false);
    });
  
    socket.on('error', (err: NodeJS.ErrnoException) => {
      sendProgress(win, `     エラーコード: ${err.code || 'N/A'}`);
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
      sendProgress(win, `%%NG%%    [ NG ] ${message}\n`);

      socket.destroy();
      resolve(false);
    });
    socket.connect(connectOptions);
  });
}

// ローカルポートのリッスン確認
async function checkLocalPort(win: BrowserWindow | null, port: number): Promise<boolean> {
  sendProgress(win, `  ・ローカルポート ${port} のリッスン状況を確認中 (netstat)…`);
  
  return new Promise((resolve) => {
    const command = 'netstat -an -p TCP';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        const errorMessage = error ? error.message : stderr;
        sendProgress(win, `%%NG%%    [ NG ] netstatコマンドの実行に失敗しました: ${errorMessage}\n`);
        resolve(false);
        return;
      }
    
      const relevantLines = stdout.split('\n').filter(line => line.includes(`:${port}`));
      if (relevantLines.length > 0) {
        sendProgress(win, `     関連するnetstatの出力:`);
        relevantLines.forEach(line => sendProgress(win, `      ${line.trim()}`));
      } else {
        sendProgress(win, `     指定されたポートを含むエントリは見つかりませんでした。`);
      }
    
      const isListening = relevantLines.some(line => /LISTENING/i.test(line));
      if (isListening) {
        sendProgress(win, `%%OK%%    [ OK ] ポート ${port} はLISTENING状態です。\n`);
        resolve(true);
      } else {
        const message = relevantLines.length > 0 ? '使用中ですが、LISTENING状態ではありません。' : '使用されていません。';
        sendProgress(win, `%%NG%%    [ NG ] ポート ${port} は${message}\n`);
        resolve(false);
      }
    });
  });
}


// --- IPCハンドラの登録 ---
export function registerConnectionCheckerHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle(channels.RUN_CHECK, async (event, mode, params) => {
    sendProgress(mainWindow, `------------------------------------------------`);
    sendProgress(mainWindow, `-- ${params.title || mode.toUpperCase()}端末からの疎通確認`);
    sendProgress(mainWindow, `------------------------------------------------`);
    
    const ipFamily = params.ipFamily || 'any';

    switch (mode) {
      case 'das':
        sendProgress(mainWindow, '【DAS端末内】');
        await checkLocalPort(mainWindow, params.portNumber1);
        await checkLocalPort(mainWindow, params.portNumber2);
        sendProgress(mainWindow, '\n【DAS -> MC】');
        await checkPing(mainWindow, params.mchost, ipFamily);
        await checkTcpPort(mainWindow, params.mchost, params.mcPort, ipFamily);
        break;

      case 'ds':
        sendProgress(mainWindow, '【DS -> MC】');
        await checkPing(mainWindow, params.mchost, ipFamily);
        await checkTcpPort(mainWindow, params.mchost, params.mcport, ipFamily);
        sendProgress(mainWindow, '\n【DS -> DAS】');
        await checkPing(mainWindow, params.dashost, ipFamily);
        await checkTcpPort(mainWindow, params.dashost, params.portNumber1, ipFamily);
        await checkTcpPort(mainWindow, params.dashost, params.portNumber2, ipFamily);
        break;
      
      case 'kapplets':
        sendProgress(mainWindow, '【Kapplets端末内】');
        await checkLocalPort(mainWindow, params.kappletsport);
        sendProgress(mainWindow, '\n【Kapplets -> DB】');
        await checkPing(mainWindow, params.dbhost, ipFamily);
        await checkTcpPort(mainWindow, params.dbhost, params.dbport, ipFamily);
        sendProgress(mainWindow, '\n【Kapplets -> MC】');
        await checkPing(mainWindow, params.mchost, ipFamily);
        await checkTcpPort(mainWindow, params.mchost, params.mcport, ipFamily);
        break;
      
      case 'mc':
        sendProgress(mainWindow, '【MC端末内】');
        await checkLocalPort(mainWindow, params.mcport);
        sendProgress(mainWindow, '\n【MC -> DB】');
        await checkPing(mainWindow, params.dbhost, ipFamily);
        await checkTcpPort(mainWindow, params.dbhost, params.dbport, ipFamily);
        sendProgress(mainWindow, '\n【MC -> Kapplets】');
        await checkPing(mainWindow, params.kappletshost, ipFamily);
        await checkTcpPort(mainWindow, params.kappletshost, params.kappletsport, ipFamily);
        sendProgress(mainWindow, '\n【MC -> RS】');
        await checkPing(mainWindow, params.rshost, ipFamily);
        await checkTcpPort(mainWindow, params.rshost, params.rsport, ipFamily);
        break;
      
      case 'rs':
        sendProgress(mainWindow, '【RS端末内】');
        await checkLocalPort(mainWindow, params.rsport);
        sendProgress(mainWindow, '\n【RS -> DB】');
        await checkPing(mainWindow, params.dbhost, ipFamily);
        await checkTcpPort(mainWindow, params.dbhost, params.dbport, ipFamily);
        sendProgress(mainWindow, '\n【RS -> MC】');
        await checkPing(mainWindow, params.mchost, ipFamily);
        await checkTcpPort(mainWindow, params.mchost, params.mcport, ipFamily);
        sendProgress(mainWindow, '\n【RS -> DAS】');
        await checkPing(mainWindow, params.dashost, ipFamily);
        await checkTcpPort(mainWindow, params.dashost, params.dasport, ipFamily);
        break;
      
      default:
        sendProgress(mainWindow, `[ERROR] 未知の実行モードです: ${mode}`);
    }
    return { success: true };
  });

  ipcMain.handle(channels.SAVE_LOG, async (event, logContent) => {
    if (!mainWindow) return { success: false, error: 'メインウィンドウが見つかりません。' };
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'ログファイルを保存',
      defaultPath: `check-log-${Date.now()}.txt`,
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
    });

    if (canceled || !filePath) return { success: false, error: '保存がキャンセルされました。' };
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

      await fs.writeFile(filePath, header + logContent);
      return { success: true, filePath };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}