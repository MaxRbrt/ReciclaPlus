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
  cidade: string;
  latitude: number;
  longitude: number;
  foto_url: string;
  horario_funcionamento: string;
  status: string;
  usuario_id: number;
  usuario_nome: string;
  criado_em: string;
}

export interface FiltrosPonto {
  categoriaId?: number;
  usuarioId?: number;
  // Prefixo do nome da cidade (a collation ignora acento e maiusculas).
  cidade?: string;
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

// Colunas de qualquer SELECT de ponto (tambem usadas pelos favoritos), para que
// todas as rotas devolvam o ponto no mesmo formato. Exigem os aliases "p"
// (pontos_coleta) e "u" (usuarios, dono do ponto).
export const COLUNAS_PONTO = `
  p.id,
  p.nome,
  p.descricao,
  p.endereco,
  p.bairro,
  p.cidade,
  CAST(p.latitude AS DOUBLE) AS latitude,
  CAST(p.longitude AS DOUBLE) AS longitude,
  p.foto_url,
  p.horario_funcionamento,
  p.status,
  p.usuario_id,
  u.nome AS usuario_nome,
  p.criado_em
`;

const ORIGEM_PONTO = 'pontos_coleta p JOIN usuarios u ON u.id = p.usuario_id';

// Prefixo para LIKE com os curingas do usuario neutralizados (ESCAPE '!').
export function prefixoLike(texto: string): string {
  return `${texto.replace(/[!%_]/g, '!$&')}%`;
}

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

// Espera ids ja validados e sem repeticao (ver utilitarios/validarPonto).
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

  // Pontos ativos, do mais recente para o mais antigo.
  async listar(filtros: FiltrosPonto = {}): Promise<PontoComCategorias[]> {
    const condicoes = ["p.status = 'Ativo'"];
    const valores: (string | number)[] = [];

    if (filtros.categoriaId) {
      condicoes.push(
        'EXISTS (SELECT 1 FROM ponto_categorias pc WHERE pc.ponto_id = p.id AND pc.categoria_id = ?)'
      );
      valores.push(filtros.categoriaId);
    }
    if (filtros.usuarioId) {
      condicoes.push('p.usuario_id = ?');
      valores.push(filtros.usuarioId);
    }
    if (filtros.cidade) {
      condicoes.push("p.cidade LIKE ? ESCAPE '!'");
      valores.push(prefixoLike(filtros.cidade));
    }

    const [linhas] = await pool.execute<PontoDB[]>(
      `SELECT ${COLUNAS_PONTO}
       FROM ${ORIGEM_PONTO}
       WHERE ${condicoes.join(' AND ')}
       ORDER BY p.criado_em DESC, p.id DESC`,
      valores
    );
    return anexarCategorias(linhas);
  },

  async buscarPorId(id: number): Promise<PontoComCategorias | null> {
    const [linhas] = await pool.execute<PontoDB[]>(
      `SELECT ${COLUNAS_PONTO} FROM ${ORIGEM_PONTO} WHERE p.id = ?`,
      [id]
    );
    const [ponto] = await anexarCategorias(linhas);
    return ponto || null;
  },

  // Fotos (caminhos nao vazios) de todos os pontos, ou so de um usuario.
  async listarFotos(usuarioId?: number): Promise<string[]> {
    const [linhas] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT foto_url FROM pontos_coleta
       WHERE foto_url <> ''${usuarioId ? ' AND usuario_id = ?' : ''}`,
      usuarioId ? [usuarioId] : []
    );
    return linhas.map(linha => String(linha.foto_url));
  },

  async fotoEmUso(fotoUrl: string): Promise<boolean> {
    const [linhas] = await pool.execute<RowDataPacket[]>(
      'SELECT 1 FROM pontos_coleta WHERE foto_url = ? LIMIT 1',
      [fotoUrl]
    );
    return linhas.length > 0;
  },

  async criar(dados: {
    nome: string; descricao: string; endereco: string; bairro: string; cidade: string;
    latitude: number; longitude: number; fotoUrl: string;
    horarioFuncionamento: string; usuarioId: number; categoriaIds: number[];
  }): Promise<{ id: number }> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [resultado] = await conn.execute<ResultSetHeader>(`
        INSERT INTO pontos_coleta
          (nome, descricao, endereco, bairro, cidade, latitude, longitude, foto_url, horario_funcionamento, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dados.nome, dados.descricao, dados.endereco, dados.bairro, dados.cidade,
        dados.latitude, dados.longitude, dados.fotoUrl,
        dados.horarioFuncionamento, dados.usuarioId,
      ]);

      const pontoId = resultado.insertId;
      await inserirCategoriasDoPonto(conn, pontoId, dados.categoriaIds);

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
    cidade: string;
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
          cidade = COALESCE(?, cidade),
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
        dados.cidade ?? null,
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
        await inserirCategoriasDoPonto(conn, id, dados.categoriaIds);
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
