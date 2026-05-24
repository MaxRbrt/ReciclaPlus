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

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base da API — trocar pelo IP real do servidor durante o desenvolvimento.
// Em producao, seria o dominio do servidor hospedado.
// IMPORTANTE: usar o IP da maquina na rede local (nao usar localhost
// no dispositivo fisico — o dispositivo nao acessa localhost do PC).
const URL_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.5.9:3000';

let aoNaoAutorizado: (() => void) | null = null;

export function registrarAoNaoAutorizado(handler: (() => void) | null) {
  aoNaoAutorizado = handler;
}

async function limparSessaoLocal() {
  await Promise.all([
    AsyncStorage.removeItem('@reciclaplus:token'),
    AsyncStorage.removeItem('@reciclaplus:usuario'),
  ]);
}

// Cria instancia do axios com configuracoes padrao
export const api = axios.create({
  baseURL: URL_BASE,
  timeout: 10000, // 10 segundos — evita requests travados
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR DE REQUEST
// Antes de cada requisicao, busca o token no AsyncStorage
// e adiciona no header Authorization se existir.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@reciclaplus:token');
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
