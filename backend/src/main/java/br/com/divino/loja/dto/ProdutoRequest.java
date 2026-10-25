package br.com.divino.loja.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Corpo do POST e do PUT /api/produtos. */
public record ProdutoRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
        String nome,

        @NotBlank(message = "Tipo é obrigatório")
        @Pattern(regexp = "Tinto|Branco|Rosé|Espumante", message = "Tipo deve ser Tinto, Branco, Rosé ou Espumante")
        String tipo,

        @NotBlank(message = "País é obrigatório")
        @Size(max = 60, message = "País deve ter no máximo 60 caracteres")
        String pais,

        @NotBlank(message = "Região é obrigatória")
        @Size(max = 80, message = "Região deve ter no máximo 80 caracteres")
        String regiao,

        @NotBlank(message = "Uva é obrigatória")
        @Size(max = 120, message = "Uva deve ter no máximo 120 caracteres")
        String uva,

        @Min(value = 1900, message = "Safra inválida")
        @Max(value = 2100, message = "Safra inválida")
        int safra,

        @NotNull(message = "Preço é obrigatório")
        @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
        BigDecimal preco,

        @Size(max = 255, message = "Foto deve ter no máximo 255 caracteres")
        String foto,

        @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
        String descricao,

        @Size(max = 300, message = "Harmonização deve ter no máximo 300 caracteres")
        String harmonizacao,

        @Size(max = 10, message = "Teor alcoólico deve ter no máximo 10 caracteres")
        String teorAlcoolico,

        @Size(max = 20, message = "Volume deve ter no máximo 20 caracteres")
        String volume
) {
}
