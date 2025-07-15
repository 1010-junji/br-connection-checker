import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderService } from 'src/app/shared/header.service';

// --- データ構造の再定義 ---
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

// チェック対象のグループ (例: "MCサーバー", "DASサーバー")
interface CheckTarget {
  title: string;
  fieldRows: FieldRow[];
}

// モードごとの設定
const MODE_CONFIG: { [key: string]: { title: string, checkTargets: CheckTarget[] } } = {
  das: {
    title: 'DAS',
    checkTargets: [
      { title: '自端末: DAS', fieldRows: [
          { fields: [{ key: 'portNumber1', label: 'DASのポート1 (例: 49998)', value: '49998', type: 'number', class: 'full-width-field' }] },
          { fields: [{ key: 'portNumber2', label: 'DASのポート2 (例: 49999)', value: '49999', type: 'number', class: 'full-width-field' }] },
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
    title: 'Design Studio',
    checkTargets: [
      { title: '接続先: MCサーバー', fieldRows: [
        { fields: [
            { key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },
            { key: 'mcport', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },
        ]}
      ]},
      { title: '接続先: DAS端末', fieldRows: [
        // 1行目: ホスト名のみ
        { fields: [{ key: 'dashost', label: 'DASのホスト名/IP', value: 'localhost', type: 'text', class: 'full-width-field' }] },
        // 2行目: ポート1のみ
        { fields: [{ key: 'portNumber1', label: 'DASのポート1', value: '49998', type: 'number', class: 'full-width-field' }] },
        // 3行目: ポート2のみ
        { fields: [{ key: 'portNumber2', label: 'DASのポート2', value: '49999', type: 'number', class: 'full-width-field' }] },
      ]},
    ]
  },
  kapplets: {
    title: 'Kapplets',
    checkTargets: [
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
    title: 'Management Console',
    checkTargets: [
        { title: '接続先: DBサーバー', fieldRows: [{ fields: [{ key: 'dbhost', label: 'DBのホスト名/IP', value: 'mysql-service', type: 'text', class: 'host-field' },{ key: 'dbport', label: 'DBポート', value: '3306', type: 'number', class: 'port-field' },]}]},
        { title: '接続先: Kappletsサーバー', fieldRows: [{ fields: [{ key: 'kappletshost', label: 'Kappletsのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'kappletsport', label: 'Kappletsポート', value: '8080', type: 'number', class: 'port-field' },]}]},
        { title: '自端末: MC', fieldRows: [{ fields: [{ key: 'mcport', label: 'MCのポート', value: '8080', type: 'number', class: 'full-width-field' }]}]},
        { title: '接続先: RoboServer', fieldRows: [{ fields: [{ key: 'rshost', label: 'RoboServerのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'rsport', label: 'RoboServerポート', value: '50000', type: 'number', class: 'port-field' },]}]},
    ]
  },
  rs: {
    title: 'RoboServer',
    checkTargets: [
        { title: '接続先: DBサーバー', fieldRows: [{ fields: [{ key: 'dbhost', label: 'DBのホスト名/IP', value: 'mysql-service', type: 'text', class: 'host-field' },{ key: 'dbport', label: 'DBポート', value: '3306', type: 'number', class: 'port-field' },]}]},
        { title: '接続先: MCサーバー', fieldRows: [{ fields: [{ key: 'mchost', label: 'MCのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'mcport', label: 'MCポート', value: '8080', type: 'number', class: 'port-field' },]}]},
        { title: '自端末: RoboServer', fieldRows: [{ fields: [{ key: 'rsport', label: 'RoboServerのポート', value: '50000', type: 'number', class: 'full-width-field' }]}]},
        { title: '接続先: DAS端末', fieldRows: [{ fields: [{ key: 'dashost', label: 'DASのホスト名/IP', value: 'localhost', type: 'text', class: 'host-field' },{ key: 'dasport', label: 'DASポート', value: '49998', type: 'number', class: 'port-field' },]}]},
    ]
  },
};

@Component({
  selector: 'app-checker',
  templateUrl: './checker.component.html',
  styleUrls: ['./checker.component.scss']
})
export class CheckerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('logContainer') private logContainer!: ElementRef;

  mode: string = '';
  config: { title: string, checkTargets: CheckTarget[] } | null = null;
  logOutput = '';
  isRunning = false;

  private routeSub!: Subscription;
  private progressListenerCleaner: (() => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.mode = params['mode'];
      this.config = MODE_CONFIG[this.mode] || null;

      this.reset();
    });

    // Electronからの進捗通知を受け取るリスナーを登録
    if (window.electronAPI) {
      this.progressListenerCleaner = window.electronAPI.onCheckProgress((event, log) => {
        this.zone.run(() => {
          // マーカーを解釈してHTMLに変換する
          let formattedLog = this.escapeHtml(log); // まずHTMLエスケープ
          if (formattedLog.startsWith('%%OK%%')) {
            formattedLog = `<span class="log-ok">${formattedLog.replace('%%OK%%', '')}</span>`;
          } else if (formattedLog.startsWith('%%NG%%')) {
            formattedLog = `<span class="log-ng">${formattedLog.replace('%%NG%%', '')}</span>`;
          }
          this.logOutput += formattedLog;
          this.cdr.detectChanges();
        });
      });
    }
  }

  ngAfterViewInit() {
    // ログが出力されるたびに一番下までスクロールする
    const observer = new MutationObserver(() => {
        this.scrollToBottom();
    });
    observer.observe(this.logContainer.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    // コンポーネント破棄時に購読とリスナーを解除
    this.routeSub.unsubscribe();
    this.progressListenerCleaner?.();
  }
  
  private scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  /**
 * テンプレートで使用するヘルパーメソッド。
 * 現在のフォームの入力値をすべて集約し、単一のオブジェクトとして返す。
 * このオブジェクトが各SVGコンポーネントの [params] に渡される。
 * @returns { [key: string]: any } フォームのキーと値のペアを持つオブジェクト
 */
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
    if (!this.config || !window.electronAPI) return;

    this.isRunning = true;
    this.logOutput = `--- ${this.config.title} のチェックを開始します ---\n\n`;

    // データ構造の変更に伴い、パラメータ収集ロジックを修正
    const params = this.config.checkTargets.reduce((acc, target) => {
      target.fieldRows.forEach(row => {
        row.fields.forEach(field => {
          acc[field.key] = field.value;
        });
      });
      return acc;
    }, {} as { [key: string]: any });
    
    params['title'] = this.config.title;

    await window.electronAPI.runCheck(this.mode, params);

    this.zone.run(() => {
      this.isRunning = false;
      this.headerService.requestScrollToBottom();
    });
  }

  async saveLog(): Promise<void> {
    if (!this.logOutput || !window.electronAPI) return;

    // HTMLとして保持しているログを、プレーンテキストに変換
    const plainTextLog = this.convertHtmlToPlainText(this.logOutput);

    const result = await window.electronAPI.saveLog(plainTextLog);
    if (result.success) {
      alert(`ログを保存しました: ${result.filePath}`);
    } else {
      alert(`エラー: ${result.error}`);
    }
  }

  // セキュリティのため、ログ中のHTML特殊文字をエスケープするヘルパー関数
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
    // 一時的なdiv要素をメモリ上に作成
    const tempDiv = document.createElement('div');

    // innerHTMLにセットすることで、ブラウザにHTMLをパースさせる
    tempDiv.innerHTML = html;

    // textContentプロパティで、タグが除去され、エンティティがデコードされた
    // 純粋なテキストを取得する
    return tempDiv.textContent || '';
  }
  
  reset(): void {
    this.logOutput = '';
    this.isRunning = false;
  }
}