// ============================================================
// ROTAS: Usuarios
// Define os endpoints relacionados a usuarios e autenticacao.
// Cada rota chama o metodo correspondente no controlador.
// ============================================================

import { Router } from 'express';
import { UsuarioControlador } from '../controladores/UsuarioControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

// POST /usuarios — Cadastrar novo usuario
router.post('/', tratarAsync(UsuarioControlador.cadastrar));

// POST /login — Autenticar usuario e retornar JWT
router.post('/login', tratarAsync(UsuarioControlador.entrar));

// GET /usuarios/:id — Buscar dados de um usuario (rota protegida)
router.get('/:id', verificarToken, tratarAsync(UsuarioControlador.buscar));

export default router;
