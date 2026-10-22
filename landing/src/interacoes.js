import { gsap } from 'gsap';

// ========================================
// 1. DADOS DOS MATERIAIS E DAS LIXEIRAS
// ========================================

const materiais = {
  papel: {
    etiqueta: 'PAPEL E PAPELÃO',
    titulo: 'Novas histórias começam aqui.',
    orientacao:
      'Separe papéis e caixas de papelão limpos e secos. Dobre as caixas para ocupar menos espaço.',
    icone: 'papel',
    cor: 'rec-papel',
    hex: '#1E5BD6',
  },
  plastico: {
    etiqueta: 'PLÁSTICO',
    titulo: 'Uma embalagem. Outro começo.',
    orientacao:
      'Esvazie as embalagens e retire os resíduos. Confira os tipos de plástico recebidos pelo ponto antes de levar.',
    icone: 'garrafa',
    cor: 'rec-plastico',
    hex: '#E2333F',
  },
  vidro: {
    etiqueta: 'VIDRO',
    titulo: 'Transparente até no cuidado.',
    orientacao:
      'Separe garrafas e potes vazios. Embale e identifique cacos para evitar acidentes. Confirme se o local recebe vidro quebrado.',
    icone: 'vidro',
    cor: 'rec-vidro',
    hex: '#1F9D55',
  },
  metal: {
    etiqueta: 'METAIS',
    titulo: 'Muito valor para ficar parado.',
    orientacao:
      'Retire resíduos das latas e embalagens metálicas. Proteja partes cortantes e confira quais metais o ponto recebe.',
    icone: 'metal',
    cor: 'rec-metal',
    hex: '#F5B700',
  },
  baterias: {
    etiqueta: 'PILHAS E BATERIAS',
    titulo: 'O cuidado também se renova.',
    orientacao:
      'Mantenha pilhas e baterias separadas do lixo comum. Não abra nem amasse; procure um ponto específico e siga suas instruções.',
    icone: 'bateria',
    cor: 'rec-baterias',
    hex: '#F2711C',
  },
  eletronicos: {
    etiqueta: 'ELETRÔNICOS',
    titulo: 'Desconecte. Dê um novo destino.',
    orientacao:
      'Apague seus dados pessoais antes de entregar aparelhos. Verifique os equipamentos aceitos e procure uma coleta especializada.',
    icone: 'eletronico',
    cor: 'rec-eletronicos',
    hex: '#6B7280',
  },
  oleo: {
    etiqueta: 'ÓLEO DE COZINHA',
    titulo: 'Fora da pia. Dentro de um ciclo.',
    orientacao:
      'Espere o óleo esfriar e guarde em uma garrafa bem fechada. Não despeje na pia; confirme a embalagem aceita pelo ponto.',
    icone: 'oleo',
    cor: 'rec-oleo',
    hex: '#8B5A2B',
  },
  roupas: {
    etiqueta: 'ROUPAS E TECIDOS',
    titulo: 'Mais histórias para vestir.',
    orientacao:
      'Separe peças limpas e secas. Confira se o local recebe doações para reúso, tecidos para reciclagem ou ambos.',
    icone: 'roupa',
    cor: 'rec-roupas',
    hex: '#8E44AD',
  },
  outros: {
    etiqueta: 'OUTROS MATERIAIS',
    titulo: 'Cada descarte merece atenção.',
    orientacao:
      'Nem todo resíduo pode ir para a coleta comum. Consulte as informações do ponto e confirme o destino adequado para o seu material.',
    icone: 'reciclar',
    cor: 'rec-outros',
    hex: '#2E7D32',
  },
};

const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
const duracao = (segundos) => (movimentoReduzido.matches ? 0 : segundos);
const avisar = (texto) => {
  document.querySelector('#aviso-interacao').textContent = texto;
};

// ========================================
// 2. MENU COM TECLADO E FECHAMENTO EXTERNO
// ========================================

export function iniciarMenu() {
  const botao = document.querySelector('.menu-botao');
  const navegacao = document.querySelector('.navegacao');
  const telaAmpla = window.matchMedia('(min-width: 961px)');

  const alterarMenu = (aberto) => {
    botao.setAttribute('aria-expanded', String(aberto));
    botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    navegacao.classList.toggle('aberto', aberto);
  };

  botao.addEventListener('click', () => {
    alterarMenu(botao.getAttribute('aria-expanded') !== 'true');
  });

  navegacao.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) alterarMenu(false);
  });

  document.addEventListener('keydown', (evento) => {
    const deveFechar = evento.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true';
    if (!deveFechar) return;
    alterarMenu(false);
    botao.focus();
  });

  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.cabecalho')) alterarMenu(false);
  });

  telaAmpla.addEventListener('change', () => alterarMenu(false));
}

// ========================================
// 3. SELEÇÃO DE MATERIAIS
// ========================================

function animarTrocaMaterial() {
  gsap.fromTo(
    '.amostra',
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: duracao(0.8), ease: 'expo.out' },
  );
  gsap.fromTo(
    '.material-ficha > *',
    { y: 14, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: duracao(0.6), stagger: duracao(0.05), ease: 'expo.out' },
  );
}

function preencherMaterial(chave, indice) {
  const material = materiais[chave];
  const painel = document.querySelector('.material-painel');

  document
    .querySelector('.materiais')
    .style.setProperty('--cor-material', `var(--${material.cor})`);
  painel.querySelector('.amostra').dataset.amostra = chave;
  document.querySelector('#material-etiqueta').textContent = material.etiqueta;
  document.querySelector('#material-titulo').textContent = material.titulo;
  document.querySelector('#material-orientacao').textContent = material.orientacao;
  document.querySelector('#material-hex').textContent = material.hex;
  document.querySelector('#material-icone use').setAttribute('href', `#icone-${material.icone}`);
}

