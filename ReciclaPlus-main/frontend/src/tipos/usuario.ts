// ============================================================
// TIPOS: Usuario
// Define a estrutura de dados de um usuario no sistema.
// Usado em: contextos/AutenticacaoContexto, servicos/autenticacao
// ============================================================

// Dados completos do usuario (retornados pela API)
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criadoEm: string; // ISO 8601: "2026-05-23T10:00:00.000Z"
}

// Dados enviados no formulario de cadastro
export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

// Dados enviados no formulario de login
export interface DadosLogin {
  email: string;
  senha: string;
}

// Resposta da API apos login bem-sucedido
export interface RespostaLogin {
  token: string;   // JWT para autenticacao nas proximas requests
  usuario: Usuario;
}
