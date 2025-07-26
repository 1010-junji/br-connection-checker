import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import AdmZip = require('adm-zip');
import { DOMParser, XMLSerializer } from 'xmldom';
import { channels } from '../shared-channels';
import { FileDialogOpenResult, ProcessBackupResult } from './types';

class BackupFileProcessor {
  private parser = new DOMParser();
  private serializer = new XMLSerializer();
  private readonly CONFIG = {
    PRODUCTION: "Production",
    NON_PRODUCTION: "Non Production",
    PROJECT_PREFIX: "Project_",
    XML_FILES: {
      GLOBAL: "global.xml",
      PROJECT: "project.xml",
    },
    VERSION_TXT: "version.txt",
  };

  constructor(private webContents: Electron.WebContents) {}

  private log(message: string) {
      this.webContents.send(channels.BACKUP_PROCESS_LOG, message);
  }

  private toggleValue(current: string, value1: string, value2: string): string {
    const normalizedCurrent = current.trim();
    if (normalizedCurrent === value1) return value2;
    if (normalizedCurrent === value2) return value1;
    return current;
  }
    
  private toggleBooleanValue(current: string): string {
    const normalizedCurrent = current.trim().toLowerCase();
    if (normalizedCurrent === 'true') return 'false';
    if (normalizedCurrent === 'false') return 'true';
    return current;
  }
  
  private async processXml(filePath: string, projectName?: string): Promise<void> {
    const logFileName = projectName ? `${projectName}/${path.basename(filePath)}` : path.basename(filePath);
    this.log(`  - XMLファイルを処理中: ${logFileName}`);

    const xmlContent = await fs.readFile(filePath, "utf-8");
    const doc = this.parser.parseFromString(xmlContent, "application/xml");

    const isGlobal = path.basename(filePath) === this.CONFIG.XML_FILES.GLOBAL;

    const clusterNodes = doc.getElementsByTagName("cluster");
    for (let i = 0; i < clusterNodes.length; i++) {
      const nameNode = clusterNodes[i].getElementsByTagName("name")[0];
      if (nameNode) {
        nameNode.textContent = this.toggleValue(nameNode.textContent!, this.CONFIG.PRODUCTION, this.CONFIG.NON_PRODUCTION);
      }
    }

    if (isGlobal) {
      for (let i = 0; i < clusterNodes.length; i++) {
        const prodNode = clusterNodes[i].getElementsByTagName("production")[0];
        if (prodNode) {
          prodNode.textContent = this.toggleBooleanValue(prodNode.textContent!);
        }
      }
    } else {
      const forceNodes = doc.getElementsByTagName("forceServiceCluster");
      for (let i = 0; i < forceNodes.length; i++) {
        forceNodes[i].textContent = this.toggleValue(forceNodes[i].textContent!, this.CONFIG.PRODUCTION, this.CONFIG.NON_PRODUCTION);
      }
    }

    let newXmlContent = this.serializer.serializeToString(doc);
    newXmlContent = newXmlContent.replace(
      // タグ名の大文字・小文字を区別せず (iフラグ)
      // 内容が改行を含んでいても正しくマッチするように (sフラグ)
      /(<blockInput\b[^>]*>)(.*?)(<\/blockInput>)/gis,
      (match, start, content, end) => {
        // XMLSerializerによってデコードされた可能性がある < と > を再エンコードする
        // 元々 &lt; や &gt; だったものが < や > になっていると仮定する
        content = content
          .replace(/</g, "&lt;") // < を &lt; に戻す
          .replace(/>/g, "&gt;"); // > を &gt; に戻す
        return start + content + end;
      }
    );

    await fs.writeFile(filePath, newXmlContent, 'utf-8');
  }

