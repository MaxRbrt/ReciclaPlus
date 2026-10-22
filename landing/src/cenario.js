import {
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Line,
  LineDashedMaterial,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFShadowMap,
  Raycaster,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { criarMaquete, descartarMaquete } from './maquete3d.js';

export { carregarModelos } from './maquete3d.js';

// ========================================
// 1. ROTEIRO DA CÂMERA AO LONGO DA ROLAGEM
// ========================================

const DISTANCIA = 60;
const DURACAO_PREDIO = 1.1;
const ATRASO_MAXIMO = 0.9;
const INICIO_PINOS = 1.3;
const INICIO_PARADAS = 0.24;
const DURACAO_PARADA = 0.14;
const TOTAL_PARADAS = 4;
const COR_ARGILA = new Color('#dcd7cd');
const COR_BASE = new Color('#5b625e');

const suavizar = (valor) => valor * valor * (3 - 2 * valor);
const desacelerar = (valor) => (valor >= 1 ? 1 : 1 - 2 ** (-10 * valor));

function criarRoteiro(pinos) {
  const centro = new Vector3(0, 0, 0);
  const quadros = [
    { p: 0, azimute: 45, elevacao: 34, zoom: 1, alvo: centro, parada: -1 },
    { p: 0.12, azimute: 100, elevacao: 30, zoom: 1.05, alvo: centro, parada: -1 },
    { p: 0.22, azimute: 160, elevacao: 32, zoom: 1, alvo: centro, parada: -1 },
  ];

  for (let indice = 0; indice < TOTAL_PARADAS; indice += 1) {
    const inicio = INICIO_PARADAS + indice * DURACAO_PARADA;
    const alvo = pinos[indice].position.clone().setY(1);
    const azimute = 200 + indice * 55;
    quadros.push({ p: inicio + 0.05, azimute, elevacao: 52, zoom: 2.5, alvo, parada: indice });
    quadros.push({
      p: inicio + 0.12,
      azimute: azimute + 16,
      elevacao: 56,
      zoom: 2.75,
      alvo,
      parada: indice,
    });
  }

  quadros.push({ p: 0.86, azimute: 380, elevacao: 60, zoom: 0.95, alvo: centro, parada: -1 });
  quadros.push({ p: 1, azimute: 360, elevacao: 89, zoom: 0.78, alvo: centro, parada: -1 });
  return quadros;
}

function lerQuadro(quadros, progresso, saida) {
  const indice = Math.max(0, quadros.findIndex((quadro) => quadro.p > progresso) - 1);
  const atual = quadros[indice];
  const proximo = quadros[Math.min(indice + 1, quadros.length - 1)];
  const intervalo = Math.max(proximo.p - atual.p, 0.0001);
  const avanco = suavizar(MathUtils.clamp((progresso - atual.p) / intervalo, 0, 1));

  saida.azimute = MathUtils.lerp(atual.azimute, proximo.azimute, avanco);
  saida.elevacao = MathUtils.lerp(atual.elevacao, proximo.elevacao, avanco);
  saida.zoom = MathUtils.lerp(atual.zoom, proximo.zoom, avanco);
  saida.alvo.lerpVectors(atual.alvo, proximo.alvo, avanco);
  saida.parada = avanco > 0.35 ? proximo.parada : atual.parada;
  return saida;
}

function etapaDoProgresso(progresso, parada) {
  if (parada >= 0) return `parada-${parada}`;
  if (progresso >= 0.86) return 'mapa';
  if (progresso >= 0.1) return 'giro';
  return 'visao';
}

// ========================================
// 2. ROTA TRACEJADA ATÉ O PONTO E MARCADOR "VOCÊ"
// ========================================

function criarRota(destino, esquina, cor) {
  const pontos = [];
  const curva = [
    new Vector3(0, 0.1, 0),
    new Vector3(esquina.x, 0.1, 0),
    new Vector3(esquina.x, 0.1, esquina.z),
    new Vector3(destino.x, 0.1, destino.z),
  ];

  for (let trecho = 0; trecho < curva.length - 1; trecho += 1) {
    for (let passo = 0; passo <= 40; passo += 1) {
      pontos.push(new Vector3().lerpVectors(curva[trecho], curva[trecho + 1], passo / 40));
    }
  }

  const geometria = new BufferGeometry().setFromPoints(pontos);
  const material = new LineDashedMaterial({ color: cor, dashSize: 0.28, gapSize: 0.18 });
  const linha = new Line(geometria, material);
  linha.computeLineDistances();
  linha.visible = false;
  return linha;
}

function criarMarcadorVoce() {
  const grupo = new Mesh(
    new CircleGeometry(0.34, 32).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({ color: '#ffffff' }),
  );
  const anel = new Mesh(
    new RingGeometry(0.34, 0.5, 32).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({ color: '#2e7d32' }),
  );
  grupo.position.y = 0.06;
  anel.position.y = 0.001;
  grupo.add(anel);
  grupo.visible = false;
  return grupo;
}

// ========================================
// 3. CONSTRUÇÃO, PINOS E ARGILA TINGIDA
// ========================================

function erguerPredios(predios, tempo) {
  predios.forEach((predio) => {
    const inicio = predio.userData.atraso * ATRASO_MAXIMO;
    const avanco = desacelerar(MathUtils.clamp((tempo - inicio) / DURACAO_PREDIO, 0, 1));
    predio.scale.y = Math.max(0.001, avanco);
  });
}

function animarPinos(pinos, contexto) {
  const { tempo, construcao, parada, destacado } = contexto;

  pinos.forEach((pino, indice) => {
    const inicio = INICIO_PINOS + indice * 0.07;
    const entrada = desacelerar(MathUtils.clamp((construcao - inicio) / 0.8, 0, 1));
    const emFoco = indice === parada || pino === destacado;
    const apagado = parada >= 0 && indice !== parada;
    const { haste: lixeira, tampa, escalaBase, cabeca: marcador, cor, sombra } = pino.userData;
    const escalaAlvo = escalaBase * (emFoco ? 1.4 : 1) * entrada;
    const escalaLixeira = MathUtils.lerp(lixeira.scale.x, escalaAlvo, 0.12);

    tampa.rotation.x = MathUtils.lerp(tampa.rotation.x, emFoco ? -1.15 : 0, 0.08);
    lixeira.position.y =
      (pino.userData.ecoponto ? 0.06 : 0) + (emFoco ? Math.abs(Math.sin(tempo * 3)) * 0.12 : 0);

    cor.opacity = MathUtils.lerp(cor.opacity, apagado ? 0.2 : 1, 0.1);
    sombra.opacity = MathUtils.lerp(sombra.opacity, apagado ? 0.05 : emFoco ? 0.55 : 0.25, 0.1);
    lixeira.scale.setScalar(Math.max(0.001, escalaLixeira));
    marcador.position.y = (emFoco ? 5 : 4.4) * entrada + Math.sin(tempo * 1.6 + indice) * 0.12;
    marcador.rotation.y = tempo * (emFoco ? 2.2 : 0.9) + indice;
    marcador.scale.setScalar(Math.max(0.001, entrada * (emFoco ? 2.1 : 1.5)));
    pino.visible = entrada > 0.001;
  });
}

function atualizarRotas(rotas, marcador, progresso, parada) {
  rotas.forEach((rota, indice) => {
    const inicio = INICIO_PARADAS + indice * DURACAO_PARADA + 0.03;
    const desenho = MathUtils.clamp((progresso - inicio) / 0.07, 0, 1);
    const total = rota.geometry.attributes.position.count;
    rota.visible = indice === parada && desenho > 0;
    rota.geometry.setDrawRange(0, Math.max(2, Math.round(total * desenho)));
  });
  marcador.visible = parada >= 0;
}

// ========================================
// 4. CENÁRIO COM PAUSA, DESTAQUE E DESCARTE
// ========================================

export function iniciarCenario(elemento, { palco, modelos, aoDestacarPino, aoMudarEtapa }) {
  let renderizador;

  try {
    renderizador = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }

  const estreita = window.matchMedia('(max-width: 760px)').matches;
  const maquete = criarMaquete({ colunas: estreita ? 6 : 8, linhas: estreita ? 6 : 8, modelos });
  const roteiro = criarRoteiro(maquete.pinos);
  const rotas = maquete.pinos
    .slice(0, TOTAL_PARADAS)
    .map((pino) => criarRota(pino.position, pino.userData.esquina, pino.userData.cor));
  const marcador = criarMarcadorVoce();
  const argila = maquete.recursos.calcada;
  const base = maquete.recursos.asfalto;
  const corAlvo = new Color();
  const corPino = new Color();
  const corBaseAlvo = new Color();
  const cena = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const raio = new Raycaster();
  const ponteiro = new Vector2();
  const giro = new Vector2();
  const giroAlvo = new Vector2();
  const projecao = new Vector3();
  const quadro = { azimute: 45, elevacao: 34, zoom: 1, alvo: new Vector3(), parada: -1 };
  const eventos = new AbortController();
  const alvosToque = maquete.pinos.flatMap((pino) => pino.userData.alvosToque);
  const contexto = { tempo: 0, construcao: 0, progresso: 0, parada: -1, destacado: null };
  let progressoAlvo = 0;
  let zoomBase = 1;
  let visivel = false;
  let contextoPerdido = false;
  let tempoAnterior = 0;
  let ponteiroMudou = false;
  let fixado = null;
  let construindo = false;
  let etapaAtual = '';

  rotas.forEach((rota) => maquete.grupo.add(rota));
  maquete.grupo.add(marcador);
  cena.add(maquete.grupo);
  cena.add(new HemisphereLight('#ffffff', '#d8d1c4', 1.5));

  const sol = new DirectionalLight('#fff4e6', 2.1);
  sol.position.set(14, 24, 6);
  sol.castShadow = !estreita;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
  sol.shadow.bias = -0.0006;
  cena.add(sol);

  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, estreita ? 1.5 : 2));
  renderizador.outputColorSpace = SRGBColorSpace;
  renderizador.shadowMap.enabled = !estreita;
  renderizador.shadowMap.type = PCFShadowMap;
  renderizador.setClearColor(0x000000, 0);
  elemento.append(renderizador.domElement);

  const recalcular = () => {
    const area = elemento.getBoundingClientRect();
    const alvoPalco = palco.getBoundingClientRect();
    const centroX = alvoPalco.left - area.left + alvoPalco.width / 2;
    const centroY = alvoPalco.top - area.top + alvoPalco.height / 2;

    Object.assign(camera, {
      left: -area.width / 2,
      right: area.width / 2,
      top: area.height / 2,
      bottom: -area.height / 2,
    });
    camera.setViewOffset(
      area.width,
      area.height,
      area.width / 2 - centroX,
      area.height / 2 - centroY,
      area.width,
      area.height,
    );
    zoomBase = Math.min(alvoPalco.width, alvoPalco.height * 1.5) / (maquete.largura * 1.5);
    renderizador.setSize(area.width, area.height, false);
  };

  const posicionarCamera = () => {
    const azimute = MathUtils.degToRad(quadro.azimute + giro.x * 8);
    const elevacao = MathUtils.degToRad(MathUtils.clamp(quadro.elevacao + giro.y * 4, 10, 89.5));

    camera.position.set(
      quadro.alvo.x + Math.cos(elevacao) * Math.sin(azimute) * DISTANCIA,
      quadro.alvo.y + Math.sin(elevacao) * DISTANCIA,
      quadro.alvo.z + Math.cos(elevacao) * Math.cos(azimute) * DISTANCIA,
    );
    camera.lookAt(quadro.alvo);
    camera.zoom = zoomBase * quadro.zoom;
    camera.updateProjectionMatrix();
  };

  const tingirArgila = () => {
    const pino = maquete.pinos[contexto.parada];
    corAlvo.copy(COR_ARGILA);
    corBaseAlvo.copy(COR_BASE);
    if (pino) {
      corPino.set(pino.userData.cor);
      corAlvo.lerp(corPino, 0.18);
      corBaseAlvo.lerp(corPino, 0.12);
    }
    argila.color.lerp(corAlvo, 0.06);
    base.color.lerp(corBaseAlvo, 0.06);
  };

  const anunciar = (pino) => {
    if (!pino) {
      aoDestacarPino(null);
      return;
    }
    const area = elemento.getBoundingClientRect();
    pino.userData.cabeca.getWorldPosition(projecao).project(camera);
    aoDestacarPino({
      nome: pino.userData.nome,
      cor: pino.userData.cor,
      x: ((projecao.x + 1) / 2) * area.width,
      y: ((1 - projecao.y) / 2) * area.height,
    });
  };

  const informarEtapa = () => {
    const etapa = etapaDoProgresso(contexto.progresso, contexto.parada);
    if (etapa === etapaAtual) return;
    etapaAtual = etapa;
    const pino = maquete.pinos[contexto.parada];
    aoMudarEtapa({ etapa, categoria: pino ? pino.userData.chave : null });
  };

  const encontrarPino = () => {
    raio.setFromCamera(ponteiro, camera);
    const [toque] = raio.intersectObjects(alvosToque, false);
    return toque ? toque.object.userData.pino : null;
  };

  const animar = (tempo) => {
    const intervalo = tempoAnterior ? Math.min((tempo - tempoAnterior) / 1000, 0.05) : 0;
    tempoAnterior = tempo;
    contexto.tempo += intervalo;
    if (construindo) contexto.construcao += intervalo;
    contexto.progresso += (progressoAlvo - contexto.progresso) * Math.min(1, intervalo * 5);
    giro.lerp(giroAlvo, Math.min(1, intervalo * 3));

    lerQuadro(roteiro, contexto.progresso, quadro);
    contexto.parada = quadro.parada;

    if (ponteiroMudou) {
      ponteiroMudou = false;
      const encontrado = encontrarPino() ?? fixado;
      if (!encontrado) anunciar(null);
      contexto.destacado = encontrado;
      elemento.parentElement.classList.toggle('sobre-pino', Boolean(encontrado));
    }

    posicionarCamera();
    tingirArgila();
    erguerPredios(maquete.predios, contexto.construcao);
    animarPinos(maquete.pinos, contexto);
    atualizarRotas(rotas, marcador, contexto.progresso, contexto.parada);
    renderizador.render(cena, camera);
    informarEtapa();
    if (contexto.destacado) anunciar(contexto.destacado);
  };

  const atualizarAtividade = () => {
    const deveAnimar = visivel && !document.hidden && !contextoPerdido;
    tempoAnterior = 0;
    renderizador.setAnimationLoop(deveAnimar ? animar : null);
  };

  const lerPonteiro = (evento) => {
    const area = elemento.getBoundingClientRect();
    ponteiro.set(
      ((evento.clientX - area.left) / area.width) * 2 - 1,
      -((evento.clientY - area.top) / area.height) * 2 + 1,
    );
    return evento.clientY >= area.top && evento.clientY <= area.bottom;
  };

  const acompanharPonteiro = (evento) => {
    if (evento.pointerType !== 'mouse' || !lerPonteiro(evento)) return;
    giroAlvo.set(
      MathUtils.clamp((evento.clientX / window.innerWidth - 0.5) * 2, -1, 1),
      MathUtils.clamp((evento.clientY / window.innerHeight - 0.5) * 2, -1, 1),
    );
    ponteiroMudou = true;
  };

  const tocar = (evento) => {
    const alvoInterativo = evento.target.closest('a, button, summary');
    if (alvoInterativo || !lerPonteiro(evento)) return;
    fixado = encontrarPino();
    contexto.destacado = fixado;
    anunciar(fixado);
  };

  const perderContexto = (evento) => {
    evento.preventDefault();
    contextoPerdido = true;
    atualizarAtividade();
  };

  const restaurarContexto = () => {
    contextoPerdido = false;
    recalcular();
    atualizarAtividade();
  };

  const observadorTamanho = new ResizeObserver(recalcular);
  const observadorVisibilidade = new IntersectionObserver(([registro]) => {
    visivel = registro.isIntersecting;
    atualizarAtividade();
  });
  const opcoes = { passive: true, signal: eventos.signal };

  observadorTamanho.observe(elemento);
  observadorVisibilidade.observe(elemento);
  window.addEventListener('pointermove', acompanharPonteiro, opcoes);
  window.addEventListener('pointerdown', tocar, opcoes);
  document.addEventListener('visibilitychange', atualizarAtividade, opcoes);
  renderizador.domElement.addEventListener('webglcontextlost', perderContexto, {
    signal: eventos.signal,
  });
  renderizador.domElement.addEventListener('webglcontextrestored', restaurarContexto, opcoes);
  recalcular();

  return {
    recalcular,
    construir: () => {
      construindo = true;
    },
    definirProgresso: (valor) => {
      progressoAlvo = valor;
    },
    encerrar: () => {
      eventos.abort();
      observadorTamanho.disconnect();
      observadorVisibilidade.disconnect();
      renderizador.setAnimationLoop(null);
      elemento.parentElement.classList.remove('sobre-pino');
      aoDestacarPino(null);
      rotas.forEach((rota) => {
        rota.geometry.dispose();
        rota.material.dispose();
      });
      marcador.traverse((parte) => {
        parte.geometry?.dispose();
        parte.material?.dispose();
      });
      descartarMaquete(maquete);
      cena.clear();
      renderizador.dispose();
      renderizador.domElement.remove();
    },
  };
}
