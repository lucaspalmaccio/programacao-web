package br.com.divino.loja;

import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.security.TokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {"spring.datasource.url=jdbc:h2:mem:teste_produto;DB_CLOSE_DELAY=-1",
        "divino.upload-dir=target/test-uploads"})
class ProdutoControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TokenService tokens;
    @Autowired ClienteRepository clientes;

    /** Cabeçalho Authorization da conta de administrador criada na carga inicial. */
    private String admin() {
        long id = clientes.buscarPorEmailNativo("admin@divino.com").orElseThrow().getId();
        return "Bearer " + tokens.emitir(id);
    }

    private long cadastrarCliente(String email, String cpf) throws Exception {
        Map<String, Object> c = new HashMap<>();
        c.put("nome", "Joao Comum");
        c.put("email", email);
        c.put("cpf", cpf);
        c.put("telefone", "(11) 91234-5678");
        c.put("nascimento", "1990-05-20");
        c.put("senha", "segredo123");
        String corpo = mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(c)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.admin", is(false)))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    private Map<String, Object> produto() {
        Map<String, Object> p = new HashMap<>();
        p.put("nome", "Vinho de Teste");
        p.put("tipo", "Tinto");
        p.put("pais", "Brasil");
        p.put("regiao", "Serra Gaúcha");
        p.put("uva", "Merlot");
        p.put("safra", 2022);
        p.put("preco", 59.90);
        return p;
    }

    private long criar(Map<String, Object> p) throws Exception {
        String corpo = mvc.perform(post("/api/produtos").header("Authorization", admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(p)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    @Test
    void catalogoInicialVemDaCargaDoBanco() throws Exception {
        mvc.perform(get("/api/produtos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(13)));
    }

    @Test
    void buscaNativaIgnoraMaiusculasEProcuraEmVariosCampos() throws Exception {
        mvc.perform(get("/api/produtos").param("busca", "CHILE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$[0].pais", is("Chile")));
        mvc.perform(get("/api/produtos").param("busca", "inexistente-xyz"))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void crudCompleto() throws Exception {
        long id = criar(produto());

        mvc.perform(get("/api/produtos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Vinho de Teste")));

        Map<String, Object> alterado = produto();
        alterado.put("preco", 79.90);
        mvc.perform(put("/api/produtos/{id}", id).header("Authorization", admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(alterado)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preco", is(79.90)));

        mvc.perform(delete("/api/produtos/{id}", id).header("Authorization", admin())).andExpect(status().isNoContent());
        mvc.perform(get("/api/produtos/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/produtos/{id}", id).header("Authorization", admin())).andExpect(status().isNotFound());
    }

    @Test
    void rejeitaDadosInvalidos() throws Exception {
        Map<String, Object> ruim = produto();
        ruim.put("tipo", "Suco");
        ruim.put("preco", 0);
        mvc.perform(post("/api/produtos").header("Authorization", admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(ruim)))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/produtos/{id}", 99999).header("Authorization", admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(produto())))
                .andExpect(status().isNotFound());
    }

    @Test
    void escritaNoCatalogoExigeAdministrador() throws Exception {
        String corpo = json.writeValueAsString(produto());
        // sem token: 401
        mvc.perform(post("/api/produtos").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/produtos/{id}", 1)).andExpect(status().isUnauthorized());
        // token adulterado: 401
        mvc.perform(post("/api/produtos").header("Authorization", admin() + "x")
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isUnauthorized());
        // cliente comum: 403
        long id = cadastrarCliente("comum@teste.com", "529.982.247-25");
        mvc.perform(post("/api/produtos").header("Authorization", "Bearer " + tokens.emitir(id))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isForbidden());
        // leitura segue pública
        mvc.perform(get("/api/produtos")).andExpect(status().isOk());
    }

    @Test
    void loginDoAdminDevolveAdminETokenValido() throws Exception {
        mvc.perform(post("/api/clientes/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@divino.com\",\"senha\":\"Admin@123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admin", is(true)))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @Test
    void uploadDeFotoGravaEServeAImagem() throws Exception {
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "qualquer.txt", "text/plain", PNG);
        String corpo = mvc.perform(multipart("/api/uploads/vinhos").file(arquivo).header("Authorization", admin()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String url = json.readTree(corpo).get("url").asText();
        org.junit.jupiter.api.Assertions.assertTrue(url.endsWith(".png"), url);
        mvc.perform(get(java.net.URI.create(url).getPath())).andExpect(status().isOk());
    }

    @Test
    void uploadRejeitaNaoImagemSemTokenEClienteComum() throws Exception {
        MockMultipartFile texto = new MockMultipartFile("arquivo", "foto.png", "image/png", "nao sou imagem".getBytes());
        mvc.perform(multipart("/api/uploads/vinhos").file(texto).header("Authorization", admin()))
                .andExpect(status().isBadRequest());
        MockMultipartFile ok = new MockMultipartFile("arquivo", "foto.png", "image/png", PNG);
        mvc.perform(multipart("/api/uploads/vinhos").file(ok)).andExpect(status().isUnauthorized());
        long id = cadastrarCliente("comum2@teste.com", "168.995.350-09");
        mvc.perform(multipart("/api/uploads/vinhos").file(ok).header("Authorization", "Bearer " + tokens.emitir(id)))
                .andExpect(status().isForbidden());
    }
}
