import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LatheGeometry,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ========================================
// 1. MEDIDAS DA CIDADE E CATEGORIAS DA COLETA
// ========================================

const TAMANHO_CELULA = 2;
const TAMANHO_QUADRA = 1.56;
const ALTURA_MARCADOR = 2.1;
const MODELOS_PREDIO = ['a', 'c', 'd', 'e', 'f', 'h'].map((letra) => `building-${letra}`);
const MODELOS_ALTOS = ['a', 'b', 'e'].map((letra) => `building-skyscraper-${letra}`);
const CORES_ECOPONTO = ['#1E5BD6', '#E2333F', '#1F9D55', '#F5B700'];

export const CATEGORIAS_PINO = [
  { chave: 'papel', nome: 'Papel', cor: '#1E5BD6' },
  { chave: 'plastico', nome: 'Plástico', cor: '#E2333F' },
  { chave: 'vidro', nome: 'Vidro', cor: '#1F9D55' },
  { chave: 'metal', nome: 'Metal', cor: '#F5B700' },
  { chave: 'baterias', nome: 'Pilhas e baterias', cor: '#F2711C' },
  { chave: 'eletronicos', nome: 'Eletrônicos', cor: '#6B7280' },
  { chave: 'oleo', nome: 'Óleo de cozinha', cor: '#8B5A2B' },
  { chave: 'roupas', nome: 'Roupas', cor: '#8E44AD' },
  { chave: 'outros', nome: 'Outros', cor: '#2E7D32' },
];

