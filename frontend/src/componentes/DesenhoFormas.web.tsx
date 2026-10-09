// Desenho das formas organicas na versao web, em SVG. O Skia do navegador
// exigiria baixar o CanvasKit; aqui as mesmas formas saem sem ele.

import { FormaOrganica, QUADRO_FORMAS } from '@/constantes/formas';

export function DesenhoFormas({ formas }: { formas: FormaOrganica[] }) {
  return (
    <svg
      viewBox={`0 0 ${QUADRO_FORMAS.largura} ${QUADRO_FORMAS.altura}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {formas.map((forma, indice) => (
        <path
          key={indice}
          d={forma.d}
          fill={forma.cor}
          opacity={forma.opacidade}
          transform={`translate(${forma.x} ${forma.y}) rotate(${forma.rotacao}) scale(${forma.escala})`}
        />
      ))}
    </svg>
  );
}
