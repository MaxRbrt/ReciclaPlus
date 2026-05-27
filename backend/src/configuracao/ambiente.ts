// ============================================================
// CONFIGURACAO: Variaveis de Ambiente
// Le o arquivo .env e exporta as variaveis tipadas.
// Centraliza o acesso ao process.env — nao usar process.env
// diretamente em outros arquivos, sempre importar daqui.
// ============================================================

import 'dotenv/config';

function variavelObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${nome}`);
  }
  return valor;
}

function listaVariavel(nome: string): string[] {
  const valor = process.env[nome];
  if (!valor) return [];
  return valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const ambiente = {
  porta: Number(process.env.PORTA) || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    porta: Number(process.env.DB_PORTA) || 3306,
    usuario: process.env.DB_USUARIO || 'root',
    senha: process.env.DB_SENHA || '',
    nome: process.env.DB_NOME || 'reciclaplus',
  },

  jwt: {
    segredo: variavelObrigatoria('JWT_SEGREDO'),
    expiracao: process.env.JWT_EXPIRACAO || '7d',
  },

  cors: {
    origensPermitidas: listaVariavel('CORS_ORIGENS'),
  },
};
