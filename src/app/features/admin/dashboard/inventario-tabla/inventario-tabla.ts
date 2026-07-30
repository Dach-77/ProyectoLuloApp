import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-inventario-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario-tabla.html',
  styleUrl: './inventario-tabla.css'
})
export class InventarioTabla {
  @Input() productos: Producto[] = [];

  @Output() editar = new EventEmitter<Producto>();
  @Output() cambiarEstado = new EventEmitter<Producto>();
}
