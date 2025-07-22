import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackupEditorComponent } from './backup-editor.component';

const routes: Routes = [{ path: '', component: BackupEditorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackupEditorRoutingModule { }
