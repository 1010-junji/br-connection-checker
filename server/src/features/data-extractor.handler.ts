import { ipcMain, dialog } from 'electron';
import mysql from 'mysql2';
import { format as csvFormat } from '@fast-csv/format';
import AdmZip from 'adm-zip';
import { channels } from '../shared-channels';
import { DbSetting, TablePreviewData, ExportResult } from './types';

// DB接続を管理するヘルパークラス
class DbConnectionManager {
  private connection: mysql.Connection | null = null;

  constructor(private params: DbSetting) {}

  private getConnectionParams(): mysql.ConnectionOptions {
    const connectionParams: mysql.ConnectionOptions = {
      host: this.params.host,
      port: this.params.port,
      user: this.params.user,
      password: this.params.password,
      database: this.params.database,
    };
    if (!connectionParams.password) {
      delete connectionParams.password;
    }
    return connectionParams;
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
        this.connection = mysql.createConnection(this.getConnectionParams());
        this.connection.connect(err => {
            if (err) return reject(err);
            resolve();
        });
    });
  }

  getTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!this.connection) return reject(new Error('Not connected to database'));
        this.connection.query<mysql.RowDataPacket[]>(`SHOW TABLES`, (err, rows) => {
            if (err) return reject(err);
            resolve(rows.map(row => Object.values(row)[0]));
        });
    });
  }

  getTablePreview(tableName: string): Promise<TablePreviewData> {
    return new Promise((resolve, reject) => {
        if (!this.connection) return reject(new Error('Not connected to database'));
        this.connection.query(`SELECT * FROM \`${tableName}\` LIMIT 100`, (err, rows, fields) => {
            if (err) return reject(err);
            resolve({
                headers: fields.map(field => field.name),
                rows: rows as any[],
            });
        });
    });
  }

  exportTableToZip(tableName: string, savePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!this.connection) return reject(new Error('Not connected to database'));
        
        const csvStream = csvFormat({ headers: true });
        const zip = new AdmZip();
        
        const chunks: any[] = [];
        csvStream.on('data', chunk => chunks.push(chunk));
        csvStream.on('end', () => {
            try {
                const csvData = Buffer.concat(chunks);
                zip.addFile(`${tableName}.csv`, csvData);
                zip.writeZip(savePath);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        csvStream.on('error', err => reject(err));
        
        // connection.query() が返す Query オブジェクトから .stream() メソッドを呼び出し、
        // パイプ可能なストリームオブジェクトを正しく取得します。
        const queryStream = this.connection.query(`SELECT * FROM \`${tableName}\``).stream();
        
        queryStream.pipe(csvStream);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
        if (!this.connection) return resolve();
        this.connection.end(() => {
            resolve();
        });
    });
  }
}

// IPCハンドラ部分は変更なし
export function registerDataExtractorHandlers() {
  ipcMain.handle(channels.GET_TABLE_LIST, async (event, params: DbSetting): Promise<string[]> => {
    const db = new DbConnectionManager(params);
    try {
      await db.connect();
      return await db.getTables();
    } finally {
      await db.close();
    }
  });

  ipcMain.handle(channels.GET_TABLE_PREVIEW, async (event, params: DbSetting, tableName: string): Promise<TablePreviewData> => {
    const db = new DbConnectionManager(params);
    try {
      await db.connect();
      return await db.getTablePreview(tableName);
    } finally {
      await db.close();
    }
  });

  ipcMain.handle(channels.EXPORT_TABLE_TO_ZIP, async (event, params: DbSetting, tableName: string): Promise<ExportResult> => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const defaultPath = `${tableName}_${timestamp}.zip`;

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'ZIPファイルを保存',
      defaultPath: defaultPath,
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: '保存がキャンセルされました。' };
    }

    const db = new DbConnectionManager(params);
    try {
      await db.connect();
      await db.exportTableToZip(tableName, filePath);
      return { success: true, filePath };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      await db.close();
    }
  });
}