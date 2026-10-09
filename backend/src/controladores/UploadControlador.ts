// ============================================================
// CONTROLADOR: Upload
// Recebe a foto de um ponto e devolve o caminho a ser gravado
// em pontos_coleta.foto_url.
// ============================================================

import { Request, Response } from 'express';
import { salvarFoto } from '../utilitarios/fotos';

export const UploadControlador = {

  // POST /uploads/fotos — campo multipart "foto"
  async enviarFoto(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ erro: 'Nenhuma foto enviada.' });
      return;
    }

    const fotoUrl = await salvarFoto(req.file.buffer);
    if (!fotoUrl) {
      res.status(400).json({ erro: 'Formato de imagem não suportado. Use JPEG, PNG ou WebP.' });
      return;
    }

    res.status(201).json({ fotoUrl });
  },
};
