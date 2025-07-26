import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectionListChange } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { DbConnectionProfile, DbType } from 'src/typings.d';

@Component({
  selector: 'app-settings-main',
  templateUrl: './settings-main.component.html',
  styleUrls: ['./settings-main.component.scss']
})
export class SettingsMainComponent implements OnInit, OnDestroy {
  profiles: DbConnectionProfile[] = [];
  selectedProfile: DbConnectionProfile | null = null;
  settingsForm: FormGroup;
  isProcessing = false;
  private dbTypeSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.settingsForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      dbType: ['mysql' as DbType, Validators.required],
      connection: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.onDbTypeChange();
  }

  ngOnDestroy(): void {
    this.dbTypeSubscription?.unsubscribe();
  }

  async loadProfiles(): Promise<void> {
    if (!window.electronAPI) {
      this.profiles = [];
      return;
    }
    try {
      const loadedProfiles = await window.electronAPI.getAppSettings();
      // Electronからの戻り値が配列であることを保証する
      this.profiles = Array.isArray(loadedProfiles) ? loadedProfiles : [];

      if (this.profiles.length > 0) {
        this.selectProfile(this.profiles[0]);
      } else {
        this.selectedProfile = null;
      }
    } catch (error) {
      this.showSnackbar('設定プロファイルの読み込みに失敗しました。', 'error');
      this.profiles = []; // エラー時も空の配列を保証
    }
  }

  private onDbTypeChange(): void {
    this.dbTypeSubscription = this.settingsForm.get('dbType')!.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe((dbType: DbType) => {
      this.updateConnectionForm(dbType);
    });
  }

  private updateConnectionForm(dbType: DbType, data?: any): void {
    const connectionGroup = this.fb.group(
      dbType === 'mysql' ? this.createMysqlForm() : this.createDerbyForm()
    );
    if (data) {
      connectionGroup.patchValue(data);
    }
    this.settingsForm.setControl('connection', connectionGroup);
  }

  private createMysqlForm() {
    return {
      host: ['localhost', Validators.required],
      port: [3306, [Validators.required, Validators.min(1), Validators.max(65535)]],
      user: ['root', Validators.required],
      password: [''],
      database: ['kapow', Validators.required]
    };
  }

  private createDerbyForm() {
    return {
      path: ['', Validators.required],
      user: [''],
      password: ['']
    };
  }

  onProfileSelected(event: MatSelectionListChange): void {
    this.selectProfile(event.options[0].value);
  }

  selectProfile(profile: DbConnectionProfile): void {
    this.updateCurrentProfileFromForm();
    this.selectedProfile = profile;

    this.settingsForm.get('dbType')?.setValue(profile.dbType, { emitEvent: false });
    this.updateConnectionForm(profile.dbType, profile.connection);
    this.settingsForm.patchValue({
      id: profile.id,
      name: profile.name,
    });
  }

  private updateCurrentProfileFromForm(): void {
    if (this.selectedProfile && this.settingsForm.valid) {
      const formValue = this.settingsForm.getRawValue();
      const index = this.profiles.findIndex(p => p.id === this.selectedProfile!.id);
      if (index > -1) {
        // 配列の参照を新しくして変更検知を確実にする
        const newProfiles = [...this.profiles];
        newProfiles[index] = { ...newProfiles[index], ...formValue };
        this.profiles = newProfiles;
      }
    }
  }

  addNewProfile(): void {
    this.updateCurrentProfileFromForm();
    const newProfile: DbConnectionProfile = {
      id: uuidv4(),
      name: '新規プロファイル',
      dbType: 'mysql',
      connection: { host: 'localhost', port: 3306, user: '', password: '', database: '' }
    };
    // 新しい配列を生成して代入することで、不変性を保ちエラーを防ぐ
    this.profiles = [...this.profiles, newProfile];
    this.selectProfile(newProfile);
  }

  deleteSelectedProfile(): void {
    if (!this.selectedProfile) return;
    if (confirm(`'${this.selectedProfile.name}' を本当に削除しますか？`)) {
      this.profiles = this.profiles.filter(p => p.id !== this.selectedProfile!.id);
      if (this.profiles.length > 0) {
        this.selectProfile(this.profiles[0]);
      } else {
        this.selectedProfile = null;
        this.settingsForm.reset();
      }
    }
  }

  async selectDerbyPath(): Promise<void> {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.openDirectoryDialog();
    if (!result.canceled && result.filePath) {
      this.settingsForm.get('connection.path')?.setValue(result.filePath);
    }
  }

  async saveProfiles(): Promise<void> {
    this.updateCurrentProfileFromForm();
    if (!window.electronAPI) return;

    this.isProcessing = true;
    try {
      const result = await window.electronAPI.saveAppSettings(this.profiles);
      if (result.success) {
        this.showSnackbar('すべてのプロファイルを保存しました。', 'success');
      } else {
        this.showSnackbar(`保存に失敗しました: ${result.error}`, 'error');
      }
    } catch (error: any) {
      this.showSnackbar(`保存中にエラーが発生しました: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  async testConnection(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.showSnackbar('入力内容に不備があります。', 'error');
      return;
    };
    if (!window.electronAPI) return;

    this.isProcessing = true;
    const profileToTest: DbConnectionProfile = this.settingsForm.getRawValue();
    try {
      const result = await window.electronAPI.testDbConnection(profileToTest);
      this.showSnackbar(result.message, result.success ? 'success' : 'error');
    } catch (error: any) {
      this.showSnackbar(`テスト中にエラーが発生しました: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  private showSnackbar(message: string, panelClass: 'success' | 'error'): void {
    this.snackBar.open(message, '閉じる', {
      duration: 5000,
      panelClass: `snackbar-${panelClass}`
    });
  }
}