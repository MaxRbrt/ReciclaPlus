// ============================================================
// MODELO: Usuario
// Queries SQL diretas ao banco de dados MySQL.
// Cada funcao executa uma operacao e retorna dados tipados.
// ============================================================

import { pool } from '../configuracao/bancoDados';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UsuarioDB extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha: string;
  // null enquanto a senha nunca foi trocada.
  senha_alterada_em: Date | null;
  criado_em: string;
}

export const UsuarioModelo = {

  async buscarPorEmail(email: string): Promise<UsuarioDB | null> {
    const [linhas] = await pool.execute<UsuarioDB[]>(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return linhas[0] || null;
  },

  async buscarPorId(id: number): Promise<UsuarioDB | null> {
    const [linhas] = await pool.execute<UsuarioDB[]>(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );
    return linhas[0] || null;
  },

  async criar(dados: { nome: string; email: string; senha: string }): Promise<{ id: number }> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [dados.nome, dados.email, dados.senha]
    );
    return { id: resultado.insertId };
  },

  async atualizarNome(id: number, nome: string): Promise<void> {
    await pool.execute('UPDATE usuarios SET nome = ? WHERE id = ?', [nome, id]);
  },

  // Registra o momento da troca: tokens emitidos antes dele deixam de valer.
  async atualizarSenha(id: number, senhaCriptografada: string): Promise<void> {
    await pool.execute(
      'UPDATE usuarios SET senha = ?, senha_alterada_em = NOW() WHERE id = ?',
      [senhaCriptografada, id]
    );
  },

  // As chaves estrangeiras (ON DELETE CASCADE) levam junto os pontos,
  // as categorias desses pontos e os favoritos do usuario.
  async remover(id: number): Promise<boolean> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return resultado.affectedRows > 0;
  },
};
