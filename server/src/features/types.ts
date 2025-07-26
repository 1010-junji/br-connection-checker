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