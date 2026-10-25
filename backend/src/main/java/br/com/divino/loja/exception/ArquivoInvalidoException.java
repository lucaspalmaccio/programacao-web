package br.com.divino.loja.exception;

/** Arquivo enviado ausente, grande demais ou de formato não aceito (400). */
public class ArquivoInvalidoException extends RuntimeException {

    public ArquivoInvalidoException(String mensagem) {
        super(mensagem);
    }
}
