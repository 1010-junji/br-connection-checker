import { ComponentFixture, TestBed } from '@angular/core/testing';

import { McSVGComponent } from './mc-svg.component';

describe('McSVGComponent', () => {
  let component: McSVGComponent;
  let fixture: ComponentFixture<McSVGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ McSVGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(McSVGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
