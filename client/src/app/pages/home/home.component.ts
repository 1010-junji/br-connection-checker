import { Component, OnInit } from '@angular/core';

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
    { id: 'das', title: 'DAS', description: 'DAS端末からのアウトバウンド通信を確認します。', icon: 'dvr' },
    { id: 'ds', title: 'Design Studio (DS)', description: 'DS端末からのアウトバウンド通信を確認します。', icon: 'design_services' },
    { id: 'kapplets', title: 'Kapplets', description: 'Kappletsサーバーからのアウトバウンド通信を確認します。', icon: 'app_settings_alt' },
    { id: 'mc', title: 'Management Console (MC)', description: 'MCサーバーからのアウトバウンド通信を確認します。', icon: 'event_repeat' },
    { id: 'rs', title: 'RoboServer (RS)', description: 'RoboServerからのアウトバウンド通信を確認します。', icon: 'dns' },
  ];

  constructor() {} 

  ngOnInit(): void {
  }
}