package br.com.divino.loja.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

/** Vinho do catálogo da loja. */
@Entity
@Table(name = "produtos")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, length = 60)
    private String pais;

    @Column(nullable = false, length = 80)
    private String regiao;

    @Column(nullable = false, length = 120)
    private String uva;

    @Column(nullable = false)
    private int safra;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(length = 255)
    private String foto;

    @Column(length = 1000)
    private String descricao;

    @Column(length = 300)
    private String harmonizacao;

    @Column(name = "teor_alcoolico", length = 10)
    private String teorAlcoolico;

    @Column(length = 20)
    private String volume;

    public Long getId() { return id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getRegiao() { return regiao; }
    public void setRegiao(String regiao) { this.regiao = regiao; }

    public String getUva() { return uva; }
    public void setUva(String uva) { this.uva = uva; }

    public int getSafra() { return safra; }
    public void setSafra(int safra) { this.safra = safra; }

    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }

    public String getFoto() { return foto; }
    public void setFoto(String foto) { this.foto = foto; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getHarmonizacao() { return harmonizacao; }
    public void setHarmonizacao(String harmonizacao) { this.harmonizacao = harmonizacao; }

    public String getTeorAlcoolico() { return teorAlcoolico; }
    public void setTeorAlcoolico(String teorAlcoolico) { this.teorAlcoolico = teorAlcoolico; }

    public String getVolume() { return volume; }
    public void setVolume(String volume) { this.volume = volume; }
}
