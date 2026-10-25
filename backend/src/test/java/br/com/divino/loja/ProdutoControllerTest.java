package br.com.divino.loja;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:teste_produto;DB_CLOSE_DELAY=-1")
class ProdutoControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

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
        String corpo = mvc.perform(post("/api/produtos").contentType(MediaType.APPLICATION_JSON)
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
        mvc.perform(put("/api/produtos/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(alterado)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preco", is(79.90)));

        mvc.perform(delete("/api/produtos/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/produtos/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/produtos/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void rejeitaDadosInvalidos() throws Exception {
        Map<String, Object> ruim = produto();
        ruim.put("tipo", "Suco");
        ruim.put("preco", 0);
        mvc.perform(post("/api/produtos").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(ruim)))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/produtos/{id}", 99999).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(produto())))
                .andExpect(status().isNotFound());
    }
}
