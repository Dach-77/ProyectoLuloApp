import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../services/carrito'; // Importamos el mensajero del carrito
import { AuthService } from '../../core/auth/auth';

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
  private readonly router = inject(Router);

  cerrarSesion() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  // Función falsa de pago para cuando hagan clic en "Pagar"
  pagar() {
    if (this.carritoService.obtenerCarrito().length === 0) {
      alert('Tu carrito está vacío. ¡Agrega productos primero!');
      return;
    }
    alert('¡Simulando pasarela de pago... 💳 Gracias por tu compra en LuloApp! 🎉');
  }
}