import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { channels } from './shared-channels';
import { DbSetting } from './features/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // --- 疎通チェッカー ---
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

  // --- アプリケーション設定機能 (複数定義対応版) ---
  getDbSettingsList: () => ipcRenderer.invoke(channels.GET_DB_SETTINGS_LIST),
  saveDbSettingsList: (settings: DbSetting[]) => ipcRenderer.invoke(channels.SAVE_DB_SETTINGS_LIST, settings),
  testDbConnection: (params: DbSetting) => ipcRenderer.invoke(channels.TEST_DB_CONNECTION, params),

  // --- データ抽出機能 ---
  getTableList: (params: DbSetting) => ipcRenderer.invoke(channels.GET_TABLE_LIST, params),
  getTablePreview: (params: DbSetting, tableName: string) => ipcRenderer.invoke(channels.GET_TABLE_PREVIEW, params, tableName),
  exportTableToZip: (params: DbSetting, tableName: string) => ipcRenderer.invoke(channels.EXPORT_TABLE_TO_ZIP, params, tableName),
});