import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ========================================
// 1. CONSTANTES DE MOVIMENTO
// ========================================

const CHEGADA = 'power3.out';
const SEMPRE = '(min-width: 0px)';
const MOVIMENTO_LIVRE = '(prefers-reduced-motion: no-preference)';
const PONTEIRO_FINO =
  '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';
const METODO_FIXO =
  '(min-width: 961px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)';
const TOUR_SOLTO =
  '(prefers-reduced-motion: no-preference) and (max-width: 960px), (prefers-reduced-motion: no-preference) and (max-height: 719px)';
const TELAS_DO_METODO = ['mapa', 'detalhe', 'comunidade'];
const INICIO_DA_MAQUETE = 0.04;
const INICIO_DO_PASSEIO = 0.08;

// ========================================
// 2. ABERTURA: FLORESTA QUE VIRA MAQUETE
// ========================================

function animarEntrada() {
  gsap
    .timeline({ defaults: { ease: CHEGADA, duration: 1.1 } })
    .from('.abertura-marca', { y: 20, autoAlpha: 0 })
    .from('.abertura-titulo .linha', { y: 50, autoAlpha: 0, stagger: 0.12 }, 0.1)
    .from('.abertura-descricao, .abertura-acoes', { y: 24, autoAlpha: 0, stagger: 0.1 }, 0.4)
    .from('.abertura-foto img', { scale: 1.08, duration: 2.4, ease: 'power2.out' }, 0);
}

function conduzirAbertura({ aoRolarAbertura, aoRevelarMaquete }) {
  let revelada = false;
  const linha = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.abertura',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (gatilho) => {
        const progresso = gatilho.progress;
        aoRolarAbertura(gsap.utils.clamp(0, 1, (progresso - INICIO_DO_PASSEIO) / 0.86));
        if (revelada || progresso < INICIO_DA_MAQUETE) return;
        revelada = true;
        aoRevelarMaquete();
      },
    },
  });

  linha
    .to('.abertura-texto', { y: -90, autoAlpha: 0, duration: 0.04 }, 0.01)
    .to('.abertura-foto', { scale: 1.2, autoAlpha: 0, duration: 0.06 }, 0.02)
    .to('.cenario', { autoAlpha: 1, duration: 0.03 }, 0.05)
    .fromTo('.passeio-camada', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.07)
    .fromTo(
      '.abertura-legenda',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.04 },
      0.9,
    )
    .to({}, { duration: 0.06 }, 0.94);
}

// ========================================
// 3. COMO FUNCIONA: TELAS TROCANDO COM A ROLAGEM
// ========================================

function conduzirMetodo(mostrarTela) {
  const gatilho = { trigger: '.metodo', start: 'top top', end: 'bottom bottom' };

  ScrollTrigger.create({
    ...gatilho,
    onUpdate: (registro) => {
      const indice = Math.min(2, Math.floor(registro.progress * 3));
      mostrarTela(TELAS_DO_METODO[indice]);
    },
  });
  gsap.to('.metodo-progresso > span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { ...gatilho, scrub: true },
  });
  gsap.fromTo(
    '.metodo .aparelho',
    { y: 40 },
    { y: -40, ease: 'none', scrollTrigger: { ...gatilho, scrub: 0.8 } },
  );
}

// ========================================
// 4. TÍTULOS, BLOCOS, CARTÕES E NÚMEROS
// ========================================

function revelarTitulos() {
  gsap.utils.toArray('.titulo-revelar').forEach((titulo) => {
    gsap.from(titulo, {
      y: 48,
      autoAlpha: 0,
      duration: 1.1,
      ease: CHEGADA,
      scrollTrigger: { trigger: titulo, start: 'top 88%', once: true },
    });
  });
}

function revelarBlocos() {
  ScrollTrigger.batch('.revelar', {
    start: 'top 90%',
    once: true,
    onEnter: (elementos) =>
      gsap.from(elementos, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: CHEGADA }),
  });
}

function revelarTour() {
  gsap.utils.toArray('.tour-tela').forEach((tela) => {
    gsap.from(tela.querySelectorAll('.tour-aparelho, .destaque-tela'), {
      y: 40,
      autoAlpha: 0,
      duration: 1,
      stagger: 0.1,
      ease: CHEGADA,
      scrollTrigger: { trigger: tela, start: 'top 80%', once: true },
    });
  });
}

