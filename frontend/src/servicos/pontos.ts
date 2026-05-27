// ============================================================
// SERVICO: Pontos de Coleta
// CRUD completo para pontos de coleta via API REST.
// Todas as funcoes retornam uma Promise — usar com async/await.
// ============================================================

import { api } from './api';
import { Ponto, DadosCadastroPonto } from '@/tipos/ponto';

// Busca todos os pontos de coleta (com filtro opcional por categoria)
export async function listarPontos(categoriaId?: number): Promise<Ponto[]> {
  const params = categoriaId ? { categoriaId } : {};
  const resposta = await api.get<Ponto[]>('/pontos', { params });
  return resposta.data;
}

// Busca um ponto especifico pelo ID
export async function buscarPonto(id: number): Promise<Ponto> {
  const resposta = await api.get<Ponto>(`/pontos/${id}`);
  return resposta.data;
}

// Cadastra novo ponto de coleta (requer autenticacao — JWT no header)
export async function cadastrarPonto(dados: DadosCadastroPonto): Promise<Ponto> {
  const resposta = await api.post<Ponto>('/pontos', dados);
  return resposta.data;
}

// Atualiza dados de um ponto existente
export async function atualizarPonto(id: number, dados: Partial<DadosCadastroPonto>): Promise<Ponto> {
  const resposta = await api.put<Ponto>(`/pontos/${id}`, dados);
  return resposta.data;
}

// Remove um ponto de coleta (apenas o dono pode remover)
export async function removerPonto(id: number): Promise<void> {
  await api.delete(`/pontos/${id}`);
}
