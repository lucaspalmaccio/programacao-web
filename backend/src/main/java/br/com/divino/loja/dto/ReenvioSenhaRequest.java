package br.com.divino.loja.dto;

import jakarta.validation.constraints.NotBlank;

public record ReenvioSenhaRequest(
        @NotBlank(message = "E-mail é obrigatório")
        String email
) {
}
