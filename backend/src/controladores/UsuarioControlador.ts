// ============================================================
// CONTROLADOR: Usuario
// Contem a logica de negocio para cada endpoint de usuario.
// Recebe a request, valida os dados, chama o modelo e retorna JSON.
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModelo } from '../modelos/UsuarioModelo';
import { PontoModelo } from '../modelos/PontoModelo';
import { removerFoto } from '../utilitarios/fotos';
import { ambiente } from '../configuracao/ambiente';

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// O bcrypt so considera os primeiros 72 bytes; o limite evita senha "truncada"
// e hash caro com entrada gigante.
const TAMANHO_MAXIMO_SENHA = 72;

// JWT com o id do usuario como payload.
function emitirToken(usuarioId: number): string {
  const opcoes: jwt.SignOptions = {
    expiresIn: ambiente.jwt.expiracao as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ id: usuarioId }, ambiente.jwt.segredo, opcoes);
}

// O que pode sair nas respostas: nunca o hash nem dados da senha.
function semDadosDeSenha<T extends { senha: string; senha_alterada_em: Date | null }>(usuario: T) {
  const { senha: _senha, senha_alterada_em: _alteradaEm, ...resto } = usuario;
  return resto;
}

// Acoes sensiveis (trocar senha, excluir conta) exigem a senha de novo: um
// token roubado ou um aparelho destravado nao bastam. Responde e devolve null
// quando nao pode prosseguir.
async function buscarUsuarioConfirmandoSenha(req: Request, res: Response, senha: unknown) {
  if (typeof senha !== 'string' || !senha || senha.length > TAMANHO_MAXIMO_SENHA) {
    res.status(400).json({ erro: 'Informe sua senha atual.' });
    return null;
  }

  const usuario = await UsuarioModelo.buscarPorId(req.usuarioId!);
  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado.' });
    return null;
  }

  // 403 e nao 401: o app trata 401 como sessao expirada e desloga.
  if (!(await bcrypt.compare(senha, usuario.senha))) {
    res.status(403).json({ erro: 'Senha atual incorreta.' });
    return null;
  }
  return usuario;
}

