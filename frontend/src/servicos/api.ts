// ============================================================
// SERVICO: Configuracao Base da API
// Cria e exporta a instancia do axios com a URL base da API.
// Todos os outros servicos (pontos, auth, etc.) importam daqui.
//
// INTERCEPTOR DE REQUEST: adiciona o token JWT automaticamente
// em todas as requisicoes que precisam de autenticacao.
//
// INTERCEPTOR DE RESPONSE: captura erros 401 (nao autorizado)
// e pode redirecionar para o login se o token expirar.
// ============================================================

import { create, isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obterToken, removerToken } from './tokenSeguro';

// URL base da API — trocar pelo IP real do servidor durante o desenvolvimento.
// Em producao, seria o dominio do servidor hospedado.
// IMPORTANTE: usar o IP da maquina na rede local (nao usar localhost
// no dispositivo fisico — o dispositivo nao acessa localhost do PC).
const URL_BASE = process.env.EXPO_PUBLIC_API_URL;
const emDesenvolvimento = process.env.NODE_ENV !== 'production';

if (!URL_BASE) {
  throw new Error('EXPO_PUBLIC_API_URL não definido. Configure a variável no .env.');
}

if (!emDesenvolvimento && !URL_BASE.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL deve usar HTTPS fora de desenvolvimento.');
}

// Sem barra final, para montar URLs de arquivos servidos pela API (ex.: fotos).
export const URL_API = URL_BASE.replace(/\/+$/, '');

// Mensagem enviada pela API no campo "erro" (validacao, permissao etc.).
// Sem resposta da API (rede, timeout), devolve a mensagem padrao da tela.
export function mensagemErroApi(erro: unknown, padrao: string): string {
  if (isAxiosError(erro)) {
    const mensagem = (erro.response?.data as { erro?: unknown } | undefined)?.erro;
    if (typeof mensagem === 'string' && mensagem) return mensagem;
  }
  return padrao;
}

let aoNaoAutorizado: (() => void) | null = null;

export function registrarAoNaoAutorizado(handler: (() => void) | null) {
  aoNaoAutorizado = handler;
}

async function limparSessaoLocal() {
  await Promise.all([
    removerToken(),
    AsyncStorage.removeItem('@reciclaplus:usuario'),
  ]);
}

// Cria instancia do axios com configuracoes padrao
export const api = create({
  baseURL: URL_BASE,
  timeout: 10000, // 10 segundos — evita requests travados
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR DE REQUEST
// Antes de cada requisicao, busca o token no SecureStore
// e adiciona no header Authorization se existir.
api.interceptors.request.use(async (config) => {
  const token = await obterToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR DE RESPONSE
// Trata erros globais. Status 401 = token invalido/expirado.
api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    if (erro.response?.status === 401) {
      // Token expirado/invalido:
      //   1) Limpa credenciais locais para nao reusar token quebrado.
      //   2) Notifica o contexto de autenticacao para zerar o usuario em memoria.
      await limparSessaoLocal();
      aoNaoAutorizado?.();
    }
    return Promise.reject(erro);
  }
);
