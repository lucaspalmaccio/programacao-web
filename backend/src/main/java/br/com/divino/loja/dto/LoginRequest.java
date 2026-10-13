package br.com.divino.loja.dto;

import jakarta.validation.constraints.NotBlank;

/** Sem validar o formato do e-mail: login só confere credenciais (e o service normaliza o e-mail). */
public record LoginRequest(
        @NotBlank(message = "E-mail é obrigatório")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        String senha
) {
}
