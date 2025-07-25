import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import { channels } from '../shared-channels';
import { OpenWindowResult } from './types';

export function registerLicenseActivatorHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle(channels.OPEN_LICENSE_WINDOW, async (event, targetUrl: string): Promise<OpenWindowResult> => {
    if (!mainWindow) {
      return { success: false, error: "メインウィンドウが存在しません。" };
    }

    const licenseWindow = new BrowserWindow({
      width: 220,
      height: 220,
      parent: mainWindow,
      modal: false,
      show: false,
      frame: true,
      resizable: false,
      closable: false,
      autoHideMenuBar: true,
      title: '読み込み中...',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: `license-session-${Date.now()}`,
      },
    });

    // パスを修正
    const loadingHtmlPath = path.join(__dirname, '..', 'assets', 'loading.html');

    // 読み込みが成功したかどうかのフラグ
    let loadSuccess = false;

    // did-finish-load: ページのナビゲーションが完了したとき
    licenseWindow.webContents.on('did-finish-load', () => {
      const currentURL = licenseWindow.webContents.getURL();
      
      if (!currentURL.endsWith('loading.html')) {
        loadSuccess = true; // 目的のページのロードに成功
        licenseWindow.setResizable(true);
        licenseWindow.setClosable(true);
        licenseWindow.setBounds({ width: 1200, height: 768 }, true);
        licenseWindow.center();
      }
    });

    // did-fail-load: ページの読み込みに失敗したとき
    licenseWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (validatedURL.endsWith('loading.html')) {
        console.error('Failed to load the loading.html itself.');
        if (!licenseWindow.isDestroyed()) {
          licenseWindow.close(); // ローディング画面自体が出なければウィンドウを閉じる
        }
        return;
      }
      
      // 失敗したら即座にウィンドウを閉じる
      if (!licenseWindow.isDestroyed()) {
        licenseWindow.close();
      }

      // メインウィンドウにエラーを通知
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channels.LICENSE_WINDOW_ERROR, {
          url: validatedURL,
          error: `接続に失敗しました (Code: ${errorCode}, ${errorDescription})`
        });
      }
    });

    try {
      // 1. まずローディング画面を表示
      await licenseWindow.loadFile(loadingHtmlPath);
      licenseWindow.center();
      licenseWindow.show();

      // 2. 次に目的のURLをロード（await しない）
      licenseWindow.loadURL(targetUrl).catch(err => {
        // CATCH-ALL: loadURLが即時例外を投げる場合 (例: サポート外のプロトコルなど)
        console.error('loadURL threw an immediate error:', err.message);
        if (!licenseWindow.isDestroyed()) {
            licenseWindow.close();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(channels.LICENSE_WINDOW_ERROR, {
                url: targetUrl,
                error: `URLの読み込みを開始できませんでした (${err.message})`
            });
        }
      });
      
      // 呼び出し元には「ウィンドウの表示と読み込み開始には成功した」ことを伝える
      return { success: true };

    } catch (error: any) {
      // loadFileが失敗するなど、予期せぬエラー
      console.error("Failed to setup license window:", error);
      if (!licenseWindow.isDestroyed()) {
        licenseWindow.close();
      }
      return { success: false, error: error.message };
    }
  });
}