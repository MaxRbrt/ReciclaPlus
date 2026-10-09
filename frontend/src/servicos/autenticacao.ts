// ============================================================
// SERVICO: Autenticacao
// Funcoes para login, cadastro e logout do usuario.
// Apos login, salva o token JWT no SecureStore e dados nao sensiveis no AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { DadosLogin, DadosCadastro, RespostaLogin, Usuario } from '@/tipos/usuario';
import { salvarToken, obterToken, removerToken } from './tokenSeguro';

// Chave usada no AsyncStorage para salvar apenas dados nao sensiveis do usuario
const CHAVE_USUARIO = '@reciclaplus:usuario';

// Realiza login e salva token + usuario localmente
// IMPORTANTE: a rota correta no backend e POST /usuarios/login
// pois o roteador de usuarios e montado em /usuarios no index.ts.
// Chamar apenas '/login' resulta em 404 (rota nao registrada).
export async function entrar(dados: DadosLogin): Promise<RespostaLogin> {
  const resposta = await api.post<RespostaLogin>('/usuarios/login', dados);
  const { token, usuario } = resposta.data;

  // Salva token em storage protegido e dados do usuario para uso local.
  await salvarToken(token);
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));

  return resposta.data;
}

// Cria nova conta de usuario
export async function cadastrar(dados: DadosCadastro): Promise<Usuario> {
  const resposta = await api.post<Usuario>('/usuarios', dados);
  return resposta.data;
}

// Altera o nome do usuario logado e atualiza a copia local
export async function atualizarNome(nome: string): Promise<Usuario> {
  const resposta = await api.put<Usuario>('/usuarios/eu', { nome });
  await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.data));
  return resposta.data;
}

// Troca a senha; a API confere a senha atual antes de aceitar a nova
// A troca encerra as sessoes antigas (inclusive a deste aparelho), entao a API
// devolve um token novo, que substitui o atual.
export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  const resposta = await api.put<{ token: string }>('/usuarios/eu/senha', {
    senhaAtual,
    novaSenha,
  });
  await salvarToken(resposta.data.token);
}

// Exclui a conta (com os pontos e favoritos dela) e limpa a sessao local
export async function excluirConta(senha: string): Promise<void> {
  await api.delete('/usuarios/eu', { data: { senha } });
  await sair();
}

// Remove dados locais do usuario (efetua logout)
export async function sair(): Promise<void> {
  await Promise.all([
    removerToken(),
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
  const token = await obterToken();
  return token !== null;
}
