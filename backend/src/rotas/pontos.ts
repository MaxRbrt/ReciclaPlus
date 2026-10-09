// ============================================================
// ROTAS: Pontos de Coleta
// CRUD completo de pontos de coleta.
// Rotas de escrita (POST, PUT, DELETE) exigem autenticacao.
// ============================================================

import { Router } from 'express';
import { PontoControlador } from '../controladores/PontoControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

// GET /pontos — Listar todos os pontos (publico, sem auth)
router.get('/', tratarAsync(PontoControlador.listar));

// GET /pontos/:id — Buscar ponto especifico (publico)
router.get('/:id', tratarAsync(PontoControlador.buscar));

// POST /pontos — Cadastrar novo ponto (requer login)
router.post('/', verificarToken, tratarAsync(PontoControlador.criar));

// PUT /pontos/:id — Atualizar ponto (requer login)
router.put('/:id', verificarToken, tratarAsync(PontoControlador.atualizar));

// DELETE /pontos/:id — Remover ponto (requer login)
router.delete('/:id', verificarToken, tratarAsync(PontoControlador.remover));

export default router;
