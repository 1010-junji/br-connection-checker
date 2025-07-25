import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProcessBackupResult } from 'src/typings.d';
import { LayoutService } from 'src/app/shared/services/layout.service';

@Component({
  selector: 'app-editor-main',
  templateUrl: './editor-main.component.html',
  styleUrls: ['./editor-main.component.scss']
})
export class EditorMainComponent implements OnInit, OnDestroy {
  selectedFilePath: string | null = null;
  logOutput: { type: 'info' | 'error' | 'success', message: string }[] = [];
  isRunning = false;
  
  private logListenerCleaner: (() => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private layoutService: LayoutService
  ) { }

  ngOnInit(): void {
    this.addLog('info', '処理するZIP形式のバックアップファイルを選択してください。');
    if (window.electronAPI) {
      this.logListenerCleaner = window.electronAPI.onBackupProcessLog((event, log) => {
        this.zone.run(() => {
          if (log.startsWith('[ERROR]')) {
            this.addLog('error', log);
          } else if (log.includes('新しいZIPファイルを作成しました')) {
            this.addLog('success', log);
          }
          else {
            this.addLog('info', log);
          }
          this.cdr.detectChanges();
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.logListenerCleaner?.();
  }

  async selectFile(): Promise<void> {
    if (!window.electronAPI || this.isRunning) return;

    const result = await window.electronAPI.openFileDialog();
    if (!result.canceled && result.filePath) {
      this.selectedFilePath = result.filePath;
      this.logOutput = []; // ログをリセット
      this.addLog('info', `ファイルが選択されました: ${this.selectedFilePath}`);
      this.cdr.detectChanges();
    }
  }

  async processFile(): Promise<void> {
    if (!this.selectedFilePath || !window.electronAPI || this.isRunning) return;

    this.isRunning = true;
    this.logOutput = []; // ログをリセット

try {
        await window.electronAPI.processBackupFile(this.selectedFilePath);
    } catch (error) {
        // エラーログは onBackupProcessLog で捕捉されるため、ここでは何もしない
        console.error("Backup processing failed", error);
    } finally {
        this.isRunning = false;
        // 処理完了後にスクロールを要求
        this.zone.run(() => {
            this.cdr.detectChanges(); // UIの更新を確実にする
            // 少し遅延させてからスクロールを要求すると、より確実
            setTimeout(() => this.layoutService.requestScrollToBottom(), 100);
        });
    }
  }

  private addLog(type: 'info' | 'error' | 'success', message: string): void {
    this.logOutput.push({ type, message });
  }

  get fileName(): string {
    if (!this.selectedFilePath) return '';
    // WindowsとLinux/Macの両方に対応するため、正規表現でパス区切り文字を扱う
    return this.selectedFilePath.replace(/^.*[\\\/]/, '');
  }
}