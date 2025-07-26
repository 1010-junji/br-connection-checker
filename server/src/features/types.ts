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