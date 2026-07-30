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
    } catch {
      this.mensajeError.set('Usuario o contraseña incorrectos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
