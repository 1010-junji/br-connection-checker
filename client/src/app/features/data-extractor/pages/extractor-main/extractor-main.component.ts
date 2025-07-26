import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DbSetting, TablePreviewData } from 'src/typings';

@Component({
  selector: 'app-extractor-main',
  templateUrl: './extractor-main.component.html',
  styleUrls: ['./extractor-main.component.scss']
})
export class ExtractorMainComponent implements OnInit {
  dbProfiles: DbSetting[] = [];
  tables: string[] = [];
  previewData: TablePreviewData = { headers: [], rows: [] };
  isLoading = false;

  profileControl = new UntypedFormControl(null, [Validators.required]);
  tableControl = new UntypedFormControl({ value: null, disabled: true }, [Validators.required]);

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loadDbProfiles();
  }

  async loadDbProfiles(): Promise<void> {
    if (!window.electronAPI) return;
    this.isLoading = true;
    try {
      this.dbProfiles = await window.electronAPI.getDbSettingsList();
      if (this.dbProfiles.length === 0) {
        this.showSnackbar('データ抽出を行うには、まず[設定]画面でデータベースプロファイルを登録してください。', 'error');
      }
    } catch (error: any) {
      this.showSnackbar(`プロファイルの読み込みに失敗しました: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async connectToDb(): Promise<void> {
    if (!this.profileControl.valid || !window.electronAPI) return;
    this.isLoading = true;
    this.tables = [];
    this.previewData = { headers: [], rows: [] };
    this.tableControl.reset();
    this.tableControl.disable();

    try {
      const selectedProfile = this.profileControl.value;
      this.tables = await window.electronAPI.getTableList(selectedProfile);
      this.tableControl.enable();
      this.showSnackbar(`接続成功: ${this.tables.length}個のテーブルが見つかりました。`, 'success');
    } catch (error: any) {
      this.showSnackbar(`データベースへの接続に失敗しました: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }
  
  async onTableSelect(tableName: string): Promise<void> {
    if (!tableName || !window.electronAPI) return;
    this.isLoading = true;

    try {
      const selectedProfile = this.profileControl.value;
      this.previewData = await window.electronAPI.getTablePreview(selectedProfile, tableName);
    } catch (error: any) {
      this.previewData = { headers: [], rows: [] };
      this.showSnackbar(`プレビューの取得に失敗しました: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }
  
  async exportData(): Promise<void> {
      if (!this.tableControl.valid || !window.electronAPI) return;
      this.isLoading = true;

      try {
        const selectedProfile = this.profileControl.value;
        const selectedTable = this.tableControl.value;
        const result = await window.electronAPI.exportTableToZip(selectedProfile, selectedTable);
        if (result.success) {
            this.showSnackbar(`データをエクスポートしました: ${result.filePath}`, 'success');
        } else {
            this.showSnackbar(`エクスポートに失敗しました: ${result.error}`, 'error');
        }
      } catch(error: any) {
        this.showSnackbar(`エクスポート中にエラーが発生しました: ${error.message}`, 'error');
      } finally {
        this.isLoading = false;
      }
  }

  private showSnackbar(message: string, panelClass: 'success' | 'error'): void {
    this.snackBar.open(message, '閉じる', {
      duration: 7000,
      panelClass: `snackbar-${panelClass}`
    });
  }
}