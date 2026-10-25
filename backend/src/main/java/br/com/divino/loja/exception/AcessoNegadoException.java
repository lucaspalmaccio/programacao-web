package br.com.divino.loja.exception;

/** Cliente autenticado, mas sem permissão para a operação (403). */
public class AcessoNegadoException extends RuntimeException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
