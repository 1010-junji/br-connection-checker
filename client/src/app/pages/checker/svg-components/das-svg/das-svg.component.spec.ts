import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DasSVGComponent } from './das-svg.component';

describe('DasSVGComponent', () => {
  let component: DasSVGComponent;
  let fixture: ComponentFixture<DasSVGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DasSVGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DasSVGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
