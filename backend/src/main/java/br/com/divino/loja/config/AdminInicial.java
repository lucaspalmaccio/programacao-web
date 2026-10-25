package br.com.divino.loja.config;

import br.com.divino.loja.entity.Cliente;
import br.com.divino.loja.repository.ClienteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/** Garante a conta de administrador (divino.admin.*). Se o e-mail já existe, só confirma o perfil admin. */
@Component
public class AdminInicial implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final ClienteRepository clientes;
    private final PasswordEncoder encoder;
    private final String email;
    private final String senha;

    public AdminInicial(ClienteRepository clientes, PasswordEncoder encoder,
                        @Value("${divino.admin.email:}") String email,
                        @Value("${divino.admin.senha:}") String senha) {
        this.clientes = clientes;
        this.encoder = encoder;
        this.email = email.trim().toLowerCase();
        this.senha = senha;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email.isEmpty() || senha.isEmpty()) {
            return;
        }
        Cliente admin = clientes.buscarPorEmailNativo(email).orElse(null);
        if (admin == null) {
            admin = new Cliente();
            admin.setNome("Administrador Di Vino");
            admin.setEmail(email);
            admin.setCpf("11144477735");
            admin.setTelefone("11999999999");
            admin.setNascimento(LocalDate.of(1990, 1, 1));
            admin.setSenhaHash(encoder.encode(senha));
            log.info("Conta de administrador criada: {}", email);
        }
        admin.setAdmin(true);
        clientes.save(admin);
    }
}
