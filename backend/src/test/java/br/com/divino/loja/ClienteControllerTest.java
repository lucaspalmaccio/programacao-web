package br.com.divino.loja;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Cada teste roda numa transação com rollback, então o banco volta ao estado inicial. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:teste;DB_CLOSE_DELAY=-1")
class ClienteControllerTest {

    private static final String CPF_A = "529.982.247-25";
    private static final String CPF_B = "168.995.350-09";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private Map<String, Object> cliente(String email, String cpf) {
        Map<String, Object> m = new HashMap<>();
        m.put("nome", "Maria Silva");
        m.put("email", email);
        m.put("cpf", cpf);
        m.put("telefone", "(11) 91234-5678");
        m.put("nascimento", "1990-05-20");
        m.put("senha", "segredo123");
        return m;
    }

    private Map<String, Object> endereco() {
        return Map.of("cep", "01001-000", "endereco", "Praça da Sé", "numero", "10",
                "cidade", "São Paulo", "uf", "sp");
    }

    private ResultActions enviar(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req,
                                 Object corpo) throws Exception {
        return mvc.perform(req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    private long criar(Map<String, Object> dados) throws Exception {
        String resposta = enviar(post("/api/clientes"), dados)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asLong();
    }

    // ---------- CRUD ----------

    @Test
    void fluxoCompletoCrud() throws Exception {
        Map<String, Object> dados = cliente("Maria@Teste.com", CPF_A);
        dados.put("endereco", endereco());

        String resposta = enviar(post("/api/clientes"), dados)
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.email", is("maria@teste.com")))
                .andExpect(jsonPath("$.cpf", is("52998224725")))
                .andExpect(jsonPath("$.telefone", is("11912345678")))
                .andExpect(jsonPath("$.endereco.cep", is("01001000")))
                .andExpect(jsonPath("$.endereco.uf", is("SP")))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(resposta).get("id").asLong();

        mvc.perform(get("/api/clientes/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("maria@teste.com")));
        mvc.perform(get("/api/clientes").param("nome", "MARIA")).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/clientes").param("nome", "zzz")).andExpect(jsonPath("$", hasSize(0)));

        Map<String, Object> alterado = cliente("maria@teste.com", CPF_A);
        alterado.put("nome", "Maria Souza");
        alterado.remove("senha");
        enviar(put("/api/clientes/" + id), alterado)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Maria Souza")))
                // PUT sem endereço não apaga o que já estava gravado
                .andExpect(jsonPath("$.endereco.cidade", is("São Paulo")));

        mvc.perform(delete("/api/clientes/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/clientes/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/clientes/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void putAtualizaEnderecoQuandoInformado() throws Exception {
        long id = criar(cliente("a@teste.com", CPF_A));
        Map<String, Object> dados = cliente("a@teste.com", CPF_A);
        dados.put("endereco", endereco());
        enviar(put("/api/clientes/" + id), dados)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endereco.endereco", is("Praça da Sé")));
    }

    @Test
    void putSemSenhaMantemASenhaEComSenhaTroca() throws Exception {
        long id = criar(cliente("a@teste.com", CPF_A));
        Map<String, Object> dados = cliente("a@teste.com", CPF_A);
        dados.remove("senha");
        enviar(put("/api/clientes/" + id), dados).andExpect(status().isOk());
        enviar(post("/api/clientes/login"), Map.of("email", "a@teste.com", "senha", "segredo123"))
                .andExpect(status().isOk());

        dados.put("senha", "outra12345");
        enviar(put("/api/clientes/" + id), dados).andExpect(status().isOk());
        enviar(post("/api/clientes/login"), Map.of("email", "a@teste.com", "senha", "segredo123"))
                .andExpect(status().isUnauthorized());
        enviar(post("/api/clientes/login"), Map.of("email", "a@teste.com", "senha", "outra12345"))
                .andExpect(status().isOk());
    }

    @Test
    void putEmClienteInexistenteRetorna404() throws Exception {
        enviar(put("/api/clientes/99999"), cliente("a@teste.com", CPF_A)).andExpect(status().isNotFound());
    }

    @Test
    void putNaoPermiteEmailOuCpfDeOutroCliente() throws Exception {
        criar(cliente("a@teste.com", CPF_A));
        long idB = criar(cliente("b@teste.com", CPF_B));

        enviar(put("/api/clientes/" + idB), cliente("a@teste.com", CPF_B)).andExpect(status().isConflict());
        enviar(put("/api/clientes/" + idB), cliente("b@teste.com", CPF_A)).andExpect(status().isConflict());
        // manter os próprios dados não é conflito
        enviar(put("/api/clientes/" + idB), cliente("b@teste.com", CPF_B)).andExpect(status().isOk());
    }

    @Test
    void getComIdNaoNumericoRetorna400() throws Exception {
        mvc.perform(get("/api/clientes/abc")).andExpect(status().isBadRequest());
    }

    // ---------- validação ----------

    @Test
    void rejeitaCpfInvalidoEMenorDeIdade() throws Exception {
        Map<String, Object> dados = cliente("x@teste.com", "111.111.111-11");
        dados.put("nascimento", LocalDate.now().minusYears(10).toString());
        enviar(post("/api/clientes"), dados)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cpf", is("CPF inválido")))
                .andExpect(jsonPath("$.campos.nascimento").exists());
    }

    @Test
    void rejeitaCamposObrigatoriosEFormatos() throws Exception {
        Map<String, Object> dados = new HashMap<>();
        dados.put("nome", "Maria");
        dados.put("email", "nao-e-email");
        dados.put("senha", "curta");
        dados.put("telefone", "123");
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dados)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists())
                .andExpect(jsonPath("$.campos.cpf").exists())
                .andExpect(jsonPath("$.campos.telefone").exists())
                .andExpect(jsonPath("$.campos.nascimento").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void validaEnderecoQuandoInformado() throws Exception {
        Map<String, Object> dados = cliente("x@teste.com", CPF_A);
        dados.put("endereco", Map.of("cep", "123", "endereco", "Rua", "numero", "1", "cidade", "SP", "uf", "SPP"));
        enviar(post("/api/clientes"), dados)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos['endereco.cep']").exists())
                .andExpect(jsonPath("$.campos['endereco.uf']").exists());
    }

    @Test
    void rejeitaJsonMalformado() throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("{nao e json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaEmailEcpfDuplicados() throws Exception {
        criar(cliente("dup@teste.com", CPF_A));
        enviar(post("/api/clientes"), cliente("DUP@teste.com", CPF_B)).andExpect(status().isConflict());
        enviar(post("/api/clientes"), cliente("outro@teste.com", "529.982.247-25")).andExpect(status().isConflict());
    }

    // ---------- login e senha ----------

    @Test
    void loginComCredenciaisCorretasEIncorretas() throws Exception {
        criar(cliente("maria@teste.com", CPF_A));

        enviar(post("/api/clientes/login"), Map.of("email", " MARIA@teste.com ", "senha", "segredo123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome", is("Maria Silva")))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
        enviar(post("/api/clientes/login"), Map.of("email", "maria@teste.com", "senha", "errada123"))
                .andExpect(status().isUnauthorized());
        enviar(post("/api/clientes/login"), Map.of("email", "ninguem@teste.com", "senha", "segredo123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem", is("E-mail ou senha incorretos.")));
        enviar(post("/api/clientes/login"), Map.of("email", "", "senha", ""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void alterarSenha() throws Exception {
        long id = criar(cliente("maria@teste.com", CPF_A));

        enviar(put("/api/clientes/" + id + "/senha"), Map.of("senhaAtual", "errada123", "novaSenha", "nova12345"))
                .andExpect(status().isUnauthorized());
        enviar(put("/api/clientes/" + id + "/senha"), Map.of("senhaAtual", "segredo123", "novaSenha", "fraca"))
                .andExpect(status().isBadRequest());
        enviar(put("/api/clientes/99999/senha"), Map.of("senhaAtual", "segredo123", "novaSenha", "nova12345"))
                .andExpect(status().isNotFound());

        enviar(put("/api/clientes/" + id + "/senha"), Map.of("senhaAtual", "segredo123", "novaSenha", "nova12345"))
                .andExpect(status().isNoContent());
        enviar(post("/api/clientes/login"), Map.of("email", "maria@teste.com", "senha", "segredo123"))
                .andExpect(status().isUnauthorized());
        enviar(post("/api/clientes/login"), Map.of("email", "maria@teste.com", "senha", "nova12345"))
                .andExpect(status().isOk());
    }
}
