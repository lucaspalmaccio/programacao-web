package br.com.divino.loja.security;

/** Quem está fazendo a requisição: o cliente do token e se ele é administrador. */
public record Sessao(Long clienteId, boolean admin) {
}
