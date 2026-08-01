import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosTabla } from './pedidos-tabla';

describe('PedidosTabla', () => {
  let component: PedidosTabla;
  let fixture: ComponentFixture<PedidosTabla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosTabla],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidosTabla);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la cantidad de pedidos recibidos por @Input', () => {
    component.pedidos = [
      { id: 'p1', fechaCreacion: '2026-07-31T00:00:00Z', total: 1000, estado: 'Confirmado', items: [], clienteNombre: 'Ana', clienteEmail: 'ana@test.com' }
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 pedido(s)');
    expect(fixture.nativeElement.textContent).toContain('Ana');
  });
});
