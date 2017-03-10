import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Beerd3Component } from './beerd3.component';

describe('Beerd3Component', () => {
  let component: Beerd3Component;
  let fixture: ComponentFixture<Beerd3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Beerd3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Beerd3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
