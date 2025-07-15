import { Injectable } from '@angular/core';
import { BehaviorSubject, asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

@Injectable({
  providedIn: 'root' // アプリケーション全体で単一のインスタンスを共有
})
export class HeaderService {
  // BehaviorSubjectを使うと、最新の値を保持し、購読時に即座に値を受け取れる
  private titleSource = new BehaviorSubject<string>('モジュール間通信 疎通チェッカー');
  public title$ = this.titleSource.asObservable().pipe(
    observeOn(asyncScheduler) // 値の通知を非同期にスケジュールする
  );

  private showBackButtonSource = new BehaviorSubject<boolean>(false);
  public showBackButton$ = this.showBackButtonSource.asObservable().pipe(
    observeOn(asyncScheduler) // 値の通知を非同期にスケジュールする
  );
  
  private scrollRequestHandler: (() => void) | null = null;

  constructor() { }

  setTitle(title: string): void {
    this.titleSource.next(title);
  }

  setShowBackButton(show: boolean): void {
    this.showBackButtonSource.next(show);
  }

  // AppComponentからスクロール実行関数を受け取って保持する
  setScrollRequestHandler(handler: () => void) {
    this.scrollRequestHandler = handler;
  }

  // CheckerComponentなど、どこからでもスクロールを要求できるようにする
  requestScrollToBottom() {
    this.scrollRequestHandler?.();
  }
}