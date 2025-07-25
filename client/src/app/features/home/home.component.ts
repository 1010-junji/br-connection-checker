import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  featureCards: FeatureCard[] = [
    {
      title: 'コンポーネント間疎通チェッカー',
      description: 'コンポーネント間のネットワーク・ポート接続を確認します。',
      icon: 'power',
      route: '/connection-checker',
      color: '#e8f5e9'
    },
    {
      title: 'バックアップファイル編集ツール',
      description: 'Management Consoleから出力したZIP形式のバックアップファイルを編集します。',
      icon: 'dynamic_form',
      route: '/backup-editor',
      color: '#e8f5e9'
    },
    {
      title: 'ライセンス認証ブラウザー',
      description: 'Management Consoleを開いてBizRobo!のライセンスを登録します。',
      icon: 'vpn_key',
      route: '/license-activator',
      color: '#e8f5e9'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}