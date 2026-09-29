import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidoService } from '../../services/pedido.service';
import { FotoFallbackDirective } from '../../shared/foto-fallback.directive';

const ROTULOS_PAGAMENTO: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão de crédito',
  boleto: 'Boleto'
};

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, FotoFallbackDirective],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss'
})
export class PedidosComponent {
  pedidos: Pedido[];

  constructor(authService: AuthService, pedidoService: PedidoService) {
    const usuario = authService.usuarioLogado();
    this.pedidos = usuario ? pedidoService.doUsuario(usuario.email) : [];
  }

  pagamento(codigo: string): string {
    return ROTULOS_PAGAMENTO[codigo] ?? codigo;
  }
}
