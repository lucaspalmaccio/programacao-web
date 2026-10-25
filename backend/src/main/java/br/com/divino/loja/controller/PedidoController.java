package br.com.divino.loja.controller;

import br.com.divino.loja.dto.PedidoCreateRequest;
import br.com.divino.loja.dto.PedidoResponse;
import br.com.divino.loja.dto.StatusRequest;
import br.com.divino.loja.security.Autorizacao;
import br.com.divino.loja.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService service;
    private final Autorizacao autorizacao;

    public PedidoController(PedidoService service, Autorizacao autorizacao) {
        this.service = service;
        this.autorizacao = autorizacao;
    }

    /** GET /api/pedidos?clienteId=1 — pedidos do cliente (dono ou admin); sem clienteId, todos (só admin). */
    @GetMapping
    public List<PedidoResponse> listar(@RequestParam(required = false) Long clienteId) {
        if (clienteId == null) {
            autorizacao.exigirAdmin();
        } else {
            autorizacao.exigirDono(clienteId);
        }
        return service.listar(clienteId);
    }

    /** GET /api/pedidos/{id} — dono do pedido ou administrador. */
    @GetMapping("/{id}")
    public PedidoResponse buscar(@PathVariable Long id) {
        PedidoResponse pedido = service.buscar(id);
        autorizacao.exigirDono(pedido.clienteId());
        return pedido;
    }

    /** POST /api/pedidos — 201 Created com header Location. */
    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@Valid @RequestBody PedidoCreateRequest dto) {
        autorizacao.exigirDono(dto.clienteId());
        PedidoResponse criado = service.criar(dto);
        URI local = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(local).body(criado);
    }

    /** PUT /api/pedidos/{id}/status — ex.: "Pagamento confirmado". */
    @PutMapping("/{id}/status")
    public PedidoResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest dto) {
        autorizacao.exigirDono(service.buscar(id).clienteId());
        return service.atualizarStatus(id, dto);
    }
}
