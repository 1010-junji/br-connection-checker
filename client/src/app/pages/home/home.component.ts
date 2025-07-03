import { Component, OnInit } from '@angular/core';
import { HeaderService } from 'src/app/shared/header.service';

interface CheckMode {
  id: 'das' | 'ds' | 'kapplets' | 'mc' | 'rs';
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  checkModes: CheckMode[] = [
    { id: 'das', title: 'DAS', description: 'DAS端末からのアウトバウンド通信を確認します。', icon: 'dns' },
    { id: 'ds', title: 'Design Studio (DS)', description: 'DS端末からのアウトバウンド通信を確認します。', icon: 'developer_board' },
    { id: 'kapplets', title: 'Kapplets', description: 'Kappletsサーバーからのアウトバウンド通信を確認します。', icon: 'view_quilt' },
    { id: 'mc', title: 'Management Console (MC)', description: 'MCサーバーからのアウトバウンド通信を確認します。', icon: 'settings_input_component' },
    { id: 'rs', title: 'RoboServer (RS)', description: 'RoboServerからのアウトバウンド通信を確認します。', icon: 'memory' },
  ];

  constructor(private headerService: HeaderService) {} // <-- DI

  ngOnInit(): void {
    // 状態の更新を現在の変更検知サイクルの直後にスケジュールする
    setTimeout(() => {
      // このコンポーネントが表示されたらタイトルを設定
      this.headerService.setTitle('コンポーネント間通信 疎通チェッカー');
      // ホーム画面では戻るボタンは不要
      this.headerService.setShowBackButton(false);
    });
  }
}