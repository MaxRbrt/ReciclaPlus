// ============================================================
// CONTROLADOR: Favorito
// ============================================================

import { Request, Response } from 'express';
import { FavoritoModelo } from '../modelos/FavoritoModelo';
import { PontoModelo } from '../modelos/PontoModelo';

// Ids chegam como texto (URL) ou em JSON; so inteiro positivo segue para o banco.
function lerId(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const FavoritoControlador = {

  async listar(req: Request, res: Response): Promise<void> {
    const favoritos = await FavoritoModelo.listarPorUsuario(req.usuarioId!);
    res.json(favoritos);
  },

  async buscarPorPonto(req: Request, res: Response): Promise<void> {
    const pontoId = lerId(req.params.pontoId);
    const favorito = pontoId
      ? await FavoritoModelo.buscarPorUsuarioEPonto(req.usuarioId!, pontoId)
      : null;
    res.json({
      favorito: Boolean(favorito),
      favoritoId: favorito?.id ?? null,
    });
  },

  async adicionar(req: Request, res: Response): Promise<void> {
    const pontoId = lerId(req.body?.pontoId);
    if (!pontoId) {
      res.status(400).json({ erro: 'pontoId inválido.' });
      return;
    }

    const existente = await FavoritoModelo.buscarPorUsuarioEPonto(req.usuarioId!, pontoId);
    if (existente) {
      res.json({ id: existente.id });
      return;
    }

    if (!(await PontoModelo.buscarPorId(pontoId))) {
      res.status(404).json({ erro: 'Ponto não encontrado.' });
      return;
    }

    try {
      const favorito = await FavoritoModelo.criar({ usuarioId: req.usuarioId!, pontoId });
      res.status(201).json(favorito);
    } catch (erro) {
      // Toque duplo no botao: a segunda requisicao esbarra no indice unico.
      if ((erro as { code?: string }).code !== 'ER_DUP_ENTRY') throw erro;

      const jaCriado = await FavoritoModelo.buscarPorUsuarioEPonto(req.usuarioId!, pontoId);
      res.json({ id: jaCriado?.id });
    }
  },

  async remover(req: Request, res: Response): Promise<void> {
    const id = lerId(req.params.id);
    const removido = id ? await FavoritoModelo.remover(id, req.usuarioId!) : false;
    if (!removido) {
      res.status(404).json({ erro: 'Favorito não encontrado para este usuário.' });
      return;
    }
    res.status(204).send();
  },

  async removerPorPonto(req: Request, res: Response): Promise<void> {
    const pontoId = lerId(req.params.pontoId);
    const removido = pontoId
      ? await FavoritoModelo.removerPorPonto(req.usuarioId!, pontoId)
      : false;
    if (!removido) {
      res.status(404).json({ erro: 'Favorito não encontrado para este ponto.' });
      return;
    }
    res.status(204).send();
  },
};