function conduzirTour() {
  const telas = gsap.utils.toArray('.tour-tela');
  const contador = document.querySelector('.tour-contador b');
  const linha = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '.tour',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (gatilho) => {
        const indice = Math.min(telas.length - 1, Math.floor(gatilho.progress * telas.length));
        contador.textContent = String(indice + 1).padStart(2, '0');
      },
    },
  });

  telas.forEach((tela, indice) => {
    const inicio = indice;
    const destaques = tela.querySelectorAll('.destaque-tela');
    const texto = tela.querySelector('.tour-texto');
    const ultima = indice === telas.length - 1;

    if (indice > 0) {
      linha.fromTo(
        tela,
        { autoAlpha: 0, yPercent: 14, scale: 0.9 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.3 },
        inicio,
      );
    }
    linha.fromTo(
      texto,
      { x: -40, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.2 },
      inicio + 0.1,
    );
    linha.fromTo(
      destaques,
      { autoAlpha: 0, scale: 0.85 },
      { autoAlpha: 1, scale: 1, duration: 0.2, stagger: 0.08 },
      inicio + 0.2,
    );
    if (ultima) return;
    linha.to(tela, { autoAlpha: 0, scale: 0.94, yPercent: -8, duration: 0.25 }, inicio + 0.8);
  });

  gsap.to('.tour-progresso > span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.tour', start: 'top top', end: 'bottom bottom', scrub: true },
  });
}

function contarNumeros() {
  gsap.utils.toArray('.contador').forEach((contador) => {
    const valor = { atual: 0 };
    gsap.to(valor, {
      atual: Number(contador.dataset.valor),
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: contador, start: 'top 90%', once: true },
      onUpdate: () => {
        contador.textContent = String(Math.round(valor.atual));
      },
    });
  });
}

// ========================================
// 5. TRANSIÇÕES DAS FOTOGRAFIAS
// ========================================

function abrirCirculoDosMateriais() {
  const rolagem = {
    trigger: '.mascara-circulo',
    start: 'top 90%',
    end: 'center 55%',
    scrub: 0.6,
  };

  gsap.fromTo(
    '.mascara-circulo',
    { clipPath: 'circle(16% at 50% 55%)' },
    { clipPath: 'circle(76% at 50% 50%)', ease: 'none', scrollTrigger: rolagem },
  );
  gsap.fromTo(
    '.mascara-circulo img',
    { scale: 1.35 },
    { scale: 1, ease: 'none', scrollTrigger: rolagem },
  );
}

function expandirComunidade() {
  const imagem = document.querySelector('.expansor-imagem');
  const recorteInicial = getComputedStyle(imagem).clipPath;
  const linha = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.comunidade', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });

  linha
    .fromTo(
      imagem,
      { clipPath: recorteInicial },
      { clipPath: 'inset(0% 0% round 0px)', duration: 0.55 },
      0,
    )
    .fromTo('.expansor-imagem img', { scale: 1.18 }, { scale: 1, duration: 0.55 }, 0)
    .fromTo(
      '.expansor-texto',
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.25 },
      0.55,
    )
    .to({}, { duration: 0.2 }, 0.8);
}

