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
import rotasUploads from './rotas/uploads';
import rotasComunidade from './rotas/comunidade';
import {
  PASTA_UPLOADS,
  PREFIXO_URL_FOTOS,
  garantirPastaUploads,
  limparFotosOrfas,
} from './utilitarios/fotos';
import { PontoModelo } from './modelos/PontoModelo';

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
app.use('/usuarios', rotasUsuarios);
app.use('/pontos', rotasPontos);
app.use('/categorias', rotasCategorias);
app.use('/favoritos', rotasFavoritos);
app.use('/relatorios', rotasRelatorios);
app.use('/comunidade', rotasComunidade);

// Fotos dos pontos: arquivos estaticos publicos (GET) e envio autenticado (POST).
// O router de upload vem antes para o POST nao cair no static.
garantirPastaUploads();
app.use(PREFIXO_URL_FOTOS, rotasUploads);
app.use(PREFIXO_URL_FOTOS, express.static(PASTA_UPLOADS, {
  index: false,
  dotfiles: 'deny',
  maxAge: '7d',
  setHeaders(res) {
    // helmet define same-origin; imagens precisam carregar a partir do app.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Rota de health check — testar se a API esta rodando
app.get('/', (req, res) => {
  res.json({ mensagem: 'API Recicla+ funcionando!', versao: '1.0.0' });
});

// Middleware de erros — DEVE ser o ultimo middleware registrado
app.use(middlewareErros);

// Apaga fotos enviadas que nao ficaram ligadas a nenhum ponto. Falha aqui
// nao deve derrubar a API: so registra e tenta de novo na proxima rodada.
const INTERVALO_LIMPEZA_FOTOS_MS = 6 * 60 * 60 * 1000;

async function limparFotosSemPonto() {
  try {
    const removidas = await limparFotosOrfas(await PontoModelo.listarFotos());
    if (removidas > 0) {
      console.log(`🧹 ${removidas} foto(s) sem ponto removida(s).`);
    }
  } catch (erro) {
    console.error('[ERRO] limpeza de fotos:', (erro as Error).message);
  }
}

// --- INICIAR SERVIDOR ---
async function iniciar() {
  await testarConexao(); // Verifica conexao com MySQL antes de subir

  await limparFotosSemPonto();
  setInterval(limparFotosSemPonto, INTERVALO_LIMPEZA_FOTOS_MS).unref();

  app.listen(ambiente.porta, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${ambiente.porta}`);
  });
}

iniciar();
