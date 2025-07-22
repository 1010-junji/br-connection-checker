// client/src/app/features/license-activator/license-activator.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LicenseActivatorRoutingModule } from './license-activator-routing.module';
import { ActivatorMainComponent } from './pages/activator-main/activator-main.component';

// --- Angular Material Modules ---
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [
    ActivatorMainComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // Reactive Forms を使用
    LicenseActivatorRoutingModule,
    
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ]
})
export class LicenseActivatorModule { }