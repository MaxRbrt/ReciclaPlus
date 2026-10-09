// Cliente HTTP da Comunidade (todas as rotas exigem login).

import { api } from './api';
import { Ponto } from '@/tipos/ponto';
import {
  CidadeComunidade,
  PerfilPessoa,
  PessoaComunidade,
} from '@/tipos/comunidade';

// Cidade vazia = sem filtro. A API busca pelo comeco do nome, sem diferenciar acentos.
function parametrosCidade(cidade?: string) {
  const termo = cidade?.trim();
  return termo ? { cidade: termo } : {};
}

export async function listarCidades(): Promise<CidadeComunidade[]> {
  const resposta = await api.get<CidadeComunidade[]>('/comunidade/cidades');
  return resposta.data;
}

export async function listarPessoas(cidade?: string): Promise<PessoaComunidade[]> {
  const resposta = await api.get<PessoaComunidade[]>('/comunidade/pessoas', {
    params: parametrosCidade(cidade),
  });
  return resposta.data;
}

export async function buscarPerfil(usuarioId: number): Promise<PerfilPessoa> {
  const resposta = await api.get<PerfilPessoa>(`/comunidade/pessoas/${usuarioId}`);
  return resposta.data;
}

// Pontos de todas as pessoas, com o nome de quem cadastrou.
export async function listarPontosDaComunidade(cidade?: string): Promise<Ponto[]> {
  const resposta = await api.get<Ponto[]>('/comunidade/pontos', {
    params: parametrosCidade(cidade),
  });
  return resposta.data;
}
