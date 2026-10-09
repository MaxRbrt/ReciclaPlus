// ============================================================
// CONTROLADOR: Comunidade
// Quem cadastrou pontos, perfil de cada pessoa e pontos por cidade.
// Todas as rotas exigem login, pois expoem o nome dos usuarios.
// ============================================================

import { Request, Response } from 'express';
import { ComunidadeModelo } from '../modelos/ComunidadeModelo';
import { PontoModelo } from '../modelos/PontoModelo';
import { lerId } from '../utilitarios/parametros';

const MAXIMO_CIDADE = 120;

// Filtro de cidade vindo da query string. undefined = sem filtro;
// null = valor invalido (resposta 400 ja enviada).
function lerCidade(req: Request, res: Response): string | undefined | null {
  const valor = req.query.cidade;
  if (valor === undefined) return undefined;

  if (typeof valor !== 'string' || valor.length > MAXIMO_CIDADE) {
    res.status(400).json({ erro: 'Cidade inválida.' });
    return null;
  }
  return valor.trim() || undefined;
}

export const ComunidadeControlador = {

  // GET /comunidade/cidades
  async listarCidades(_req: Request, res: Response): Promise<void> {
    res.json(await ComunidadeModelo.listarCidades());
  },

  // GET /comunidade/pessoas?cidade=
  async listarPessoas(req: Request, res: Response): Promise<void> {
    const cidade = lerCidade(req, res);
    if (cidade === null) return;

    res.json(await ComunidadeModelo.listarPessoas(cidade));
  },

  // GET /comunidade/pessoas/:id — perfil publico + pontos da pessoa
  async buscarPessoa(req: Request, res: Response): Promise<void> {
    const id = lerId(req.params.id);
    const perfil = id ? await ComunidadeModelo.buscarPerfil(id) : null;
    if (!perfil) {
      res.status(404).json({ erro: 'Pessoa não encontrada.' });
      return;
    }

    const pontos = await PontoModelo.listar({ usuarioId: perfil.id });
    res.json({ ...perfil, pontos });
  },

  // GET /comunidade/pontos?cidade= — pontos de todas as pessoas, com o nome de quem cadastrou
  async listarPontos(req: Request, res: Response): Promise<void> {
    const cidade = lerCidade(req, res);
    if (cidade === null) return;

    res.json(await PontoModelo.listar({ cidade }));
  },
};
