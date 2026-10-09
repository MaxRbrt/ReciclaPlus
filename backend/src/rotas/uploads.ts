// ============================================================
// ROTAS: Uploads
// Envio de fotos dos pontos de coleta. Exige autenticacao.
// ============================================================

import { NextFunction, Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { UploadControlador } from '../controladores/UploadControlador';
import { verificarToken } from '../middlewares/autenticacao';
import { tratarAsync } from '../middlewares/tratarAsync';

const router = Router();

const TAMANHO_MAXIMO_MB = 8;

// Fica em memoria so ate o controlador conferir o tipo real da imagem.
const receberFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO_MB * 1024 * 1024, files: 1 },
}).single('foto');

const limitadorUpload = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitos envios de foto. Tente novamente em alguns minutos.' },
});

// Erros do multer (arquivo grande, campo errado) sao do cliente: 400, nao 500.
function receberFotoTratandoErros(req: Request, res: Response, next: NextFunction): void {
  receberFoto(req, res, (erro: unknown) => {
    if (!erro) {
      next();
      return;
    }
    if (erro instanceof multer.MulterError) {
      const mensagem = erro.code === 'LIMIT_FILE_SIZE'
        ? `A foto deve ter no máximo ${TAMANHO_MAXIMO_MB} MB.`
        : 'Envio de foto inválido.';
      res.status(400).json({ erro: mensagem });
      return;
    }
    next(erro);
  });
}

// POST /uploads/fotos — Enviar foto de um ponto (requer login)
router.post(
  '/fotos',
  limitadorUpload,
  verificarToken,
  receberFotoTratandoErros,
  tratarAsync(UploadControlador.enviarFoto)
);

export default router;
