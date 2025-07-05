import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsSVGComponent } from './ds-svg.component';

describe('DsSVGComponent', () => {
  let component: DsSVGComponent;
  let fixture: ComponentFixture<DsSVGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DsSVGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsSVGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
