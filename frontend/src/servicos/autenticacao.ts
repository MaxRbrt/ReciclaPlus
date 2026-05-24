// ============================================================
// SERVICO: Autenticacao
// Funcoes para login, cadastro e logout do usuario.
// Apos login, salva o token JWT e dados do usuario no AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { DadosLogin, DadosCadastro, RespostaLogin, Usuario } from '@/tipos/usuario';

// Chaves usadas no AsyncStorage para salvar dados do usuario
const CHAVE_TOKEN = '@reciclaplus:token';
const CHAVE_USUARIO = '@reciclaplus:usuario';

// Realiza login e salva token + usuario localmente
// IMPORTANTE: a rota correta no backend e POST /usuarios/login
// pois o roteador de usuarios e montado em /usuarios no index.ts.
// Chamar apenas '/login' resulta em 404 (rota nao registrada).
export async function entrar(dados: DadosLogin): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>('/usuarios/login', dados);
  const { token, usuario } = resposta.data;

  // Salva token e dados do usuario para uso offline e proximas requests
  await AsyncStorage.setItem(CHAVE_TOKEN, token);
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));

  return resposta.data;
}

// Cria nova conta de usuario
export async function cadastrar(dados: DadosCadastro): Promise<Usuario> {
  const resposta = await api.post<Usuario>('/usuarios', dados);
  return resposta.data;
}

// Remove dados locais do usuario (efetua logout)
export async function sair(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(CHAVE_TOKEN),
    AsyncStorage.removeItem(CHAVE_USUARIO),
  ]);
}

// Recupera usuario salvo localmente (sem precisar chamar a API)
export async function recuperarUsuarioLocal(): Promise<Usuario | null> {
  const json = await AsyncStorage.getItem(CHAVE_USUARIO);
  return json ? JSON.parse(json) : null;
}

// Verifica se ha token salvo (usuario ja logou antes)
export async function estaAutenticado(): Promise<boolean> {
  const token = await AsyncStorage.getItem(CHAVE_TOKEN);
  return token !== null;
}
