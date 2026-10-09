// ============================================================
// ROTAS: Favoritos
// Gerencia os favoritos do usuario autenticado.
// Todas as rotas exigem autenticacao.
// ============================================================

import { Router } from 'express';
import { FavoritoControlador } from '../controladores/FavoritoControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

// GET /favoritos - Listar favoritos do usuario autenticado
router.get('/', verificarToken, tratarAsync(FavoritoControlador.listar));

// GET /favoritos/ponto/:pontoId - Verificar favorito por ponto
router.get('/ponto/:pontoId', verificarToken, tratarAsync(FavoritoControlador.buscarPorPonto));

// POST /favoritos - Adicionar ponto aos favoritos
router.post('/', verificarToken, tratarAsync(FavoritoControlador.adicionar));

// DELETE /favoritos/ponto/:pontoId - Remover favorito pelo ponto
router.delete('/ponto/:pontoId', verificarToken, tratarAsync(FavoritoControlador.removerPorPonto));

// DELETE /favoritos/:id - Remover favorito por id
router.delete('/:id', verificarToken, tratarAsync(FavoritoControlador.remover));

export default router;
