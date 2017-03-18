import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSimpleCMSComponent } from './admin-simple-cms.component';

describe('AdminSimpleCMSComponent', () => {
  let component: AdminSimpleCMSComponent;
  let fixture: ComponentFixture<AdminSimpleCMSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminSimpleCMSComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSimpleCMSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
