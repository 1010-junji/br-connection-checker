import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { HomeComponent } from './features/home/home.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // デフォルトはホーム画面へ
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      // ホーム画面
      { 
        path: 'home', 
        component: HomeComponent,
        data: { title: 'ホーム' }
      },
      // 疎通チェッカー機能（遅延読み込み）
      {
        path: 'connection-checker',
        loadChildren: () => import('./features/connection-checker/connection-checker.module').then(m => m.ConnectionCheckerModule),
        data: { title: 'コンポーネント間疎通チェッカー' }
      },
      // バックアップ編集機能（遅延読み込み）
      {
        path: 'backup-editor',
        loadChildren: () => import('./features/backup-editor/backup-editor.module').then(m => m.BackupEditorModule),
        data: { title: 'バックアップファイル編集ツール' }
      },
      // ライセンス認証機能（遅延読み込み）
      {
        path: 'license-activator',
        loadChildren: () => import('./features/license-activator/license-activator.module').then(m => m.LicenseActivatorModule),
        data: { title: 'ライセンス認証ブラウザー' }
      },
      // アプリケーション設定機能（遅延読み込み）
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
        data: { title: 'アプリケーション設定' }
      },
    ]
  },
  // 上記以外のパスはホームにリダイレクト
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }