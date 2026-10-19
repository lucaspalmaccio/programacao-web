package br.com.divino.loja.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/** Subtotal e total não vêm do cliente: são calculados a partir dos itens. */
public record PedidoCreateRequest(
        @NotNull(message = "Cliente é obrigatório")
        Long clienteId,

        @NotEmpty(message = "O pedido precisa ter ao menos um item")
        List<@Valid ItemPedidoRequest> itens,

        @NotNull(message = "Frete é obrigatório")
        @DecimalMin(value = "0.00", message = "Frete não pode ser negativo")
        BigDecimal frete,

        @NotNull(message = "Endereço de entrega é obrigatório")
        @Valid
        EnderecoDto endereco,

        @NotBlank(message = "Forma de pagamento é obrigatória")
        @Size(max = 30, message = "Pagamento deve ter no máximo 30 caracteres")
        String pagamento,

        /** Opcional; o padrão é "Pedido recebido". */
        @Size(max = 40, message = "Status deve ter no máximo 40 caracteres")
        String status
) {
}
