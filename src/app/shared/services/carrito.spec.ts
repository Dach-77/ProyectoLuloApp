import { TestBed } from '@angular/core/testing';

import { CarritoService } from './carrito';
import { Producto } from '../models/producto.model';

function crearProducto(id: string, precio: number, stock: Producto['stock'] = []): Producto {
  return {
    id, precio, nombre: `Producto ${id}`, codigo: id, activo: true, genero: 'Unisex',
    materiales: [], temporadas: [], tallas: [], colores: [], stock,
    imagenUrl: '', descripcion: '', imagenesPorColor: []
  };
}

describe('Carrito', () => {
  let service: CarritoService;

  beforeEach(() => {
    localStorage.clear();
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

  it('no agrega una variante cuya combinación de talla/color no tiene stock', () => {
    const producto = crearProducto('a', 50000, [{ talla: 'S', color: 'Rojo', cantidad: 0 }]);

    const agregado = service.agregarVarianteAlCarrito(producto, 'S', 'Rojo');

    expect(agregado).toBe(false);
    expect(service.obtenerCarrito().length).toBe(0);
  });

  it('no permite superar el stock disponible de una variante', () => {
    const producto = crearProducto('a', 50000, [{ talla: 'S', color: 'Rojo', cantidad: 2 }]);

    expect(service.agregarVarianteAlCarrito(producto, 'S', 'Rojo')).toBe(true);
    const item = service.obtenerCarrito()[0];
    expect(service.agregarAlCarrito(item.producto)).toBe(true);
    expect(service.obtenerCarrito()[0].cantidad).toBe(2);

    // La tercera unidad excede el stock (2) y debe rechazarse sin alterar la cantidad.
    expect(service.agregarAlCarrito(item.producto)).toBe(false);
    expect(service.obtenerCarrito()[0].cantidad).toBe(2);
  });

  it('persiste el carrito entre instancias del servicio (localStorage)', () => {
    service.agregarAlCarrito(crearProducto('a', 30000));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const otraInstancia = TestBed.inject(CarritoService);

    expect(otraInstancia.obtenerCarrito().length).toBe(1);
    expect(otraInstancia.obtenerTotal()).toBe(30000);
  });

  it('agregarVarianteAlCarrito guarda el productoId real y la variante elegida (necesario para armar el pedido)', () => {
    const producto = crearProducto('a', 50000, [{ talla: 'S', color: 'Rojo', cantidad: 5 }]);

    service.agregarVarianteAlCarrito(producto, 'S', 'Rojo');

    const item = service.obtenerCarrito()[0];
    expect(item.productoId).toBe('a');
    expect(item.talla).toBe('S');
    expect(item.color).toBe('Rojo');
    // El id del producto embebido sigue siendo el sintético, usado solo para deduplicar líneas.
    expect(item.producto.id).toBe('a-S-Rojo');
  });

  it('vaciarCarrito() limpia el carrito y lo persiste vacío en localStorage', () => {
    service.agregarAlCarrito(crearProducto('a', 30000));
    service.agregarAlCarrito(crearProducto('b', 20000));

    service.vaciarCarrito();

    expect(service.obtenerCarrito().length).toBe(0);
    expect(service.obtenerTotal()).toBe(0);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const otraInstancia = TestBed.inject(CarritoService);
    expect(otraInstancia.obtenerCarrito().length).toBe(0);
  });
});
