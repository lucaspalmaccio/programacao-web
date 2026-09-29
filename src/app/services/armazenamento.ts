/** Só é usada quando o navegador bloqueia o localStorage (ex.: modo restrito). */
const memoria = new Map<string, string>();

function interpretar<T>(bruto: string | null | undefined, padrao: T): T {
  if (!bruto) {
    return padrao;
  }
  try {
    return JSON.parse(bruto) as T;
  } catch {
    return padrao;
  }
}

/** Lê um JSON do localStorage; dado ausente ou corrompido devolve o valor padrão. */
export function lerJson<T>(chave: string, padrao: T): T {
  try {
    return interpretar(localStorage.getItem(chave), padrao);
  } catch {
    return interpretar(memoria.get(chave), padrao);
  }
}

export function gravarJson(chave: string, valor: unknown): void {
  const texto = JSON.stringify(valor);
  try {
    localStorage.setItem(chave, texto);
  } catch {
    memoria.set(chave, texto);
  }
}

export function removerChave(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    memoria.delete(chave);
  }
}
