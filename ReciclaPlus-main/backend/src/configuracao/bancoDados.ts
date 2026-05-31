// ============================================================
// CONFIGURACAO: Conexao com o Banco de Dados MySQL
// Cria e exporta um pool de conexoes.
// Pool = conjunto de conexoes reutilizaveis (mais eficiente
// do que abrir e fechar uma conexao a cada query).
// Os modelos importam o pool e usam pool.execute() para queries.
// ============================================================

import mysql from 'mysql2/promise';
import { ambiente } from './ambiente';

export const pool = mysql.createPool({
  host: ambiente.db.host,
  port: ambiente.db.porta,
  user: ambiente.db.usuario,
  password: ambiente.db.senha,
  database: ambiente.db.nome,
  waitForConnections: true,  // Aguarda conexao livre ao inves de lancar erro
  connectionLimit: 10,       // Maximo de 10 conexoes simultaneas
  queueLimit: 0,             // Sem limite de requisicoes na fila
});

// Testa a conexao ao iniciar o servidor
export async function testarConexao(): Promise<void> {
  const conn = await pool.getConnection();
  console.log('✅ Banco de dados conectado com sucesso.');
  conn.release();
}
