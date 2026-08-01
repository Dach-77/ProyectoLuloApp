import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../shared/services/producto';
import { ProductoCard } from '../../shared/producto-card/producto-card';
import { Producto } from '../../shared/models/producto.model';

interface TemporadaCard {
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductoCard],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  private readonly productoService = inject(ProductoService);

  // toSignal (en vez de .subscribe() + asignación a un campo plano) porque esta app
  // no carga zone.js: sin eso, un .subscribe() nunca dispara un nuevo render cuando
  // llega la respuesta HTTP. Con signals, la vista se actualiza sola al resolver.
  private readonly productos = toSignal(this.productoService.obtenerProductos(), { initialValue: [] as Producto[] });

  readonly gruposCarrusel = computed(() => {
    const productosRecientes = [...this.productos()]
      .sort((a, b) => new Date(b.fechaCreacion ?? 0).getTime() - new Date(a.fechaCreacion ?? 0).getTime())
      .slice(0, 8);

    return this.agruparDeACuatro(productosRecientes);
  });

  readonly temporadas: TemporadaCard[] = [
    { nombre: 'Verano', icono: '☀️' },
    { nombre: 'Invierno', icono: '❄️' },
    { nombre: 'Primavera', icono: '🌸' },
    { nombre: 'Otoño', icono: '🍂' },
  ];

  // Cada tile de temporada usa la foto de un producto real de esa temporada
  // (así el módulo no depende de fotografía editorial que no tenemos todavía).
  readonly temporadaCards = computed(() => {
    const productos = this.productos();
    return this.temporadas.map(t => {
      const productoConImagen = productos.find(p => p.activo && p.temporadas.includes(t.nombre) && p.imagenUrl);
      return { ...t, imagenUrl: productoConImagen?.imagenUrl ?? null };
    });
  });

  // No existe todavía un campo "favorito"/best-seller en el modelo: mientras tanto,
  // se muestran los productos activos de mayor precio como placeholder.
  readonly favoritosCards = computed(() => {
    return [...this.productos()]
      .filter(p => p.activo && p.imagenUrl)
      .sort((a, b) => b.precio - a.precio)
      .slice(0, 4);
  });

  private agruparDeACuatro(productos: Producto[]): Producto[][] {
    const grupos: Producto[][] = [];
    for (let i = 0; i < productos.length; i += 4) {
      grupos.push(productos.slice(i, i + 4));
    }
    return grupos;
  }
}
