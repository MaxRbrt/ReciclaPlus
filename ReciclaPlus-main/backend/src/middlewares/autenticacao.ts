// ============================================================
// MIDDLEWARE: Autenticacao JWT
// Intercepta requests nas rotas protegidas.
// Verifica se o header Authorization contem um JWT valido.
// Se valido, adiciona o payload (id do usuario) ao req.
// Se invalido ou ausente, retorna 401 Nao Autorizado.
//
// Uso nas rotas:
//   router.post('/pontos', verificarToken, PontoControlador.criar);
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ambiente } from '../configuracao/ambiente';

// Estende o tipo Request do Express para incluir o usuarioId
declare global {
  namespace Express {
    interface Request {
      usuarioId?: number;
    }
  }
}

interface PayloadJWT {
  id: number;
  iat: number;
  exp: number;
}

export function verificarToken(req: Request, res: Response, next: NextFunction): void {
  // Busca o token no header: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token nao fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica a assinatura e a expiracao do token
    const payload = jwt.verify(token, ambiente.jwt.segredo) as PayloadJWT;
    req.usuarioId = payload.id; // Disponibiliza o ID nas proximas funcoes
    next();
  } catch {
    res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }
}
