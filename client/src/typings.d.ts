import { IpcRendererEvent } from 'electron';

export interface FileDialogOpenResult {
  canceled: boolean;
  filePath?: string;
}

export interface ProcessBackupResult {
    success: boolean;
    error?: string;
    outputPath?: string;
}

export interface OpenWindowResult {
    success: boolean;
    error?: string;
}

export interface DbConnectionParams {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
}

export interface TestDbConnectionResult {
    success: boolean;
    message: string;
}

export interface IElectronAPI {
  // --- 疎通チェッカー ---
  runCheck: (mode: string, params: any) => Promise<{ success: boolean; error?: string }>;
  saveLog: (logContent: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  onCheckProgress: (callback: (event: IpcRendererEvent, log: string) => void) => () => void;

  // --- バックアップ編集機能 ---
  openFileDialog: () => Promise<FileDialogOpenResult>;
  processBackupFile: (filePath: string) => Promise<ProcessBackupResult>;
  onBackupProcessLog: (callback: (event: IpcRendererEvent, log: string) => void) => () => void;

  // --- ライセンス認証機能 ---
  openLicenseWindow: (url: string) => Promise<OpenWindowResult>;
  onLicenseWindowError: (callback: (event: IpcRendererEvent, errorInfo: { url: string; error: string; }) => void) => () => void;

  // --- アプリケーション設定機能 ---
  getAppSettings: () => Promise<DbConnectionParams>;
  saveAppSettings: (settings: DbConnectionParams) => Promise<{ success: boolean; error?: string }>;
  testDbConnection: (params: DbConnectionParams) => Promise<TestDbConnectionResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}