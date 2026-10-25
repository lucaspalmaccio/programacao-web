package br.com.divino.loja.service;

import br.com.divino.loja.dto.AlterarSenhaRequest;
import br.com.divino.loja.dto.LoginRequest;
import br.com.divino.loja.dto.ReenvioSenhaRequest;
import br.com.divino.loja.exception.CredenciaisInvalidasException;
import br.com.divino.loja.dto.ClienteCreateRequest;
import br.com.divino.loja.dto.ClienteResponse;
import br.com.divino.loja.dto.ClienteUpdateRequest;
import br.com.divino.loja.dto.EnderecoDto;
import br.com.divino.loja.entity.Cliente;
import br.com.divino.loja.entity.Endereco;
import br.com.divino.loja.exception.ConflitoException;
import br.com.divino.loja.exception.RecursoNaoEncontradoException;
import br.com.divino.loja.repository.ClienteRepository;
import br.com.divino.loja.repository.PedidoRepository;
import br.com.divino.loja.security.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class ClienteService {

    private static final Logger log = LoggerFactory.getLogger(ClienteService.class);
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClienteRepository repository;
    private final PedidoRepository pedidos;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;

    public ClienteService(ClienteRepository repository, PedidoRepository pedidos, PasswordEncoder passwordEncoder,
                          TokenService tokens) {
        this.repository = repository;
        this.pedidos = pedidos;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String nome) {
        List<Cliente> clientes = (nome == null || nome.isBlank())
                ? repository.findAll()
                : repository.findByNomeContainingIgnoreCaseOrderByNome(nome.trim());
        return clientes.stream().map(ClienteResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscar(Long id) {
        return ClienteResponse.de(obter(id));
    }

    public ClienteResponse criar(ClienteCreateRequest dto) {
        String email = normalizarEmail(dto.email());
        String cpf = apenasDigitos(dto.cpf());
        if (repository.existsByEmail(email)) {
            throw new ConflitoException("Já existe uma conta com esse e-mail.");
        }
        if (repository.existsByCpf(cpf)) {
            throw new ConflitoException("Já existe uma conta com esse CPF.");
        }

        Cliente cliente = new Cliente();
        preencher(cliente, dto.nome(), email, cpf, dto.telefone(), dto.nascimento(), dto.endereco());
        cliente.setSenhaHash(passwordEncoder.encode(dto.senha()));
        Cliente salvo = repository.save(cliente);
        return ClienteResponse.de(salvo).comToken(tokens.emitir(salvo.getId()));
    }

    public ClienteResponse atualizar(Long id, ClienteUpdateRequest dto) {
        Cliente cliente = obter(id);
        String email = normalizarEmail(dto.email());
        String cpf = apenasDigitos(dto.cpf());
        if (repository.existsByEmailAndIdNot(email, id)) {
            throw new ConflitoException("Já existe outra conta com esse e-mail.");
        }
        if (repository.existsByCpfAndIdNot(cpf, id)) {
            throw new ConflitoException("Já existe outra conta com esse CPF.");
        }

        preencher(cliente, dto.nome(), email, cpf, dto.telefone(), dto.nascimento(), dto.endereco());
        if (dto.senha() != null && !dto.senha().isBlank()) {
            cliente.setSenhaHash(passwordEncoder.encode(dto.senha()));
        }
        return ClienteResponse.de(repository.save(cliente));
    }

    public void excluir(Long id) {
        Cliente cliente = obter(id);
        if (pedidos.existsByClienteId(id)) {
            throw new ConflitoException("Cliente possui pedidos e não pode ser excluído.");
        }
        repository.delete(cliente);
    }

    private Cliente obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente " + id + " não encontrado."));
    }

    private void preencher(Cliente c, String nome, String email, String cpf, String telefone,
                           LocalDate nascimento, EnderecoDto end) {
        c.setNome(nome.trim());
        c.setEmail(email);
        c.setCpf(cpf);
        c.setTelefone(apenasDigitos(telefone));
        c.setNascimento(nascimento);
        // endereço ausente no corpo = mantém o que já estava gravado
        if (end != null) {
            c.setEndereco(new Endereco(
                    end.cep().replace("-", ""), end.endereco().trim(), end.numero().trim(),
                    end.cidade().trim(), end.uf().toUpperCase(Locale.ROOT)));
        }
    }

    @Transactional(readOnly = true)
    public ClienteResponse login(LoginRequest dto) {
        Cliente cliente = repository.buscarPorEmailNativo(normalizarEmail(dto.email()))
                .filter(c -> passwordEncoder.matches(dto.senha(), c.getSenhaHash()))
                .orElseThrow(() -> new CredenciaisInvalidasException("E-mail ou senha incorretos."));
        return ClienteResponse.de(cliente).comToken(tokens.emitir(cliente.getId()));
    }

    public void alterarSenha(Long id, AlterarSenhaRequest dto) {
        Cliente cliente = obter(id);
        if (!passwordEncoder.matches(dto.senhaAtual(), cliente.getSenhaHash())) {
            throw new CredenciaisInvalidasException("A senha atual está incorreta.");
        }
        cliente.setSenhaHash(passwordEncoder.encode(dto.novaSenha()));
        repository.save(cliente);
    }

    /**
     * Senhas ficam em hash BCrypt, então não dá para "reenviar" a original: gera-se uma senha
     * temporária, grava o hash via native query e a envia ao e-mail. Sem servidor de e-mail
     * configurado, o envio é simulado no log. E-mail desconhecido é ignorado em silêncio
     * para não revelar quais e-mails têm conta.
     */
    public void reenviarSenha(ReenvioSenhaRequest dto) {
        repository.buscarPorEmailNativo(normalizarEmail(dto.email())).ifPresent(cliente -> {
            StringBuilder temporaria = new StringBuilder();
            for (int i = 0; i < 10; i++) {
                temporaria.append(ALFABETO.charAt(RANDOM.nextInt(ALFABETO.length())));
            }
            repository.atualizarSenhaHash(cliente.getId(), passwordEncoder.encode(temporaria));
            log.info("[e-mail simulado] Para {}: sua nova senha temporária é {}", cliente.getEmail(), temporaria);
        });
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String apenasDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }
}
