import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Dashboard } from './dashboard';
import { Producto } from '../../../shared/models/producto.model';

function crearProducto(overrides: Partial<Producto> & { id?: string }): Producto {
  return {
    nombre: 'Producto', codigo: 'C-1', activo: true, genero: 'Unisex',
    materiales: [], temporadas: [], tallas: [], colores: [], stock: [],
    precio: 1000, imagenUrl: '', descripcion: '', imagenesPorColor: [],
    ...overrides,
  };
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // El GET de productos$/pedidos$ solo se dispara cuando algo se suscribe (el async
    // pipe del template), así que hay que renderizar antes de poder responderlos. Las
    // 3 pestañas (Crear, Inventario, Pedidos) están todas en el DOM aunque solo una se
    // vea, así que las dos peticiones salen juntas al primer detectChanges().
    fixture.detectChanges();
    httpMock.expectOne(req => req.url.includes('/productos')).flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
    httpMock.expectOne(req => req.url.includes('/pedidos')).flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('guarda un producto nuevo, confirma con un alert y recarga el inventario', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const producto = crearProducto({});
    const archivosPorColor = { Rojo: new File(['x'], 'foto.png', { type: 'image/png' }) };

    const promesa = component.guardar({ producto, archivosPorColor });

    const creacion = httpMock.expectOne(req => req.method === 'POST');
    creacion.flush({ ...producto, id: 'nuevo-id' });
    await promesa;

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('guardad'));
    expect(component.productoEnEdicion).toBeNull();

    // guardar() dispara una recarga del inventario tras el éxito
    httpMock.expectOne(req => req.url.includes('/productos')).flush({ items: [producto], page: 1, pageSize: 20, totalCount: 1, totalPages: 1 });
  });

  it('si el guardado falla con un error genérico, muestra el mensaje por defecto y no recarga el inventario', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const producto = crearProducto({});
    const archivosPorColor = { Rojo: new File(['x'], 'foto.png', { type: 'image/png' }) };

    const promesa = component.guardar({ producto, archivosPorColor });

    // Body no-string (a diferencia de los errores de validación del backend, que
    // devuelven el motivo como un string simple): debe caer al mensaje por defecto.
    httpMock.expectOne(req => req.method === 'POST').flush({ title: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
    await promesa;

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('error al guardar'));
    httpMock.expectNone(req => req.method === 'GET');
  });

  it('si el guardado falla por una validación del backend (ej. código duplicado), muestra el motivo real', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const producto = crearProducto({});
    const archivosPorColor = { Rojo: new File(['x'], 'foto.png', { type: 'image/png' }) };

    const promesa = component.guardar({ producto, archivosPorColor });

    // El backend devuelve estos errores como un string simple en el body (ver
    // ProductosController.Crear/Actualizar), no como { error: '...' }.
    httpMock.expectOne(req => req.method === 'POST').flush(
      "Ya existe un producto con el código 'C-1'.",
      { status: 409, statusText: 'Conflict' }
    );
    await promesa;

    expect(alertSpy).toHaveBeenCalledWith("Ya existe un producto con el código 'C-1'.");
    httpMock.expectNone(req => req.method === 'GET');
  });

  it('cambiarEstado envía el estado invertido y recarga el inventario', async () => {
    const producto = crearProducto({ id: 'p1', activo: true });

    const promesa = component.cambiarEstado(producto);

    const peticion = httpMock.expectOne(req => req.method === 'PATCH');
    expect(peticion.request.body).toEqual({ activo: false });
    peticion.flush({ ...producto, activo: false });
    await promesa;

    httpMock.expectOne(req => req.url.includes('/productos')).flush({ items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  });
});
