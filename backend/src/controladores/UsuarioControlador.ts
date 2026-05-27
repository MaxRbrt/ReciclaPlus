// ============================================================
// CONTROLADOR: Usuario
// Contem a logica de negocio para cada endpoint de usuario.
// Recebe a request, valida os dados, chama o modelo e retorna JSON.
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModelo } from '../modelos/UsuarioModelo';
import { ambiente } from '../configuracao/ambiente';

export const UsuarioControlador = {

  // POST /usuarios — Cadastrar novo usuario
  async cadastrar(req: Request, res: Response): Promise<void> {
    const { nome, email, senha } = req.body;
    const nomeNormalizado = String(nome ?? '').trim();
    const emailNormalizado = String(email ?? '').trim().toLowerCase();

    // Verifica se todos os campos foram enviados
    if (!nomeNormalizado || !emailNormalizado || !senha) {
      res.status(400).json({ erro: 'Nome, email e senha sao obrigatorios.' });
      return;
    }

    // Verifica se o email ja esta em uso
    const existente = await UsuarioModelo.buscarPorEmail(emailNormalizado);
    if (existente) {
      res.status(409).json({ erro: 'Email ja cadastrado.' });
      return;
    }

    // Criptografa a senha antes de salvar (nunca salvar senha em texto puro)
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const { id } = await UsuarioModelo.criar({
      nome: nomeNormalizado,
      email: emailNormalizado,
      senha: senhaCriptografada,
    });
    const usuario = await UsuarioModelo.buscarPorId(id);
    if (!usuario) {
      res.status(500).json({ erro: 'Usuario criado, mas nao foi possivel carrega-lo.' });
      return;
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(201).json(usuarioSemSenha);
  },

  // POST /login — Autenticar usuario
  async entrar(req: Request, res: Response): Promise<void> {
    const { email, senha } = req.body;
    const emailNormalizado = String(email ?? '').trim().toLowerCase();

    const usuario = await UsuarioModelo.buscarPorEmail(emailNormalizado);
    if (!usuario) {
      res.status(401).json({ erro: 'Email ou senha invalidos.' });
      return;
    }

    // Compara a senha enviada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      res.status(401).json({ erro: 'Email ou senha invalidos.' });
      return;
    }

    // Gera o JWT com o ID do usuario como payload
    const opcoesToken: jwt.SignOptions = {
      expiresIn: ambiente.jwt.expiracao as jwt.SignOptions['expiresIn'],
    };
    const token = jwt.sign({ id: usuario.id }, ambiente.jwt.segredo, opcoesToken);

    // Retorna token e dados do usuario (sem a senha)
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({ token, usuario: usuarioSemSenha });
  },

  // GET /usuarios/:id — Buscar dados do usuario
  async buscar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (id !== req.usuarioId) {
      res.status(403).json({ erro: 'Acesso negado para este usuario.' });
      return;
    }

    const usuario = await UsuarioModelo.buscarPorId(id);

    if (!usuario) {
      res.status(404).json({ erro: 'Usuario nao encontrado.' });
      return;
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  },
};
