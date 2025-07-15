import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CheckerComponent } from './pages/checker/checker.component';
import { PageDataResolver } from './shared/page-data.resolver';

const routes: Routes = [
  // デフォルトパスはホーム画面へ
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // ホーム画面
  {
    path: 'home', component: HomeComponent,
    resolve: { pageData: PageDataResolver },
    data: {
      title: 'コンポーネント間通信 疎通チェッカー',
      showBackButton: false
    }
  },
  // チェック実行画面 (例: /check/das のようにモードをパラメータで受け取る)
  {
    path: 'check/:mode', component: CheckerComponent,
    resolve: { pageData: PageDataResolver },
    data: {
      // タイトルはResolverが:modeから動的に生成するので、ここでは空でよい
      // showBackButtonは固定でtrue
      showBackButton: true
    }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // useHash: true はElectronで推奨
  exports: [RouterModule],
})
export class AppRoutingModule {}