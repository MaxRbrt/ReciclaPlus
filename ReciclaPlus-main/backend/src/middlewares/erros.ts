// ============================================================
// MIDDLEWARE: Tratamento Global de Erros
// Captura qualquer erro nao tratado nas rotas/controladores.
// Express reconhece como middleware de erro por ter 4 parametros.
// Registrar no final do index.ts, apos todas as rotas.
// ============================================================

import { Request, Response, NextFunction } from 'express';

export function middlewareErros(
  erro: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[ERRO] ${req.method} ${req.path}:`, erro.message);

  res.status(500).json({
    erro: 'Erro interno do servidor.',
    detalhe: process.env.NODE_ENV === 'development' ? erro.message : undefined,
  });
}
