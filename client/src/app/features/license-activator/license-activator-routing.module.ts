import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LicenseActivatorComponent } from './license-activator.component';

const routes: Routes = [{ path: '', component: LicenseActivatorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LicenseActivatorRoutingModule { }
