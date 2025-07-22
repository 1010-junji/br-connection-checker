import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ds-svg',
  templateUrl: './ds-svg.component.html',
  styleUrls: ['./ds-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSvgComponent {
  @Input() params: { [key: string]: any } = {};
}