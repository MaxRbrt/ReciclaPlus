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
import { UsuarioModelo } from '../modelos/UsuarioModelo';

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
    res.status(401).json({ erro: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  let payload: PayloadJWT;
  try {
    // Verifica a assinatura e a expiracao do token
    payload = jwt.verify(token, ambiente.jwt.segredo) as PayloadJWT;
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
    return;
  }

  // O token continua assinado e no prazo depois que a conta e excluida ou a
  // senha e trocada; sem estas checagens ele ainda entraria nas rotas protegidas.
  UsuarioModelo.buscarPorId(payload.id)
    .then((usuario) => {
      // iat e senha_alterada_em tem precisao de segundos.
      const emitidoAntesDaTrocaDeSenha =
        usuario?.senha_alterada_em != null &&
        payload.iat < Math.floor(usuario.senha_alterada_em.getTime() / 1000);

      if (!usuario || emitidoAntesDaTrocaDeSenha) {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
        return;
      }
      req.usuarioId = usuario.id; // Disponibiliza o ID nas proximas funcoes
      next();
    })
    .catch(next);
}
