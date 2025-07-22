import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-rs-svg',
  templateUrl: './rs-svg.component.html',
  styleUrls: ['./rs-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsSvgComponent {
  @Input() params: { [key: string]: any } = {};
}