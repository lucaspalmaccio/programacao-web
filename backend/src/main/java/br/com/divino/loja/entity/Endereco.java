package br.com.divino.loja.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Endereço do cliente, gravado na mesma tabela de clientes. */
@Embeddable
public class Endereco {

    @Column(length = 9)
    private String cep;

    @Column(name = "logradouro", length = 150)
    private String endereco;

    @Column(length = 10)
    private String numero;

    @Column(length = 80)
    private String cidade;

    @Column(length = 2)
    private String uf;

    public Endereco() {
    }

    public Endereco(String cep, String endereco, String numero, String cidade, String uf) {
        this.cep = cep;
        this.endereco = endereco;
        this.numero = numero;
        this.cidade = cidade;
        this.uf = uf;
    }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
}
