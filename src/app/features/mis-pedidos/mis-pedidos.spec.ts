import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { MisPedidos } from './mis-pedidos';

describe('MisPedidos', () => {
  let component: MisPedidos;
  let fixture: ComponentFixture<MisPedidos>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPedidos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MisPedidos);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    httpMock.expectOne(req => req.method === 'GET').flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    expect(component).toBeTruthy();
  });

  it('expone los pedidos del cliente devueltos por el backend', () => {
    const pedido = {
      id: 'p1', fechaCreacion: '2026-07-31T00:00:00Z', total: 50000, estado: 'Confirmado',
      items: [{ nombreProducto: 'Camisa', talla: 'S', color: 'Rojo', cantidad: 1, precioUnitario: 50000 }]
    };

    httpMock.expectOne(req => req.method === 'GET').flush({ items: [pedido], page: 1, pageSize: 100, totalCount: 1, totalPages: 1 });

    expect(component.pedidos()).toEqual([pedido]);
  });
});
