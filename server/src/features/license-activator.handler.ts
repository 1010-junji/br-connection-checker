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
        width: 1024,
        height: 768,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
        
      licenseWindow.removeMenu();
      await licenseWindow.loadURL(url);

      licenseWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Failed to load URL: ${url}`, errorCode, errorDescription);
        if (!licenseWindow.isDestroyed()) {
          licenseWindow.close();
        }
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Failed to open license window:", error);
      return { success: false, error: error.message };
    }
  });
}