function criarSorteio(semente) {
  let estado = semente;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let valor = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    valor = (valor + Math.imul(valor ^ (valor >>> 7), 61 | valor)) ^ valor;
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

// ========================================
// 2. MODELOS DE PRÉDIO (CITY KIT, KENNEY, CC0)
// ========================================

async function carregarModelo(carregador, base, nome) {
  const arquivo = await carregador.loadAsync(`${base}/${nome}.glb`);
  const cena = arquivo.scene;
  const tamanho = new Box3().setFromObject(cena).getSize(new Vector3());

  cena.traverse((parte) => {
    if (!parte.isMesh) return;
    parte.castShadow = true;
    parte.receiveShadow = true;
  });
  return { cena, tamanho };
}

export async function carregarModelos(base) {
  const carregador = new GLTFLoader();
  const [predios, altos] = await Promise.all([
    Promise.all(MODELOS_PREDIO.map((nome) => carregarModelo(carregador, base, nome))),
    Promise.all(MODELOS_ALTOS.map((nome) => carregarModelo(carregador, base, nome))),
  ]);
  return { predios, altos };
}

// ========================================
// 3. SÍMBOLO DE RECICLAGEM E MATERIAIS
// ========================================

function criarTexturaSimbolo() {
  const tela = document.createElement('canvas');
  const desenho = tela.getContext('2d');
  tela.width = 128;
  tela.height = 128;
  desenho.fillStyle = '#ffffff';
  desenho.font = 'bold 104px sans-serif';
  desenho.textAlign = 'center';
  desenho.textBaseline = 'middle';
  desenho.fillText('♻', 64, 70);

  const textura = new CanvasTexture(tela);
  textura.colorSpace = SRGBColorSpace;
  return textura;
}

function criarRecursos() {
  const perfilCorpo = [
    [0, 0],
    [0.24, 0],
    [0.27, 0.04],
    [0.31, 0.66],
    [0.34, 0.7],
    [0.34, 0.74],
    [0, 0.74],
  ].map(([raio, altura]) => new Vector2(raio, altura));

  return {
    asfalto: new MeshStandardMaterial({ color: '#4f5753', roughness: 1 }),
    calcada: new MeshStandardMaterial({ color: '#e2ddd2', roughness: 1 }),
    gramado: new MeshStandardMaterial({ color: '#86bd5f', roughness: 1 }),
    concreto: new MeshStandardMaterial({ color: '#cfcac0', roughness: 0.95 }),
    tronco: new MeshStandardMaterial({ color: '#7a5a3c', roughness: 1 }),
    copa: new MeshStandardMaterial({ color: '#4c9a45', roughness: 0.85 }),
    borracha: new MeshStandardMaterial({ color: '#222826', roughness: 0.8 }),
    simbolo: new MeshStandardMaterial({
      map: criarTexturaSimbolo(),
      transparent: true,
      side: DoubleSide,
    }),
    faixa: new LineDashedMaterial({ color: '#f4f1e8', dashSize: 0.22, gapSize: 0.22 }),
    geometriaTronco: new CylinderGeometry(0.035, 0.05, 0.32, 6).translate(0, 0.16, 0),
    geometriaCopa: new SphereGeometry(0.2, 12, 10),
    geometriaCorpo: new LatheGeometry(perfilCorpo, 24),
    geometriaTampa: new CylinderGeometry(0.37, 0.37, 0.07, 24).translate(0, 0.035, 0.36),
    geometriaRoda: new CylinderGeometry(0.07, 0.07, 0.05, 12).rotateZ(Math.PI / 2),
    geometriaSimbolo: new PlaneGeometry(0.3, 0.3),
    geometriaMarcador: new OctahedronGeometry(0.22, 0),
    geometriaMarca: new CircleGeometry(0.5, 32).rotateX(-Math.PI / 2),
    geometriaPiso: new BoxGeometry(1.95, 0.06, 0.95).translate(0, 0.03, 0),
    geometriaPoste: new CylinderGeometry(0.025, 0.025, 1, 8).translate(0, 0.5, 0),
    geometriaPlaca: new BoxGeometry(0.7, 0.32, 0.04),
  };
}

// ========================================
// 4. TERRENO: ASFALTO, CALÇADAS E FAIXAS
// ========================================

function criarTerreno(recursos, largura, profundidade) {
  const terreno = new Mesh(
    new BoxGeometry(largura + 1.2, 0.3, profundidade + 1.2),
    recursos.asfalto,
  );
  terreno.position.y = -0.15;
  terreno.receiveShadow = true;
  return terreno;
}

function criarFaixas(recursos, colunas, linhas) {
  const pontos = [];
  const meiaLargura = (colunas * TAMANHO_CELULA) / 2;
  const meiaProfundidade = (linhas * TAMANHO_CELULA) / 2;

  for (let coluna = 1; coluna < colunas; coluna += 1) {
    const x = coluna * TAMANHO_CELULA - meiaLargura;
    pontos.push(x, 0.012, -meiaProfundidade, x, 0.012, meiaProfundidade);
  }

  for (let linha = 1; linha < linhas; linha += 1) {
    const z = linha * TAMANHO_CELULA - meiaProfundidade;
    pontos.push(-meiaLargura, 0.012, z, meiaLargura, 0.012, z);
  }

  const geometria = new BufferGeometry();
  geometria.setAttribute('position', new Float32BufferAttribute(pontos, 3));
  const faixas = new LineSegments(geometria, recursos.faixa);
  faixas.computeLineDistances();
  return faixas;
}

function criarCalcada(recursos, ehVerde) {
  const lado = TAMANHO_QUADRA + 0.18;
  const geometria = new BoxGeometry(lado, 0.08, lado).translate(0, 0.04, 0);
  const calcada = new Mesh(geometria, ehVerde ? recursos.gramado : recursos.calcada);
  calcada.receiveShadow = true;
  return calcada;
}

function criarArvores(recursos, posicoes) {
  const troncos = new InstancedMesh(recursos.geometriaTronco, recursos.tronco, posicoes.length);
  const copas = new InstancedMesh(recursos.geometriaCopa, recursos.copa, posicoes.length);
  const matriz = new Matrix4();

  posicoes.forEach(([x, z, escala], indice) => {
    matriz.makeScale(escala, escala, escala).setPosition(x, 0.08, z);
    troncos.setMatrixAt(indice, matriz);
    matriz.makeScale(escala, escala, escala).setPosition(x, 0.08 + 0.4 * escala, z);
    copas.setMatrixAt(indice, matriz);
  });

  copas.castShadow = true;
  return [troncos, copas];
}

// ========================================
// 5. PRÉDIOS DA QUADRA
// ========================================

function posicionarModelo(modelo, larguraMaxima) {
  const copia = modelo.cena.clone();
  const escala = larguraMaxima / Math.max(modelo.tamanho.x, modelo.tamanho.z);
  copia.scale.setScalar(escala);
  return copia;
}

function preencherQuadra(modelos, sorteio, proximidade) {
  const quadra = new Group();
  const predios = [];
  const usarAlto = proximidade > 0.6 && sorteio() > 0.3;
  const partes = usarAlto ? 1 : 1 + Math.floor(sorteio() * 2);
  const larguraParte = (TAMANHO_QUADRA * 0.92) / partes;

  for (let parte = 0; parte < partes; parte += 1) {
    const lista = usarAlto ? modelos.altos : modelos.predios;
    const modelo = lista[Math.floor(sorteio() * lista.length)];
    const predio = new Group();
    predio.add(posicionarModelo(modelo, larguraParte * (usarAlto ? 0.8 : 0.95)));
    predio.position.set((parte - (partes - 1) / 2) * larguraParte, 0.08, 0);
    predio.rotation.y = Math.floor(sorteio() * 4) * (Math.PI / 2);
    predio.userData.altura = 1;
    quadra.add(predio);
    predios.push(predio);
  }

  return { quadra, predios };
}

// ========================================
// 6. LIXEIRAS: CORPO, TAMPA, RODAS E SÍMBOLO
// ========================================

function criarLixeira(recursos, material) {
  const lixeira = new Group();
  const corpo = new Mesh(recursos.geometriaCorpo, material);
  const tampa = new Group();
  const placaTampa = new Mesh(recursos.geometriaTampa, material);
  const simbolo = new Mesh(recursos.geometriaSimbolo, recursos.simbolo);

  corpo.castShadow = true;
  placaTampa.castShadow = true;
  tampa.position.set(0, 0.74, -0.36);
  tampa.add(placaTampa);
  simbolo.position.set(0, 0.4, 0.3);
  simbolo.rotation.x = -0.06;
  [-0.18, 0.18].forEach((x) => {
    const roda = new Mesh(recursos.geometriaRoda, recursos.borracha);
    roda.position.set(x, 0.07, -0.26);
    lixeira.add(roda);
  });
  lixeira.add(corpo, tampa, simbolo);
  lixeira.userData = { tampa, alvos: [corpo, placaTampa] };
  return lixeira;
}

function criarMaterialLixeira(cor) {
  return new MeshStandardMaterial({ color: cor, roughness: 0.4, transparent: true });
}

function criarEcoponto(recursos, categoria, indiceDestaque) {
  const ecoponto = new Group();
  const piso = new Mesh(recursos.geometriaPiso, recursos.concreto);
  const poste = new Mesh(recursos.geometriaPoste, recursos.borracha);
  const placa = new Mesh(recursos.geometriaPlaca, criarMaterialLixeira('#14482a'));
  const materiais = CORES_ECOPONTO.map(criarMaterialLixeira);
  const lixeiras = materiais.map((material, indice) => {
    const lixeira = criarLixeira(recursos, material);
    lixeira.position.set((indice - 1.5) * 0.44, 0.06, 0);
    lixeira.scale.setScalar(0.55);
    ecoponto.add(lixeira);
    return lixeira;
  });

  piso.receiveShadow = true;
  poste.position.set(1.05, 0, -0.25);
  placa.position.set(1.05, 0.92, -0.25);
  ecoponto.add(piso, poste, placa);
  return {
    ecoponto,
    destaque: lixeiras[indiceDestaque],
    materiais: [...materiais, placa.material],
  };
}

function criarPonto(recursos, categoria, indice) {
  const pino = new Group();
  const ehEcoponto = indice < CORES_ECOPONTO.length;
  const cor = criarMaterialLixeira(categoria.cor);
  const sombra = new MeshStandardMaterial({
    color: categoria.cor,
    transparent: true,
    opacity: 0.25,
  });
  const marcador = new Mesh(recursos.geometriaMarcador, cor);
  const marca = new Mesh(recursos.geometriaMarca, sombra);
  const materiais = [cor, sombra];
  let destaque;

  if (ehEcoponto) {
    const montagem = criarEcoponto(recursos, categoria, indice);
    destaque = montagem.destaque;
    materiais.push(...montagem.materiais);
    pino.add(montagem.ecoponto);
  } else {
    destaque = criarLixeira(recursos, cor);
    destaque.scale.setScalar(0.5);
    pino.add(destaque);
  }

  marcador.position.y = ALTURA_MARCADOR;
  marca.position.y = 0.03;
  pino.add(marca, marcador);

  const alvosToque = [...destaque.userData.alvos, marcador];
  alvosToque.forEach((alvo) => {
    alvo.userData.pino = pino;
  });
  pino.userData = {
    ...categoria,
    ecoponto: ehEcoponto,
    haste: destaque,
    tampa: destaque.userData.tampa,
    escalaBase: destaque.scale.x,
    cabeca: marcador,
    cor,
    sombra,
    alvosToque,
    materiais,
  };
  return pino;
}

// ========================================
// 7. MONTAGEM DA CIDADE
// ========================================

export function criarMaquete({ colunas, linhas, modelos, semente = 7 }) {
  const sorteio = criarSorteio(semente);
  const recursos = criarRecursos();
  const grupo = new Group();
  const predios = [];
  const celulas = [];
  const posicoesArvores = [];
  const meiaLargura = (colunas * TAMANHO_CELULA) / 2;
  const meiaProfundidade = (linhas * TAMANHO_CELULA) / 2;
  const raioMaximo = Math.hypot(meiaLargura, meiaProfundidade);

  for (let coluna = 0; coluna < colunas; coluna += 1) {
    for (let linha = 0; linha < linhas; linha += 1) {
      const x = (coluna + 0.5) * TAMANHO_CELULA - meiaLargura;
      const z = (linha + 0.5) * TAMANHO_CELULA - meiaProfundidade;
      celulas.push({ x, z, proximidade: 1 - Math.hypot(x, z) / raioMaximo });
    }
  }

  const passo = Math.floor(celulas.length / CATEGORIAS_PINO.length);
  const celulasDosPontos = CATEGORIAS_PINO.map(
    (_, indice) => celulas[indice * passo + Math.floor(passo / 2)],
  );

  grupo.add(criarTerreno(recursos, colunas * TAMANHO_CELULA, linhas * TAMANHO_CELULA));
  grupo.add(criarFaixas(recursos, colunas, linhas));

  celulas.forEach((celula) => {
    const indicePonto = celulasDosPontos.indexOf(celula);
    const ehEcoponto = indicePonto >= 0 && indicePonto < CORES_ECOPONTO.length;
    const ehPraca = ehEcoponto || (indicePonto < 0 && sorteio() < 0.1);
    const calcada = criarCalcada(recursos, ehPraca);

    calcada.position.set(celula.x, 0, celula.z);
    grupo.add(calcada);
    posicoesArvores.push(
      [celula.x - 0.78, celula.z + 0.78, 0.9],
      [celula.x + 0.78, celula.z - 0.78, 0.8],
    );

    if (ehPraca) {
      for (let arvore = 0; arvore < 3; arvore += 1) {
        posicoesArvores.push([
          celula.x + (sorteio() - 0.5) * 1.1,
          celula.z - 0.45 - sorteio() * 0.2,
          1 + sorteio() * 0.5,
        ]);
      }
      return;
    }

    const { quadra, predios: novos } = preencherQuadra(modelos, sorteio, celula.proximidade);
    quadra.position.set(celula.x, 0, celula.z);
    grupo.add(quadra);
    novos.forEach((predio) => {
      predio.userData.atraso = 1 - celula.proximidade;
      predios.push(predio);
    });
  });

  grupo.add(...criarArvores(recursos, posicoesArvores));

  const pinos = CATEGORIAS_PINO.map((categoria, indice) => {
    const celula = celulasDosPontos[indice];
    const pino = criarPonto(recursos, categoria, indice);
    const naPraca = indice < CORES_ECOPONTO.length;
    pino.position.set(celula.x + (naPraca ? 0 : 0.78), 0, celula.z + (naPraca ? 0.25 : 0.78));
    pino.userData.esquina = new Vector3(
      celula.x + TAMANHO_CELULA / 2,
      0,
      celula.z + TAMANHO_CELULA / 2,
    );
    grupo.add(pino);
    return pino;
  });

  return { grupo, predios, pinos, recursos, largura: colunas * TAMANHO_CELULA };
}

export function descartarMaquete({ recursos, pinos, grupo }) {
  const compartilhados = new Set(Object.values(recursos));
  pinos.forEach((pino) => pino.userData.materiais.forEach((material) => material.dispose()));
  grupo.traverse((filho) => {
    const geometriaPropria = filho.geometry && !compartilhados.has(filho.geometry);
    if (geometriaPropria) filho.geometry.dispose();
    if (filho.isInstancedMesh) filho.dispose();
  });
  recursos.simbolo.map.dispose();
  compartilhados.forEach((recurso) => recurso.dispose());
}
