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
      title: '疎通チェッカー',
      description: 'サーバー間のネットワーク・ポート接続をGUIから確認します。',
      icon: 'power',
      route: '/connection-checker',
      color: '#388E3C' // Green
    },
    {
      title: 'バックアップ編集',
      description: 'ZIP形式のバックアップファイル内のクラスター情報を編集します。',
      icon: 'dynamic_form',
      route: '/backup-editor',
      color: '#1976D2' // Blue
    },
    {
      title: 'ライセンス認証',
      description: '指定したURLを新しいウィンドウで開き、ライセンス認証を補助します。',
      icon: 'vpn_key',
      route: '/license-activator',
      color: '#F57C00' // Orange
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}