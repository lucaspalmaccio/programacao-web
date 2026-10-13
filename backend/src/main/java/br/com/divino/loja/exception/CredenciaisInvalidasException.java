package br.com.divino.loja.exception;

/** E-mail/senha incorretos. A mensagem é a mesma exista ou não a conta, para não vazar cadastros. */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException(String mensagem) {
        super(mensagem);
    }
}
