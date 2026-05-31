// Tipos compartilhados do dominio de pontos de coleta.

import { Categoria } from './categoria';

export interface Ponto {
  id: number;
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  fotoUrl: string;
  horarioFuncionamento: string;
  status: 'Ativo' | 'Inativo';
  categorias: Categoria[];
  usuarioId: number;
  criadoEm: string;
}

export interface DadosCadastroPonto {
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  fotoUrl: string;
  horarioFuncionamento: string;
  categoriaIds: number[];
}
