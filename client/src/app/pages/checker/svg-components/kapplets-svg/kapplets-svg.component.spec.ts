import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KappletsSVGComponent } from './kapplets-svg.component';

describe('KappletsSVGComponent', () => {
  let component: KappletsSVGComponent;
  let fixture: ComponentFixture<KappletsSVGComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KappletsSVGComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KappletsSVGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
