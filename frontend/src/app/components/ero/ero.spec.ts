import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ero } from './ero';

describe('Ero', () => {
  let component: Ero;
  let fixture: ComponentFixture<Ero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
