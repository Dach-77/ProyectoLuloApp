import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../services/carrito'; // Importamos el mensajero del carrito
import { PedidoService } from '../services/pedido';
import { AuthService } from '../../core/auth/auth';
import { ClienteAuthService } from '../../core/auth/cliente-auth';
import { StockConflicto } from '../models/pedido.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule], // Necesitamos CommonModule para mostrar dinero y listas
  templateUrl: './navbar.html',
  styleUrl: './navbar.css' // Si no tienes este archivo, puedes borrar esta línea sin problema
})
export class Navbar {
  readonly carritoService = inject(CarritoService);
  readonly authService = inject(AuthService);
  readonly clienteAuthService = inject(ClienteAuthService);
  private readonly pedidoService = inject(PedidoService);
  private readonly router = inject(Router);

  readonly procesandoPago = signal(false);

  cerrarSesion() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  cerrarSesionCliente() {
    this.clienteAuthService.logout();
  }

  async pagar() {
    const items = this.carritoService.obtenerCarrito();
    if (items.length === 0) {
      alert('Tu carrito está vacío. ¡Agrega productos primero!');
      return;
    }

    // No se puede crear un pedido sin saber a qué cliente pertenece: si todavía no
    // inició sesión, se le abre el mismo popup de login/registro que ya usa el resto
    // de la app en vez de dejarlo "pagar" sin cuenta.
    if (!this.clienteAuthService.estaAutenticado()) {
      this.clienteAuthService.abrirPopup();
      return;
    }

    this.procesandoPago.set(true);
    try {
      const pedido = await this.pedidoService.crearPedido(
        items.map(item => ({
          productoId: item.productoId,
          talla: item.talla,
          color: item.color,
          cantidad: item.cantidad
        }))
      );
      this.carritoService.vaciarCarrito();
      alert(`¡Pedido confirmado! 🎉 Número de pedido: ${pedido.id}.\nGracias por tu compra en LuloApp.`);
    } catch (error) {
      alert(this.describirErrorPago(error));
    } finally {
      this.procesandoPago.set(false);
    }
  }

  private describirErrorPago(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const conflicto = error.error as StockConflicto;
      const detalle = conflicto?.items
        ?.map(i => `• Talla ${i.talla}, ${i.color}: quedan ${i.cantidadDisponible} disponibles`)
        .join('\n');
      return detalle
        ? `Algunos productos de tu carrito ya no tienen stock suficiente:\n${detalle}\n\nAjusta tu carrito e intenta de nuevo.`
        : 'Algunos productos de tu carrito ya no están disponibles. Ajusta tu carrito e intenta de nuevo.';
    }
    return 'No pudimos procesar tu pedido. Intenta de nuevo en unos minutos.';
  }
}