import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../shared/services/pedido';
import { Pedido } from '../../shared/models/pedido.model';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos {
  private readonly pedidoService = inject(PedidoService);

  // toSignal porque esta app no carga zone.js: un .subscribe() plano nunca dispararía
  // un nuevo render cuando llega la respuesta HTTP (mismo motivo que en Catalogo/Inicio).
  readonly pedidos = toSignal(this.pedidoService.obtenerMisPedidos(), { initialValue: [] as Pedido[] });
}
