import { ipcMain, BrowserWindow } from 'electron';
import { channels } from '../shared-channels';
import { OpenWindowResult } from './types';

export function registerLicenseActivatorHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle(channels.OPEN_LICENSE_WINDOW, async (event, url: string): Promise<OpenWindowResult> => {
    if (!mainWindow) {
      return { success: false, error: "メインウィンドウが存在しません。" };
    }
      
    try {
      const licenseWindow = new BrowserWindow({
        parent: mainWindow,
        modal: false,
        width: 1200,
        height: 768,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // 一意のパーティション名を指定することで、インメモリセッションが作成される。
          // これにより、ウィンドウを閉じるとセッションデータ(Cookie, Cache等)は破棄される。
          partition: `license-session-${Date.now()}`, 
        },
      });
        
      licenseWindow.removeMenu();

      licenseWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        // メインウィンドウにエラー情報を送信
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(channels.LICENSE_WINDOW_ERROR, {
            url: validatedURL,
            error: `接続に失敗しました (Code: ${errorCode}, Desc: ${errorDescription})`
          });
        }
        // ウィンドウを閉じる
        if (!licenseWindow.isDestroyed()) {
          licenseWindow.close();
        }
      });

      await licenseWindow.loadURL(url);
      
      return { success: true };

    } catch (error: any) {
      console.error("Failed to open license window:", error);
      return { success: false, error: error.message };
    }
  });
}