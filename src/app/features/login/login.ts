import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  usuario = '';
  contrasena = '';

  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  async onSubmit() {
    this.mensajeError.set(null);
    this.cargando.set(true);
    try {
      await this.authService.login(this.usuario, this.contrasena);
      this.router.navigateByUrl('/admin');
    } catch (error) {
      this.mensajeError.set(this.extraerMensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private extraerMensajeError(error: unknown): string {
    const httpError = error as { status?: number };
    if (httpError?.status === 429) {
      return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    }
    return 'Usuario o contraseña incorrectos.';
  }
}
