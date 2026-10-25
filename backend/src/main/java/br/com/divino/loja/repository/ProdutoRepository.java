package br.com.divino.loja.repository;

import br.com.divino.loja.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    /** Native query da busca: termo em nome, tipo, país, região ou uva (sem diferenciar maiúsculas). */
    @Query(value = """
            SELECT * FROM produtos
            WHERE LOWER(nome) LIKE :termo OR LOWER(tipo) LIKE :termo OR LOWER(pais) LIKE :termo
               OR LOWER(regiao) LIKE :termo OR LOWER(uva) LIKE :termo
            ORDER BY id
            """, nativeQuery = true)
    List<Produto> buscarPorTermo(@Param("termo") String termo);
}
