// ============================================================
// CONTROLADOR: Ponto de Coleta
// Logica de negocio para CRUD de pontos.
// ============================================================

import { Request, Response } from 'express';
import { PontoModelo } from '../modelos/PontoModelo';

export const PontoControlador = {

  // GET /pontos — Listar todos (filtro opcional por categoriaId)
  async listar(req: Request, res: Response): Promise<void> {
    const categoriaId = req.query.categoriaId ? Number(req.query.categoriaId) : undefined;
    const pontos = await PontoModelo.listar(categoriaId);
    res.json(pontos);
  },

  // GET /pontos/:id — Buscar ponto especifico com categorias
  async buscar(req: Request, res: Response): Promise<void> {
    const ponto = await PontoModelo.buscarPorId(Number(req.params.id));
    if (!ponto) {
      res.status(404).json({ erro: 'Ponto nao encontrado.' });
      return;
    }
    res.json(ponto);
  },

  // POST /pontos — Criar novo ponto (usuario autenticado)
  async criar(req: Request, res: Response): Promise<void> {
    const dados = { ...req.body, usuarioId: req.usuarioId };
    const { id } = await PontoModelo.criar(dados);
    const ponto = await PontoModelo.buscarPorId(id);
    res.status(201).json(ponto);
  },

  // PUT /pontos/:id — Atualizar ponto existente
  async atualizar(req: Request, res: Response): Promise<void> {
    const atualizado = await PontoModelo.atualizar(Number(req.params.id), req.usuarioId!, req.body);
    if (!atualizado) {
      res.status(404).json({ erro: 'Ponto nao encontrado para este usuario.' });
      return;
    }
    const ponto = await PontoModelo.buscarPorId(Number(req.params.id));
    res.json(ponto);
  },

  // DELETE /pontos/:id — Remover ponto
  async remover(req: Request, res: Response): Promise<void> {
    const removido = await PontoModelo.remover(Number(req.params.id), req.usuarioId!);
    if (!removido) {
      res.status(404).json({ erro: 'Ponto nao encontrado para este usuario.' });
      return;
    }
    res.status(204).send();
  },
};
