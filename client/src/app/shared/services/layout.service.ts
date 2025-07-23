import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export interface PageHeader {
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // サイドナビの開閉状態
  private _isSidenavOpen$ = new BehaviorSubject<boolean>(false);
  isSidenavOpen$ = this._isSidenavOpen$.asObservable();

  // ページヘッダーの状態
  private _pageHeaderState$ = new BehaviorSubject<PageHeader>({ title: '' });
  pageHeaderState$ = this._pageHeaderState$.asObservable().pipe(distinctUntilChanged());

  // メインコンテンツエリアのスクロールリクエスト
  private _scrollToBottomRequest$ = new Subject<void>();
  scrollToBottomRequest$ = this._scrollToBottomRequest$.asObservable();
  
  constructor() { }

  toggleSidenav(): void {
    this._isSidenavOpen$.next(!this._isSidenavOpen$.value);
  }

  setSidenavOpen(isOpen: boolean): void {
    this._isSidenavOpen$.next(isOpen);
  }

  setPageHeader(state: Partial<PageHeader>): void {
    const currentState = this._pageHeaderState$.value;
    this._pageHeaderState$.next({ ...currentState, ...state });
  }
  
  requestScrollToBottom(): void {
    this._scrollToBottomRequest$.next();
  }
}