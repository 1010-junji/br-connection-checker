import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseActivatorComponent } from './license-activator.component';

describe('LicenseActivatorComponent', () => {
  let component: LicenseActivatorComponent;
  let fixture: ComponentFixture<LicenseActivatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LicenseActivatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LicenseActivatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
