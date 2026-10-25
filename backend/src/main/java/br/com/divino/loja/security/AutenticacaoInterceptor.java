package br.com.divino.loja.security;

import br.com.divino.loja.entity.Cliente;
import br.com.divino.loja.exception.AcessoNegadoException;
import br.com.divino.loja.exception.CredenciaisInvalidasException;
import br.com.divino.loja.repository.ClienteRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Exige token válido em toda a API, menos nas rotas públicas (cadastro, login, reenvio de senha,
 * leitura do catálogo e o preflight do CORS). Escrita no catálogo e upload exigem administrador;
 * as regras por dono dos dados ficam nos controllers, via {@link Autorizacao}.
 */
@Component
public class AutenticacaoInterceptor implements HandlerInterceptor {

    private final TokenService tokens;
    private final ClienteRepository clientes;

    public AutenticacaoInterceptor(TokenService tokens, ClienteRepository clientes) {
        this.tokens = tokens;
        this.clientes = clientes;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String metodo = request.getMethod();
        String uri = request.getRequestURI();
        if (publica(metodo, uri)) {
            return true;
        }
        String cabecalho = request.getHeader("Authorization");
        if (cabecalho == null || !cabecalho.startsWith("Bearer ")) {
            throw new CredenciaisInvalidasException("Faça login para continuar.");
        }
        Long id = tokens.validar(cabecalho.substring(7).trim())
                .orElseThrow(() -> new CredenciaisInvalidasException("Sessão inválida ou expirada. Entre novamente."));
        // o perfil vem do banco: tirar o admin de alguém vale na hora, mesmo com token antigo
        Cliente cliente = clientes.findById(id)
                .orElseThrow(() -> new CredenciaisInvalidasException("Sessão inválida ou expirada. Entre novamente."));
        request.setAttribute(Autorizacao.ATRIBUTO, new Sessao(cliente.getId(), cliente.isAdmin()));

        boolean areaAdmin = uri.startsWith("/api/produtos") || uri.startsWith("/api/uploads");
        if (areaAdmin && !cliente.isAdmin()) {
            throw new AcessoNegadoException("Apenas administradores podem fazer isso.");
        }
        return true;
    }

    private static boolean publica(String metodo, String uri) {
        if (metodo.equals("OPTIONS")) {
            return true;
        }
        if (metodo.equals("GET")) {
            return uri.equals("/api/produtos") || uri.startsWith("/api/produtos/");
        }
        return metodo.equals("POST")
                && (uri.equals("/api/clientes") || uri.equals("/api/clientes/login")
                    || uri.equals("/api/clientes/reenviar-senha"));
    }
}
