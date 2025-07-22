// server/src/features/types.ts
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