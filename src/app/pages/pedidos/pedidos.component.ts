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
  pedidos: Pedido[] = [];
  carregando = true;
  erro = '';

  constructor(authService: AuthService, pedidoService: PedidoService) {
    const usuario = authService.usuarioLogado();
    if (!usuario) {
      this.carregando = false;
      return;
    }
    pedidoService.doCliente(usuario.id)
      .then(lista => (this.pedidos = lista))
      .catch(() => (this.erro = 'Não foi possível carregar seus pedidos.'))
      .finally(() => (this.carregando = false));
  }

  pagamento(codigo: string): string {
    return ROTULOS_PAGAMENTO[codigo] ?? codigo;
  }
}
