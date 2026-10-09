// ============================================================
// CONSTANTES: Categorias de Materiais Reciclaveis
// Cores importadas do tema — nunca definir cores aqui diretamente.
// ============================================================

import type { NomeIcone } from '@/componentes/Icone';
import { coresCategorias } from './tema';

export interface CategoriaLocal {
  id:    number;
  nome:  string;
  icone: NomeIcone;
  cor:   string; // Cor de destaque — vem de coresCategorias
}

export const CATEGORIAS: CategoriaLocal[] = [
  { id: 1, nome: 'Papel',             icone: 'newspaper-variant', cor: coresCategorias[1] },
  { id: 2, nome: 'Plástico',          icone: 'bottle-soda',       cor: coresCategorias[2] },
  { id: 3, nome: 'Vidro',             icone: 'bottle-wine',       cor: coresCategorias[3] },
  { id: 4, nome: 'Metal',             icone: 'nail',              cor: coresCategorias[4] },
  { id: 5, nome: 'Pilhas e baterias', icone: 'battery',           cor: coresCategorias[5] },
  { id: 6, nome: 'Eletrônicos',       icone: 'laptop',            cor: coresCategorias[6] },
  { id: 7, nome: 'Óleo de cozinha',   icone: 'bottle-tonic',      cor: coresCategorias[7] },
  { id: 8, nome: 'Roupas',            icone: 'tshirt-crew',       cor: coresCategorias[8] },
  { id: 9, nome: 'Outros',            icone: 'recycle',           cor: coresCategorias[9] },
];
