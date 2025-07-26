import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-main',
  templateUrl: './settings-main.component.html',
  styleUrls: ['./settings-main.component.scss']
})
export class SettingsMainComponent implements OnInit {
  settingsForm: FormGroup;
  isSaving = false;
  isTesting = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.settingsForm = this.fb.group({
      host: ['localhost', [Validators.required]],
      port: [3306, [Validators.required, Validators.min(1), Validators.max(65535)]],
      user: ['root', [Validators.required]],
      password: [''],
      database: ['kapow', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const settings = await window.electronAPI.getAppSettings();
      this.settingsForm.patchValue(settings);
    } catch (error) {
      console.error('Failed to load settings', error);
      this.showSnackbar('設定の読み込みに失敗しました。', 'error');
    }
  }

  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid || !window.electronAPI) return;

    this.isSaving = true;
    try {
      const result = await window.electronAPI.saveAppSettings(this.settingsForm.value);
      if (result.success) {
        this.showSnackbar('設定を保存しました。', 'success');
      } else {
        this.showSnackbar(`設定の保存に失敗しました: ${result.error}`, 'error');
      }
    } catch (error: any) {
      this.showSnackbar(`設定の保存中にエラーが発生しました: ${error.message}`, 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async testConnection(): Promise<void> {
    if (this.settingsForm.invalid || !window.electronAPI) return;

    this.isTesting = true;
    try {
      const result = await window.electronAPI.testDbConnection(this.settingsForm.value);
      this.showSnackbar(result.message, result.success ? 'success' : 'error');
    } catch (error: any) {
      this.showSnackbar(`接続テスト中にエラーが発生しました: ${error.message}`, 'error');
    } finally {
      this.isTesting = false;
    }
  }

  private showSnackbar(message: string, panelClass: 'success' | 'error'): void {
    this.snackBar.open(message, '閉じる', {
      duration: 5000,
      panelClass: `snackbar-${panelClass}`
    });
  }
}