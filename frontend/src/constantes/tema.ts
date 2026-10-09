// ============================================================
// CONSTANTES: Tema Visual do Recicla+
// Centraliza cores, fontes, espacamentos e sombras do app.
// Importar sempre daqui — nunca usar valores fixos nas telas.
// ============================================================

export const Cores = {
  // --- Primarias (verde reciclagem) ---
  primaria:        '#2E7D32', // Verde escuro — botoes, header, icone ativo
  primariaMedia:   '#43A047', // Verde medio — estados hover/pressionado
  primariaClara:   '#66BB6A', // Verde claro — icones secundarios
  primariaFundo:   '#E8F5E9', // Verde palido — fundo de cards e chips

  // --- Secundaria (teal — agua, papel) ---
  secundaria:      '#00897B', // Teal escuro — destaques alternativos
  secundariaClara: '#4DB6AC', // Teal claro — badges, tags

  // --- Acento (ambar — seta do simbolo de reciclagem) ---
  acento:          '#F9A825', // Ambar — CTA principal, marcador selecionado
  acentoClaro:     '#FFD54F', // Ambar claro — fundo de alertas suaves

  // --- Neutras ---
  branco:          '#FFFFFF',
  cinzaClaro:      '#F5F5F5', // Fundo geral das telas
  cinzaBorda:      '#E0E0E0', // Bordas de inputs e divisores
  cinzaMedio:      '#9E9E9E', // Textos secundarios, placeholders
  cinzaEscuro:     '#424242', // Textos de corpo
  preto:           '#212121', // Titulos

  // --- Feedback ---
  erro:            '#D32F2F', // Mensagens de erro
  erroFundo:       '#FFEBEE', // Fundo de card de erro
  sucesso:         '#388E3C', // Confirmacoes
  sucessoFundo:    '#E8F5E9', // Fundo de card de sucesso
  aviso:           '#F57C00', // Alertas
  avisoFundo:      '#FFF3E0', // Fundo de card de aviso

  // --- Status dos pontos ---
  ativo:           '#43A047',
  inativo:         '#9E9E9E',

  // --- Mapa ---
  marcadorPrimario:    '#2E7D32',
  marcadorSelecionado: '#F9A825',
};

// Cores por categoria — usadas nos cards, icones e filtros do mapa
export const CoresCategorias: Record<number, string> = {
  1: '#1565C0', // Papel        — azul
  2: '#E91E63', // Plastico     — rosa
  3: '#00897B', // Vidro        — teal
  4: '#546E7A', // Metal        — cinza azulado
  5: '#F57F17', // Pilhas       — ambar escuro
  6: '#6A1B9A', // Eletronicos  — roxo
  7: '#EF6C00', // Oleo         — laranja
  8: '#C62828', // Roupas       — vermelho
  9: '#2E7D32', // Outros       — verde
};

export const Gradientes = {
  verde:  ['#2E7D32', '#43A047'] as const, // Header principal
  teal:   ['#00897B', '#26A69A'] as const, // Cards de destaque
  splash: ['#1B5E20', '#2E7D32'] as const, // Tela inicial
};

export const Fontes = {
  pequena:      12,
  normal:       14,
  media:        16,
  grande:       18,
  titulo:       22,
  tituloGrande: 28,

  normal_peso:    '400' as const,
  medio_peso:     '500' as const,
  negrito:        '600' as const,
  muitoNegrito:   '700' as const,
};

export const Espacamento = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Bordas = {
  raio:      8,   // Padrao — inputs, cards pequenos
  raioGrande: 16, // Cards maiores, modais
  raioTotal: 999, // Pilulas — botoes arredondados, chips
};

export const Sombra = {
  suave: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  padrao: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  forte: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
};
