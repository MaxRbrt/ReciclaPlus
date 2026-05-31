// ============================================================
// CONSTANTES: Categorias de Materiais Reciclaveis
// Cores importadas do tema — nunca definir cores aqui diretamente.
// ============================================================

import { CoresCategorias } from './tema';

export interface CategoriaLocal {
  id:    number;
  nome:  string;
  icone: string; // Nome do icone (MaterialCommunityIcons)
  cor:   string; // Cor de destaque — vem de CoresCategorias
}

export const CATEGORIAS: CategoriaLocal[] = [
  { id: 1, nome: 'Papel',             icone: 'newspaper-variant', cor: CoresCategorias[1] },
  { id: 2, nome: 'Plastico',          icone: 'bottle-soda',       cor: CoresCategorias[2] },
  { id: 3, nome: 'Vidro',             icone: 'bottle-wine',       cor: CoresCategorias[3] },
  { id: 4, nome: 'Metal',             icone: 'nail',              cor: CoresCategorias[4] },
  { id: 5, nome: 'Pilhas e baterias', icone: 'battery',           cor: CoresCategorias[5] },
  { id: 6, nome: 'Eletronicos',       icone: 'laptop',            cor: CoresCategorias[6] },
  { id: 7, nome: 'Oleo de cozinha',   icone: 'bottle-tonic',      cor: CoresCategorias[7] },
  { id: 8, nome: 'Roupas',            icone: 'tshirt-crew',       cor: CoresCategorias[8] },
  { id: 9, nome: 'Outros',            icone: 'recycle',           cor: CoresCategorias[9] },
];
