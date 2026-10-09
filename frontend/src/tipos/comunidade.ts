// Tipos da Comunidade: pessoas que cadastraram pontos e cidades atendidas.

import { Ponto } from './ponto';

// Item da lista de pessoas (total ja considera o filtro de cidade, se houver).
export interface PessoaComunidade {
  id: number;
  nome: string;
  totalPontos: number;
  ultimaMarcacao: string | null;
}

// Perfil publico de uma pessoa com os pontos que ela cadastrou.
export interface PerfilPessoa {
  id: number;
  nome: string;
  criadoEm: string;
  totalPontos: number;
  pontos: Ponto[];
}

export interface CidadeComunidade {
  cidade: string;
  totalPontos: number;
  totalPessoas: number;
}
