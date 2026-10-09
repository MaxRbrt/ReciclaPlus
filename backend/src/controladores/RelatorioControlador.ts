// ============================================================
// CONTROLADOR: Relatorios
// Totais agregados de pontos ativos. O app ainda nao consome estas rotas.
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../configuracao/bancoDados';

export const RelatorioControlador = {

  // GET /relatorios/pontos-por-categoria
  async pontosPorCategoria(_req: Request, res: Response): Promise<void> {
    const [linhas] = await pool.execute(`
      SELECT c.nome AS categoria, COUNT(p.id) AS total
      FROM categorias c
      LEFT JOIN ponto_categorias pc ON c.id = pc.categoria_id
      LEFT JOIN pontos_coleta p ON p.id = pc.ponto_id AND p.status = 'Ativo'
      GROUP BY c.id, c.nome
      ORDER BY total DESC
    `);
    res.json(linhas);
  },

  // GET /relatorios/pontos-por-bairro
  async pontosPorBairro(_req: Request, res: Response): Promise<void> {
    const [linhas] = await pool.execute(`
      SELECT bairro, COUNT(*) AS total
      FROM pontos_coleta
      WHERE status = 'Ativo'
      GROUP BY bairro
      ORDER BY total DESC
    `);
    res.json(linhas);
  },
};
