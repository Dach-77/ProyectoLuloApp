import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioTabla } from './inventario-tabla';

describe('InventarioTabla', () => {
  let component: InventarioTabla;
  let fixture: ComponentFixture<InventarioTabla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioTabla],
    }).compileComponents();

    fixture = TestBed.createComponent(InventarioTabla);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
