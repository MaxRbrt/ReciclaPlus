// ============================================================
// ENTRY POINT: Servidor Express
// Ponto de entrada da API REST do Recicla+.
// Registra middlewares globais, rotas e inicia o servidor.
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ambiente } from './configuracao/ambiente';
import { testarConexao } from './configuracao/bancoDados';
import { middlewareErros } from './middlewares/erros';
import { converterChaves } from './utilitarios/camelCase';

// Importa os arquivos de rotas
import rotasUsuarios from './rotas/usuarios';
import rotasPontos from './rotas/pontos';
import rotasCategorias from './rotas/categorias';
import rotasFavoritos from './rotas/favoritos';
import rotasRelatorios from './rotas/relatorios';

const app = express();

// --- MIDDLEWARES GLOBAIS ---

app.disable('x-powered-by');
app.use(helmet());

const origensPadraoDesenvolvimento = [
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

const origensPermitidas = ambiente.cors.origensPermitidas.length > 0
  ? ambiente.cors.origensPermitidas
  : process.env.NODE_ENV === 'development'
    ? origensPadraoDesenvolvimento
    : [];

// CORS: restringe origens de browser; clientes sem origin (app nativo/curl) continuam permitidos.
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origensPermitidas.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse de JSON: le o corpo das requests como JSON automaticamente
app.use(express.json({ limit: '1mb' }));

// Converte todas as respostas JSON de snake_case para camelCase
app.use((_req: Request, res: Response, next: NextFunction) => {
  const jsonOriginal = res.json.bind(res);
  res.json = (dados: unknown) => jsonOriginal(converterChaves(dados));
  next();
});

// --- ROTAS ---
// Prefixo /api/v1 em todas as rotas (boa pratica para versionamento)
app.use('/usuarios', rotasUsuarios);
app.use('/pontos', rotasPontos);
app.use('/categorias', rotasCategorias);
app.use('/favoritos', rotasFavoritos);
app.use('/relatorios', rotasRelatorios);

// Rota de health check — testar se a API esta rodando
app.get('/', (req, res) => {
  res.json({ mensagem: 'API Recicla+ funcionando!', versao: '1.0.0' });
});

// Middleware de erros — DEVE ser o ultimo middleware registrado
app.use(middlewareErros);

// --- INICIAR SERVIDOR ---
async function iniciar() {
  await testarConexao(); // Verifica conexao com MySQL antes de subir
  app.listen(ambiente.porta, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${ambiente.porta}`);
  });
}

iniciar();
