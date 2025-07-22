import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupEditorComponent } from './backup-editor.component';

describe('BackupEditorComponent', () => {
  let component: BackupEditorComponent;
  let fixture: ComponentFixture<BackupEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackupEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
