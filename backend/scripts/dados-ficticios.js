// ============================================================
// SCRIPT: Dados ficticios para desenvolvimento
//
// Enche o banco local com pessoas, pontos de coleta e favoritos de
// mentira, para o app nao ficar vazio durante testes e demonstracoes.
//
//   node scripts/dados-ficticios.js            insere (ou reinsere)
//   node scripts/dados-ficticios.js --remover  apaga tudo que foi inserido
//
// Tudo que entra aqui pertence a contas com e-mail @ficticio.recicla.
// Remover essas contas leva junto os pontos e favoritos delas (ON DELETE
// CASCADE), entao contas e pontos reais nunca sao tocados.
//
// As contas ficticias entram com a senha abaixo, caso queira logar com uma.
// NAO rode em banco de producao.
// ============================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const DOMINIO = '@ficticio.recicla';
const SENHA = 'Ficticio@123';
// Quantos pontos ficticios cada conta real ja existente ganha nos favoritos.
const FAVORITOS_PARA_CONTAS_REAIS = 6;

// Categorias (ids de sql/init.sql)
const PAPEL = 1, PLASTICO = 2, VIDRO = 3, METAL = 4, PILHAS = 5;
const ELETRONICOS = 6, OLEO = 7, ROUPAS = 8, OUTROS = 9;

// [nome, meses atras em que entrou na comunidade]
const PESSOAS = [
  ['Ana Beatriz Moraes', 11],
  ['João Pedro Almeida', 10],
  ['Cláudia Ferraz', 9],
  ['Seu Antônio Ribeiro', 9],
  ['Larissa Nogueira', 8],
  ['Rafael Camargo', 7],
  ['Dona Lurdes Batista', 6],
  ['Thiago Vasconcelos', 6],
  ['Patrícia Yamamoto', 5],
  ['Cooperativa Recicla Vale', 5],
  ['Gustavo Prado', 4],
  ['Mariana Siqueira', 3],
  ['Escola Estadual Monteiro Lobato', 3],
  ['Bruno Tavares', 2],
  ['Associação de Moradores do Jardim Europa', 1],
  ['Camila Rocha', 1],
];

// Cada ponto: [dono (indice em PESSOAS), nome, descricao, endereco, bairro,
//              cidade, latitude, longitude, horario, categorias]
const PONTOS = [
  // ---------------- Taquarituba ----------------
  [9, 'Cooperativa Recicla Vale', 'Galpão da cooperativa. Recebe material separado e limpo; para grandes volumes, avise antes.', 'Rua Coronel João Quintino, 1450', 'Distrito Industrial', 'Taquarituba', -23.5412, -49.2391, 'Seg a Sex, 7h às 17h · Sáb, 7h às 11h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [0, 'Ecoponto Praça da Matriz', 'Contêineres coloridos ao lado do coreto.', 'Praça São Roque, s/n', 'Centro', 'Taquarituba', -23.5331, -49.2446, 'Todos os dias, 24h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [3, 'Ferro-velho do Seu Antônio', 'Compra sucata de ferro, alumínio e cobre. Pesa na hora.', 'Rua Duque de Caxias, 782', 'Vila São Vicente', 'Taquarituba', -23.5268, -49.2489, 'Seg a Sáb, 8h às 17h', [METAL, ELETRONICOS]],
  [6, 'Coleta de Óleo da Dona Lurdes', 'Traga o óleo usado em garrafa PET bem fechada. Vira sabão para a comunidade.', 'Rua Sete de Setembro, 215', 'Centro', 'Taquarituba', -23.5349, -49.2421, 'Seg a Sex, 9h às 16h', [OLEO]],
  [12, 'Papa-pilhas da Escola Monteiro Lobato', 'Coletor na secretaria. Aberto à comunidade em dias letivos.', 'Rua Professor Gabriel Camargo, 90', 'Jardim Ouro Branco', 'Taquarituba', -23.5287, -49.2412, 'Seg a Sex, 7h às 18h', [PILHAS, PAPEL]],
  [4, 'Bazar Solidário Santa Rita', 'Roupas, calçados e cobertores em bom estado. Doações vão para famílias do bairro.', 'Rua Santa Rita, 340', 'Jardim São Roque', 'Taquarituba', -23.5402, -49.2463, 'Ter e Qui, 13h às 17h', [ROUPAS]],
  [14, 'Ecoponto Jardim Europa', 'Mantido pelos moradores. Não deixe material fora dos tambores.', 'Avenida Europa, 610', 'Jardim Europa', 'Taquarituba', -23.5243, -49.2378, 'Todos os dias, 6h às 20h', [PAPEL, PLASTICO, METAL]],
  [1, 'Supermercado Bom Preço — Coleta de Vidro', 'Caçamba verde no estacionamento, perto da saída.', 'Avenida Governador Mário Covas, 1200', 'Centro', 'Taquarituba', -23.5318, -49.2398, 'Seg a Sáb, 8h às 21h · Dom, 8h às 13h', [VIDRO, PLASTICO]],
  [7, 'Assistência Técnica Vasconcelos', 'Recebe celulares, cabos, carregadores e computadores velhos para descarte correto.', 'Rua Quinze de Novembro, 455', 'Centro', 'Taquarituba', -23.5337, -49.2467, 'Seg a Sex, 8h30 às 18h', [ELETRONICOS, PILHAS]],
  [9, 'Ponto de Entrega Voluntária — Rodoviária', 'Contêiner da prefeitura em frente ao terminal.', 'Avenida Coronel João Quintino, 300', 'Vila Nova', 'Taquarituba', -23.5371, -49.2512, 'Todos os dias, 24h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [10, 'Oficina do Gustavo — Baterias', 'Recebe baterias de carro e moto. Não aceita bateria vazando.', 'Rua Tiradentes, 1012', 'Vila São Vicente', 'Taquarituba', -23.5259, -49.2455, 'Seg a Sex, 8h às 18h · Sáb, 8h às 12h', [PILHAS, METAL]],
  [2, 'Farmácia Central — Coletor de Pilhas', 'Coletor no balcão. Também recebe blister e embalagem de remédio vazia.', 'Rua Rui Barbosa, 128', 'Centro', 'Taquarituba', -23.5322, -49.2431, 'Seg a Sáb, 7h às 22h', [PILHAS, OUTROS]],
  [11, 'Horta Comunitária Dona Carmélia', 'Recebe potes de vidro com tampa e caixas de papelão para as mudas.', 'Rua das Hortênsias, 77', 'Jardim Dona Carmélia', 'Taquarituba', -23.5433, -49.2498, 'Qua e Sáb, 8h às 11h', [VIDRO, PAPEL, OUTROS]],
  [15, 'Igreja São Roque — Campanha do Agasalho', 'Caixa na entrada lateral. No inverno recebe também cobertores.', 'Rua São Roque, 20', 'Centro', 'Taquarituba', -23.5327, -49.2452, 'Todos os dias, 7h às 19h', [ROUPAS]],
  [5, 'Depósito de Recicláveis Camargo', 'Compra papelão, PET e latinha por quilo.', 'Rua José Bonifácio, 890', 'Jardim São Vicente', 'Taquarituba', -23.5226, -49.2437, 'Seg a Sex, 7h30 às 17h', [PAPEL, PLASTICO, METAL]],
  [13, 'Posto Avenida — Óleo de Cozinha', 'Bombona azul ao lado da loja de conveniência.', 'Avenida Governador Mário Covas, 455', 'Vila Nova', 'Taquarituba', -23.5362, -49.2409, 'Todos os dias, 6h às 22h', [OLEO, PILHAS]],
  [8, 'Ateliê Yamamoto — Retalhos e Tecidos', 'Aceita retalhos, aviamentos e roupas para reforma.', 'Rua Marechal Deodoro, 266', 'Jardim Ouro Branco', 'Taquarituba', -23.5296, -49.2379, 'Seg a Sex, 9h às 17h', [ROUPAS, OUTROS]],
  [0, 'Ecoponto Lago Municipal', 'Lixeiras de coleta seletiva na entrada da pista de caminhada.', 'Avenida Beira Lago, s/n', 'Jardim do Lago', 'Taquarituba', -23.5389, -49.2356, 'Todos os dias, 5h às 22h', [PLASTICO, METAL, VIDRO]],

  // ---------------- Região ----------------
  [9, 'Ecoponto Municipal de Itaí', 'Recebe recicláveis, entulho pequeno e móveis velhos.', 'Rua Salvador de Oliveira Leme, 1010', 'Centro', 'Itaí', -23.4181, -49.0912, 'Seg a Sáb, 7h às 17h', [PAPEL, PLASTICO, VIDRO, METAL, OUTROS]],
  [2, 'Mercado Bela Vista — Pilhas e Óleo', '', 'Avenida Santo Antônio, 520', 'Bela Vista', 'Itaí', -23.4152, -49.0871, 'Seg a Sáb, 8h às 20h', [PILHAS, OLEO]],
  [5, 'Sucatas Represa', 'Compra metal e eletrônico sem conserto.', 'Rodovia Eduardo Saigh, km 12', 'Zona Rural', 'Itaí', -23.4302, -49.1105, 'Seg a Sex, 8h às 17h', [METAL, ELETRONICOS]],
  [1, 'Associação Avareense de Catadores', 'Cooperativa com triagem própria. Faz retirada em condomínios e comércios.', 'Rua Pernambuco, 1840', 'Brabância', 'Avaré', -23.1042, -48.9321, 'Seg a Sex, 7h às 16h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [4, 'Ecoponto Largo São João', '', 'Largo São João, s/n', 'Centro', 'Avaré', -23.0991, -48.9259, 'Todos os dias, 24h', [PAPEL, PLASTICO, VIDRO]],
  [7, 'Info Avaré — Lixo Eletrônico', 'Descarte gratuito de computadores, monitores e impressoras.', 'Rua Rio Grande do Sul, 1310', 'Centro', 'Avaré', -23.1013, -48.9237, 'Seg a Sex, 9h às 18h', [ELETRONICOS, PILHAS]],
  [15, 'Brechó Amigos do Bem', 'Roupas e brinquedos. A renda mantém o abrigo de animais.', 'Rua Santa Catarina, 905', 'Alto', 'Avaré', -23.0954, -48.9288, 'Ter a Sáb, 9h às 17h', [ROUPAS, OUTROS]],
  [11, 'Ponto Verde Piraju', 'Coleta seletiva ao lado do ginásio de esportes.', 'Rua Treze de Maio, 640', 'Centro', 'Piraju', -23.1938, -49.3842, 'Todos os dias, 6h às 22h', [PAPEL, PLASTICO, METAL]],
  [6, 'Sabão Ecológico Piraju', 'Grupo de mulheres que transforma óleo usado em sabão em barra.', 'Rua Major Mariano, 212', 'Vila São José', 'Piraju', -23.1975, -49.3801, 'Seg, Qua e Sex, 13h às 17h', [OLEO]],
  [3, 'Reciclagem Fartura', '', 'Rua Barão do Rio Branco, 733', 'Centro', 'Fartura', -23.3889, -49.5103, 'Seg a Sex, 8h às 17h', [PAPEL, PLASTICO, METAL]],
  [13, 'Cooperativa de Catadores de Itapeva', 'Recebe material de toda a região. Tem balança para caminhão.', 'Avenida Vaticano, 2100', 'Jardim Maringá', 'Itapeva', -23.9871, -48.8702, 'Seg a Sex, 7h às 17h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [8, 'Ecoponto Praça Anchieta', '', 'Praça Anchieta, s/n', 'Centro', 'Itapeva', -23.9824, -48.8759, 'Todos os dias, 24h', [PLASTICO, VIDRO, PILHAS]],
  [10, 'Auto Elétrica Prado — Baterias', '', 'Rua Mário Prandini, 480', 'Vila Aparecida', 'Itapeva', -23.9779, -48.8811, 'Seg a Sex, 8h às 18h', [PILHAS, METAL]],
  [12, 'Projeto Recicla Unesp', 'Ponto de entrega no campus, aberto a moradores do entorno.', 'Avenida Universitária, 3780', 'Altos do Paraíso', 'Botucatu', -22.8469, -48.4333, 'Seg a Sex, 8h às 17h', [PAPEL, ELETRONICOS, PILHAS]],
  [14, 'Ecoponto Vila dos Lavradores', '', 'Rua Major Matheus, 1500', 'Vila dos Lavradores', 'Botucatu', -22.8791, -48.4402, 'Seg a Sáb, 7h às 18h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [0, 'Feira da Troca Botucatu', 'Todo primeiro sábado do mês. Leve roupas, livros e utensílios.', 'Praça Emílio Peduti, s/n', 'Centro', 'Botucatu', -22.8859, -48.4452, 'Primeiro sábado do mês, 9h às 13h', [ROUPAS, OUTROS]],

  // ---------------- Sorocaba e Campinas ----------------
  [1, 'Ecoponto Campolim', '', 'Avenida Gisele Constantino, 1850', 'Parque Campolim', 'Sorocaba', -23.5338, -47.4651, 'Seg a Sáb, 8h às 17h', [PAPEL, PLASTICO, VIDRO, METAL, ELETRONICOS]],
  [5, 'Coreso — Cooperativa de Reciclagem', 'Uma das cooperativas mais antigas da cidade.', 'Rua Padre Madureira, 255', 'Vila Hortência', 'Sorocaba', -23.4927, -47.4388, 'Seg a Sex, 7h às 16h30', [PAPEL, PLASTICO, METAL]],
  [7, 'Descarte Tech Sorocaba', 'Apaga os dados do aparelho na sua frente antes do descarte.', 'Avenida Itavuvu, 3200', 'Jardim Santa Cecília', 'Sorocaba', -23.4589, -47.4802, 'Seg a Sex, 9h às 18h', [ELETRONICOS, PILHAS]],
  [4, 'Varal Solidário Zona Norte', '', 'Rua Atanázio Soares, 990', 'Vila Fiori', 'Sorocaba', -23.4612, -47.4466, 'Sáb, 9h às 13h', [ROUPAS]],
  [2, 'Ecoponto Barão Geraldo', '', 'Avenida Santa Isabel, 1100', 'Barão Geraldo', 'Campinas', -22.8239, -47.0811, 'Seg a Sáb, 7h às 18h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [8, 'Cooperativa Reciclar Campinas', 'Recebe também isopor limpo e embalagem longa vida.', 'Rua Francisco Teodoro, 870', 'Vila Industrial', 'Campinas', -22.9132, -47.0789, 'Seg a Sex, 7h às 17h', [PAPEL, PLASTICO, METAL, OUTROS]],
  [11, 'Óleo Amigo Cambuí', 'Tambor no pátio da padaria. A cada 2 litros, leve um sabão.', 'Rua Coronel Quirino, 1455', 'Cambuí', 'Campinas', -22.8951, -47.0512, 'Todos os dias, 6h às 20h', [OLEO]],
  [13, 'Ponto Eletrônico Taquaral', '', 'Avenida Doutor Heitor Penteado, 2010', 'Taquaral', 'Campinas', -22.8763, -47.0548, 'Seg a Sex, 9h às 17h', [ELETRONICOS, PILHAS]],

  // ---------------- São Paulo ----------------
  [0, 'Ecoponto Vila Madalena', '', 'Rua Girassol, 15', 'Vila Madalena', 'São Paulo', -23.5549, -46.6909, 'Seg a Sáb, 6h às 22h · Dom, 6h às 18h', [PAPEL, PLASTICO, VIDRO, METAL, OUTROS]],
  [9, 'Cooperativa Sempre Verde', 'Triagem de material da coleta seletiva da zona oeste.', 'Rua Embaixador Macedo Soares, 6000', 'Lapa', 'São Paulo', -23.5148, -46.7273, 'Seg a Sex, 7h às 16h', [PAPEL, PLASTICO, METAL]],
  [15, 'Descarte Verde Paulista', 'Coletor no térreo do edifício. Só pequenos eletrônicos.', 'Avenida Paulista, 1578', 'Bela Vista', 'São Paulo', -23.5614, -46.6558, 'Seg a Sex, 8h às 20h', [ELETRONICOS, PILHAS]],
  [6, 'Sabão da Vila — Coleta de Óleo', '', 'Rua Tuiuti, 1200', 'Tatuapé', 'São Paulo', -23.5401, -46.5762, 'Seg a Sex, 10h às 16h', [OLEO]],
  [4, 'Guarda-Roupa Coletivo Mooca', 'Troque uma peça por outra ou só doe.', 'Rua da Mooca, 2500', 'Mooca', 'São Paulo', -23.5578, -46.5984, 'Qua a Sáb, 10h às 18h', [ROUPAS]],
  [3, 'Ferro-velho Ipiranga', '', 'Rua Silva Bueno, 1830', 'Ipiranga', 'São Paulo', -23.5924, -46.6021, 'Seg a Sáb, 8h às 17h', [METAL, ELETRONICOS]],
  [14, 'Ecoponto Santo Amaro', '', 'Rua Padre José de Anchieta, 802', 'Santo Amaro', 'São Paulo', -23.6498, -46.7081, 'Seg a Sáb, 6h às 22h', [PAPEL, PLASTICO, VIDRO, METAL]],
  [12, 'Biblioteca Viva — Livros e Papel', 'Livros em bom estado vão para o acervo; o resto segue para reciclagem.', 'Rua Voluntários da Pátria, 2400', 'Santana', 'São Paulo', -23.4987, -46.6255, 'Ter a Sáb, 9h às 18h', [PAPEL, OUTROS]],
  [10, 'Vidraçaria Prado — Cacos e Garrafas', 'Aceita vidro plano e garrafas. Embrulhe os cacos em jornal.', 'Avenida Sapopemba, 4100', 'Sapopemba', 'São Paulo', -23.5892, -46.5237, 'Seg a Sex, 8h às 17h', [VIDRO]],
  [2, 'Drogaria Saúde — Remédios Vencidos', 'Coletor para medicamentos vencidos, pilhas e chapas de raio X.', 'Rua Augusta, 2340', 'Jardins', 'São Paulo', -23.5611, -46.6672, 'Todos os dias, 7h às 23h', [PILHAS, OUTROS]],
];

// Sorteio com semente fixa: rodar de novo gera sempre os mesmos dados.
function criarSorteio(semente) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

function emailDe(nome) {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
  return base + DOMINIO;
}

// Data "ha N dias", no formato que o MySQL aceita.
function diasAtras(dias) {
  const data = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

async function remover(conexao) {
  const [resultado] = await conexao.execute(
    'DELETE FROM usuarios WHERE email LIKE ?',
    ['%' + DOMINIO]
  );
  return resultado.affectedRows;
}

async function inserir(conexao) {
  const sorteio = criarSorteio(20261009);
  const hash = await bcrypt.hash(SENHA, 10);

  const [contasReais] = await conexao.execute(
    'SELECT id FROM usuarios WHERE email NOT LIKE ?',
    ['%' + DOMINIO]
  );

  const idsPessoas = [];
  for (const [nome, meses] of PESSOAS) {
    const [resultado] = await conexao.execute(
      'INSERT INTO usuarios (nome, email, senha, criado_em) VALUES (?, ?, ?, ?)',
      [nome, emailDe(nome), hash, diasAtras(meses * 30 + Math.floor(sorteio() * 20))]
    );
    idsPessoas.push(resultado.insertId);
  }

  const idsPontos = [];
  for (const ponto of PONTOS) {
    const [dono, nome, descricao, endereco, bairro, cidade, latitude, longitude, horario, categorias] = ponto;
    const mesesDoDono = PESSOAS[dono][1];
    const [resultado] = await conexao.execute(
      `INSERT INTO pontos_coleta
         (nome, descricao, endereco, bairro, cidade, latitude, longitude,
          foto_url, horario_funcionamento, status, usuario_id, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, 'Ativo', ?, ?)`,
      [
        nome, descricao, endereco, bairro, cidade, latitude, longitude, horario,
        idsPessoas[dono],
        // Sempre depois de a pessoa ter entrado na comunidade.
        diasAtras(Math.floor(sorteio() * mesesDoDono * 30)),
      ]
    );
    idsPontos.push(resultado.insertId);

    for (const categoriaId of categorias) {
      await conexao.execute(
        'INSERT INTO ponto_categorias (ponto_id, categoria_id) VALUES (?, ?)',
        [resultado.insertId, categoriaId]
      );
    }
  }

  // Favoritos: cada pessoa ficticia salva alguns pontos; cada conta real
  // ganha os primeiros pontos da lista (os de Taquarituba).
  let favoritos = 0;
  async function favoritar(usuarioId, pontoId) {
    const [resultado] = await conexao.execute(
      'INSERT IGNORE INTO favoritos (usuario_id, ponto_id) VALUES (?, ?)',
      [usuarioId, pontoId]
    );
    favoritos += resultado.affectedRows;
  }

  for (const usuarioId of idsPessoas) {
    const quantos = 2 + Math.floor(sorteio() * 5);
    for (let i = 0; i < quantos; i++) {
      await favoritar(usuarioId, idsPontos[Math.floor(sorteio() * idsPontos.length)]);
    }
  }
  for (const conta of contasReais) {
    for (const pontoId of idsPontos.slice(0, FAVORITOS_PARA_CONTAS_REAIS)) {
      await favoritar(conta.id, pontoId);
    }
  }

  return { pessoas: idsPessoas.length, pontos: idsPontos.length, favoritos };
}

async function principal() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Recusado: NODE_ENV=production. Este script e so para desenvolvimento.');
  }

  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORTA) || 3306,
    user: process.env.DB_USUARIO || 'root',
    password: process.env.DB_SENHA || '',
    database: process.env.DB_NOME || 'reciclaplus',
    charset: 'utf8mb4',
  });

  try {
    await conexao.beginTransaction();

    // Sempre limpa antes: rodar duas vezes nao duplica nada.
    const removidas = await remover(conexao);

    if (process.argv.includes('--remover')) {
      await conexao.commit();
      console.log(`Removidas ${removidas} contas ficticias, com seus pontos e favoritos.`);
      return;
    }

    const total = await inserir(conexao);
    await conexao.commit();
    console.log(
      `Inseridos: ${total.pessoas} pessoas, ${total.pontos} pontos, ${total.favoritos} favoritos.`
    );
    console.log(`Contas ficticias: <nome>${DOMINIO}, senha ${SENHA}`);
    console.log('Para desfazer: node scripts/dados-ficticios.js --remover');
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    await conexao.end();
  }
}

principal().catch(erro => {
  console.error('Falhou, nada foi gravado:', erro.message);
  process.exit(1);
});
