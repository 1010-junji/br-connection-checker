import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorMainComponent } from './pages/editor-main/editor-main.component';

const routes: Routes = [
  {
    path: '',
    component: EditorMainComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackupEditorRoutingModule { }