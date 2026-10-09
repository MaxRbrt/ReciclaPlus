// Controlador HTTP para pontos de coleta.

import { Request, Response } from 'express';
import { PontoModelo } from '../modelos/PontoModelo';
import { CategoriaModelo } from '../modelos/CategoriaModelo';
import { removerFoto } from '../utilitarios/fotos';
import { validarAtualizacaoPonto, validarNovoPonto } from '../utilitarios/validarPonto';

// Ids vem da URL como texto; qualquer coisa que nao seja inteiro positivo
// e tratada como "nao encontrado" em vez de chegar ao banco.
function lerId(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Carrega o ponto e garante que o usuario autenticado e o dono.
// Responde 404/403 e retorna null quando nao pode prosseguir.
async function buscarPontoDoDono(req: Request, res: Response) {
  const id = lerId(req.params.id);
  const ponto = id ? await PontoModelo.buscarPorId(id) : null;

  if (!ponto) {
    res.status(404).json({ erro: 'Ponto não encontrado.' });
    return null;
  }
  if (ponto.usuario_id !== req.usuarioId) {
    res.status(403).json({ erro: 'Apenas quem cadastrou o ponto pode alterá-lo.' });
    return null;
  }
  return ponto;
}

// As rotas de leitura de /pontos sao publicas; o nome de quem cadastrou so
// sai pelas rotas autenticadas de /comunidade.
function semAutor<T extends { usuario_nome?: string }>(ponto: T): Omit<T, 'usuario_nome'> {
  const { usuario_nome: _, ...resto } = ponto;
  return resto;
}

// Apaga o arquivo so se nenhum ponto ainda aponta para ele. O caminho da
// foto e publico, entao outro ponto pode referenciar o mesmo arquivo.
async function descartarFotoSemUso(fotoUrl: string): Promise<void> {
  if (!fotoUrl || (await PontoModelo.fotoEmUso(fotoUrl))) return;
  await removerFoto(fotoUrl);
}

export const PontoControlador = {

  async listar(req: Request, res: Response): Promise<void> {
    let categoriaId: number | undefined;

    if (req.query.categoriaId !== undefined) {
      const lido = lerId(req.query.categoriaId);
      if (!lido) {
        res.status(400).json({ erro: 'categoriaId inválido.' });
        return;
      }
      categoriaId = lido;
    }

    const pontos = await PontoModelo.listar({ categoriaId });
    res.json(pontos.map(semAutor));
  },

  // Retorna o ponto com suas categorias carregadas.
  async buscar(req: Request, res: Response): Promise<void> {
    const id = lerId(req.params.id);
    const ponto = id ? await PontoModelo.buscarPorId(id) : null;
    if (!ponto) {
      res.status(404).json({ erro: 'Ponto não encontrado.' });
      return;
    }
    res.json(semAutor(ponto));
  },

  async criar(req: Request, res: Response): Promise<void> {
    const validacao = validarNovoPonto(req.body);
    if (!validacao.valido) {
      res.status(400).json({ erro: validacao.erros[0], erros: validacao.erros });
      return;
    }

    if (!(await CategoriaModelo.todasExistem(validacao.dados.categoriaIds))) {
      res.status(400).json({ erro: 'Uma ou mais categorias não existem.' });
      return;
    }

    const { id } = await PontoModelo.criar({ ...validacao.dados, usuarioId: req.usuarioId! });
    const ponto = await PontoModelo.buscarPorId(id);
    res.status(201).json(ponto ? semAutor(ponto) : null);
  },

  // Somente o dono do ponto pode atualizar.
  async atualizar(req: Request, res: Response): Promise<void> {
    const pontoAtual = await buscarPontoDoDono(req, res);
    if (!pontoAtual) return;

    const validacao = validarAtualizacaoPonto(req.body);
    if (!validacao.valido) {
      res.status(400).json({ erro: validacao.erros[0], erros: validacao.erros });
      return;
    }

    const { categoriaIds, fotoUrl } = validacao.dados;
    if (categoriaIds && !(await CategoriaModelo.todasExistem(categoriaIds))) {
      res.status(400).json({ erro: 'Uma ou mais categorias não existem.' });
      return;
    }

    const atualizado = await PontoModelo.atualizar(pontoAtual.id, validacao.dados);
    if (!atualizado) {
      res.status(404).json({ erro: 'Ponto não encontrado.' });
      return;
    }

    // Foto trocada ou removida: o arquivo antigo deixa de ser referenciado.
    if (fotoUrl !== undefined && fotoUrl !== pontoAtual.foto_url) {
      await descartarFotoSemUso(pontoAtual.foto_url);
    }

    const ponto = await PontoModelo.buscarPorId(pontoAtual.id);
    res.json(ponto ? semAutor(ponto) : null);
  },

  // Somente o dono do ponto pode remover.
  async remover(req: Request, res: Response): Promise<void> {
    const pontoAtual = await buscarPontoDoDono(req, res);
    if (!pontoAtual) return;

    const removido = await PontoModelo.remover(pontoAtual.id);
    if (!removido) {
      res.status(404).json({ erro: 'Ponto não encontrado.' });
      return;
    }

    await descartarFotoSemUso(pontoAtual.foto_url);
    res.status(204).send();
  },
};
