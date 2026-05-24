// ============================================================
// MODELO: Categoria
// ============================================================

import { pool } from '../configuracao/bancoDados';
import { RowDataPacket } from 'mysql2';

interface CategoriaDB extends RowDataPacket {
  id: number;
  nome: string;
}

export const CategoriaModelo = {
  async listar(): Promise<CategoriaDB[]> {
    const [linhas] = await pool.execute<CategoriaDB[]>('SELECT * FROM categorias ORDER BY nome');
    return linhas;
  },
};
