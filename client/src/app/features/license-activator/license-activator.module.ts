import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LicenseActivatorRoutingModule } from './license-activator-routing.module';
import { LicenseActivatorComponent } from './license-activator.component';
import { ActivatorMainComponent } from './pages/activator-main/activator-main.component';


@NgModule({
  declarations: [
    LicenseActivatorComponent,
    ActivatorMainComponent
  ],
  imports: [
    CommonModule,
    LicenseActivatorRoutingModule
  ]
})
export class LicenseActivatorModule { }
