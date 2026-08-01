import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoForm } from './producto-form';
import { Producto } from '../../../../shared/models/producto.model';

function crearProducto(overrides: Partial<Producto> & { id: string }): Producto {
  return {
    nombre: 'Producto', codigo: 'C-1', activo: true, genero: 'Unisex',
    materiales: [], temporadas: [], tallas: [], colores: [], stock: [],
    precio: 1000, imagenUrl: '', descripcion: '', imagenesPorColor: [],
    ...overrides,
  };
}

describe('ProductoForm', () => {
  let component: ProductoForm;
  let fixture: ComponentFixture<ProductoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exige una foto para crear un producto nuevo', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const guardarSpy = vi.spyOn(component.guardar, 'emit');

    component.onGuardar();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('foto'));
    expect(guardarSpy).not.toHaveBeenCalled();
  });

  it('al editar no exige una foto nueva (conserva la actual)', () => {
    component.productoEditado = crearProducto({ id: 'p1' });
    component.ngOnChanges({ productoEditado: {} as any });
    const guardarSpy = vi.spyOn(component.guardar, 'emit');

    component.onGuardar();

    expect(guardarSpy).toHaveBeenCalled();
  });

  it('incrementa y decrementa el stock de una combinación talla+color sin afectar las demás', () => {
    component.incrementarCantidad('S', 'Rojo');
    component.incrementarCantidad('S', 'Rojo');
    component.incrementarCantidad('M', 'Azul');

    expect(component.obtenerCantidad('S', 'Rojo')).toBe(2);
    expect(component.obtenerCantidad('M', 'Azul')).toBe(1);
    expect(component.obtenerCantidad('S', 'Azul')).toBe(0);

    component.decrementarCantidad('S', 'Rojo');
    expect(component.obtenerCantidad('S', 'Rojo')).toBe(1);
  });

  it('descarta del stock las combinaciones cuya talla o color ya no está seleccionada al guardar', () => {
    component.nuevoProducto.tallas = ['S'];
    component.nuevoProducto.colores = ['Rojo'];
    component.nuevoProducto.stock = [
      { talla: 'S', color: 'Rojo', cantidad: 3 },
      { talla: 'M', color: 'Rojo', cantidad: 5 }, // "M" ya no está entre las tallas seleccionadas
    ];
    component.archivosPorColor['Rojo'] = new File(['x'], 'foto.png', { type: 'image/png' });
    const guardarSpy = vi.spyOn(component.guardar, 'emit');

    component.onGuardar();

    expect(guardarSpy).toHaveBeenCalledWith(expect.objectContaining({
      producto: expect.objectContaining({ stock: [{ talla: 'S', color: 'Rojo', cantidad: 3 }] }),
    }));
  });

  it('no exige fotos si ya hay al menos una para un color seleccionado', () => {
    component.nuevoProducto.colores = ['Rojo'];
    component.archivosPorColor['Rojo'] = new File(['x'], 'foto.png', { type: 'image/png' });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const guardarSpy = vi.spyOn(component.guardar, 'emit');

    component.onGuardar();

    expect(alertSpy).not.toHaveBeenCalled();
    expect(guardarSpy).toHaveBeenCalledWith(expect.objectContaining({
      archivosPorColor: { Rojo: expect.anything() },
    }));
  });

  it('resetFormulario() limpia el producto y las fotos por color seleccionadas', () => {
    component.productoEditado = crearProducto({ id: 'p1', nombre: 'Algo' });
    component.ngOnChanges({ productoEditado: {} as any });
    component.archivosPorColor['Rojo'] = new File(['x'], 'foto.png', { type: 'image/png' });

    component.resetFormulario();

    expect(component.nuevoProducto.nombre).toBe('');
    expect(component.archivosPorColor).toEqual({});
  });
});