export function iniciarMateriais() {
  const seletor = document.querySelector('.materiais-seletor');
  const botoes = [...seletor.querySelectorAll('[data-material]')];

  seletor.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-material]');
    if (!botao || botao.classList.contains('selecionado')) return;

    botoes.forEach((opcao) => {
      const selecionado = opcao === botao;
      opcao.classList.toggle('selecionado', selecionado);
      opcao.setAttribute('aria-pressed', String(selecionado));
    });

    preencherMaterial(botao.dataset.material, botoes.indexOf(botao));
    animarTrocaMaterial();
  });
}

// ========================================
// 4. MAPA ILUSTRATIVO E NAVEGAÇÃO DAS PRÉVIAS
// ========================================

export function iniciarMapa() {
  const filtros = document.querySelectorAll('[data-filtro]');
  const pinos = [...document.querySelectorAll('[data-categoria]')];
  const total = document.querySelector('#mapa-total');

  filtros.forEach((botao) => {
    botao.addEventListener('click', () => {
      const categoria = botao.dataset.filtro;
      filtros.forEach((opcao) => {
        const selecionado = opcao === botao;
        opcao.classList.toggle('ativo', selecionado);
        opcao.setAttribute('aria-pressed', String(selecionado));
      });

      pinos.forEach((pino) => {
        pino.hidden = categoria !== 'todos' && pino.dataset.categoria !== categoria;
      });

      const visiveis = pinos.filter((pino) => !pino.hidden).length;
      total.textContent = `${visiveis} ${visiveis === 1 ? 'ponto' : 'pontos'}`;
      avisar(`Mapa ilustrativo: ${total.textContent} com o filtro ${botao.textContent.trim()}.`);
    });
  });
}

export function iniciarExperiencia() {
  const botoes = [...document.querySelectorAll('[data-tela]')];
  const telas = [...document.querySelectorAll('.tela-aplicativo')];
  const abas = [...document.querySelectorAll('[data-aba]')];
  let telaAtual = botoes.find((botao) => botao.classList.contains('selecionado'))?.dataset.tela;

  const mostrarTela = (nome) => {
    if (telaAtual === nome) return;
    telaAtual = nome;
    telas.forEach((tela) => {
      tela.hidden = tela.id !== `previa-${nome}`;
    });
    botoes.forEach((botao) => {
      const selecionado = botao.dataset.tela === nome;
      botao.classList.toggle('selecionado', selecionado);
      botao.setAttribute('aria-pressed', String(selecionado));
    });
    abas.forEach((aba) => aba.classList.toggle('ativa', aba.dataset.aba === nome));
  };

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      mostrarTela(botao.dataset.tela);
      avisar(`Prévia: ${botao.querySelector('strong').textContent}`);
    });
  });

  return mostrarTela;
}

// ========================================
// 5. PASSEIO PELA MAQUETE: TEMA E CARTÃO DA PARADA
// ========================================

const frasesDoPasseio = {
  visao: 'Sua cidade, em pontos de coleta.',
  giro: 'Cada cor, um material.',
  mapa: 'E tudo isso cabe no seu bolso.',
};

const paradas = {
  papel: { frase: 'Papel vai no azul.', lixeira: 'Lixeira azul · Papel' },
  plastico: { frase: 'Plástico vai no vermelho.', lixeira: 'Lixeira vermelha · Plástico' },
  vidro: { frase: 'Vidro vai no verde.', lixeira: 'Lixeira verde · Vidro' },
  metal: { frase: 'Metal vai no amarelo.', lixeira: 'Lixeira amarela · Metal' },
};

function preencherParada(cartao, chave) {
  const material = materiais[chave];
  cartao.style.setProperty('--cor', `var(--${material.cor})`);
  cartao.querySelector('.parada-icone use').setAttribute('href', `#icone-${material.icone}`);
  cartao.querySelector('.parada-etiqueta').textContent = paradas[chave].lixeira;
  cartao.querySelector('.parada-titulo').textContent = material.titulo;
  cartao.querySelector('.parada-texto').textContent = material.orientacao;
}

export function criarPasseio() {
  const palco = document.querySelector('.abertura-palco');
  const frase = document.querySelector('.passeio-frase');
  const cartao = document.querySelector('.parada-cartao');

  return ({ etapa, categoria }) => {
    const ehParada = Boolean(categoria);
    palco.dataset.tema = ehParada ? categoria : etapa === 'mapa' ? 'mapa' : '';
    cartao.classList.toggle('visivel', ehParada);
    frase.textContent = ehParada ? paradas[categoria].frase : frasesDoPasseio[etapa];
    if (ehParada) preencherParada(cartao, categoria);
    gsap.fromTo(
      frase,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: duracao(0.6), ease: 'power3.out', overwrite: true },
    );
  };
}

// ========================================
// 6. MAQUETE DO TOPO: LEGENDA DO PINO
// ========================================

export function criarLegendaDePino() {
  const legenda = document.querySelector('.aviso-pino');
  let nomeAtual = '';

  return (pino) => {
    legenda.classList.toggle('visivel', Boolean(pino));
    if (!pino) {
      nomeAtual = '';
      return;
    }
    legenda.style.setProperty('--cor', pino.cor);
    legenda.style.translate = `${pino.x}px ${pino.y}px`;
    if (pino.nome === nomeAtual) return;
    nomeAtual = pino.nome;
    legenda.textContent = `${pino.nome} · ponto ilustrativo`;
  };
}
