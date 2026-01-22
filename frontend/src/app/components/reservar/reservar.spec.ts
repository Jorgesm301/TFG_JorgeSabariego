import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reservar } from './reservar';

describe('Reservar', () => {
  let component: Reservar;
  let fixture: ComponentFixture<Reservar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reservar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
