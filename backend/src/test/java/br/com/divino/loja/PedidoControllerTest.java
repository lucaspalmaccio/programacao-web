package br.com.divino.loja;

import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.security.TokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:teste_pedido;DB_CLOSE_DELAY=-1")
class PedidoControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Autowired TokenService tokens;
    @Autowired ClienteRepository clientesRepo;

    /** Os testes de CRUD agem como administrador; o acesso por dono é testado em SegurancaClientesTest. */
    private ResultActions executar(MockHttpServletRequestBuilder req) throws Exception {
        long id = clientesRepo.buscarPorEmailNativo("admin@divino.com").orElseThrow().getId();
        return mvc.perform(req.header("Authorization", "Bearer " + tokens.emitir(id)));
    }

    private long criarCliente() throws Exception {
        Map<String, Object> c = new HashMap<>();
        c.put("nome", "Maria Silva");
        c.put("email", "maria@teste.com");
        c.put("cpf", "529.982.247-25");
        c.put("telefone", "(11) 91234-5678");
        c.put("nascimento", "1990-05-20");
        c.put("senha", "segredo123");
        String corpo = executar(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(c)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    private Map<String, Object> pedido(long clienteId) {
        Map<String, Object> item = Map.of("produtoId", 2, "nome", "Qualquer", "preco", 1.00, "quantidade", 2);
        Map<String, Object> p = new HashMap<>();
        p.put("clienteId", clienteId);
        p.put("itens", List.of(item));
        p.put("frete", 24.90);
        p.put("endereco", Map.of("cep", "01001-000", "endereco", "Praça da Sé", "numero", "10",
                "cidade", "São Paulo", "uf", "sp"));
        p.put("pagamento", "Pix");
        return p;
    }

    private long criarPedido(long clienteId) throws Exception {
        String corpo = executar(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(pedido(clienteId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal", is(99.8)))
                .andExpect(jsonPath("$.total", is(124.7)))
                .andExpect(jsonPath("$.itens[0].nome", is("Casal Garcia Sweet Branco")))
                .andExpect(jsonPath("$.status", is("Pedido recebido")))
                .andExpect(jsonPath("$.endereco.uf", is("SP")))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    @Test
    void criaBuscaEListaPedidosDoCliente() throws Exception {
        long cliente = criarCliente();
        long id = criarPedido(cliente);

        executar(get("/api/pedidos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens", hasSize(1)))
                .andExpect(jsonPath("$.itens[0].quantidade", is(2)));
        executar(get("/api/pedidos").param("clienteId", String.valueOf(cliente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void atualizaStatus() throws Exception {
        long id = criarPedido(criarCliente());
        executar(put("/api/pedidos/{id}/status", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"Pagamento confirmado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("Pagamento confirmado")));
    }

    @Test
    void rejeitaClienteInexistenteEPedidoSemItens() throws Exception {
        executar(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(pedido(9999))))
                .andExpect(status().isNotFound());

        Map<String, Object> vazio = pedido(criarCliente());
        vazio.put("itens", List.of());
        executar(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(vazio)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void naoExcluiClienteComPedidos() throws Exception {
        long cliente = criarCliente();
        criarPedido(cliente);
        executar(delete("/api/clientes/{id}", cliente)).andExpect(status().isConflict());
    }

    @Test
    void produtoInexistenteNoPedidoDevolve404() throws Exception {
        long cliente = criarCliente();
        Map<String, Object> p = pedido(cliente);
        p.put("itens", List.of(Map.of("produtoId", 99999, "nome", "X", "preco", 10.00, "quantidade", 1)));
        executar(post("/api/pedidos").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(p)))
                .andExpect(status().isNotFound());
    }
}
