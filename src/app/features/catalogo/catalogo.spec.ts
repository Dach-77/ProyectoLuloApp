import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Catalogo } from './catalogo';
import { Producto } from '../../shared/models/producto.model';

function crearProducto(overrides: Partial<Producto> & { id: string }): Producto {
  return {
    nombre: 'Producto',
    codigo: 'C-1',
    activo: true,
    genero: 'Unisex',
    materiales: [],
    temporadas: [],
    tallas: [],
    colores: [],
    stock: [],
    precio: 1000,
    imagenUrl: '',
    descripcion: '',
    imagenesPorColor: [],
    ...overrides,
  };
}

describe('Catalogo', () => {
  let component: Catalogo;
  let fixture: ComponentFixture<Catalogo>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'catalogo', component: Catalogo }])],
    }).compileComponents();

    fixture = TestBed.createComponent(Catalogo);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function responderCatalogo(productos: Producto[]) {
    httpMock.expectOne(req => req.method === 'GET').flush({
      items: productos, page: 1, pageSize: 100, totalCount: productos.length, totalPages: 1
    });
  }

  it('should create', () => {
    responderCatalogo([]);
    expect(component).toBeTruthy();
  });

  it('combina filtro de nombre, temporada y precio máximo', () => {
    responderCatalogo([
      crearProducto({ id: 'a', nombre: 'Camisa Roja', temporadas: ['Verano'], precio: 50000 }),
      crearProducto({ id: 'b', nombre: 'Camisa Azul', temporadas: ['Verano'], precio: 200000 }), // excede el precio máximo
      crearProducto({ id: 'c', nombre: 'Pantalón', temporadas: ['Invierno'], precio: 60000 }), // otra temporada
    ]);

    component.filtroNombre.set('camisa');
    component.filtroTemporada.set('Verano');
    component.filtroPrecioMax.set(100000);

    expect(component.productosFiltrados().map(p => p.id)).toEqual(['a']);
  });

  it('limpiarFiltros() vuelve a mostrar todos los productos', () => {
    responderCatalogo([
      crearProducto({ id: 'a', nombre: 'Camisa' }),
      crearProducto({ id: 'b', nombre: 'Pantalón' }),
    ]);

    component.filtroNombre.set('camisa');
    expect(component.productosFiltrados().length).toBe(1);

    component.limpiarFiltros();
    expect(component.productosFiltrados().length).toBe(2);
  });

  it('comprarDesdeModal exige talla y color antes de agregar al carrito', () => {
    const producto = crearProducto({ id: 'x', tallas: ['S'], colores: ['Rojo'], stock: [{ talla: 'S', color: 'Rojo', cantidad: 5 }] });
    responderCatalogo([producto]);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    component.mostrarDetalle(producto);
    component.comprarDesdeModal();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('talla'));

    component.modalTalla = 'S';
    component.comprarDesdeModal();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('color'));
  });

  it('comprarDesdeModal no agrega al carrito si la combinación elegida no tiene stock', () => {
    const producto = crearProducto({ id: 'x', tallas: ['S'], colores: ['Rojo'], stock: [{ talla: 'S', color: 'Rojo', cantidad: 0 }] });
    responderCatalogo([producto]);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    component.mostrarDetalle(producto);
    component.modalTalla = 'S';
    component.modalColor = 'Rojo';
    component.comprarDesdeModal();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('No quedan más unidades'));
  });
});
