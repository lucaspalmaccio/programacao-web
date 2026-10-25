package br.com.divino.loja.service;

import br.com.divino.loja.dto.ProdutoRequest;
import br.com.divino.loja.dto.ProdutoResponse;
import br.com.divino.loja.entity.Produto;
import br.com.divino.loja.exception.RecursoNaoEncontradoException;
import br.com.divino.loja.repository.ProdutoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class ProdutoService {

    private final ProdutoRepository repository;

    public ProdutoService(ProdutoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar(String busca) {
        List<Produto> lista = (busca == null || busca.isBlank())
                ? repository.findAll(Sort.by("id"))
                : repository.buscarPorTermo("%" + busca.trim().toLowerCase(Locale.ROOT) + "%");
        return lista.stream().map(ProdutoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscar(Long id) {
        return ProdutoResponse.de(obter(id));
    }

    public ProdutoResponse criar(ProdutoRequest dto) {
        Produto produto = new Produto();
        copiar(dto, produto);
        return ProdutoResponse.de(repository.save(produto));
    }

    public ProdutoResponse atualizar(Long id, ProdutoRequest dto) {
        Produto produto = obter(id);
        copiar(dto, produto);
        return ProdutoResponse.de(repository.save(produto));
    }

    public void excluir(Long id) {
        repository.delete(obter(id));
    }

    private Produto obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Produto " + id + " não encontrado."));
    }

    private static void copiar(ProdutoRequest dto, Produto produto) {
        produto.setNome(dto.nome().trim());
        produto.setTipo(dto.tipo());
        produto.setPais(dto.pais().trim());
        produto.setRegiao(dto.regiao().trim());
        produto.setUva(dto.uva().trim());
        produto.setSafra(dto.safra());
        produto.setPreco(dto.preco());
        produto.setFoto(dto.foto());
        produto.setDescricao(dto.descricao());
        produto.setHarmonizacao(dto.harmonizacao());
        produto.setTeorAlcoolico(dto.teorAlcoolico());
        produto.setVolume(dto.volume());
    }
}
