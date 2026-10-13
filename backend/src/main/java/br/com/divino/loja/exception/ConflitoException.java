package br.com.divino.loja.exception;

/** Violação de unicidade (e-mail ou CPF já cadastrados). */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
