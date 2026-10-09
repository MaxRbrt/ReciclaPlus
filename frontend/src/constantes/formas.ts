// ============================================================
// CONSTANTES: Formas organicas dos fundos
// Folhas e massas de cor desenhadas atras dos destaques. Cada forma e um
// caminho SVG posicionado num quadro de 390 x 320; o desenho cobre a area
// disponivel mantendo a proporcao (celular: Skia; web: SVG).
// ============================================================

import { cores } from './tema';

export interface FormaOrganica {
  d: string;
  cor: string;
  opacidade: number;
  x: number;
  y: number;
  escala: number;
  rotacao: number; // graus
}

export const QUADRO_FORMAS = { largura: 390, altura: 320 };

// Circulo de raio 1 e folha de 160 de comprimento, ambos centrados na origem.
const CIRCULO = 'M-1 0A1 1 0 1 0 1 0A1 1 0 1 0 -1 0Z';
const FOLHA = 'M-80 0C-40 -58 40 -58 80 0C40 58 -40 58 -80 0Z';
const NERVURA = 'M-66 -2C-20 -8 20 -8 66 -2L66 2C20 8 -20 8 -66 2Z';

function folha(
  cor: string,
  opacidade: number,
  x: number,
  y: number,
  escala: number,
  rotacao: number
): FormaOrganica[] {
  return [
    { d: FOLHA, cor, opacidade, x, y, escala, rotacao },
    { d: NERVURA, cor: cores.floresta, opacidade: 0.22, x, y, escala, rotacao },
  ];
}

// Fundo do destaque da tela Inicio (sobre cores.floresta).
export const FORMAS_DESTAQUE: FormaOrganica[] = [
  { d: CIRCULO, cor: cores.primaria,     opacidade: 0.9,  x: 352, y: 34,  escala: 128, rotacao: 0 },
  { d: CIRCULO, cor: cores.primariaViva, opacidade: 0.55, x: 20,  y: 300, escala: 96,  rotacao: 0 },
  ...folha(cores.primariaViva, 0.8, 352, 214, 1.1, -40),
  ...folha(cores.lima, 0.95, 372, 286, 0.6, -62),
  ...folha(cores.folha, 0.55, 268, 40, 0.48, 24),
  { d: CIRCULO, cor: cores.lima, opacidade: 0.9, x: 214, y: 22, escala: 7, rotacao: 0 },
];

// Fundo dos cabecalhos de tela (faixa baixa: so o miolo do quadro aparece).
export const FORMAS_CABECALHO: FormaOrganica[] = [
  { d: CIRCULO, cor: cores.primaria, opacidade: 0.9, x: 372, y: 118, escala: 92, rotacao: 0 },
  ...folha(cores.primariaViva, 0.75, 318, 214, 0.78, -34),
  ...folha(cores.lima, 0.9, 392, 196, 0.4, -64),
  { d: CIRCULO, cor: cores.lima, opacidade: 0.9, x: 262, y: 108, escala: 5, rotacao: 0 },
];
