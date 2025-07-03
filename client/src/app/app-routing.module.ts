import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CheckerComponent } from './pages/checker/checker.component';

const routes: Routes = [
  // デフォルトパスはホーム画面へ
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // ホーム画面
  { path: 'home', component: HomeComponent },
  // チェック実行画面 (例: /check/das のようにモードをパラメータで受け取る)
  { path: 'check/:mode', component: CheckerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })], // useHash: true はElectronで推奨
  exports: [RouterModule],
})
export class AppRoutingModule {}