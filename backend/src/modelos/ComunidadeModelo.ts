// Queries SQL da Comunidade: quem cadastrou pontos e em quais cidades.
// Nunca seleciona email nem senha — so o que pode aparecer para outros usuarios.

import { pool } from '../configuracao/bancoDados';
import { RowDataPacket } from 'mysql2';
import { prefixoLike } from './PontoModelo';

interface PessoaDB extends RowDataPacket {
  id: number;
  nome: string;
  total_pontos: number;
  ultima_marcacao: string | null;
}

interface PerfilDB extends RowDataPacket {
  id: number;
  nome: string;
  criado_em: string;
  total_pontos: number;
}

interface CidadeDB extends RowDataPacket {
  cidade: string;
  total_pontos: number;
  total_pessoas: number;
}

export const ComunidadeModelo = {

  // Pessoas com ao menos um ponto ativo (na cidade, quando filtrado).
  async listarPessoas(cidade?: string): Promise<PessoaDB[]> {
    const condicoes = ["p.status = 'Ativo'"];
    const valores: string[] = [];

    if (cidade) {
      condicoes.push("p.cidade LIKE ? ESCAPE '!'");
      valores.push(prefixoLike(cidade));
    }

    const [linhas] = await pool.execute<PessoaDB[]>(
      `SELECT u.id, u.nome, COUNT(p.id) AS total_pontos, MAX(p.criado_em) AS ultima_marcacao
       FROM usuarios u
       JOIN pontos_coleta p ON p.usuario_id = u.id
       WHERE ${condicoes.join(' AND ')}
       GROUP BY u.id, u.nome
       ORDER BY total_pontos DESC, u.nome`,
      valores
    );
    return linhas;
  },

  async buscarPerfil(usuarioId: number): Promise<PerfilDB | null> {
    const [linhas] = await pool.execute<PerfilDB[]>(
      `SELECT u.id, u.nome, u.criado_em,
              (SELECT COUNT(*) FROM pontos_coleta p
               WHERE p.usuario_id = u.id AND p.status = 'Ativo') AS total_pontos
       FROM usuarios u
       WHERE u.id = ?`,
      [usuarioId]
    );
    return linhas[0] || null;
  },

  // Cidades que ja tem ponto de coleta, das mais movimentadas para as menos.
  async listarCidades(): Promise<CidadeDB[]> {
    const [linhas] = await pool.execute<CidadeDB[]>(
      `SELECT p.cidade, COUNT(*) AS total_pontos, COUNT(DISTINCT p.usuario_id) AS total_pessoas
       FROM pontos_coleta p
       WHERE p.status = 'Ativo' AND p.cidade <> ''
       GROUP BY p.cidade
       ORDER BY total_pontos DESC, p.cidade
       LIMIT 100`
    );
    return linhas;
  },
};
