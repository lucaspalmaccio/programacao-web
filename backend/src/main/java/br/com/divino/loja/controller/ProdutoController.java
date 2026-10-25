package br.com.divino.loja.controller;

import br.com.divino.loja.dto.ProdutoRequest;
import br.com.divino.loja.dto.ProdutoResponse;
import br.com.divino.loja.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService service;

    public ProdutoController(ProdutoService service) {
        this.service = service;
    }

    /** GET /api/produtos?busca=chile — catálogo, ou só os que combinam com o termo. */
    @GetMapping
    public List<ProdutoResponse> listar(@RequestParam(required = false) String busca) {
        return service.listar(busca);
    }

    /** GET /api/produtos/{id} */
    @GetMapping("/{id}")
    public ProdutoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** POST /api/produtos — 201 Created com header Location. */
    @PostMapping
    public ResponseEntity<ProdutoResponse> criar(@Valid @RequestBody ProdutoRequest dto) {
        ProdutoResponse criado = service.criar(dto);
        URI local = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(local).body(criado);
    }

    /** PUT /api/produtos/{id} — substitui os dados do produto. */
    @PutMapping("/{id}")
    public ProdutoResponse atualizar(@PathVariable Long id, @Valid @RequestBody ProdutoRequest dto) {
        return service.atualizar(id, dto);
    }

    /** DELETE /api/produtos/{id} — 204 No Content. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
