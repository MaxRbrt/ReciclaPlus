// ============================================================
// SERVICO: Favoritos
// Gerencia os pontos favoritados pelo usuario autenticado.
// ============================================================

import { api } from './api';
import { Ponto } from '@/tipos/ponto';

export interface FavoritoPonto extends Omit<Ponto, 'categorias'> {
  favoritoId: number;
  categorias?: Ponto['categorias'];
}

export interface StatusFavorito {
  favorito: boolean;
  favoritoId: number | null;
}

// Busca os pontos favoritados pelo usuario
export async function listarFavoritos(): Promise<FavoritoPonto[]> {
  const resposta = await api.get<FavoritoPonto[]>('/favoritos');
  return resposta.data;
}

// Verifica se um ponto especifico ja esta nos favoritos
export async function verificarFavorito(pontoId: number): Promise<StatusFavorito> {
  const resposta = await api.get<StatusFavorito>(`/favoritos/ponto/${pontoId}`);
  return resposta.data;
}

// Adiciona um ponto aos favoritos do usuario
export async function adicionarFavorito(pontoId: number): Promise<{ id: number }> {
  const resposta = await api.post<{ id: number }>('/favoritos', { pontoId });
  return resposta.data;
}

// Remove um ponto dos favoritos
export async function removerFavorito(favoritoId: number): Promise<void> {
  await api.delete(`/favoritos/${favoritoId}`);
}

// Remove um ponto dos favoritos usando o id do ponto
export async function removerFavoritoPorPonto(pontoId: number): Promise<void> {
  await api.delete(`/favoritos/ponto/${pontoId}`);
}
