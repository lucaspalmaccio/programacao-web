package br.com.divino.loja.security;

import br.com.divino.loja.exception.AcessoNegadoException;
import br.com.divino.loja.exception.CredenciaisInvalidasException;
import br.com.divino.loja.repository.ClienteRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Exige um token válido de administrador. Leituras (GET) e o preflight do CORS passam livres. */
@Component
public class AdminInterceptor implements HandlerInterceptor {

    private final TokenService tokens;
    private final ClienteRepository clientes;

    public AdminInterceptor(TokenService tokens, ClienteRepository clientes) {
        this.tokens = tokens;
        this.clientes = clientes;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String metodo = request.getMethod();
        if (metodo.equals("OPTIONS") || (metodo.equals("GET") && !request.getRequestURI().startsWith("/api/uploads"))) {
            return true;
        }
        String cabecalho = request.getHeader("Authorization");
        if (cabecalho == null || !cabecalho.startsWith("Bearer ")) {
            throw new CredenciaisInvalidasException("Faça login para continuar.");
        }
        Long id = tokens.validar(cabecalho.substring(7).trim())
                .orElseThrow(() -> new CredenciaisInvalidasException("Sessão inválida ou expirada. Entre novamente."));
        boolean admin = clientes.findById(id).map(c -> c.isAdmin()).orElse(false);
        if (!admin) {
            throw new AcessoNegadoException("Apenas administradores podem fazer isso.");
        }
        return true;
    }
}
