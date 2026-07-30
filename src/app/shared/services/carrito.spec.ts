import { TestBed } from '@angular/core/testing';

import { CarritoService } from './carrito';
import { Producto } from '../models/producto.model';

function crearProducto(id: string, precio: number): Producto {
  return {
    id, precio, nombre: `Producto ${id}`, codigo: id, activo: true, genero: 'Unisex',
    materiales: [], temporadas: [], tallas: [], colores: [], stock: [],
    imagenUrl: '', descripcion: ''
  };
}

describe('Carrito', () => {
  let service: CarritoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CarritoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('suma el total correctamente al agregar varios productos distintos', () => {
    service.agregarAlCarrito(crearProducto('a', 85000));
    service.agregarAlCarrito(crearProducto('b', 120000));
    service.agregarAlCarrito(crearProducto('b', 120000)); // misma variante: suma cantidad, no duplica línea

    expect(service.obtenerCarrito().length).toBe(2);
    expect(service.obtenerTotal()).toBe(85000 + 120000 * 2);
  });

  it('recalcula el total al restar y al eliminar', () => {
    service.agregarAlCarrito(crearProducto('a', 50000));
    service.agregarAlCarrito(crearProducto('a', 50000));
    expect(service.obtenerTotal()).toBe(100000);

    service.restarCantidad('a');
    expect(service.obtenerTotal()).toBe(50000);

    service.eliminarDelCarrito('a');
    expect(service.obtenerTotal()).toBe(0);
    expect(service.obtenerCarrito().length).toBe(0);
  });
});
