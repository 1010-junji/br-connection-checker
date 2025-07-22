import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-activator-main',
  templateUrl: './activator-main.component.html',
  styleUrls: ['./activator-main.component.scss']
})
export class ActivatorMainComponent implements OnInit {
  form: UntypedFormGroup;
  isLoading = false;

  private errorListenerCleaner: (() => void) | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      url: ['http://localhost:50080', [
        Validators.required,
        // URL形式を検証する正規表現
        Validators.pattern('^(https?|ftp)://[a-zA-Z0-9.-]+(:[0-9]{1,5})?(/.*)?$')
      ]]
    });
  }

  ngOnInit(): void {
    if (window.electronAPI?.onLicenseWindowError) {
      this.errorListenerCleaner = window.electronAPI.onLicenseWindowError((event, errorInfo) => {
        this.snackBar.open(`エラー: ${errorInfo.error}`, '閉じる', {
          duration: 7000,
          panelClass: ['mat-toolbar', 'mat-warn'] // エラーが目立つようにスタイルを適用
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.errorListenerCleaner?.();
  }

  async openWindow(): Promise<void> {
    if (this.form.invalid || !window.electronAPI) {
      this.snackBar.open('有効なURLを入力してください。', '閉じる', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const url = this.form.get('url')?.value;

    try {
      const result = await window.electronAPI.openLicenseWindow(url);
      if (result.success) {
        this.snackBar.open(`新しいウィンドウで ${url} を開きました。`, 'OK', { duration: 3000 });
      } else {
        this.snackBar.open(`ウィンドウを開けませんでした: ${result.error}`, '閉じる', { duration: 5000 });
      }
    } catch (error: any) {
      this.snackBar.open(`エラーが発生しました: ${error.message}`, '閉じる', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  get urlControl() {
    return this.form.get('url');
  }
}