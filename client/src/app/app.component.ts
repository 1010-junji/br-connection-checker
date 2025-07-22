import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // アプリケーションのルートコンポーネントは、
  // ルーティングを処理する <router-outlet> をホストする役割に専念します。
  // 実際のUIレイアウトは LayoutComponent が担当します。
}