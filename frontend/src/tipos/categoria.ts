// ============================================================
// TIPOS: Categoria
// Define a estrutura de uma categoria de material reciclavel.
// Exemplo: Papel, Plastico, Vidro, Metal...
// Usado em: servicos/categorias, telas de cadastro e filtros
// ============================================================

// Categoria retornada pela API
export interface Categoria {
  id: number;
  nome: string; // Ex: "Papel", "Plastico", "Vidro"
}
