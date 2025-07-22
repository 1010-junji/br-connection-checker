import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Routing ---
import { ConnectionCheckerRoutingModule } from './connection-checker-routing.module';

// --- Pages ---
import { CheckerMainComponent } from './pages/checker-main/checker-main.component';

// --- Components ---
import { DasSvgComponent } from './components/das-svg/das-svg.component';
import { DsSvgComponent } from './components/ds-svg/ds-svg.component';
import { KappletsSvgComponent } from './components/kapplets-svg/kapplets-svg.component';
import { McSvgComponent } from './components/mc-svg/mc-svg.component';
import { RsSvgComponent } from './components/rs-svg/rs-svg.component';

// --- Angular Material Modules ---
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';


@NgModule({
  declarations: [
    CheckerMainComponent,
    DasSvgComponent,
    DsSvgComponent,
    KappletsSvgComponent,
    McSvgComponent,
    RsSvgComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ConnectionCheckerRoutingModule,
    
    // Angular Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatGridListModule,
    MatSelectModule,
  ]
})
export class ConnectionCheckerModule { }