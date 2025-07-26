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

export interface DbSetting {
    id: string;
    name: string;
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

export interface TablePreviewData {
    headers: string[];
    rows: any[];
}
export interface ExportResult {
    success: boolean;
    filePath?: string;
    error?: string;
}