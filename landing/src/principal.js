import '@fontsource-variable/inter';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import './estilos.css';
import { aoAtualizarRolagem, iniciarAnimacoes } from './animacoes.js';
import {
  criarLegendaDePino,
  criarPasseio,
  iniciarExperiencia,
  iniciarMapa,
  iniciarMateriais,
  iniciarMenu,
} from './interacoes.js';

// ========================================
// 1. MAQUETE 3D CARREGADA SOB DEMANDA
// ========================================

function prepararCenario(estado) {
  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const abertura = document.querySelector('.abertura');
  const aoDestacarPino = criarLegendaDePino();
  const aoMudarEtapa = criarPasseio();
  let versao = 0;

  const desligar = () => {
    estado.cenario?.encerrar();
    estado.cenario = null;
    abertura.classList.remove('com-3d');
  };

  const atualizarCenario = async () => {
    versao += 1;
    const versaoAtual = versao;
    desligar();
    if (movimentoReduzido.matches) return;

    try {
      const { iniciarCenario, carregarModelos } = await import('./cenario.js');
      const modelos = await carregarModelos(`${import.meta.env.BASE_URL}modelos/cidade`);
      if (versaoAtual !== versao) return;
      estado.cenario = iniciarCenario(document.querySelector('.cenario'), {
        palco: document.querySelector('.palco-maquete'),
        modelos,
        aoDestacarPino,
        aoMudarEtapa,
      });
      estado.cenario?.definirProgresso(estado.progresso);
      if (estado.revelada) estado.cenario?.construir();
      abertura.classList.toggle('com-3d', Boolean(estado.cenario));
    } catch {
      desligar();
    }
  };

  movimentoReduzido.addEventListener('change', atualizarCenario);
  atualizarCenario();

  return () => {
    versao += 1;
    movimentoReduzido.removeEventListener('change', atualizarCenario);
    desligar();
  };
}

// ========================================
// 2. INICIALIZAÇÃO E CICLO DE VIDA DA PÁGINA
// ========================================

const raiz = document.documentElement;
const estadoCenario = { cenario: null, progresso: 0, revelada: false };
const mostrarTela = iniciarExperiencia();
let encerrarAnimacoes;
let encerrarCenario;
let pararRecalculo;

function aoRolarAbertura(progresso) {
  estadoCenario.progresso = progresso;
  estadoCenario.cenario?.definirProgresso(progresso);
}

function aoRevelarMaquete() {
  estadoCenario.revelada = true;
  estadoCenario.cenario?.construir();
}

async function iniciarVisual() {
  encerrarCenario = prepararCenario(estadoCenario);
  pararRecalculo = aoAtualizarRolagem(() => estadoCenario.cenario?.recalcular());
  await document.fonts.ready;
  encerrarAnimacoes = iniciarAnimacoes({ aoRolarAbertura, aoRevelarMaquete, mostrarTela });
  raiz.classList.remove('animacao-pendente');
}

raiz.classList.add('animacao-pendente');
iniciarMenu();
iniciarMateriais();
iniciarMapa();
iniciarVisual();
document.querySelector('#ano').textContent = new Date().getFullYear();

window.addEventListener('pagehide', () => {
  encerrarAnimacoes?.();
  encerrarCenario?.();
  pararRecalculo?.();
});

window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) iniciarVisual();
});
