import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DbSetting } from 'src/typings';

@Component({
  selector: 'app-settings-main',
  templateUrl: './settings-main.component.html',
  styleUrls: ['./settings-main.component.scss']
})
export class SettingsMainComponent implements OnInit {
  settings: DbSetting[] = [];
  selectedSettingId: string | null = null;
  isNewMode = false;
  isProcessing = false;

  settingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.settingsForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      host: ['localhost', Validators.required],
      port: [3306, [Validators.required, Validators.min(1), Validators.max(65535)]],
      user: ['root', Validators.required],
      password: [''],
      database: ['kapow', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  get isFormVisible(): boolean {
      return this.isNewMode || !!this.selectedSettingId;
  }

  async loadSettings(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      this.settings = await window.electronAPI.getDbSettingsList();
    } catch (error) {
      this.showSnackbar('設定の読み込みに失敗しました。', 'error');
    }
  }

  onSelect(setting: DbSetting): void {
    this.selectedSettingId = setting.id;
    this.isNewMode = false;
    this.settingsForm.reset(setting);
  }

  onAddNew(): void {
    this.selectedSettingId = null;
    this.isNewMode = true;
    this.settingsForm.reset({
      host: 'localhost',
      port: 3306,
      user: 'root',
      database: 'kapow',
    });
  }

  async onSave(): Promise<void> {
    if (this.settingsForm.invalid || !window.electronAPI) return;
    this.isProcessing = true;

    const formValue = this.settingsForm.getRawValue();
    let updatedSettings: DbSetting[];

    if (this.isNewMode) {
      const newSetting = { ...formValue, id: crypto.randomUUID() };
      updatedSettings = [...this.settings, newSetting];
    } else {
      updatedSettings = this.settings.map(s => s.id === formValue.id ? formValue : s);
    }

    try {
      const result = await window.electronAPI.saveDbSettingsList(updatedSettings);
      if (result.success) {
        this.showSnackbar('設定を保存しました。', 'success');
        this.settings = updatedSettings;
        if (this.isNewMode) {
            this.isNewMode = false;
            this.selectedSettingId = formValue.id;
        }
      } else {
        this.showSnackbar(`設定の保存に失敗しました: ${result.error}`, 'error');
      }
    } catch (error: any) {
        this.showSnackbar(`エラー: ${error.message}`, 'error');
    } finally {
        this.isProcessing = false;
    }
  }

  async onDelete(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation(); // 親要素のクリックイベントを発火させない
    
    if (!window.confirm('この接続設定を本当に削除しますか？')) return;
    this.isProcessing = true;
    
    const updatedSettings = this.settings.filter(s => s.id !== id);

    try {
      const result = await window.electronAPI.saveDbSettingsList(updatedSettings);
      if (result.success) {
        this.showSnackbar('設定を削除しました。', 'success');
        this.settings = updatedSettings;
        if (this.selectedSettingId === id) {
          this.selectedSettingId = null;
          this.isNewMode = false;
        }
      } else {
        this.showSnackbar(`削除に失敗しました: ${result.error}`, 'error');
      }
    } catch(error: any) {
        this.showSnackbar(`エラー: ${error.message}`, 'error');
    } finally {
        this.isProcessing = false;
    }
  }
  
  async onTestConnection(): Promise<void> {
    if (this.settingsForm.invalid || !window.electronAPI) return;
    this.isProcessing = true;

    try {
        const result = await window.electronAPI.testDbConnection(this.settingsForm.value);
        this.showSnackbar(result.message, result.success ? 'success' : 'error');
    } catch(error: any) {
        this.showSnackbar(`エラー: ${error.message}`, 'error');
    } finally {
        this.isProcessing = false;
    }
  }

  private showSnackbar(message: string, panelClass: 'success' | 'error'): void {
    this.snackBar.open(message, '閉じる', {
      duration: 7000,
      panelClass: `snackbar-${panelClass}`
    });
  }
}