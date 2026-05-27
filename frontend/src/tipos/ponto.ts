// ============================================================
// TIPOS: Ponto de Coleta
// Define a estrutura de dados de um ponto de coleta reciclavel.
// E o tipo principal do sistema — usado em quase todas as telas.
// ============================================================

import { Categoria } from './categoria';

// Ponto completo retornado pela API (com categorias populadas)
export interface Ponto {
  id: number;
  nome: string;                          // Ex: "Ecoponto Centro"
  descricao: string;                     // Texto livre sobre o ponto
  endereco: string;                      // Rua + numero
  bairro: string;
  latitude: number;                      // Coordenada GPS
  longitude: number;                     // Coordenada GPS
  fotoUrl: string;                       // URL da foto do ponto
  horarioFuncionamento: string;          // Ex: "08:00 as 18:00"
  status: 'Ativo' | 'Inativo';          // So pontos Ativos aparecem no mapa
  categorias: Categoria[];              // Materiais aceitos neste ponto
  usuarioId: number;                    // Quem cadastrou
  criadoEm: string;                     // ISO 8601
}

// Dados enviados no formulario de cadastro de novo ponto
export interface DadosCadastroPonto {
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  fotoUrl: string;
  horarioFuncionamento: string;
  categoriaIds: number[]; // IDs das categorias selecionadas
}

// Versao resumida usada nos cards da lista e marcadores do mapa
export interface PontoResumo {
  id: number;
  nome: string;
  bairro: string;
  latitude: number;
  longitude: number;
  status: 'Ativo' | 'Inativo';
  categorias: string[]; // Apenas nomes, para exibicao rapida
  distancia?: number;   // Calculada localmente em km (opcional)
}
