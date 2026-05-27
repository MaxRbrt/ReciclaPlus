// ============================================================
// CONTROLADOR: Relatorios
// Retorna dados agregados para o dashboard do app.
// ============================================================

import { Request, Response } from 'express';
import { pool } from '../configuracao/bancoDados';

export const RelatorioControlador = {

  // GET /relatorios/pontos-por-categoria
  async pontosPorCategoria(req: Request, res: Response): Promise<void> {
    const [linhas] = await pool.execute(`
      SELECT c.nome AS categoria, COUNT(pc.ponto_id) AS total
      FROM categorias c
      LEFT JOIN ponto_categorias pc ON c.id = pc.categoria_id
      GROUP BY c.id, c.nome
      ORDER BY total DESC
    `);
    res.json(linhas);
  },

  // GET /relatorios/pontos-por-bairro
  async pontosPorBairro(req: Request, res: Response): Promise<void> {
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
