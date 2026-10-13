package br.com.divino.loja.service;

import br.com.divino.loja.dto.AlterarSenhaRequest;
import br.com.divino.loja.dto.LoginRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class ClienteService {

    private final ClienteRepository repository;
    private final PasswordEncoder passwordEncoder;

    public ClienteService(ClienteRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
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
        return ClienteResponse.de(repository.save(cliente));
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
        repository.delete(obter(id));
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
        Cliente cliente = repository.findByEmail(normalizarEmail(dto.email()))
                .filter(c -> passwordEncoder.matches(dto.senha(), c.getSenhaHash()))
                .orElseThrow(() -> new CredenciaisInvalidasException("E-mail ou senha incorretos."));
        return ClienteResponse.de(cliente);
    }

    public void alterarSenha(Long id, AlterarSenhaRequest dto) {
        Cliente cliente = obter(id);
        if (!passwordEncoder.matches(dto.senhaAtual(), cliente.getSenhaHash())) {
            throw new CredenciaisInvalidasException("A senha atual está incorreta.");
        }
        cliente.setSenhaHash(passwordEncoder.encode(dto.novaSenha()));
        repository.save(cliente);
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String apenasDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }
}
