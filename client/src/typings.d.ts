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

export interface IElectronAPI {
  // --- 疎通チェッカー ---
  runCheck: (mode: string, params: any) => Promise<{ success: boolean; error?: string }>;
  saveLog: (logContent: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  onCheckProgress: (callback: (event: IpcRendererEvent, log: string) => void) => () => void;

  // --- バックアップ編集機能 ---
  openFileDialog: () => Promise<FileDialogOpenResult>;
  processBackupFile: (filePath: string) => Promise<ProcessBackupResult>;
  onBackupProcessLog: (callback: (event: IpcRendererEvent, log: string) => void) => () => void;

  // --- 追加: ライセンス認証機能 ---
  openLicenseWindow: (url: string) => Promise<OpenWindowResult>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}