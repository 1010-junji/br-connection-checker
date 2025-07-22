import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProcessBackupResult } from 'src/typings.d';

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

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

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

    const result: ProcessBackupResult = await window.electronAPI.processBackupFile(this.selectedFilePath);

    this.isRunning = false;
    this.cdr.detectChanges();
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