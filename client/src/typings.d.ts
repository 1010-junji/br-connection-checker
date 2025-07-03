import { IpcRendererEvent } from 'electron';

export interface IElectronAPI {
  runCheck: (mode: string, params: any) => Promise<{ success: boolean; error?: string }>;
  saveLog: (logContent: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  onCheckProgress: (callback: (event: IpcRendererEvent, log: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}