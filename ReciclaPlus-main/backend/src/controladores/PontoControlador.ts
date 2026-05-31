// Controlador HTTP para pontos de coleta.

import { Request, Response } from 'express';
import { PontoModelo } from '../modelos/PontoModelo';

export const PontoControlador = {

  async listar(req: Request, res: Response): Promise<void> {
    const categoriaId = req.query.categoriaId ? Number(req.query.categoriaId) : undefined;
    const pontos = await PontoModelo.listar(categoriaId);
    res.json(pontos);
  },

  // Retorna o ponto com suas categorias carregadas.
  async buscar(req: Request, res: Response): Promise<void> {
    const ponto = await PontoModelo.buscarPorId(Number(req.params.id));
    if (!ponto) {
      res.status(404).json({ erro: 'Ponto nao encontrado.' });
      return;
    }
    res.json(ponto);
  },

  async criar(req: Request, res: Response): Promise<void> {
    const dados = { ...req.body, usuarioId: req.usuarioId };
    const { id } = await PontoModelo.criar(dados);
    const ponto = await PontoModelo.buscarPorId(id);
    res.status(201).json(ponto);
  },

  // A rota exige autenticacao; o modelo atualiza pelo id do ponto.
  async atualizar(req: Request, res: Response): Promise<void> {
    const atualizado = await PontoModelo.atualizar(Number(req.params.id), req.body);
    if (!atualizado) {
      res.status(404).json({ erro: 'Ponto nao encontrado.' });
      return;
    }
    const ponto = await PontoModelo.buscarPorId(Number(req.params.id));
    res.json(ponto);
  },

  // A rota exige autenticacao; o modelo remove pelo id do ponto.
  async remover(req: Request, res: Response): Promise<void> {
    const removido = await PontoModelo.remover(Number(req.params.id));
    if (!removido) {
      res.status(404).json({ erro: 'Ponto nao encontrado.' });
      return;
    }
    res.status(204).send();
  },
};
