import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-das-svg',
  templateUrl: './das-svg.component.html',
  styleUrls: ['./das-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DasSvgComponent {
  @Input() params: { [key: string]: any } = {};
}