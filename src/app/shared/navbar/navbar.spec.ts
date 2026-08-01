import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { CarritoService } from '../services/carrito';
import { ClienteAuthService } from '../../core/auth/cliente-auth';
import { Producto } from '../models/producto.model';

function crearProducto(id: string, precio: number, stock: Producto['stock'] = []): Producto {
  return {
    id, precio, nombre: `Producto ${id}`, codigo: id, activo: true, genero: 'Unisex',
    materiales: [], temporadas: [], tallas: [], colores: [], stock,
    imagenUrl: '', descripcion: '', imagenesPorColor: []
  };
}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  // No se crea el componente en beforeEach: algunas pruebas necesitan sembrar
  // localStorage (sesión de cliente) ANTES de que ClienteAuthService se construya.
  function crearComponente() {
    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  }

  function loguearCliente() {
    localStorage.setItem('luloapp_cliente_token', 'token-de-prueba');
    localStorage.setItem('luloapp_cliente_info', JSON.stringify({ id: 'c1', nombre: 'Ana', email: 'ana@test.com' }));
  }

  afterEach(() => {
    httpMock?.verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    crearComponente();
    expect(component).toBeTruthy();
  });

  it('pagar() avisa si el carrito está vacío, sin llamar al backend', async () => {
    crearComponente();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await component.pagar();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('vacío'));
  });

  it('pagar() abre el popup de login/registro si no hay cliente autenticado', async () => {
    crearComponente();
    const carrito = TestBed.inject(CarritoService);
    const clienteAuth = TestBed.inject(ClienteAuthService);
    carrito.agregarAlCarrito(crearProducto('a', 1000));
    const popupSpy = vi.spyOn(clienteAuth, 'abrirPopup');

    await component.pagar();

    expect(popupSpy).toHaveBeenCalled();
  });

  it('pagar() crea el pedido, vacía el carrito y confirma con un alert cuando hay stock', async () => {
    loguearCliente();
    crearComponente();
    const carrito = TestBed.inject(CarritoService);
    carrito.agregarVarianteAlCarrito(crearProducto('a', 1000, [{ talla: 'S', color: 'Rojo', cantidad: 5 }]), 'S', 'Rojo');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const promesa = component.pagar();
    const peticion = httpMock.expectOne(req => req.method === 'POST');
    expect(peticion.request.body.items).toEqual([{ productoId: 'a', talla: 'S', color: 'Rojo', cantidad: 1 }]);
    peticion.flush({ id: 'pedido-123', fechaCreacion: new Date().toISOString(), total: 1000, estado: 'Confirmado', items: [] });
    await promesa;

    expect(carrito.obtenerCarrito().length).toBe(0);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('pedido-123'));
  });

  it('pagar() muestra el detalle si hay conflicto de stock (409) y deja el carrito intacto', async () => {
    loguearCliente();
    crearComponente();
    const carrito = TestBed.inject(CarritoService);
    carrito.agregarVarianteAlCarrito(crearProducto('a', 1000, [{ talla: 'S', color: 'Rojo', cantidad: 5 }]), 'S', 'Rojo');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const promesa = component.pagar();
    httpMock.expectOne(req => req.method === 'POST').flush(
      { error: 'Sin stock', items: [{ productoId: 'a', talla: 'S', color: 'Rojo', cantidadSolicitada: 1, cantidadDisponible: 0, motivo: 'SinStock' }] },
      { status: 409, statusText: 'Conflict' }
    );
    await promesa;

    expect(carrito.obtenerCarrito().length).toBe(1);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('quedan 0 disponibles'));
  });
});
