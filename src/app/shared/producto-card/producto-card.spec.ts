import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoCard } from './producto-card';
import { Producto } from '../models/producto.model';

describe('ProductoCard', () => {
  let component: ProductoCard;
  let fixture: ComponentFixture<ProductoCard>;

  const productoDePrueba: Producto = {
    nombre: 'Producto de prueba',
    codigo: 'TEST-01',
    activo: true,
    genero: 'Unisex',
    materiales: ['Lino'],
    temporadas: ['Verano'],
    tallas: ['M'],
    colores: ['Blanco'],
    stock: [],
    precio: 1000,
    imagenUrl: '',
    descripcion: '',
    imagenesPorColor: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCard);
    component = fixture.componentInstance;
    component.producto = productoDePrueba;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
