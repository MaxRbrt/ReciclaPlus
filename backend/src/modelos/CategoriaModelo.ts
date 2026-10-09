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

  // Espera ids ja deduplicados.
  async todasExistem(ids: number[]): Promise<boolean> {
    if (ids.length === 0) return true;

    const placeholders = ids.map(() => '?').join(', ');
    const [linhas] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM categorias WHERE id IN (${placeholders})`,
      ids
    );
    return Number(linhas[0].total) === ids.length;
  },
};
