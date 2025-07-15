import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HeaderService } from './header.service';

// モードに応じたタイトルを取得するためのヘルパー関数
function getTitleForMode(mode: string): string {
  const titles: { [key: string]: string } = {
    das: 'DAS',
    ds: 'Design Studio',
    kapplets: 'Kapplets',
    mc: 'Management Console',
    rs: 'RoboServer',
  };
  return titles[mode] ? `${titles[mode]} 疎通チェック` : '不明なモード';
}

@Injectable({
  providedIn: 'root'
})
export class PageDataResolver implements Resolve<void> {

  constructor(private headerService: HeaderService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<void> | void {
    // 1. 固定のデータ（dataプロパティ）から値を取得
    const staticTitle = route.data['title'];
    const showBackButton = route.data['showBackButton'] ?? true; // デフォルトは表示

    let finalTitle = staticTitle;

    // 2. 動的なデータ（URLパラメータ）から値を取得
    //    CheckerComponentのように、:mode パラメータがある場合
    if (route.params['mode']) {
      const mode = route.params['mode'];
      finalTitle = getTitleForMode(mode);
    }
    
    // 3. HeaderServiceの状態を更新する
    //    tap演算子は副作用を実行するのに便利だが、このケースでは直接呼び出すだけでもOK
    this.headerService.setTitle(finalTitle);
    this.headerService.setShowBackButton(showBackButton);

    // ResolverはObservableを返す必要があるが、値は不要なのでof(null)やof(undefined)を返す
    // しかし、このケースでは何も返す必要がないので `return;` でも良い
    return; 
  }
}