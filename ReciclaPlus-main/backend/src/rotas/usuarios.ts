// ============================================================
// ROTAS: Usuarios
// Define os endpoints relacionados a usuarios e autenticacao.
// Cada rota chama o metodo correspondente no controlador.
// ============================================================

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { UsuarioControlador } from '../controladores/UsuarioControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

// POST /usuarios — Cadastrar novo usuario
router.post('/', tratarAsync(UsuarioControlador.cadastrar));

// POST /login — Autenticar usuario e retornar JWT
router.post('/login', limitadorLogin, tratarAsync(UsuarioControlador.entrar));

// GET /usuarios/:id — Buscar dados de um usuario (rota protegida)
router.get('/:id', verificarToken, tratarAsync(UsuarioControlador.buscar));

export default router;
