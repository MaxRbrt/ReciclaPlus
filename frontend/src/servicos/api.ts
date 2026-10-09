// ============================================================
// SERVICO: Configuracao Base da API
// Cria e exporta a instancia do axios com a URL base da API.
// Todos os outros servicos (pontos, auth, etc.) importam daqui.
//
// INTERCEPTOR DE REQUEST: adiciona o token JWT em toda requisicao.
//
// INTERCEPTOR DE RESPONSE: em erro 401 (token invalido ou expirado),
// avisa o contexto de autenticacao, que encerra a sessao.
// ============================================================

import { create, isAxiosError } from 'axios';
import { obterToken } from './tokenSeguro';

// Vem de frontend/.env. No celular precisa ser o IP da maquina na rede
// local: o aparelho nao enxerga o "localhost" do computador.
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

// Registrado pelo AutenticacaoProvider: limpa a sessao salva e zera o usuario.
type AoNaoAutorizado = () => Promise<void> | void;
let aoNaoAutorizado: AoNaoAutorizado | null = null;

export function registrarAoNaoAutorizado(handler: AoNaoAutorizado | null) {
  aoNaoAutorizado = handler;
}

export const api = create({
  baseURL: URL_BASE,
  timeout: 10000, // 10 segundos — evita requests travados
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await obterToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    if (erro.response?.status === 401) {
      // Espera a limpeza antes de devolver o erro, para a proxima
      // requisicao nao reaproveitar o token recusado.
      await aoNaoAutorizado?.();
    }
    return Promise.reject(erro);
  }
);
