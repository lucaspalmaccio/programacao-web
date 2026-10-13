package br.com.divino.loja.dto;

import br.com.divino.loja.entity.Cliente;
import br.com.divino.loja.entity.Endereco;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Representação pública do cliente: nunca inclui a senha nem o hash. */
public record ClienteResponse(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone,
        LocalDate nascimento,
        EnderecoDto endereco,
        LocalDateTime dataCadastro
) {

    public static ClienteResponse de(Cliente c) {
        Endereco e = c.getEndereco();
        EnderecoDto endereco = (e == null || e.getCep() == null) ? null
                : new EnderecoDto(e.getCep(), e.getEndereco(), e.getNumero(), e.getCidade(), e.getUf());
        return new ClienteResponse(c.getId(), c.getNome(), c.getEmail(), c.getCpf(), c.getTelefone(),
                c.getNascimento(), endereco, c.getDataCadastro());
    }
}
