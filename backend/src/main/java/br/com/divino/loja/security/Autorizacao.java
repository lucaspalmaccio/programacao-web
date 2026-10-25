package br.com.divino.loja.security;

import br.com.divino.loja.exception.AcessoNegadoException;
import br.com.divino.loja.exception.CredenciaisInvalidasException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/** Regras de acesso usadas pelos controllers; a sessão é preenchida pelo {@link AutenticacaoInterceptor}. */
@Component
public class Autorizacao {

    static final String ATRIBUTO = "divino.sessao";

    public Sessao atual() {
        Object sessao = RequestContextHolder.currentRequestAttributes()
                .getAttribute(ATRIBUTO, RequestAttributes.SCOPE_REQUEST);
        if (sessao instanceof Sessao s) {
            return s;
        }
        throw new CredenciaisInvalidasException("Faça login para continuar.");
    }

    public void exigirAdmin() {
        if (!atual().admin()) {
            throw new AcessoNegadoException("Apenas administradores podem fazer isso.");
        }
    }

    /** O próprio cliente ou um administrador. */
    public void exigirDono(Long clienteId) {
        Sessao s = atual();
        if (!s.admin() && !s.clienteId().equals(clienteId)) {
            throw new AcessoNegadoException("Você só pode acessar os seus próprios dados.");
        }
    }
}
