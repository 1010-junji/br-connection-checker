// client/src/app/features/license-activator/license-activator-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivatorMainComponent } from './pages/activator-main/activator-main.component';

const routes: Routes = [
  {
    path: '',
    component: ActivatorMainComponent,
    data: {
      showBackButton: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LicenseActivatorRoutingModule { }