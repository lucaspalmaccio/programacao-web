import { HttpErrorResponse } from '@angular/common/http';

/** Endereço da API Spring Boot (backend/). */
export const API_URL = 'http://localhost:8080/api';

/** Extrai a mensagem de erro devolvida pela API (ou uma genérica se o servidor não responder). */
export function mensagemDeErro(erro: unknown, padrao = 'Não foi possível concluir a operação.'): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Servidor indisponível. Verifique se a API está rodando.';
    }
    const campos = erro.error?.campos as Record<string, string> | undefined;
    if (campos) {
      return Object.values(campos)[0] ?? padrao;
    }
    return erro.error?.mensagem ?? padrao;
  }
  return padrao;
}
