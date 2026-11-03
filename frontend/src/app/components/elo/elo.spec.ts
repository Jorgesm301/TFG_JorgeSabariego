import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Elo } from './elo';

describe('Elo', () => {
  let component: Elo;
  let fixture: ComponentFixture<Elo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Elo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Elo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