export const UsuarioControlador = {

  // POST /usuarios — Cadastrar novo usuario
  async cadastrar(req: Request, res: Response): Promise<void> {
    const { nome, email, senha } = req.body;
    const nomeNormalizado = String(nome ?? '').trim();
    const emailNormalizado = String(email ?? '').trim().toLowerCase();

    // Verifica se todos os campos foram enviados
    if (!nomeNormalizado || !emailNormalizado || typeof senha !== 'string' || !senha) {
      res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
      return;
    }

    // Mesmos limites da tela de cadastro e das colunas do banco.
    if (nomeNormalizado.length < 3 || nomeNormalizado.length > 120) {
      res.status(400).json({ erro: 'Nome deve ter entre 3 e 120 caracteres.' });
      return;
    }
    if (emailNormalizado.length > 180 || !FORMATO_EMAIL.test(emailNormalizado)) {
      res.status(400).json({ erro: 'Email inválido.' });
      return;
    }
    if (senha.length < 6 || senha.length > TAMANHO_MAXIMO_SENHA) {
      res.status(400).json({
        erro: `Senha deve ter entre 6 e ${TAMANHO_MAXIMO_SENHA} caracteres.`,
      });
      return;
    }

    // Verifica se o email ja esta em uso
    const existente = await UsuarioModelo.buscarPorEmail(emailNormalizado);
    if (existente) {
      res.status(409).json({ erro: 'Email já cadastrado.' });
      return;
    }

    // Criptografa a senha antes de salvar (nunca salvar senha em texto puro)
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    let id: number;
    try {
      ({ id } = await UsuarioModelo.criar({
        nome: nomeNormalizado,
        email: emailNormalizado,
        senha: senhaCriptografada,
      }));
    } catch (erro) {
      // Dois cadastros simultaneos com o mesmo email: o indice unico barra o segundo.
      if ((erro as { code?: string }).code === 'ER_DUP_ENTRY') {
        res.status(409).json({ erro: 'Email já cadastrado.' });
        return;
      }
      throw erro;
    }
    const usuario = await UsuarioModelo.buscarPorId(id);
    if (!usuario) {
      res.status(500).json({ erro: 'Usuário criado, mas não foi possível carregá-lo.' });
      return;
    }

    const usuarioSemSenha = semDadosDeSenha(usuario);
    res.status(201).json(usuarioSemSenha);
  },

  // POST /login — Autenticar usuario
  async entrar(req: Request, res: Response): Promise<void> {
    const { email, senha } = req.body;
    const emailNormalizado = String(email ?? '').trim().toLowerCase();

    if (!emailNormalizado || typeof senha !== 'string' || !senha) {
      res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
      return;
    }
    // Senha acima do limite nunca foi cadastrada; nem chega ao bcrypt.
    if (senha.length > TAMANHO_MAXIMO_SENHA) {
      res.status(401).json({ erro: 'Email ou senha inválidos.' });
      return;
    }

    const usuario = await UsuarioModelo.buscarPorEmail(emailNormalizado);
    if (!usuario) {
      res.status(401).json({ erro: 'Email ou senha inválidos.' });
      return;
    }

    // Compara a senha enviada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      res.status(401).json({ erro: 'Email ou senha inválidos.' });
      return;
    }

    const token = emitirToken(usuario.id);

    // Retorna token e dados do usuario (sem a senha)
    const usuarioSemSenha = semDadosDeSenha(usuario);
    res.json({ token, usuario: usuarioSemSenha });
  },

  // GET /usuarios/:id — Buscar dados do usuario
  async buscar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (id !== req.usuarioId) {
      res.status(403).json({ erro: 'Acesso negado para este usuário.' });
      return;
    }

    const usuario = await UsuarioModelo.buscarPorId(id);

    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    const usuarioSemSenha = semDadosDeSenha(usuario);
    res.json(usuarioSemSenha);
  },

  // PUT /usuarios/eu — Alterar o proprio nome
  async atualizarPerfil(req: Request, res: Response): Promise<void> {
    const nome = typeof req.body?.nome === 'string' ? req.body.nome.trim() : '';
    if (nome.length < 3 || nome.length > 120) {
      res.status(400).json({ erro: 'Nome deve ter entre 3 e 120 caracteres.' });
      return;
    }

    await UsuarioModelo.atualizarNome(req.usuarioId!, nome);
    const usuario = await UsuarioModelo.buscarPorId(req.usuarioId!);
    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    const usuarioSemSenha = semDadosDeSenha(usuario);
    res.json(usuarioSemSenha);
  },

  // PUT /usuarios/eu/senha — Trocar a senha, confirmando a atual
  async alterarSenha(req: Request, res: Response): Promise<void> {
    const { senhaAtual, novaSenha } = req.body ?? {};

    if (typeof novaSenha !== 'string' || novaSenha.length < 6 || novaSenha.length > TAMANHO_MAXIMO_SENHA) {
      res.status(400).json({
        erro: `A nova senha deve ter entre 6 e ${TAMANHO_MAXIMO_SENHA} caracteres.`,
      });
      return;
    }

    const usuario = await buscarUsuarioConfirmandoSenha(req, res, senhaAtual);
    if (!usuario) return;

    await UsuarioModelo.atualizarSenha(usuario.id, await bcrypt.hash(novaSenha, 10));

    // A troca invalida todos os tokens anteriores (inclusive o desta
    // requisicao); o app recebe um novo para continuar logado.
    res.json({ token: emitirToken(usuario.id) });
  },

  // DELETE /usuarios/eu — Excluir a propria conta, confirmando a senha.
  // Leva junto os pontos e favoritos do usuario (cascata no banco) e as fotos.
  async excluirConta(req: Request, res: Response): Promise<void> {
    const usuario = await buscarUsuarioConfirmandoSenha(req, res, req.body?.senha);
    if (!usuario) return;

    const fotos = await PontoModelo.listarFotos(usuario.id);
    await UsuarioModelo.remover(usuario.id);

    // Depois da exclusao: so apaga o arquivo que nenhum outro ponto usa.
    for (const foto of fotos) {
      if (!(await PontoModelo.fotoEmUso(foto))) {
        await removerFoto(foto);
      }
    }

    res.status(204).send();
  },
};
