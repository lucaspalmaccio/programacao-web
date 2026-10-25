package br.com.divino.loja.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Token de sessão assinado (HMAC-SHA256), sem estado no servidor: "{clienteId}:{expiraEm}.{assinatura}".
 * O perfil (admin ou não) NÃO vai no token; é lido do banco a cada requisição protegida.
 */
@Service
public class TokenService {

    private final byte[] segredo;
    private final long validadeSegundos;

    public TokenService(@Value("${divino.seguranca.segredo}") String segredo,
                        @Value("${divino.seguranca.validade-horas:12}") long validadeHoras) {
        this.segredo = segredo.getBytes(StandardCharsets.UTF_8);
        this.validadeSegundos = validadeHoras * 3600;
    }

    public String emitir(Long clienteId) {
        String carga = clienteId + ":" + (Instant.now().getEpochSecond() + validadeSegundos);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(carga.getBytes(StandardCharsets.UTF_8))
                + "." + assinar(carga);
    }

    /** Devolve o id do cliente se o token é autêntico e não expirou. */
    public Optional<Long> validar(String token) {
        try {
            int ponto = token.indexOf('.');
            if (ponto < 0) {
                return Optional.empty();
            }
            String carga = new String(Base64.getUrlDecoder().decode(token.substring(0, ponto)), StandardCharsets.UTF_8);
            byte[] esperado = assinar(carga).getBytes(StandardCharsets.UTF_8);
            byte[] recebido = token.substring(ponto + 1).getBytes(StandardCharsets.UTF_8);
            if (!MessageDigest.isEqual(esperado, recebido)) {
                return Optional.empty();
            }
            String[] partes = carga.split(":");
            if (partes.length != 2 || Long.parseLong(partes[1]) < Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.of(Long.parseLong(partes[0]));
        } catch (RuntimeException e) {
            return Optional.empty();
        }
    }

    private String assinar(String carga) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(carga.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
