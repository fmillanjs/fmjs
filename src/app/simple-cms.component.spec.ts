import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleCMSComponent } from './simple-cms.component';

describe('SimpleCMSComponent', () => {
  let component: SimpleCMSComponent;
  let fixture: ComponentFixture<SimpleCMSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleCMSComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleCMSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
