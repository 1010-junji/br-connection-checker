import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-kapplets-svg',
  templateUrl: './kapplets-svg.component.html',
  styleUrls: ['./kapplets-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KappletsSvgComponent {
  @Input() params: { [key: string]: any } = {};
}