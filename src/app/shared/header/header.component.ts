import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LogoComponent } from '../logo/logo.component';
import { CarrinhoService } from '../../services/carrinho.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, LogoComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  termoBusca = '';
  menuAberto = false;

  constructor(
    private router: Router,
    public carrinhoService: CarrinhoService,
    public authService: AuthService
  ) {}

  primeiroNome(nome: string): string {
    return nome.split(' ')[0];
  }

  @HostListener('document:click', ['$event'])
  fecharMenu(evento: Event): void {
    if (!(evento.target as HTMLElement).closest('.position-relative')) {
      this.menuAberto = false;
    }
  }

  sair(): void {
    this.menuAberto = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }

  buscar(): void {
    this.router.navigate(['/busca'], { queryParams: { q: this.termoBusca } });
  }
}
