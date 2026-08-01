import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Componentes menú superior y Footer
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { ClienteBienvenidaModal } from './shared/cliente-bienvenida-modal/cliente-bienvenida-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Lo agregamos a esta lista de imports separándolo con una coma
  imports: [RouterOutlet, Navbar, Footer, ClienteBienvenidaModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'ProyectoLuloApp';
}