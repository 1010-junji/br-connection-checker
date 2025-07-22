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
      XML_FILES: {
          GLOBAL: "global.xml",
          PROJECT: "project.xml",
      },
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
    
  private async processXml(filePath: string): Promise<void> {
    this.log(`  - XMLファイルを処理中: ${path.basename(filePath)}`);
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
    
  private async findAndProcessXmlFiles(dir: string): Promise<number> {
    let count = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await this.findAndProcessXmlFiles(fullPath);
      } else if (entry.isFile() && (entry.name === this.CONFIG.XML_FILES.GLOBAL || entry.name === this.CONFIG.XML_FILES.PROJECT)) {
        await this.processXml(fullPath);
        count++;
      }
    }
    return count;
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

      const processedCount = await this.findAndProcessXmlFiles(tempDir);

      if (processedCount === 0) {
        throw new Error("処理対象の global.xml または project.xml が見つかりませんでした。");
      }
      this.log(`[*] ${processedCount}個のXMLファイルを更新しました。`);

      const outputZip = new AdmZip();
      outputZip.addLocalFolder(tempDir);

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