function deslizarBroto() {
  gsap.fromTo(
    '.renovacao-imagem img',
    { yPercent: -7 },
    {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: '.renovacao', start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

// ========================================
// 5B. SEPARAÇÃO GUIADA PELA ROLAGEM
// Cada item voa até a lixeira certa; a tampa
// abre na chegada e o contador acompanha.
// ========================================

function deslocamentoAte(item, alvo) {
  const origem = item.getBoundingClientRect();
  const destino = alvo.getBoundingClientRect();
  return {
    x: destino.left + destino.width / 2 - (origem.left + origem.width / 2),
    y: destino.top + destino.height * 0.25 - (origem.top + origem.height / 2),
  };
}

function contarSeparados(contagens, total) {
  const porLixeira = {};
  let soma = 0;
  contagens.forEach((chegou, item) => {
    if (!chegou) return;
    const chave = item.dataset.lixeira;
    porLixeira[chave] = (porLixeira[chave] ?? 0) + 1;
    soma += 1;
  });
  document.querySelectorAll('.lixeira-cena').forEach((lixeira) => {
    lixeira.querySelector('.lixeira-contagem').textContent = String(
      porLixeira[lixeira.dataset.lixeira] ?? 0,
    );
  });
  total.textContent = String(soma);
}

function conduzirSeparacao() {
  const itens = gsap.utils.toArray('.separar-item');
  const total = document.querySelector('#separar-total');
  const contagens = new Map(itens.map((item) => [item, false]));
  const linha = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.separar',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true,
    },
  });

  itens.forEach((item, indice) => {
    const lixeira = document.querySelector(`.lixeira-cena[data-lixeira="${item.dataset.lixeira}"]`);
    const tampa = lixeira.querySelector('.lixeira-cena-tampa');
    const marcar = (chegou) => () => {
      contagens.set(item, chegou);
      contarSeparados(contagens, total);
    };

    linha
      .to(tampa, { rotation: -55, duration: 0.25, ease: 'power2.out' }, indice)
      .to(
        item,
        { x: () => deslocamentoAte(item, lixeira).x, duration: 0.7, ease: 'power1.inOut' },
        indice,
      )
      .to(
        item,
        { y: () => deslocamentoAte(item, lixeira).y, duration: 0.7, ease: 'back.in(1.4)' },
        indice,
      )
      .to(
        item,
        {
          scale: 0.35,
          autoAlpha: 0,
          duration: 0.2,
          onComplete: marcar(true),
          onReverseComplete: marcar(false),
        },
        indice + 0.6,
      )
      .to(tampa, { rotation: 0, duration: 0.25, ease: 'back.out(3)' }, indice + 0.75)
      .fromTo(lixeira, { y: 0 }, { y: -10, duration: 0.12, yoyo: true, repeat: 1 }, indice + 0.75);
  });
}

// ========================================
// 6. BOTÕES MAGNÉTICOS
// ========================================

function atrairBotoes() {
  const remocoes = gsap.utils.toArray('.magnetico').map((botao) => {
    const moverX = gsap.quickTo(botao, 'x', { duration: 0.6, ease: 'power3' });
    const moverY = gsap.quickTo(botao, 'y', { duration: 0.6, ease: 'power3' });

    const mover = (evento) => {
      const area = botao.getBoundingClientRect();
      moverX((evento.clientX - area.left - area.width / 2) * 0.15);
      moverY((evento.clientY - area.top - area.height / 2) * 0.2);
    };
    const soltar = () => {
      moverX(0);
      moverY(0);
    };

    botao.addEventListener('pointermove', mover);
    botao.addEventListener('pointerleave', soltar);
    return () => {
      botao.removeEventListener('pointermove', mover);
      botao.removeEventListener('pointerleave', soltar);
    };
  });

  return () => remocoes.forEach((remover) => remover());
}

// ========================================
// 7. CABEÇALHO E INICIALIZAÇÃO
// ========================================

function iniciarCabecalho() {
  ScrollTrigger.create({
    start: 20,
    end: 'max',
    toggleClass: { targets: '.cabecalho', className: 'rolado' },
  });
}

export function iniciarAnimacoes({ aoRolarAbertura, aoRevelarMaquete, mostrarTela }) {
  const preferencias = gsap.matchMedia();

  preferencias.add(SEMPRE, iniciarCabecalho);

  preferencias.add(MOVIMENTO_LIVRE, () => {
    animarEntrada();
    conduzirAbertura({ aoRolarAbertura, aoRevelarMaquete });
    revelarTitulos();
    revelarBlocos();
    contarNumeros();
    abrirCirculoDosMateriais();
    expandirComunidade();
    deslizarBroto();
    conduzirSeparacao();
  });

  preferencias.add(PONTEIRO_FINO, atrairBotoes);
  preferencias.add(METODO_FIXO, () => {
    conduzirMetodo(mostrarTela);
    conduzirTour();
  });
  preferencias.add(TOUR_SOLTO, revelarTour);

  return () => preferencias.revert();
}

export function aoAtualizarRolagem(acao) {
  ScrollTrigger.addEventListener('refresh', acao);
  return () => ScrollTrigger.removeEventListener('refresh', acao);
}
