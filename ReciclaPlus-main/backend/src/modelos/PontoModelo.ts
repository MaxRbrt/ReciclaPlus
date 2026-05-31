// Queries SQL para pontos de coleta e suas categorias.

import { pool } from '../configuracao/bancoDados';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';

interface PontoDB extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  foto_url: string;
  horario_funcionamento: string;
  status: string;
  usuario_id: number;
  criado_em: string;
}

interface CategoriaDoPontoDB extends RowDataPacket {
  ponto_id: number;
  id: number;
  nome: string;
}

interface CategoriaResumo {
  id: number;
  nome: string;
}

type PontoComCategorias = PontoDB & {
  categorias: CategoriaResumo[];
};

const COLUNAS_PONTO = `
  p.id,
  p.nome,
  p.descricao,
  p.endereco,
  p.bairro,
  CAST(p.latitude AS DOUBLE) AS latitude,
  CAST(p.longitude AS DOUBLE) AS longitude,
  p.foto_url,
  p.horario_funcionamento,
  p.status,
  p.usuario_id,
  p.criado_em
`;

async function anexarCategorias(pontos: PontoDB[]): Promise<PontoComCategorias[]> {
  if (pontos.length === 0) return [];

  const ids = pontos.map(ponto => ponto.id);
  const placeholders = ids.map(() => '?').join(', ');
  const [linhas] = await pool.execute<CategoriaDoPontoDB[]>(`
    SELECT pc.ponto_id, c.id, c.nome
    FROM ponto_categorias pc
    JOIN categorias c ON c.id = pc.categoria_id
    WHERE pc.ponto_id IN (${placeholders})
    ORDER BY c.nome
  `, ids);

  const categoriasPorPonto = new Map<number, CategoriaResumo[]>();
  for (const linha of linhas) {
    const categorias = categoriasPorPonto.get(linha.ponto_id) ?? [];
    categorias.push({ id: linha.id, nome: linha.nome });
    categoriasPorPonto.set(linha.ponto_id, categorias);
  }

  return pontos.map(ponto => ({
    ...ponto,
    categorias: categoriasPorPonto.get(ponto.id) ?? [],
  }));
}

function normalizarCategoriaIds(categoriaIds?: number[]): number[] {
  return [...new Set((categoriaIds ?? []).map(Number))]
    .filter((id): id is number => Number.isInteger(id));
}

async function inserirCategoriasDoPonto(
  conn: PoolConnection,
  pontoId: number,
  categoriaIds: number[]
): Promise<void> {
  for (const categoriaId of categoriaIds) {
    await conn.execute(
      'INSERT INTO ponto_categorias (ponto_id, categoria_id) VALUES (?, ?)',
      [pontoId, categoriaId]
    );
  }
}

export const PontoModelo = {

  async listar(categoriaId?: number): Promise<PontoComCategorias[]> {
    if (categoriaId) {
      const [linhas] = await pool.execute<PontoDB[]>(`
        SELECT DISTINCT ${COLUNAS_PONTO}
        FROM pontos_coleta p
        JOIN ponto_categorias pc ON p.id = pc.ponto_id
        WHERE pc.categoria_id = ? AND p.status = 'Ativo'
      `, [categoriaId]);
      return anexarCategorias(linhas);
    }

    const [linhas] = await pool.execute<PontoDB[]>(
      `SELECT ${COLUNAS_PONTO} FROM pontos_coleta p WHERE p.status = 'Ativo'`
    );
    return anexarCategorias(linhas);
  },

  async buscarPorId(id: number): Promise<PontoComCategorias | null> {
    const [linhas] = await pool.execute<PontoDB[]>(
      `SELECT ${COLUNAS_PONTO} FROM pontos_coleta p WHERE p.id = ?`,
      [id]
    );
    const [ponto] = await anexarCategorias(linhas);
    return ponto || null;
  },

  async criar(dados: {
    nome: string; descricao: string; endereco: string; bairro: string;
    latitude: number; longitude: number; fotoUrl: string;
    horarioFuncionamento: string; usuarioId: number; categoriaIds?: number[];
  }): Promise<{ id: number }> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [resultado] = await conn.execute<ResultSetHeader>(`
        INSERT INTO pontos_coleta
          (nome, descricao, endereco, bairro, latitude, longitude, foto_url, horario_funcionamento, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dados.nome, dados.descricao, dados.endereco, dados.bairro,
        dados.latitude, dados.longitude, dados.fotoUrl,
        dados.horarioFuncionamento, dados.usuarioId,
      ]);

      const pontoId = resultado.insertId;
      await inserirCategoriasDoPonto(
        conn,
        pontoId,
        normalizarCategoriaIds(dados.categoriaIds)
      );

      await conn.commit();
      return { id: pontoId };
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },

  async atualizar(id: number, dados: Partial<{
    nome: string;
    descricao: string;
    endereco: string;
    bairro: string;
    latitude: number;
    longitude: number;
    fotoUrl: string;
    horarioFuncionamento: string;
    status: string;
    categoriaIds: number[];
  }>): Promise<boolean> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [pontos] = await conn.execute<PontoDB[]>(
        'SELECT * FROM pontos_coleta WHERE id = ? LIMIT 1',
        [id]
      );

      if (pontos.length === 0) {
        await conn.rollback();
        return false;
      }

      // mysql2 nao aceita undefined em query preparada.
      await conn.execute<ResultSetHeader>(`
        UPDATE pontos_coleta
        SET
          nome = COALESCE(?, nome),
          descricao = COALESCE(?, descricao),
          endereco = COALESCE(?, endereco),
          bairro = COALESCE(?, bairro),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          foto_url = COALESCE(?, foto_url),
          horario_funcionamento = COALESCE(?, horario_funcionamento),
          status = COALESCE(?, status)
        WHERE id = ?
      `, [
        dados.nome ?? null,
        dados.descricao ?? null,
        dados.endereco ?? null,
        dados.bairro ?? null,
        dados.latitude ?? null,
        dados.longitude ?? null,
        dados.fotoUrl ?? null,
        dados.horarioFuncionamento ?? null,
        dados.status ?? null,
        id,
      ]);

      // Quando categoriaIds vem no payload, ele representa a selecao final.
      if (Array.isArray(dados.categoriaIds)) {
        await conn.execute('DELETE FROM ponto_categorias WHERE ponto_id = ?', [id]);
        await inserirCategoriasDoPonto(
          conn,
          id,
          normalizarCategoriaIds(dados.categoriaIds)
        );
      }

      await conn.commit();
      return true;
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },

  async remover(id: number): Promise<boolean> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [pontos] = await conn.execute<PontoDB[]>(
        'SELECT * FROM pontos_coleta WHERE id = ? LIMIT 1',
        [id]
      );

      if (pontos.length === 0) {
        await conn.rollback();
        return false;
      }

      await conn.execute('DELETE FROM ponto_categorias WHERE ponto_id = ?', [id]);
      await conn.execute('DELETE FROM favoritos WHERE ponto_id = ?', [id]);
      await conn.execute('DELETE FROM pontos_coleta WHERE id = ?', [id]);

      await conn.commit();
      return true;
    } catch (erro) {
      await conn.rollback();
      throw erro;
    } finally {
      conn.release();
    }
  },
};
