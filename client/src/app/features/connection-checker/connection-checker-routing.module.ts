import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckerMainComponent } from './pages/checker-main/checker-main.component';

const routes: Routes = [
  { 
    path: '', 
    component: CheckerMainComponent,
    // この機能は戻るボタンを表示する
    data: {
      showBackButton: true 
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConnectionCheckerRoutingModule { }