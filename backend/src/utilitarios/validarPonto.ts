// ============================================================
// UTILITARIO: Validacao dos dados de um ponto de coleta
// Le apenas os campos conhecidos do corpo da requisicao (o resto
// e descartado) e devolve os dados normalizados ou a lista de erros.
// ============================================================

import { caminhoFotoValido } from './fotos';

export interface DadosPonto {
  nome: string;
  descricao: string;
  endereco: string;
  bairro: string;
  cidade: string;
  latitude: number;
  longitude: number;
  fotoUrl: string;
  horarioFuncionamento: string;
  categoriaIds: number[];
}

export type DadosPontoAtualizacao = Partial<DadosPonto> & {
  status?: 'Ativo' | 'Inativo';
};

type Resultado<T> =
  | { valido: true; dados: T }
  | { valido: false; erros: string[] };

const MAXIMO_CATEGORIAS = 20;

function lerTexto(
  corpo: Record<string, unknown>,
  campo: string,
  rotulo: string,
  opcoes: { maximo: number; obrigatorio: boolean },
  erros: string[]
): string | undefined {
  const valor = corpo[campo];

  if (valor === undefined || valor === null) {
    if (opcoes.obrigatorio) erros.push(`${rotulo} é obrigatório.`);
    return undefined;
  }
  if (typeof valor !== 'string') {
    erros.push(`${rotulo} deve ser um texto.`);
    return undefined;
  }

  const texto = valor.trim();
  if (opcoes.obrigatorio && !texto) {
    erros.push(`${rotulo} é obrigatório.`);
    return undefined;
  }
  if (texto.length > opcoes.maximo) {
    erros.push(`${rotulo} deve ter no máximo ${opcoes.maximo} caracteres.`);
    return undefined;
  }
  return texto;
}

function lerCoordenada(
  corpo: Record<string, unknown>,
  campo: string,
  rotulo: string,
  limite: number,
  erros: string[]
): number | undefined {
  const valor = corpo[campo];

  if (valor === undefined || valor === null) {
    erros.push(`${rotulo} é obrigatória.`);
    return undefined;
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) > limite) {
    erros.push(`${rotulo} deve ser um número entre -${limite} e ${limite}.`);
    return undefined;
  }
  return valor;
}

function lerFotoUrl(corpo: Record<string, unknown>, erros: string[]): string | undefined {
  const valor = corpo.fotoUrl;

  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor !== 'string' || !caminhoFotoValido(valor)) {
    erros.push('Foto inválida. Envie a imagem novamente.');
    return undefined;
  }
  return valor;
}

function lerCategoriaIds(corpo: Record<string, unknown>, erros: string[]): number[] | undefined {
  const valor = corpo.categoriaIds;

  if (!Array.isArray(valor) || valor.length === 0) {
    erros.push('Selecione ao menos uma categoria.');
    return undefined;
  }
  if (valor.length > MAXIMO_CATEGORIAS) {
    erros.push(`Selecione no máximo ${MAXIMO_CATEGORIAS} categorias.`);
    return undefined;
  }
  if (!valor.every((id) => Number.isInteger(id) && id > 0)) {
    erros.push('Categorias inválidas.');
    return undefined;
  }
  return [...new Set(valor as number[])];
}

function ehObjeto(corpo: unknown): corpo is Record<string, unknown> {
  return typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo);
}

// Criacao: todos os campos passam pela validacao.
export function validarNovoPonto(corpo: unknown): Resultado<DadosPonto> {
  if (!ehObjeto(corpo)) {
    return { valido: false, erros: ['Corpo da requisição inválido.'] };
  }

  const erros: string[] = [];
  const dados = {
    nome: lerTexto(corpo, 'nome', 'Nome', { maximo: 160, obrigatorio: true }, erros),
    descricao: lerTexto(corpo, 'descricao', 'Descrição', { maximo: 2000, obrigatorio: false }, erros) ?? '',
    endereco: lerTexto(corpo, 'endereco', 'Endereço', { maximo: 255, obrigatorio: true }, erros),
    bairro: lerTexto(corpo, 'bairro', 'Bairro', { maximo: 120, obrigatorio: true }, erros),
    cidade: lerTexto(corpo, 'cidade', 'Cidade', { maximo: 120, obrigatorio: true }, erros),
    latitude: lerCoordenada(corpo, 'latitude', 'Latitude', 90, erros),
    longitude: lerCoordenada(corpo, 'longitude', 'Longitude', 180, erros),
    fotoUrl: lerFotoUrl(corpo, erros),
    horarioFuncionamento:
      lerTexto(corpo, 'horarioFuncionamento', 'Horário de funcionamento', { maximo: 160, obrigatorio: false }, erros) ?? '',
    categoriaIds: lerCategoriaIds(corpo, erros),
  };

  if (erros.length > 0) return { valido: false, erros };
  return { valido: true, dados: dados as DadosPonto };
}

// Atualizacao: so valida o que veio no corpo; campo ausente fica como esta.
export function validarAtualizacaoPonto(corpo: unknown): Resultado<DadosPontoAtualizacao> {
  if (!ehObjeto(corpo)) {
    return { valido: false, erros: ['Corpo da requisição inválido.'] };
  }

  const erros: string[] = [];
  const dados: DadosPontoAtualizacao = {};
  const veio = (campo: string) => corpo[campo] !== undefined;

  if (veio('nome')) {
    dados.nome = lerTexto(corpo, 'nome', 'Nome', { maximo: 160, obrigatorio: true }, erros);
  }
  if (veio('descricao')) {
    dados.descricao = lerTexto(corpo, 'descricao', 'Descrição', { maximo: 2000, obrigatorio: false }, erros);
  }
  if (veio('endereco')) {
    dados.endereco = lerTexto(corpo, 'endereco', 'Endereço', { maximo: 255, obrigatorio: true }, erros);
  }
  if (veio('bairro')) {
    dados.bairro = lerTexto(corpo, 'bairro', 'Bairro', { maximo: 120, obrigatorio: true }, erros);
  }
  if (veio('cidade')) {
    dados.cidade = lerTexto(corpo, 'cidade', 'Cidade', { maximo: 120, obrigatorio: true }, erros);
  }
  if (veio('latitude')) {
    dados.latitude = lerCoordenada(corpo, 'latitude', 'Latitude', 90, erros);
  }
  if (veio('longitude')) {
    dados.longitude = lerCoordenada(corpo, 'longitude', 'Longitude', 180, erros);
  }
  if (veio('fotoUrl')) {
    dados.fotoUrl = lerFotoUrl(corpo, erros);
  }
  if (veio('horarioFuncionamento')) {
    dados.horarioFuncionamento = lerTexto(
      corpo, 'horarioFuncionamento', 'Horário de funcionamento', { maximo: 160, obrigatorio: false }, erros
    );
  }
  if (veio('categoriaIds')) {
    dados.categoriaIds = lerCategoriaIds(corpo, erros);
  }
  if (veio('status')) {
    if (corpo.status === 'Ativo' || corpo.status === 'Inativo') {
      dados.status = corpo.status;
    } else {
      erros.push('Status deve ser "Ativo" ou "Inativo".');
    }
  }

  if (erros.length > 0) return { valido: false, erros };
  return { valido: true, dados };
}
