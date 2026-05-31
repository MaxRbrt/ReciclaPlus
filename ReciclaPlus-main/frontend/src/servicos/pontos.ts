// Cliente HTTP para o CRUD de pontos de coleta.

import { api } from './api';
import { Ponto, DadosCadastroPonto } from '@/tipos/ponto';

export async function listarPontos(categoriaId?: number): Promise<Ponto[]> {
  const params = categoriaId ? { categoriaId } : {};
  const resposta = await api.get<Ponto[]>('/pontos', { params });
  return resposta.data;
}

export async function buscarPonto(id: number): Promise<Ponto> {
  const resposta = await api.get<Ponto>(`/pontos/${id}`);
  return resposta.data;
}

export async function cadastrarPonto(dados: DadosCadastroPonto): Promise<Ponto> {
  const resposta = await api.post<Ponto>('/pontos', dados);
  return resposta.data;
}

export async function atualizarPonto(id: number, dados: Partial<DadosCadastroPonto>): Promise<Ponto> {
  const resposta = await api.put<Ponto>(`/pontos/${id}`, dados);
  return resposta.data;
}

// A rota exige autenticacao; a API define a regra de permissao.
export async function removerPonto(id: number): Promise<void> {
  await api.delete(`/pontos/${id}`);
}
