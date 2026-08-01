import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../../../shared/models/pedido.model';

@Component({
  selector: 'app-pedidos-tabla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos-tabla.html',
  styleUrl: './pedidos-tabla.css'
})
export class PedidosTabla {
  @Input() pedidos: Pedido[] = [];
}
