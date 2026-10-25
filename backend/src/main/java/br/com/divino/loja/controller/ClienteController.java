package br.com.divino.loja.controller;

import br.com.divino.loja.dto.AlterarSenhaRequest;
import br.com.divino.loja.dto.LoginRequest;
import br.com.divino.loja.dto.ReenvioSenhaRequest;
import br.com.divino.loja.dto.ClienteCreateRequest;
import br.com.divino.loja.dto.ClienteResponse;
import br.com.divino.loja.dto.ClienteUpdateRequest;
import br.com.divino.loja.service.ClienteService;
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
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService service;

    public ClienteController(ClienteService service) {
        this.service = service;
    }

    /** GET /api/clientes?nome=ana — lista todos ou filtra pelo nome. */
    @GetMapping
    public List<ClienteResponse> listar(@RequestParam(required = false) String nome) {
        return service.listar(nome);
    }

    /** GET /api/clientes/{id} */
    @GetMapping("/{id}")
    public ClienteResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    /** POST /api/clientes — 201 Created com header Location. */
    @PostMapping
    public ResponseEntity<ClienteResponse> criar(@Valid @RequestBody ClienteCreateRequest dto) {
        ClienteResponse criado = service.criar(dto);
        URI local = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(criado.id()).toUri();
        return ResponseEntity.created(local).body(criado);
    }

    /** PUT /api/clientes/{id} — substitui os dados cadastrais. */
    @PutMapping("/{id}")
    public ClienteResponse atualizar(@PathVariable Long id, @Valid @RequestBody ClienteUpdateRequest dto) {
        return service.atualizar(id, dto);
    }

    /** POST /api/clientes/login — 200 com o cliente, ou 401 se e-mail/senha não conferem. */
    @PostMapping("/login")
    public ClienteResponse login(@Valid @RequestBody LoginRequest dto) {
        return service.login(dto);
    }

    /** POST /api/clientes/reenviar-senha — envia senha temporária ao e-mail. Sempre 204. */
    @PostMapping("/reenviar-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reenviarSenha(@Valid @RequestBody ReenvioSenhaRequest dto) {
        service.reenviarSenha(dto);
    }

    /** PUT /api/clientes/{id}/senha — troca a senha exigindo a atual. 204 No Content. */
    @PutMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarSenha(@PathVariable Long id, @Valid @RequestBody AlterarSenhaRequest dto) {
        service.alterarSenha(id, dto);
    }

    /** DELETE /api/clientes/{id} — 204 No Content. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
