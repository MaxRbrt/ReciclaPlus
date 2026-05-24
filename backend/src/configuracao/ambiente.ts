// ============================================================
// CONFIGURACAO: Variaveis de Ambiente
// Le o arquivo .env e exporta as variaveis tipadas.
// Centraliza o acesso ao process.env — nao usar process.env
// diretamente em outros arquivos, sempre importar daqui.
// ============================================================

import 'dotenv/config';

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
    segredo: process.env.JWT_SEGREDO || 'chave_padrao_insegura',
    expiracao: process.env.JWT_EXPIRACAO || '7d',
  },
};
