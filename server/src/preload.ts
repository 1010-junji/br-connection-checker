import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { channels } from './shared-channels';
import { DbConnectionProfile } from './features/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // (既存のAPIは省略)
  runCheck: (mode: string, params: any) => ipcRenderer.invoke(channels.RUN_CHECK, mode, params),
  saveLog: (logContent: string) => ipcRenderer.invoke(channels.SAVE_LOG, logContent),
  onCheckProgress: (callback: (event: IpcRendererEvent, log: string) => void) => {
    ipcRenderer.on(channels.CHECK_PROGRESS, callback);
    return () => ipcRenderer.removeAllListeners(channels.CHECK_PROGRESS);
  },

  // --- バックアップ編集機能 ---
  openFileDialog: () => ipcRenderer.invoke(channels.OPEN_FILE_DIALOG),
  processBackupFile: (filePath: string) => ipcRenderer.invoke(channels.PROCESS_BACKUP_FILE, filePath),
  onBackupProcessLog: (callback: (event: IpcRendererEvent, log: string) => void) => {
    ipcRenderer.on(channels.BACKUP_PROCESS_LOG, callback);
    return () => ipcRenderer.removeAllListeners(channels.BACKUP_PROCESS_LOG);
  },

  // --- ライセンス認証機能 ---
  openLicenseWindow: (url: string) => ipcRenderer.invoke(channels.OPEN_LICENSE_WINDOW, url),
  onLicenseWindowError: (callback: (event: IpcRendererEvent, errorInfo: { url: string; error: string; }) => void) => {
    ipcRenderer.on(channels.LICENSE_WINDOW_ERROR, callback);
    return () => ipcRenderer.removeAllListeners(channels.LICENSE_WINDOW_ERROR);
  },

  // --- アプリケーション設定機能 ---
  getAppSettings: () => ipcRenderer.invoke(channels.GET_APP_SETTINGS),
  saveAppSettings: (profiles: DbConnectionProfile[]) => ipcRenderer.invoke(channels.SAVE_APP_SETTINGS, profiles),
  testDbConnection: (profile: DbConnectionProfile) => ipcRenderer.invoke(channels.TEST_DB_CONNECTION, profile),
  openDirectoryDialog: () => ipcRenderer.invoke(channels.OPEN_DIRECTORY_DIALOG),
});