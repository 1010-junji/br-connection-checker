import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackupEditorRoutingModule } from './backup-editor-routing.module';
import { BackupEditorComponent } from './backup-editor.component';
import { EditorMainComponent } from './pages/editor-main/editor-main.component';


@NgModule({
  declarations: [
    BackupEditorComponent,
    EditorMainComponent
  ],
  imports: [
    CommonModule,
    BackupEditorRoutingModule
  ]
})
export class BackupEditorModule { }
