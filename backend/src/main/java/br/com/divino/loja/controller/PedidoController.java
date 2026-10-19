package br.com.divino.loja.controller;

import br.com.divino.loja.dto.PedidoCreateRequest;
import br.com.divino.loja.dto.PedidoResponse;
import br.com.divino.loja.dto.StatusRequest;
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

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    /** GET /api/pedidos?clienteId=1 — pedidos do cliente (mais recentes primeiro), ou todos. */
    @GetMapping
    public List<PedidoResponse> listar(@RequestParam(required = false) Long clienteId) {
        return service.listar(clienteId);
    }

    /** GET /api/pedidos/{id} */
    @GetMapping("/{id}")
    public PedidoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** POST /api/pedidos — 201 Created com header Location. */
    @PostMapping
    public ResponseEntity<PedidoResponse> criar(@Valid @RequestBody PedidoCreateRequest dto) {
        PedidoResponse criado = service.criar(dto);
        URI local = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(local).body(criado);
    }

    /** PUT /api/pedidos/{id}/status — ex.: "Pagamento confirmado". */
    @PutMapping("/{id}/status")
    public PedidoResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest dto) {
        return service.atualizarStatus(id, dto);
    }
}
