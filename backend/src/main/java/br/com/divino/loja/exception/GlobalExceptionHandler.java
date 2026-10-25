package br.com.divino.loja.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> naoEncontrado(RecursoNaoEncontradoException ex) {
        return corpo(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> naoAutorizado(CredenciaisInvalidasException ex) {
        return corpo(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    @ExceptionHandler(AcessoNegadoException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> proibido(AcessoNegadoException ex) {
        return corpo(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }

    @ExceptionHandler(ArquivoInvalidoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> arquivoInvalido(ArquivoInvalidoException ex) {
        return corpo(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, Object> arquivoGrande(MaxUploadSizeExceededException ex) {
        return corpo(HttpStatus.PAYLOAD_TOO_LARGE, "A imagem deve ter no máximo 2 MB.", null);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> parteAusente(MissingServletRequestPartException ex) {
        return corpo(HttpStatus.BAD_REQUEST, "Selecione uma imagem.", null);
    }

    @ExceptionHandler(ConflitoException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> conflito(ConflitoException ex) {
        return corpo(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    /** Rede de segurança para corridas entre duas requisições (índice único do banco). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> integridade(DataIntegrityViolationException ex) {
        return corpo(HttpStatus.CONFLICT, "E-mail ou CPF já cadastrado.", null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return corpo(HttpStatus.BAD_REQUEST, "Dados inválidos", campos);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> requisicaoMalFormada(Exception ex) {
        return corpo(HttpStatus.BAD_REQUEST, "Requisição malformada (JSON ou parâmetro inválido)", null);
    }

    private Map<String, Object> corpo(HttpStatus status, String mensagem, Map<String, String> campos) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", LocalDateTime.now().toString());
        corpo.put("status", status.value());
        corpo.put("erro", status.getReasonPhrase());
        corpo.put("mensagem", mensagem);
        if (campos != null) {
            corpo.put("campos", campos);
        }
        return corpo;
    }
}
