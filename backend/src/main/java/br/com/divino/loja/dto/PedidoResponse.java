package br.com.divino.loja.dto;

import br.com.divino.loja.entity.Endereco;
import br.com.divino.loja.entity.ItemPedido;
import br.com.divino.loja.entity.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        Long clienteId,
        LocalDateTime data,
        List<Item> itens,
        BigDecimal subtotal,
        BigDecimal frete,
        BigDecimal total,
        EnderecoDto endereco,
        String pagamento,
        String status
) {

    public record Item(Long produtoId, String nome, String foto, BigDecimal preco, int quantidade) {
        static Item de(ItemPedido i) {
            return new Item(i.getProdutoId(), i.getNome(), i.getFoto(), i.getPreco(), i.getQuantidade());
        }
    }

    public static PedidoResponse de(Pedido p) {
        Endereco e = p.getEndereco();
        EnderecoDto endereco = (e == null) ? null
                : new EnderecoDto(e.getCep(), e.getEndereco(), e.getNumero(), e.getCidade(), e.getUf());
        return new PedidoResponse(p.getId(), p.getCliente().getId(), p.getDataPedido(),
                p.getItens().stream().map(Item::de).toList(),
                p.getSubtotal(), p.getFrete(), p.getTotal(), endereco, p.getPagamento(), p.getStatus());
    }
}
