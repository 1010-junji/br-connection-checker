import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { channels } from '../shared-channels';
import { DbConnectionProfile, MysqlConnectionParams, DerbyConnectionParams, TestDbConnectionResult, FileDialogOpenResult } from './types';

const SETTINGS_FILE_NAME = 'settings.json';

// 設定ファイルのフルパスを取得
function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE_NAME);
}

// デフォルト設定
const createDefaultProfile = (): DbConnectionProfile[] => [{
  id: uuidv4(),
  name: 'Default MySQL',
  dbType: 'mysql',
  connection: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'kapow'
  }
}];

async function testMysqlConnection(params: MysqlConnectionParams): Promise<TestDbConnectionResult> {
  let connection: mysql.Connection | null = null;
  try {
    const connectionParams: mysql.ConnectionOptions = { ...params };
    if (!connectionParams.password) {
      delete connectionParams.password;
    }
    connection = await mysql.createConnection(connectionParams);
    await connection.ping();
    return { success: true, message: 'MySQLデータベースへの接続に成功しました。' };
  } catch (error: any) {
    console.error('MySQL Connection Test Failed:', error);
    let friendlyMessage = `接続に失敗しました: ${error.message}`;
    if (error.code === 'ECONNREFUSED') friendlyMessage = `接続が拒否されました。ホスト名やポート番号が正しいか、DBサーバーが起動しているか確認してください。`;
    else if (error.code === 'ER_ACCESS_DENIED_ERROR') friendlyMessage = `アクセスが拒否されました。ユーザー名またはパスワードが正しくありません。`;
    else if (error.code === 'ER_DBACCESS_DENIED_ERROR') friendlyMessage = `データベース'${params.database}'へのアクセスが拒否されました。`;
    else if (error.code === 'ENOTFOUND') friendlyMessage = `ホスト'${params.host}'が見つかりませんでした。`;
    return { success: false, message: friendlyMessage };
  } finally {
    if (connection) await connection.end();
  }
}

async function testDerbyConnection(params: DerbyConnectionParams): Promise<TestDbConnectionResult> {
  try {
    // Derbyは組み込みDBのため、ここではファイルの存在確認のみを行う
    // Java依存を避けるためのアーキテクチャ判断
    await fs.access(params.path, fs.constants.F_OK);
    return { success: true, message: 'Derbyデータベースのディレクトリ（またはファイル）が確認できました。' };
  } catch (error) {
    console.error('Derby Connection Test Failed:', error);
    return { success: false, message: `指定されたパス '${params.path}' が見つかりません。` };
  }
}

export function registerSettingsHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle(channels.GET_APP_SETTINGS, async (): Promise<DbConnectionProfile[]> => {
    try {
      const filePath = getSettingsFilePath();
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('Settings file not found, returning default profile.');
        return createDefaultProfile();
      }
      console.error('Failed to read settings file:', error);
      return []; // エラー時は空の配列を返す
    }
  });

  ipcMain.handle(channels.SAVE_APP_SETTINGS, async (event, profiles: DbConnectionProfile[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const filePath = getSettingsFilePath();
      await fs.writeFile(filePath, JSON.stringify(profiles, null, 2), 'utf-8');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save settings file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(channels.TEST_DB_CONNECTION, async (event, profile: DbConnectionProfile): Promise<TestDbConnectionResult> => {
    if (profile.dbType === 'mysql') {
      return testMysqlConnection(profile.connection as MysqlConnectionParams);
    } else if (profile.dbType === 'derby') {
      return testDerbyConnection(profile.connection as DerbyConnectionParams);
    }
    return { success: false, message: '不明なデータベースタイプです。' };
  });

  ipcMain.handle(channels.OPEN_DIRECTORY_DIALOG, async (): Promise<FileDialogOpenResult> => {
    if (!mainWindow) return { canceled: true };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Derbyデータベースのディレクトリを選択',
      properties: ['openDirectory'],
    });
    return { canceled: canceled || filePaths.length === 0, filePath: filePaths[0] };
  });
}