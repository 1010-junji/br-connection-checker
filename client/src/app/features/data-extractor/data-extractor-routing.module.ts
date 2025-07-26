import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExtractorMainComponent } from './pages/extractor-main/extractor-main.component';

const routes: Routes = [
  { path: '', component: ExtractorMainComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataExtractorRoutingModule { }