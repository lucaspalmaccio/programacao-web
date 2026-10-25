package br.com.divino.loja.config;

import br.com.divino.loja.dto.ProdutoRequest;
import br.com.divino.loja.repository.ProdutoRepository;
import br.com.divino.loja.service.ProdutoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/** Cadastra o catálogo inicial (produtos-seed.json) quando a tabela de produtos está vazia. */
@Component
public class CargaInicialProdutos implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CargaInicialProdutos.class);

    private final ProdutoRepository repository;
    private final ProdutoService service;
    private final ObjectMapper json;

    public CargaInicialProdutos(ProdutoRepository repository, ProdutoService service, ObjectMapper json) {
        this.repository = repository;
        this.service = service;
        this.json = json;
    }

    @Override
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("produtos-seed.json").getInputStream()) {
            ProdutoRequest[] produtos = json.readValue(in, ProdutoRequest[].class);
            for (ProdutoRequest p : produtos) {
                service.criar(p);
            }
            log.info("Catálogo inicial cadastrado: {} produtos.", produtos.length);
        }
    }
}
