// Converte string snake_case para camelCase
function paraCamel(chave: string): string {
  return chave.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
}

// Percorre objeto/array recursivamente e renomeia todas as chaves
export function converterChaves(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(converterChaves);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([k, v]) => [
        paraCamel(k),
        converterChaves(v),
      ])
    );
  }
  return valor;
}
