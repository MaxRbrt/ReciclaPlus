// ============================================================
// MODELO: Favorito
// ============================================================

import { pool } from '../configuracao/bancoDados';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { COLUNAS_PONTO } from './PontoModelo';

interface FavoritoDB extends RowDataPacket {
  id: number;
  usuario_id: number;
  ponto_id: number;
  criado_em: string;
}

// Ponto favoritado: as colunas do ponto mais o id do favorito.
interface FavoritoComPontoDB extends RowDataPacket {
  favorito_id: number;
  id: number;
  nome: string;
}

export const FavoritoModelo = {

  async listarPorUsuario(usuarioId: number): Promise<FavoritoComPontoDB[]> {
    const [linhas] = await pool.execute<FavoritoComPontoDB[]>(
      `SELECT f.id AS favorito_id, ${COLUNAS_PONTO}
       FROM favoritos f
       JOIN pontos_coleta p ON p.id = f.ponto_id
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE f.usuario_id = ?
       ORDER BY f.criado_em DESC`,
      [usuarioId]
    );
    return linhas;
  },

  async buscarPorUsuarioEPonto(usuarioId: number, pontoId: number): Promise<FavoritoDB | null> {
    const [linhas] = await pool.execute<FavoritoDB[]>(
      'SELECT * FROM favoritos WHERE usuario_id = ? AND ponto_id = ? LIMIT 1',
      [usuarioId, pontoId]
    );
    return linhas[0] || null;
  },

  async criar(dados: { usuarioId: number; pontoId: number }): Promise<{ id: number }> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      'INSERT INTO favoritos (usuario_id, ponto_id) VALUES (?, ?)',
      [dados.usuarioId, dados.pontoId]
    );
    return { id: resultado.insertId };
  },

  async remover(id: number, usuarioId: number): Promise<boolean> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      'DELETE FROM favoritos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return resultado.affectedRows > 0;
  },

  async removerPorPonto(usuarioId: number, pontoId: number): Promise<boolean> {
    const [resultado] = await pool.execute<ResultSetHeader>(
      'DELETE FROM favoritos WHERE usuario_id = ? AND ponto_id = ?',
      [usuarioId, pontoId]
    );
    return resultado.affectedRows > 0;
  },
};
