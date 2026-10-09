// ============================================================
// MIDDLEWARE: Tratamento Global de Erros
// Captura qualquer erro nao tratado nas rotas/controladores.
// Express reconhece como middleware de erro por ter 4 parametros.
// Registrar no final do index.ts, apos todas as rotas.
// ============================================================

import { Request, Response, NextFunction } from 'express';

// Erros do proprio Express ao ler o corpo (JSON malformado, corpo grande
// demais) trazem o status HTTP correto; sao falha do cliente, nao do servidor.
const MENSAGENS_CLIENTE: Record<number, string> = {
  400: 'Requisição inválida.',
  413: 'Requisição grande demais.',
};

export function middlewareErros(
  erro: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const mensagemCliente = erro.status ? MENSAGENS_CLIENTE[erro.status] : undefined;
  if (erro.status && mensagemCliente) {
    res.status(erro.status).json({ erro: mensagemCliente });
    return;
  }

  console.error(`[ERRO] ${req.method} ${req.path}:`, erro.message);

  res.status(500).json({
    erro: 'Erro interno do servidor.',
    detalhe: process.env.NODE_ENV === 'development' ? erro.message : undefined,
  });
}