  public async run(inputZipPath: string): Promise<ProcessBackupResult> {
    let tempDir = '';
    try {
      this.log(`[*] 処理を開始します: ${inputZipPath}`);
      
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-editor-'));
      this.log(`[*] 一時フォルダを作成しました: ${tempDir}`);

      const zip = new AdmZip(inputZipPath);
      zip.extractAllTo(tempDir, true);
      this.log(`[*] ZIPファイルを一時フォルダに展開しました。`);

      // 1. まず global.xml を探す
      const globalXmlEntry = zip.getEntry(this.CONFIG.XML_FILES.GLOBAL);
      if (!globalXmlEntry) {
          throw new Error(`ZIPファイルのルートに ${this.CONFIG.XML_FILES.GLOBAL} が見つかりませんでした。`);
      }
      const globalXmlFullPath = path.join(tempDir, globalXmlEntry.entryName);
      const baseDir = path.dirname(globalXmlFullPath); // global.xml があるディレクトリが基点

      try {
        const versionTxtPath = path.join(baseDir, this.CONFIG.VERSION_TXT);
        // version.txtを読み込む
        const versionContent = await fs.readFile(versionTxtPath, "utf-8");
        // 最初の行を抽出（改行コードで分割し、最初の要素を取得）
        const firstLine = versionContent.split(/\r?\n/)[0].trim();
        if (firstLine) {
          // 抽出したバージョン情報をログに出力
          this.log(`  - MCバックアップファイルのバージョン: ${firstLine}`);
        }
      } catch (error) {
        // version.txt が存在しない、または読み込めない場合は、エラーにせず処理を続行する
        // console.log('version.txt not found or could not be read, skipping.');
      }
      
      // 2. global.xml を処理
      await this.processXml(globalXmlFullPath);
      let processedCount = 1;

      // 3. 基点ディレクトリ内の Project_xxx フォルダを探索
      this.log(`[*] プロジェクトフォルダをスキャン中...`);
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith(this.CONFIG.PROJECT_PREFIX)) {
          const projectDir = path.join(baseDir, entry.name);
          const projectXmlPath = path.join(projectDir, this.CONFIG.XML_FILES.PROJECT);

          try {
            // project.xml の存在を確認
            await fs.access(projectXmlPath);
            // processXml にプロジェクト名を渡す
            await this.processXml(projectXmlPath, entry.name);
            processedCount++;
          } catch (error) {
            this.log(`  - スキップ: ${entry.name} 内に ${this.CONFIG.XML_FILES.PROJECT} が見つかりませんでした。`);
          }
        }
      }
      
      this.log(`[*] 合計 ${processedCount} 個のXMLファイルを更新しました。`);

      // 4. 新しいZIPを作成 (基点ディレクトリを圧縮)
      const outputZip = new AdmZip();
      outputZip.addLocalFolder(baseDir, ''); // 基点ディレクトリの内容をZIPのルートに追加
      
      const originalFileName = path.basename(inputZipPath);
      const outputFileName = `switched_${originalFileName}`;
      const outputZipPath = path.join(path.dirname(inputZipPath), outputFileName);
      
      outputZip.writeZip(outputZipPath);
      this.log(`[*] 新しいZIPファイルを作成しました: ${outputZipPath}`);
      
      return { success: true, outputPath: outputZipPath };

    } catch (error: any) {
      this.log(`[ERROR] エラーが発生しました: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
        this.log(`[*] 一時フォルダを削除しました。`);
      }
      this.log('--- 処理完了 ---');
    }
  }
}

export function registerBackupEditorHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle(channels.OPEN_FILE_DIALOG, async (): Promise<FileDialogOpenResult> => {
    if (!mainWindow) return { canceled: true };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'バックアップファイルを選択',
      properties: ['openFile'],
      filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
    });
    return { canceled: canceled || filePaths.length === 0, filePath: filePaths[0] };
  });

  ipcMain.handle(channels.PROCESS_BACKUP_FILE, async (event, filePath: string): Promise<ProcessBackupResult> => {
    if (!mainWindow) return { success: false, error: 'メインウィンドウが見つかりません。' };
    
    const processor = new BackupFileProcessor(mainWindow.webContents);
    return await processor.run(filePath);
  });
}