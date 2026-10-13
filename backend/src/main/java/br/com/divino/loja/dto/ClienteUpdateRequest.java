package br.com.divino.loja.dto;

import br.com.divino.loja.validation.Cpf;
import br.com.divino.loja.validation.Maioridade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Corpo do PUT /api/clientes/{id}. PUT substitui o recurso, então todos os dados
 * cadastrais são obrigatórios; a senha é opcional (se ausente, a atual é mantida).
 */
public record ClienteUpdateRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 3, max = 120, message = "Nome deve ter entre 3 e 120 caracteres")
        @Pattern(regexp = "^\\S+(\\s+\\S+)+$", message = "Informe nome e sobrenome")
        String nome,

        @NotBlank(message = "E-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 120, message = "E-mail deve ter no máximo 120 caracteres")
        String email,

        @NotBlank(message = "CPF é obrigatório")
        @Cpf
        String cpf,

        @NotBlank(message = "Telefone é obrigatório")
        @Pattern(regexp = "^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$", message = "Telefone inválido")
        String telefone,

        @NotNull(message = "Data de nascimento é obrigatória")
        @Past(message = "Data de nascimento deve estar no passado")
        @Maioridade
        LocalDate nascimento,

        @Size(min = 8, max = 72, message = "Senha deve ter entre 8 e 72 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Senha deve conter letras e números")
        String senha,

        @Valid
        EnderecoDto endereco
) {
}
