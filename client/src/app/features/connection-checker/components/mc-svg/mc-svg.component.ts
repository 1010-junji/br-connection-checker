import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-mc-svg',
  templateUrl: './mc-svg.component.html',
  styleUrls: ['./mc-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McSvgComponent {
  @Input() params: { [key: string]: any } = {};
}