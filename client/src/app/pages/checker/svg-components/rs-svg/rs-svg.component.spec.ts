import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RsSVGComponent } from './rs-svg.component';

describe('RsSVGComponent', () => {
  let component: RsSVGComponent;
  let fixture: ComponentFixture<RsSVGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RsSVGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RsSVGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
