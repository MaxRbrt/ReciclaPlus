// ============================================================
// ROTAS: Categorias
// Apenas leitura — categorias sao gerenciadas pelo admin.
// ============================================================

import { Router } from 'express';
import { CategoriaControlador } from '../controladores/CategoriaControlador';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

// GET /categorias — Listar todas as categorias (publico)
router.get('/', tratarAsync(CategoriaControlador.listar));

export default router;
