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

const limitadorCadastro = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Conta so contas realmente criadas; erro de validacao nao gasta o limite.
  skipFailedRequests: true,
  message: { erro: 'Muitos cadastros em pouco tempo. Tente novamente em alguns minutos.' },
});

// POST /usuarios — Cadastrar novo usuario
router.post('/', limitadorCadastro, tratarAsync(UsuarioControlador.cadastrar));

// POST /usuarios/login — Autenticar usuario e retornar JWT
router.post('/login', limitadorLogin, tratarAsync(UsuarioControlador.entrar));

// Confirmacao de senha (trocar senha, excluir conta): limita tentativas erradas
// para que um token roubado nao sirva para adivinhar a senha.
const limitadorConfirmacaoSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

// As rotas "/eu" vem antes de "/:id" para nao serem lidas como um id.

// PUT /usuarios/eu — Alterar o proprio nome
router.put('/eu', verificarToken, tratarAsync(UsuarioControlador.atualizarPerfil));

// PUT /usuarios/eu/senha — Trocar a senha (confirma a atual)
router.put(
  '/eu/senha',
  limitadorConfirmacaoSenha,
  verificarToken,
  tratarAsync(UsuarioControlador.alterarSenha)
);

// DELETE /usuarios/eu — Excluir a propria conta (confirma a senha)
router.delete(
  '/eu',
  limitadorConfirmacaoSenha,
  verificarToken,
  tratarAsync(UsuarioControlador.excluirConta)
);

// GET /usuarios/:id — Buscar dados de um usuario (rota protegida)
router.get('/:id', verificarToken, tratarAsync(UsuarioControlador.buscar));

export default router;
