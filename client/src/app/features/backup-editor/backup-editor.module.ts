import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackupEditorRoutingModule } from './backup-editor-routing.module';
import { EditorMainComponent } from './pages/editor-main/editor-main.component';

// --- Angular Material Modules ---
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';


@NgModule({
  declarations: [
    EditorMainComponent
  ],
  imports: [
    CommonModule,
    BackupEditorRoutingModule,

    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ]
})
export class BackupEditorModule { }