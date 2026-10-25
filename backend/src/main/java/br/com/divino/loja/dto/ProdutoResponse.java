package br.com.divino.loja.dto;

import br.com.divino.loja.entity.Produto;

import java.math.BigDecimal;

public record ProdutoResponse(
        Long id,
        String nome,
        String tipo,
        String pais,
        String regiao,
        String uva,
        int safra,
        BigDecimal preco,
        String foto,
        String descricao,
        String harmonizacao,
        String teorAlcoolico,
        String volume
) {
    public static ProdutoResponse de(Produto p) {
        return new ProdutoResponse(p.getId(), p.getNome(), p.getTipo(), p.getPais(), p.getRegiao(), p.getUva(),
                p.getSafra(), p.getPreco(), p.getFoto(), p.getDescricao(), p.getHarmonizacao(),
                p.getTeorAlcoolico(), p.getVolume());
    }
}
