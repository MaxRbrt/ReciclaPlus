// ============================================================
// ROTAS: Comunidade
// Pessoas que cadastraram pontos e pontos por cidade.
// Todas as rotas exigem autenticacao.
// ============================================================

import { Router } from 'express';
import { ComunidadeControlador } from '../controladores/ComunidadeControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

router.use(verificarToken);

// GET /comunidade/cidades — Cidades que ja tem ponto de coleta
router.get('/cidades', tratarAsync(ComunidadeControlador.listarCidades));

// GET /comunidade/pessoas — Quem cadastrou pontos (filtro opcional ?cidade=)
router.get('/pessoas', tratarAsync(ComunidadeControlador.listarPessoas));

// GET /comunidade/pessoas/:id — Perfil de uma pessoa e os pontos dela
router.get('/pessoas/:id', tratarAsync(ComunidadeControlador.buscarPessoa));

// GET /comunidade/pontos — Pontos de todas as pessoas (filtro opcional ?cidade=)
router.get('/pontos', tratarAsync(ComunidadeControlador.listarPontos));

export default router;
