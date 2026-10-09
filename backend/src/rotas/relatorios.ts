// ============================================================
// ROTAS: Relatorios
// Totais agregados de pontos ativos. O app ainda nao consome estas rotas.
// ============================================================

import { Router } from 'express';
import { RelatorioControlador } from '../controladores/RelatorioControlador';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

// GET /relatorios/pontos-por-categoria — Qtd de pontos por categoria
router.get('/pontos-por-categoria', tratarAsync(RelatorioControlador.pontosPorCategoria));

// GET /relatorios/pontos-por-bairro — Qtd de pontos por bairro
router.get('/pontos-por-bairro', tratarAsync(RelatorioControlador.pontosPorBairro));

export default router;
