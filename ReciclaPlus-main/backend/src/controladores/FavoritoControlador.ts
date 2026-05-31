// ============================================================
// CONTROLADOR: Favorito
// ============================================================

import { Request, Response } from 'express';
import { FavoritoModelo } from '../modelos/FavoritoModelo';

export const FavoritoControlador = {

  async listar(req: Request, res: Response): Promise<void> {
    const favoritos = await FavoritoModelo.listarPorUsuario(req.usuarioId!);
    res.json(favoritos);
  },

  async buscarPorPonto(req: Request, res: Response): Promise<void> {
    const pontoId = Number(req.params.pontoId);
    const favorito = await FavoritoModelo.buscarPorUsuarioEPonto(req.usuarioId!, pontoId);
    res.json({
      favorito: Boolean(favorito),
      favoritoId: favorito?.id ?? null,
    });
  },

  async adicionar(req: Request, res: Response): Promise<void> {
    const pontoId = Number(req.body.pontoId);
    if (!Number.isInteger(pontoId)) {
      res.status(400).json({ erro: 'pontoId invalido.' });
      return;
    }

    const existente = await FavoritoModelo.buscarPorUsuarioEPonto(req.usuarioId!, pontoId);
    if (existente) {
      res.json({ id: existente.id });
      return;
    }

    const favorito = await FavoritoModelo.criar({ usuarioId: req.usuarioId!, pontoId });
    res.status(201).json(favorito);
  },

  async remover(req: Request, res: Response): Promise<void> {
    const removido = await FavoritoModelo.remover(Number(req.params.id), req.usuarioId!);
    if (!removido) {
      res.status(404).json({ erro: 'Favorito nao encontrado para este usuario.' });
      return;
    }
    res.status(204).send();
  },

  async removerPorPonto(req: Request, res: Response): Promise<void> {
    const removido = await FavoritoModelo.removerPorPonto(req.usuarioId!, Number(req.params.pontoId));
    if (!removido) {
      res.status(404).json({ erro: 'Favorito nao encontrado para este ponto.' });
      return;
    }
    res.status(204).send();
  },
};
