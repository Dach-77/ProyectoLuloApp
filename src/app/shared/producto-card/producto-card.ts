import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../models/producto.model';
import { CarritoService } from '../services/carrito';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.css'
})
export class ProductoCard {
  @Input({ required: true }) producto!: Producto;

  // En Inicio no queremos abrir el modal de vista rápida (solo existe en Catálogo)
  @Input() habilitarVistaRapida = true;

  @Output() verDetalle = new EventEmitter<Producto>();

  tallaSeleccionada = '';
  colorSeleccionado = '';

  private readonly carritoService = inject(CarritoService);

  // Si el color elegido tiene una foto propia, se muestra esa en vez de la general
  get imagenMostrada(): string {
    const imagenColor = this.producto.imagenesPorColor?.find(i => i.color === this.colorSeleccionado);
    return imagenColor?.imagenUrl ?? this.producto.imagenUrl;
  }

  seleccionarTalla(event: Event) {
    this.tallaSeleccionada = (event.target as HTMLSelectElement).value;
  }

  seleccionarColor(event: Event) {
    this.colorSeleccionado = (event.target as HTMLSelectElement).value;
  }

  onClickImagen() {
    this.verDetalle.emit(this.producto);
  }

  comprar() {
    if (!this.tallaSeleccionada) {
      alert(`Por favor, selecciona una talla para ${this.producto.nombre}`);
      return;
    }

    if (!this.colorSeleccionado) {
      alert(`Por favor, selecciona un color para ${this.producto.nombre}`);
      return;
    }

    const agregado = this.carritoService.agregarVarianteAlCarrito(this.producto, this.tallaSeleccionada, this.colorSeleccionado);
    if (!agregado) {
      alert(`No quedan más unidades disponibles de ${this.producto.nombre} en talla ${this.tallaSeleccionada} y color ${this.colorSeleccionado}.`);
    }
  }
}
