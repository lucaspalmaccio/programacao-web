package br.com.divino.loja.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StatusRequest(
        @NotBlank(message = "Status é obrigatório")
        @Size(max = 40, message = "Status deve ter no máximo 40 caracteres")
        String status
) {
}
