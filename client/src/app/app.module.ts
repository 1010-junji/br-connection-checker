import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

// Angular Materialモジュール
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// ルーティングとコンポーネント
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { CheckerComponent } from './pages/checker/checker.component';
import { BackButtonComponent } from './shared/back-button/back-button.component';

import { DasSvgComponent } from './pages/checker/svg-components/das-svg/das-svg.component';
import { DsSvgComponent } from './pages/checker/svg-components/ds-svg/ds-svg.component';
import { KappletsSvgComponent } from './pages/checker/svg-components/kapplets-svg/kapplets-svg.component';
import { McSvgComponent } from './pages/checker/svg-components/mc-svg/mc-svg.component';
import { RsSvgComponent } from './pages/checker/svg-components/rs-svg/rs-svg.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CheckerComponent,
    BackButtonComponent,

    DasSvgComponent,
    DsSvgComponent,
    KappletsSvgComponent,
    McSvgComponent,
    RsSvgComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,

    // Materialモジュール
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }