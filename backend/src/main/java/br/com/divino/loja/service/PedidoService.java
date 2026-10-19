package br.com.divino.loja.service;

import br.com.divino.loja.dto.EnderecoDto;
import br.com.divino.loja.dto.ItemPedidoRequest;
import br.com.divino.loja.dto.PedidoCreateRequest;
import br.com.divino.loja.dto.PedidoResponse;
import br.com.divino.loja.dto.StatusRequest;
import br.com.divino.loja.entity.Cliente;
import br.com.divino.loja.entity.Endereco;
import br.com.divino.loja.entity.ItemPedido;
import br.com.divino.loja.entity.Pedido;
import br.com.divino.loja.exception.RecursoNaoEncontradoException;
import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class PedidoService {

    private static final String STATUS_INICIAL = "Pedido recebido";

    private final PedidoRepository pedidos;
    private final ClienteRepository clientes;

    public PedidoService(PedidoRepository pedidos, ClienteRepository clientes) {
        this.pedidos = pedidos;
        this.clientes = clientes;
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(Long clienteId) {
        List<Pedido> lista = (clienteId == null)
                ? pedidos.findAllByOrderByIdDesc()
                : pedidos.findByClienteIdOrderByIdDesc(clienteId);
        return lista.stream().map(PedidoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse buscar(Long id) {
        return PedidoResponse.de(obter(id));
    }

    public PedidoResponse criar(PedidoCreateRequest dto) {
        Cliente cliente = clientes.findById(dto.clienteId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente " + dto.clienteId() + " não encontrado."));

        Pedido pedido = new Pedido();
        pedido.setCliente(cliente);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (ItemPedidoRequest i : dto.itens()) {
            ItemPedido item = new ItemPedido();
            item.setProdutoId(i.produtoId());
            item.setNome(i.nome().trim());
            item.setFoto(i.foto());
            item.setPreco(i.preco().setScale(2, RoundingMode.HALF_UP));
            item.setQuantidade(i.quantidade());
            pedido.adicionarItem(item);
            subtotal = subtotal.add(item.getTotal());
        }
        BigDecimal frete = dto.frete().setScale(2, RoundingMode.HALF_UP);
        pedido.setSubtotal(subtotal);
        pedido.setFrete(frete);
        pedido.setTotal(subtotal.add(frete));

        EnderecoDto end = dto.endereco();
        pedido.setEndereco(new Endereco(
                end.cep().replace("-", ""), end.endereco().trim(), end.numero().trim(),
                end.cidade().trim(), end.uf().toUpperCase(Locale.ROOT)));
        pedido.setPagamento(dto.pagamento().trim());
        pedido.setStatus(dto.status() == null || dto.status().isBlank() ? STATUS_INICIAL : dto.status().trim());

        return PedidoResponse.de(pedidos.save(pedido));
    }

    public PedidoResponse atualizarStatus(Long id, StatusRequest dto) {
        Pedido pedido = obter(id);
        pedido.setStatus(dto.status().trim());
        return PedidoResponse.de(pedidos.save(pedido));
    }

    private Pedido obter(Long id) {
        return pedidos.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pedido " + id + " não encontrado."));
    }
}
