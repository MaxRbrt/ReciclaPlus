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
};
