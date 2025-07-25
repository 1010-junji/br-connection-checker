import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LayoutService } from 'src/app/shared/services/layout.service';

interface FormField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number';
  class: 'host-field' | 'port-field' | 'full-width-field';
}
interface FieldRow {
  fields: FormField[];
}

interface CheckTarget {
  title: string;
  fieldRows: FieldRow[];
}

interface ModeSelection {
  id: string;
  name: string;
}

interface IpFamilySelection {
  value: 'any' | 4 | 6;
  viewValue: string;
}

const MODE_CONFIG: { [key: string]: { title: string, checkTargets: CheckTarget[] } } = {
  das: {
    title: 'DAS', checkTargets: [
      { title: '自端末: DAS', fieldRows: [
          { fields: [{ key: 'portNumber1', label: 'DASのコマンド ポート', value: '49998', type: 'number', class: 'full-width-field' }] },
          { fields: [{ key: 'portNumber2', label: 'DASのストリーム ポート', value: '49999', type: 'number', class: 'full-width-field' }] },
      ]},
      { title: '接続先: MCサーバー', fieldRows: [
          { fields: [
              { key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },
              { key: 'mcPort', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },
          ]}
      ]},
    ]
  },
  ds: {
    title: 'Design Studio', checkTargets: [
      { title: '接続先: MCサーバー', fieldRows: [
        { fields: [
            { key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },
            { key: 'mcport', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },
        ]}
      ]},
      { title: '接続先: DAS端末', fieldRows: [
        { fields: [{ key: 'dashost', label: 'DASのホスト名/IP', value: 'localhost', type: 'text', class: 'full-width-field' }] },
        { fields: [{ key: 'portNumber1', label: 'DASのコマンド ポート', value: '49998', type: 'number', class: 'full-width-field' }] },
        { fields: [{ key: 'portNumber2', label: 'DASのストリーム ポート', value: '49999', type: 'number', class: 'full-width-field' }] },
      ]},
    ]
  },
  kapplets: {
    title: 'Kapplets', checkTargets: [
      { title: '自端末: Kapplets', fieldRows: [
          { fields: [{ key: 'kappletsport', label: 'Kappletsのポート', value: '8080', type: 'number', class: 'full-width-field' }] },
      ]},
      { title: '接続先: DBサーバー', fieldRows: [
        { fields: [
            { key: 'dbhost', label: 'DBのホスト名/IP', value: 'mysql-service', type: 'text', class: 'host-field' },
            { key: 'dbport', label: 'DBポート', value: '3306', type: 'number', class: 'port-field' },
        ]}
      ]},
      { title: '接続先: MCサーバー', fieldRows: [
        { fields: [
            { key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },
            { key: 'mcport', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },
        ]}
      ]},
    ]
  },
  mc: {
    title: 'Management Console', checkTargets: [
        { title: '接続先: DBサーバー', fieldRows: [{ fields: [{ key: 'dbhost', label: 'DBのホスト名/IP', value: 'mysql-service', type: 'text', class: 'host-field' },{ key: 'dbport', label: 'DBポート', value: '3306', type: 'number', class: 'port-field' },]}]},
        { title: '接続先: Kappletsサーバー', fieldRows: [{ fields: [{ key: 'kappletshost', label: 'Kappletsのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'kappletsport', label: 'Kappletsポート', value: '8080', type: 'number', class: 'port-field' },]}]},
        { title: '自端末: MC', fieldRows: [{ fields: [{ key: 'mcport', label: 'MCのポート', value: '8080', type: 'number', class: 'full-width-field' }]}]},
        { title: '接続先: RoboServer', fieldRows: [{ fields: [{ key: 'rshost', label: 'RoboServerのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'rsport', label: 'RoboServerポート', value: '50000', type: 'number', class: 'port-field' },]}]},
    ]
  },
  rs: {
    title: 'RoboServer', checkTargets: [
        { title: '接続先: DBサーバー', fieldRows: [{ fields: [{ key: 'dbhost', label: 'DBのホスト名/IP', value: 'mysql-service', type: 'text', class: 'host-field' },{ key: 'dbport', label: 'DBポート', value: '3306', type: 'number', class: 'port-field' },]}]},
        { title: '接続先: MCサーバー', fieldRows: [{ fields: [{ key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'mcport', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },]}]},
        { title: '自端末: RoboServer', fieldRows: [{ fields: [{ key: 'rsport', label: 'RoboServerのポート', value: '50000', type: 'number', class: 'full-width-field' }]}]},
        { title: '接続先: DAS端末', fieldRows: [{ fields: [{ key: 'dashost', label: 'DASのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'dasport', label: 'DASコマンド ポート', value: '49998', type: 'number', class: 'port-field' },]}]},
    ]
  },
};

interface ModeSelection {
  id: string;
  name: string;
}

@Component({
  selector: 'app-checker-main',
  templateUrl: './checker-main.component.html',
  styleUrls: ['./checker-main.component.scss']
})
export class CheckerMainComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('logContainer') private logContainer!: ElementRef;

  modes: ModeSelection[] = [
    { id: 'das', name: 'DAS' },
    { id: 'ds', name: 'Design Studio (DS)' },
    { id: 'kapplets', name: 'Kapplets' },
    { id: 'mc', name: 'Management Console (MC)' },
    { id: 'rs', name: 'RoboServer (RS)' },
  ];

  ipFamilies: IpFamilySelection[] = [
    { value: 'any', viewValue: '両方 (OSに依存)' },
    { value: 4, viewValue: 'IPv4のみ' },
    { value: 6, viewValue: 'IPv6のみ' },
  ];
  selectedIpFamily: 'any' | 4 | 6 = 'any'; 

  selectedMode: string | null = null;
  config: { title: string, checkTargets: CheckTarget[] } | null = null;
  logOutput = '';
  isRunning = false;

  private progressListenerCleaner: (() => void) | null = null;
  private logObserver?: MutationObserver;

  constructor(
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService, // 新しいLayoutServiceをインジェクト
  ) { }

  ngOnInit(): void {

    if (window.electronAPI) {
      this.progressListenerCleaner = window.electronAPI.onCheckProgress((event, log) => {
        this.zone.run(() => {
          let formattedLog = this.escapeHtml(log);
          if (formattedLog.startsWith('%%OK%%')) {
            formattedLog = `<span class="log-ok">${formattedLog.replace('%%OK%%', '')}</span>`;
          } else if (formattedLog.startsWith('%%NG%%')) {
            formattedLog = `<span class="log-ng">${formattedLog.replace('%%NG%%', '')}</span>`;
          }
          this.logOutput += formattedLog;
          this.cdr.detectChanges(); // 手動で変更検出をトリガー
        });
      });
    }
  }

  ngAfterViewInit() {
    // ログが出力されるたびに一番下までスクロールする
    if (this.logContainer) {
      this.logObserver = new MutationObserver(() => {
          this.scrollToBottom();
      });
      this.logObserver.observe(this.logContainer.nativeElement, { childList: true, subtree: true });
    }
  }

  ngOnDestroy(): void {
    this.progressListenerCleaner?.();
    this.logObserver?.disconnect();
  }

  onModeChange(mode: string | null): void {
    if (!mode) {
      this.config = null;
      this.layoutService.setPageHeader({ title: '疎通チェッカー' });
    } else {
      this.selectedMode = mode;
      this.config = MODE_CONFIG[this.selectedMode] || null;
      this.layoutService.setPageHeader({ title: `疎通チェッカー - ${this.config?.title || ''}` });
    }
    this.resetLog();
  }
  
  private scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch(err) { /* do nothing */ }
  }

  public getFormParams(): { [key: string]: any } {
    if (!this.config) {
      return {};
    }
    const params = this.config.checkTargets.reduce((acc, target) => {
      target.fieldRows.forEach(row => {
        row.fields.forEach(field => {
          acc[field.key] = field.value;
        });
      });
      return acc;
    }, {} as { [key: string]: any });
    return params;
  }
  
  async runCheck(): Promise<void> {
    if (!this.config || !this.selectedMode || !window.electronAPI) return;

    this.isRunning = true;
    this.logOutput = `--- ${this.config.title} のチェックを開始します ---\n\n`;

    const params = this.getFormParams();
    params['title'] = this.config.title;
    params['ipFamily'] = this.selectedIpFamily;

    try {
      await window.electronAPI.runCheck(this.selectedMode, params);
    } catch (error) {
        console.error('Error during runCheck:', error);
        this.logOutput += `\n%%NG%%[FATAL] チェック実行中に予期せぬエラーが発生しました: ${error}\n`;
    } finally {
        this.zone.run(() => {
          this.isRunning = false;
          // 新しいサービス経由でスクロールをリクエスト
          this.layoutService.requestScrollToBottom();
        });
    }
  }

  async saveLog(): Promise<void> {
    if (!this.logOutput || !window.electronAPI) return;

    const plainTextLog = this.convertHtmlToPlainText(this.logOutput);

    const result = await window.electronAPI.saveLog(plainTextLog);
    if (result.success) {
      alert(`ログを保存しました: ${result.filePath}`);
    } else if (result.error) {
      alert(`エラー: ${result.error}`);
    }
  }

  private escapeHtml(text: string): string {
    const map: {[key: string]: string} = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;' // &apos; はHTML4でサポートされていないため、&#039; を使用
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
  
  private convertHtmlToPlainText(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  }
  
  private resetLog(): void {
    this.logOutput = '';
    this.isRunning = false;
  }
}