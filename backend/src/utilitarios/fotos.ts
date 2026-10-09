// ============================================================
// UTILITARIO: Fotos dos pontos
// Centraliza onde as fotos ficam no disco, o formato do caminho
// gravado no banco e a deteccao do tipo real da imagem.
// ============================================================

import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

// backend/uploads tanto em dev (src/) quanto compilado (dist/).
export const PASTA_UPLOADS = path.resolve(__dirname, '../../uploads');

export const PREFIXO_URL_FOTOS = '/uploads';

// Caminho relativo gravado em pontos_coleta.foto_url. So aceita nomes
// gerados por este modulo, o que impede URL externa ou path traversal.
const PADRAO_CAMINHO_FOTO = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;

type ExtensaoFoto = 'jpg' | 'png' | 'webp';

export function garantirPastaUploads(): void {
  fs.mkdirSync(PASTA_UPLOADS, { recursive: true });
}

export function caminhoFotoValido(caminho: string): boolean {
  return PADRAO_CAMINHO_FOTO.test(caminho);
}

// Identifica o formato pelos primeiros bytes. O mimetype enviado pelo
// cliente nao e confiavel, entao a extensao sai sempre daqui.
function detectarExtensao(conteudo: Buffer): ExtensaoFoto | null {
  if (conteudo.length < 12) return null;

  if (conteudo[0] === 0xff && conteudo[1] === 0xd8 && conteudo[2] === 0xff) {
    return 'jpg';
  }

  const assinaturaPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (assinaturaPng.every((byte, indice) => conteudo[indice] === byte)) {
    return 'png';
  }

  if (
    conteudo.toString('ascii', 0, 4) === 'RIFF' &&
    conteudo.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

// Grava a imagem com nome aleatorio e devolve o caminho relativo.
// Retorna null quando o conteudo nao e JPEG, PNG ou WebP.
export async function salvarFoto(conteudo: Buffer): Promise<string | null> {
  const extensao = detectarExtensao(conteudo);
  if (!extensao) return null;

  const nomeArquivo = `${randomBytes(16).toString('hex')}.${extensao}`;
  await fs.promises.writeFile(path.join(PASTA_UPLOADS, nomeArquivo), conteudo, {
    flag: 'wx',
  });

  return `${PREFIXO_URL_FOTOS}/${nomeArquivo}`;
}

// Fotos enviadas que nunca foram ligadas a um ponto (cadastro abandonado).
// So apaga arquivos com mais de um dia, para nao pegar um envio em andamento.
const IDADE_MINIMA_ORFA_MS = 24 * 60 * 60 * 1000;

export async function limparFotosOrfas(fotosEmUso: string[]): Promise<number> {
  const emUso = new Set(fotosEmUso.map(caminho => path.basename(caminho)));
  const limite = Date.now() - IDADE_MINIMA_ORFA_MS;
  let removidas = 0;

  for (const nomeArquivo of await fs.promises.readdir(PASTA_UPLOADS)) {
    // Ignora qualquer coisa que nao tenha sido gerada por salvarFoto.
    if (emUso.has(nomeArquivo) || !caminhoFotoValido(`${PREFIXO_URL_FOTOS}/${nomeArquivo}`)) {
      continue;
    }

    const arquivo = path.join(PASTA_UPLOADS, nomeArquivo);
    try {
      const { mtimeMs } = await fs.promises.stat(arquivo);
      if (mtimeMs < limite) {
        await fs.promises.unlink(arquivo);
        removidas += 1;
      }
    } catch {
      // Arquivo sumiu no meio da varredura: nada a fazer.
    }
  }

  return removidas;
}

// Remocao "melhor esforco": foto ausente ou caminho fora do padrao nao
// deve derrubar a operacao principal (editar/excluir ponto).
export async function removerFoto(caminho: string | null | undefined): Promise<void> {
  if (!caminho || !caminhoFotoValido(caminho)) return;

  try {
    await fs.promises.unlink(path.join(PASTA_UPLOADS, path.basename(caminho)));
  } catch {
    // Arquivo ja removido ou inacessivel: nada a fazer.
  }
}
