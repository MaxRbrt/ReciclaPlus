// Leitura de parametros vindos da URL, da query string ou do corpo JSON.

// Ids chegam como texto (URL) ou em JSON; so inteiro positivo segue para o
// banco. Qualquer outra coisa vira null e a rota responde 400/404.
export function lerId(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}
