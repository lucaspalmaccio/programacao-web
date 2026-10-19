package br.com.divino.loja.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ItemPedidoRequest(
        @NotNull(message = "Produto é obrigatório")
        Long produtoId,

        @NotBlank(message = "Nome do produto é obrigatório")
        @Size(max = 150, message = "Nome do produto deve ter no máximo 150 caracteres")
        String nome,

        @Size(max = 255, message = "Foto deve ter no máximo 255 caracteres")
        String foto,

        @NotNull(message = "Preço é obrigatório")
        @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
        BigDecimal preco,

        @Min(value = 1, message = "Quantidade mínima é 1")
        @Max(value = 12, message = "Quantidade máxima é 12 por produto")
        int quantidade
) {
}
