import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import mysql from 'mysql2/promise';
import { channels } from '../shared-channels';
import { DbConnectionParams } from './types';

const SETTINGS_FILE_NAME = 'settings.json';

// 設定ファイルのフルパスを取得
function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE_NAME);
}

// デフォルト設定
const defaultSettings: DbConnectionParams = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'kapow'
};

export function registerSettingsHandlers() {
  // 設定を取得するハンドラ
  ipcMain.handle(channels.GET_APP_SETTINGS, async (): Promise<DbConnectionParams> => {
    try {
      const filePath = getSettingsFilePath();
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      // ファイルが存在しない、または読み取りエラーの場合はデフォルト設定を返す
      if (error.code === 'ENOENT') {
        console.log('Settings file not found, returning default settings.');
        return defaultSettings;
      }
      console.error('Failed to read settings file:', error);
      // その他のエラーの場合もデフォルト設定を返す
      return defaultSettings;
    }
  });

  // 設定を保存するハンドラ
  ipcMain.handle(channels.SAVE_APP_SETTINGS, async (event, settings: DbConnectionParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const filePath = getSettingsFilePath();
      // NOTE: 本番アプリケーションでは、パスワードなどの機密情報は
      // electron.safeStorage を使用して暗号化することを強く推奨します。
      // 今回は簡潔さのために平文で保存しています。
      await fs.writeFile(filePath, JSON.stringify(settings, null, 2), 'utf-8');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save settings file:', error);
      return { success: false, error: error.message };
    }
  });

  // DB接続をテストするハンドラ
  ipcMain.handle(channels.TEST_DB_CONNECTION, async (event, params: DbConnectionParams): Promise<{ success: boolean; message: string }> => {
    let connection: mysql.Connection | null = null;
    try {
      // passwordが空文字またはnullの場合、接続パラメータから除外する
      const connectionParams: mysql.ConnectionOptions = { ...params };
      if (!connectionParams.password) {
        delete connectionParams.password;
      }

      connection = await mysql.createConnection(connectionParams);
      await connection.ping(); // 接続確認

      return { success: true, message: 'データベースへの接続に成功しました。' };
    } catch (error: any) {
      console.error('DB Connection Test Failed:', error);
      // エラーメッセージを分かりやすく整形
      let friendlyMessage = `接続に失敗しました: ${error.message}`;
      if (error.code === 'ECONNREFUSED') {
        friendlyMessage = `接続が拒否されました。ホスト名やポート番号が正しいか、DBサーバーが起動しているか確認してください。`;
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyMessage = `アクセスが拒否されました。ユーザー名またはパスワードが正しくありません。`;
      } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
        friendlyMessage = `データベース'${params.database}'へのアクセスが拒否されました。ユーザーに権限があるか確認してください。`;
      } else if (error.code === 'ENOTFOUND') {
        friendlyMessage = `ホスト'${params.host}'が見つかりませんでした。ホスト名が正しいか、DNS設定を確認してください。`;
      }
      return { success: false, message: friendlyMessage };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });
}