// ============================================================
// SERVICO: Armazenamento Seguro de Token
// Encapsula o expo-secure-store para salvar, ler e remover
// o JWT do usuario. O SecureStore usa o Keychain (iOS) ou
// EncryptedSharedPreferences (Android) — mais seguro que
// AsyncStorage para dados sensiveis como tokens.
// ============================================================

import * as SecureStore from 'expo-secure-store';

const CHAVE_TOKEN = '@reciclaplus:token';

// Salva o token JWT no armazenamento seguro do dispositivo
export async function salvarToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CHAVE_TOKEN, token);
}

// Recupera o token JWT salvo (null se nao houver sessao ativa)
export async function obterToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_TOKEN);
}

// Remove o token ao fazer logout ou quando o token expira
export async function removerToken(): Promise<void> {
  await SecureStore.deleteItemAsync(CHAVE_TOKEN);
}
