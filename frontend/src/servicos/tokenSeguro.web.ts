// ============================================================
// SERVICO: Armazenamento de Token (navegador)
// O expo-secure-store nao existe na web. Aqui o JWT fica no
// localStorage, que e legivel por qualquer script da pagina — menos
// protegido que o Keychain/EncryptedSharedPreferences do celular.
// Aceitavel para desenvolvimento e testes no navegador.
// ============================================================

const CHAVE_TOKEN = 'reciclaplus_token';

export async function salvarToken(token: string): Promise<void> {
  window.localStorage.setItem(CHAVE_TOKEN, token);
}

export async function obterToken(): Promise<string | null> {
  return window.localStorage.getItem(CHAVE_TOKEN);
}

export async function removerToken(): Promise<void> {
  window.localStorage.removeItem(CHAVE_TOKEN);
}
