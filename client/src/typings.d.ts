import { IpcRendererEvent } from 'electron';

// --- 共通 ---
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

// --- 設定機能 ---
export type DbType = 'mysql' | 'derby';

export interface MysqlConnectionParams {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
}

export interface DerbyConnectionParams {
    path: string;
    user?: string;
    password?: string;
}

export interface DbConnectionProfile {
    id: string;
    name: string;
    dbType: DbType;
    connection: MysqlConnectionParams | DerbyConnectionParams;
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
  getAppSettings: () => Promise<DbConnectionProfile[]>;
  saveAppSettings: (profiles: DbConnectionProfile[]) => Promise<{ success: boolean; error?: string }>;
  testDbConnection: (profile: DbConnectionProfile) => Promise<TestDbConnectionResult>;
  openDirectoryDialog: () => Promise<FileDialogOpenResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}