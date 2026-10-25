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
import br.com.divino.loja.entity.Produto;
import br.com.divino.loja.exception.RecursoNaoEncontradoException;
import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.repository.PedidoRepository;
import br.com.divino.loja.repository.ProdutoRepository;
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
    private final ProdutoRepository produtos;

    public PedidoService(PedidoRepository pedidos, ClienteRepository clientes, ProdutoRepository produtos) {
        this.pedidos = pedidos;
        this.clientes = clientes;
        this.produtos = produtos;
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(Long clienteId) {
        List<Pedido> lista = (clienteId == null)
                ? pedidos.findAllByOrderByIdDesc()
                : pedidos.listarPorCliente(clienteId);
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
            // nome, foto e preço vêm do catálogo: o que o cliente envia não é confiável
            Produto produto = produtos.findById(i.produtoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Produto " + i.produtoId() + " não encontrado."));
            ItemPedido item = new ItemPedido();
            item.setProdutoId(produto.getId());
            item.setNome(produto.getNome());
            item.setFoto(produto.getFoto());
            item.setPreco(produto.getPreco().setScale(2, RoundingMode.HALF_UP));
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
