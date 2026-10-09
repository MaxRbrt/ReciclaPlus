// ============================================================
// CONTROLADOR: Categoria
// ============================================================

import { Request, Response } from 'express';
import { CategoriaModelo } from '../modelos/CategoriaModelo';

export const CategoriaControlador = {
  async listar(req: Request, res: Response): Promise<void> {
    const categorias = await CategoriaModelo.listar();
    res.json(categorias);
  },
};
