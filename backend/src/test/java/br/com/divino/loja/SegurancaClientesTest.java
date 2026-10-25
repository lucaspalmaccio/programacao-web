package br.com.divino.loja;

import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.security.TokenService;
import com.fasterxml.jackson.databind.JsonNode;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cada cliente só acessa os próprios dados; o administrador acessa todos. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:teste_seguranca;DB_CLOSE_DELAY=-1")
class SegurancaClientesTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TokenService tokens;
    @Autowired ClienteRepository clientes;

    /** Cliente criado pelo cadastro público, com o token devolvido na resposta. */
    private record Conta(long id, String auth) {}

    private Conta cadastrar(String email, String cpf) throws Exception {
        Map<String, Object> c = new HashMap<>();
        c.put("nome", "Maria Silva");
        c.put("email", email);
        c.put("cpf", cpf);
        c.put("telefone", "(11) 91234-5678");
        c.put("nascimento", "1990-05-20");
        c.put("senha", "segredo123");
        String corpo = mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(c)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode n = json.readTree(corpo);
        return new Conta(n.get("id").asLong(), "Bearer " + n.get("token").asText());
    }

    private Conta admin() {
        long id = clientes.buscarPorEmailNativo("admin@divino.com").orElseThrow().getId();
        return new Conta(id, "Bearer " + tokens.emitir(id));
    }

    private ResultActions como(Conta conta, MockHttpServletRequestBuilder req) throws Exception {
        return mvc.perform(conta == null ? req : req.header("Authorization", conta.auth()));
    }

    private ResultActions comCorpo(Conta conta, MockHttpServletRequestBuilder req, Object corpo) throws Exception {
        return como(conta, req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    private Map<String, Object> dadosCliente(String email, String cpf) {
        Map<String, Object> m = new HashMap<>();
        m.put("nome", "Maria Souza");
        m.put("email", email);
        m.put("cpf", cpf);
        m.put("telefone", "(11) 91234-5678");
        m.put("nascimento", "1990-05-20");
        return m;
    }

    private Map<String, Object> pedido(long clienteId) {
        Map<String, Object> item = Map.of("produtoId", 2, "nome", "X", "preco", 1.00, "quantidade", 1);
        Map<String, Object> p = new HashMap<>();
        p.put("clienteId", clienteId);
        p.put("itens", List.of(item));
        p.put("frete", 24.90);
        p.put("endereco", Map.of("cep", "01001-000", "endereco", "Praça da Sé", "numero", "10",
                "cidade", "São Paulo", "uf", "SP"));
        p.put("pagamento", "Pix");
        return p;
    }

    private long criarPedido(Conta dono) throws Exception {
        String corpo = comCorpo(dono, post("/api/pedidos"), pedido(dono.id()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    @Test
    void semTokenOuComTokenRuimNadaDeClientesEPedidosFunciona() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        como(null, get("/api/clientes")).andExpect(status().isUnauthorized());
        como(null, get("/api/clientes/{id}", a.id())).andExpect(status().isUnauthorized());
        como(null, get("/api/pedidos")).andExpect(status().isUnauthorized());
        como(null, get("/api/pedidos").param("clienteId", String.valueOf(a.id()))).andExpect(status().isUnauthorized());
        como(new Conta(a.id(), a.auth() + "x"), get("/api/clientes/{id}", a.id())).andExpect(status().isUnauthorized());
        como(new Conta(a.id(), "Bearer lixo"), get("/api/clientes/{id}", a.id())).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenDeClienteExcluidoDeixaDeValer() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        como(a, delete("/api/clientes/{id}", a.id())).andExpect(status().isNoContent());
        como(a, get("/api/clientes/{id}", a.id())).andExpect(status().isUnauthorized());
    }

    @Test
    void clienteAcessaESalvaOsProprios() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        como(a, get("/api/clientes/{id}", a.id())).andExpect(status().isOk());
        comCorpo(a, put("/api/clientes/{id}", a.id()), dadosCliente("a@teste.com", "529.982.247-25"))
                .andExpect(status().isOk());
        comCorpo(a, put("/api/clientes/{id}/senha", a.id()), Map.of("senhaAtual", "segredo123", "novaSenha", "nova12345"))
                .andExpect(status().isNoContent());
    }

    @Test
    void clienteNaoMexeNosDadosDeOutro() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        Conta b = cadastrar("b@teste.com", "168.995.350-09");
        como(a, get("/api/clientes")).andExpect(status().isForbidden());
        como(a, get("/api/clientes/{id}", b.id())).andExpect(status().isForbidden());
        comCorpo(a, put("/api/clientes/{id}", b.id()), dadosCliente("b@teste.com", "168.995.350-09"))
                .andExpect(status().isForbidden());
        comCorpo(a, put("/api/clientes/{id}/senha", b.id()), Map.of("senhaAtual", "segredo123", "novaSenha", "nova12345"))
                .andExpect(status().isForbidden());
        como(a, delete("/api/clientes/{id}", b.id())).andExpect(status().isForbidden());
        // nem para saber se o id existe
        como(a, get("/api/clientes/{id}", 99999)).andExpect(status().isForbidden());
    }

    @Test
    void administradorEnxergaTodos() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        Conta adm = admin();
        como(adm, get("/api/clientes")).andExpect(status().isOk());
        como(adm, get("/api/clientes/{id}", a.id())).andExpect(status().isOk());
        como(adm, get("/api/pedidos")).andExpect(status().isOk());
    }

    @Test
    void pedidosSoParaODono() throws Exception {
        Conta a = cadastrar("a@teste.com", "529.982.247-25");
        Conta b = cadastrar("b@teste.com", "168.995.350-09");
        long pedidoDeA = criarPedido(a);

        como(a, get("/api/pedidos").param("clienteId", String.valueOf(a.id())))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        como(a, get("/api/pedidos/{id}", pedidoDeA)).andExpect(status().isOk());
        comCorpo(a, put("/api/pedidos/{id}/status", pedidoDeA), Map.of("status", "Pagamento confirmado"))
                .andExpect(status().isOk());

        // B não vê nem altera o pedido de A, nem lista os pedidos de A, nem a lista geral
        como(b, get("/api/pedidos").param("clienteId", String.valueOf(a.id()))).andExpect(status().isForbidden());
        como(b, get("/api/pedidos")).andExpect(status().isForbidden());
        como(b, get("/api/pedidos/{id}", pedidoDeA)).andExpect(status().isForbidden());
        comCorpo(b, put("/api/pedidos/{id}/status", pedidoDeA), Map.of("status", "Entregue"))
                .andExpect(status().isForbidden());
        // e não cria pedido em nome de A
        comCorpo(b, post("/api/pedidos"), pedido(a.id())).andExpect(status().isForbidden());

        como(admin(), get("/api/pedidos/{id}", pedidoDeA)).andExpect(status().isOk());
    }
}
