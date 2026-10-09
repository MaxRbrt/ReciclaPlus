// ============================================================
// CONSTANTES: Tema Visual do Recicla+ ("Matéria", em verdes)
// Fonte unica de cores, tipografia, espacos, raios, sombras e movimento.
// As telas nunca usam cor nem tamanho solto: importam daqui.
// ============================================================

import { TextStyle } from 'react-native';

// Cor em hexadecimal (#RRGGBB) com transparencia, para fundos tingidos.
export function comAlfa(hex: string, alfa: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alfa})`;
}

export const cores = {
  // --- Verdes, do mais escuro ao mais claro ---
  floresta:      '#14482A', // Fundo dos destaques escuros
  primaria:      '#2E7D32', // Acao principal, icone ativo
  primariaViva:  '#43A047', // Massas de cor, estados ativos
  folha:         '#66BB6A', // Formas de fundo
  broto:         '#A5D6A7', // Formas de fundo claras
  nevoa:         '#DDEEDB', // Superficie tingida, botao suave
  lima:          '#CDEB6B', // Acento: distancia, numeros em destaque

  // --- Superficies ---
  fundo:         '#EFF6EC', // Fundo geral das telas
  superficie:    '#FFFFFF', // Cartoes e campos
  borda:         '#CFE2CD',
  veu:           'rgba(16,41,28,0.5)', // Atras de dialogos

  // --- Texto ---
  tinta:         '#10291C', // Titulos e texto principal
  tintaSuave:    '#4A6553', // Texto secundario
  tintaFraca:    '#6B8273', // Placeholders e icones discretos
  sobreEscuro:   '#FFFFFF',
  sobreEscuroSuave: 'rgba(255,255,255,0.82)',
  vidro:         'rgba(255,255,255,0.18)', // Botao sobre fundo escuro

  // --- Feedback ---
  erro:          '#C62828',
  erroFundo:     '#FCE9E7',
  coracao:       '#E5484D',
} as const;

// Cor de cada categoria de material: chips, selos e marcadores do mapa.
// Continuam em matizes distintos para o mapa seguir legivel.
export const coresCategorias: Record<number, string> = {
  1: '#2563C9', // Papel
  2: '#D9364B', // Plastico
  3: '#0F7A64', // Vidro
  4: '#5B6B7A', // Metal
  5: '#A86200', // Pilhas e baterias
  6: '#6B3FB5', // Eletronicos
  7: '#C4531A', // Oleo de cozinha
  8: '#B8327A', // Roupas
  9: '#2E7D32', // Outros
};

// Familias carregadas no layout raiz. Titulos em Fredoka, texto em Nunito.
export const fontes = {
  tituloForte:   'Fredoka_600SemiBold',
  tituloPesado:  'Fredoka_700Bold',
  texto:         'Nunito_400Regular',
  textoMedio:    'Nunito_600SemiBold',
  textoForte:    'Nunito_700Bold',
  textoPesado:   'Nunito_800ExtraBold',
} as const;

export const tipografia = {
  display:    { fontFamily: fontes.tituloPesado, fontSize: 34, lineHeight: 38 },
  titulo:     { fontFamily: fontes.tituloForte,  fontSize: 24, lineHeight: 29 },
  subtitulo:  { fontFamily: fontes.tituloForte,  fontSize: 18, lineHeight: 23 },
  cartao:     { fontFamily: fontes.tituloForte,  fontSize: 16, lineHeight: 21 },
  numero:     { fontFamily: fontes.tituloPesado, fontSize: 28, lineHeight: 30 },
  botao:      { fontFamily: fontes.tituloForte,  fontSize: 16, lineHeight: 20 },
  corpo:      { fontFamily: fontes.texto,        fontSize: 15, lineHeight: 21 },
  corpoForte: { fontFamily: fontes.textoForte,   fontSize: 15, lineHeight: 21 },
  detalhe:    { fontFamily: fontes.textoMedio,   fontSize: 13, lineHeight: 17 },
  aba:        { fontFamily: fontes.textoForte,   fontSize: 11, lineHeight: 14 },
  rotulo: {
    fontFamily: fontes.textoPesado,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export const espaco = {
  xxs:  4,
  xs:   8,
  sm:   12,
  md:   16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

export const raios = {
  sm:    12,
  md:    20,
  lg:    28,
  total: 999,
} as const;

// Sombras macias, tingidas de verde.
export const sombras = {
  baixa: { boxShadow: '0px 2px 8px rgba(20,72,42,0.08)' },
  alta:  { boxShadow: '0px 10px 24px rgba(20,72,42,0.16)' },
} as const;

export const tamanhos = {
  toque:      44, // Area minima de toque
  botao:      52,
  chip:       36,
  barraAbas:  62, // Sem contar a area segura inferior
  borda:      1.5,
  icone:      20,
  iconeMenor: 16,
  iconeMaior: 26,
  miniatura:  48,
} as const;

// Movimento elastico e curto. O Reanimated ja troca as animacoes por um
// salto direto quando o aparelho pede movimento reduzido.
export const movimento = {
  rapida:       160,
  normal:       320,
  lenta:        520,
  escalonar:    60,   // Atraso entre itens que entram em sequencia
  escalaToque:  0.96,
  mola:         { damping: 15, stiffness: 240 },
  molaEntrada:  { damping: 14, stiffness: 150 },
} as const;
