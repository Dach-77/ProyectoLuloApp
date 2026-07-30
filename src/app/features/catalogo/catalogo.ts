import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoService } from '../../shared/services/producto';
import { CarritoService } from '../../shared/services/carrito';
import { ProductoCard } from '../../shared/producto-card/producto-card';
import { Producto } from '../../shared/models/producto.model';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductoCard],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo {
  private readonly productoService = inject(ProductoService);
  private readonly carritoService = inject(CarritoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // toSignal (en vez de .subscribe() + campo plano) porque esta app no carga
  // zone.js: sin eso, un .subscribe() nunca dispara un nuevo render cuando llega
  // la respuesta HTTP y el catálogo se queda siempre vacío en pantalla.
  private readonly todosLosProductos = toSignal(this.productoService.obtenerProductos(), { initialValue: [] as Producto[] });

  productoSeleccionado: Producto | null = null;

  readonly temporadasDisponibles = computed(() => this.valoresDistintos(this.todosLosProductos(), p => p.temporadas));
  readonly tallasDisponibles = computed(() => this.valoresDistintos(this.todosLosProductos(), p => p.tallas));
  readonly coloresDisponibles = computed(() => this.valoresDistintos(this.todosLosProductos(), p => p.colores));
  readonly materialesDisponibles = computed(() => this.valoresDistintos(this.todosLosProductos(), p => p.materiales));
  readonly generosDisponibles = computed(() => this.valoresDistintos(this.todosLosProductos(), p => [p.genero]));

  readonly filtroNombre = signal('');
  readonly filtroTemporada = signal('');
  readonly filtroTalla = signal('');
  readonly filtroColor = signal('');
  readonly filtroMaterial = signal('');
  readonly filtroGenero = signal('');
  readonly filtroPrecioMin = signal<number | null>(null);
  readonly filtroPrecioMax = signal<number | null>(null);

  // Talla/color elegidos dentro del modal de vista rápida (independiente de las tarjetas)
  modalTalla = '';
  modalColor = '';

  constructor() {
    // Precarga el filtro de temporada cuando se llega desde una tarjeta de Inicio (?temporada=Verano).
    // Solo se lee una vez al crear el componente: se navega SIEMPRE aquí desde otra ruta (Inicio),
    // así que Angular crea una instancia nueva de Catalogo en cada llegada, no la reutiliza.
    this.filtroTemporada.set(this.route.snapshot.queryParamMap.get('temporada') ?? '');
  }

  readonly productosFiltrados = computed(() => {
    const filtroNombre = this.filtroNombre();
    const filtroTemporada = this.filtroTemporada();
    const filtroTalla = this.filtroTalla();
    const filtroColor = this.filtroColor();
    const filtroMaterial = this.filtroMaterial();
    const filtroGenero = this.filtroGenero();
    const filtroPrecioMin = this.filtroPrecioMin();
    const filtroPrecioMax = this.filtroPrecioMax();

    return this.todosLosProductos().filter(p => {
      if (filtroNombre && !p.nombre.toLowerCase().includes(filtroNombre.toLowerCase())) return false;
      if (filtroTemporada && !p.temporadas.includes(filtroTemporada)) return false;
      if (filtroTalla && !p.tallas.includes(filtroTalla)) return false;
      if (filtroColor && !p.colores.includes(filtroColor)) return false;
      if (filtroMaterial && !p.materiales.includes(filtroMaterial)) return false;
      if (filtroGenero && p.genero !== filtroGenero) return false;
      if (filtroPrecioMin != null && p.precio < filtroPrecioMin) return false;
      if (filtroPrecioMax != null && p.precio > filtroPrecioMax) return false;
      return true;
    });
  });

  limpiarFiltros() {
    this.filtroNombre.set('');
    this.filtroTemporada.set('');
    this.filtroTalla.set('');
    this.filtroColor.set('');
    this.filtroMaterial.set('');
    this.filtroGenero.set('');
    this.filtroPrecioMin.set(null);
    this.filtroPrecioMax.set(null);
    this.router.navigate(['/catalogo']);
  }

  mostrarDetalle(producto: Producto) {
    this.productoSeleccionado = producto;
    this.modalTalla = '';
    this.modalColor = '';
  }

  seleccionarModalTalla(event: Event) {
    this.modalTalla = (event.target as HTMLSelectElement).value;
  }

  seleccionarModalColor(event: Event) {
    this.modalColor = (event.target as HTMLSelectElement).value;
  }

  comprarDesdeModal() {
    const producto = this.productoSeleccionado;
    if (!producto) return;

    if (!this.modalTalla) {
      alert(`Por favor, selecciona una talla para ${producto.nombre}`);
      return;
    }

    if (!this.modalColor) {
      alert(`Por favor, selecciona un color para ${producto.nombre}`);
      return;
    }

    this.carritoService.agregarVarianteAlCarrito(producto, this.modalTalla, this.modalColor);
  }

  private valoresDistintos(productos: Producto[], selector: (p: Producto) => string[]): string[] {
    const valores = new Set<string>();
    productos.forEach(p => selector(p).forEach(v => valores.add(v)));
    return Array.from(valores).sort();
  }
}
