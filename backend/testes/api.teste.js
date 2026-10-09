// ============================================================
// TESTES DA API (ponta a ponta)
// Chama a API de verdade, com o banco de verdade. Antes de rodar:
//   1. suba o backend:  npm run dev
//   2. em outro terminal:  npm test
//
// O teste cria duas contas temporarias e uma cidade de nome unico, e apaga
// tudo no final (excluir a conta leva junto pontos, favoritos e fotos).
// Dados que ja existem no banco nao sao alterados.
//
// A API limita tentativas erradas de login/senha (10 a cada 15 min). Rodar
// este arquivo muitas vezes seguidas pode esbarrar nesse limite (HTTP 429).
// ============================================================

const API = process.env.API_URL || 'http://localhost:3000';
const SUFIXO = Date.now();
const CIDADE = `Cidade Teste ${SUFIXO}`;

let falhas = 0;
let total = 0;

function conferir(nome, condicao, detalhe = '') {
  total += 1;
  if (!condicao) falhas += 1;
  console.log(`${condicao ? 'OK   ' : 'FALHA'} ${nome}${condicao ? '' : ` -> ${detalhe}`}`);
}

async function chamar(metodo, rota, { token, corpo, form, corpoBruto } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (corpo !== undefined || corpoBruto !== undefined) headers['Content-Type'] = 'application/json';

  const resposta = await fetch(API + rota, {
    method: metodo,
    headers,
    body: form ?? corpoBruto ?? (corpo !== undefined ? JSON.stringify(corpo) : undefined),
  });
  const texto = await resposta.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* resposta nao e JSON */ }

  if (resposta.status === 429) {
    throw new Error(`Limite de requisicoes atingido em ${metodo} ${rota}. Aguarde alguns minutos e rode de novo.`);
  }
  return { status: resposta.status, json, texto, headers: resposta.headers };
}

function formComArquivo(conteudo, nome, tipo, campo = 'foto') {
  const form = new FormData();
  form.append(campo, new Blob([conteudo], { type: tipo }), nome);
  return form;
}

// PNG 1x1 valido.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const pontoValido = {
  nome: 'Ponto de Teste Automatizado',
  descricao: 'Criado pelo teste da API.',
  endereco: 'Rua de Teste, 1',
  bairro: 'Centro',
  cidade: CIDADE,
  latitude: -23.55,
  longitude: -46.63,
  fotoUrl: '',
  horarioFuncionamento: 'Seg a Sex, 8h às 18h',
  categoriaIds: [1, 2],
};

const contaAna = { nome: 'Ana Teste', email: `ana.${SUFIXO}@example.com`, senha: 'Ana@12345' };
const contaBia = { nome: 'Bia Teste', email: `bia.${SUFIXO}@example.com`, senha: 'Bia@12345' };

async function criarContaELogar(conta) {
  const cadastro = await chamar('POST', '/usuarios', { corpo: conta });
  if (cadastro.status !== 201) throw new Error(`cadastro de ${conta.email} falhou: ${cadastro.texto}`);

  const login = await chamar('POST', '/usuarios/login', { corpo: { email: conta.email, senha: conta.senha } });
  if (login.status !== 200) throw new Error(`login de ${conta.email} falhou: ${login.texto}`);

  return { id: cadastro.json.id, token: login.json.token, cadastro, login };
}

async function testarContas(ana, bia) {
  console.log('\n== Contas ==');
  const cadastrar = corpo => chamar('POST', '/usuarios', { corpo });
  let r;

  conferir('cadastro nao devolve a senha', !/senha"\s*:/.test(ana.cadastro.texto), ana.cadastro.texto);
  conferir('login devolve token e usuario sem senha',
    typeof ana.login.json.token === 'string' && ana.login.json.usuario.email === contaAna.email &&
    !('senha' in ana.login.json.usuario), ana.login.texto);

  r = await cadastrar({ nome: 'Ab', email: `x1.${SUFIXO}@example.com`, senha: 'Senha@123' });
  conferir('cadastro com nome curto -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await cadastrar({ nome: 'Fulano Teste', email: 'sem-arroba', senha: 'Senha@123' });
  conferir('cadastro com email invalido -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await cadastrar({ nome: 'Fulano Teste', email: `x2.${SUFIXO}@example.com`, senha: '123' });
  conferir('cadastro com senha curta -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await cadastrar({ nome: 'Fulano Teste', email: `x3.${SUFIXO}@example.com`, senha: 12345678 });
  conferir('cadastro com senha numerica -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await cadastrar({ nome: 'Fulano Teste', email: `x4.${SUFIXO}@example.com`, senha: 'x'.repeat(73) });
  conferir('cadastro com senha de 73 caracteres -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await cadastrar({ ...contaAna, email: contaAna.email.toUpperCase() });
  conferir('email repetido (em maiusculas) -> 409', r.status === 409, `${r.status} ${r.texto}`);

  r = await chamar('POST', '/usuarios/login', { corpo: { email: contaAna.email } });
  conferir('login sem senha -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('POST', '/usuarios/login', { corpo: { email: contaAna.email, senha: 'senha-errada' } });
  conferir('login com senha errada -> 401', r.status === 401, `${r.status} ${r.texto}`);

  r = await chamar('GET', `/usuarios/${ana.id}`, { token: ana.token });
  conferir('ver os proprios dados -> 200', r.status === 200 && r.json.email === contaAna.email, `${r.status} ${r.texto}`);
  r = await chamar('GET', `/usuarios/${ana.id}`, { token: bia.token });
  conferir('ver dados de outro usuario -> 403', r.status === 403, `${r.status} ${r.texto}`);
  r = await chamar('GET', `/usuarios/${ana.id}`);
  conferir('ver dados sem token -> 401', r.status === 401, `${r.status}`);
  r = await chamar('GET', '/favoritos', { token: 'token.invalido.aqui' });
  conferir('token invalido -> 401', r.status === 401, `${r.status}`);

  console.log('\n== Perfil ==');
  r = await chamar('PUT', '/usuarios/eu', { corpo: { nome: 'Sem Token' } });
  conferir('alterar nome sem token -> 401', r.status === 401, `${r.status}`);
  r = await chamar('PUT', '/usuarios/eu', { token: ana.token, corpo: { nome: 'A' } });
  conferir('alterar nome curto -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('PUT', '/usuarios/eu', {
    token: ana.token, corpo: { nome: '  Ana Renomeada  ', email: 'outro@example.com', id: bia.id },
  });
  conferir('alterar nome -> 200, so o nome muda',
    r.status === 200 && r.json.nome === 'Ana Renomeada' && r.json.email === contaAna.email && r.json.id === ana.id,
    `${r.status} ${r.texto}`);
  conferir('resposta do perfil nao traz a senha', !('senha' in (r.json ?? {})), r.texto);

  r = await chamar('PUT', '/usuarios/eu/senha', { token: ana.token, corpo: { novaSenha: 'Nova@12345' } });
  conferir('trocar senha sem informar a atual -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('PUT', '/usuarios/eu/senha', {
    token: ana.token, corpo: { senhaAtual: 'senha-errada', novaSenha: 'Nova@12345' },
  });
  conferir('trocar senha com a atual errada -> 403', r.status === 403, `${r.status} ${r.texto}`);
  r = await chamar('PUT', '/usuarios/eu/senha', {
    token: ana.token, corpo: { senhaAtual: contaAna.senha, novaSenha: '123' },
  });
  conferir('trocar para senha curta -> 400', r.status === 400, `${r.status} ${r.texto}`);
  // A data da troca tem precisao de segundos: garante que o token antigo
  // foi emitido em um segundo anterior ao da troca.
  await new Promise(resolve => setTimeout(resolve, 1100));
  const tokenAntigo = ana.token;
  r = await chamar('PUT', '/usuarios/eu/senha', {
    token: ana.token, corpo: { senhaAtual: contaAna.senha, novaSenha: 'Nova@12345' },
  });
  conferir('trocar senha -> 200 com token novo', r.status === 200 && typeof r.json?.token === 'string', `${r.status} ${r.texto}`);
  ana.token = r.json?.token;
  contaAna.senha = 'Nova@12345';

  r = await chamar('GET', `/usuarios/${ana.id}`, { token: tokenAntigo });
  conferir('token emitido antes da troca de senha deixa de valer -> 401', r.status === 401, `${r.status}`);
  r = await chamar('GET', `/usuarios/${ana.id}`, { token: ana.token });
  conferir('token novo continua valendo -> 200', r.status === 200, `${r.status} ${r.texto}`);
  conferir('respostas nao expoem dados da senha', !/senha/i.test(r.texto), r.texto);
  r = await chamar('POST', '/usuarios/login', { corpo: { email: contaAna.email, senha: 'Ana@12345' } });
  conferir('login com a senha antiga -> 401', r.status === 401, `${r.status}`);
  r = await chamar('POST', '/usuarios/login', { corpo: { email: contaAna.email, senha: contaAna.senha } });
  conferir('login com a senha nova -> 200', r.status === 200, `${r.status} ${r.texto}`);
}

async function testarUpload(ana) {
  console.log('\n== Upload de foto ==');
  let r = await chamar('POST', '/uploads/fotos', { form: formComArquivo(PNG, 'a.png', 'image/png') });
  conferir('sem token -> 401', r.status === 401, r.texto);
  r = await chamar('POST', '/uploads/fotos', { token: ana.token, form: new FormData() });
  conferir('sem arquivo -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('POST', '/uploads/fotos', {
    token: ana.token,
    form: formComArquivo(Buffer.from('<script>alert(1)</script> isto nao e imagem'), 'x.jpg', 'image/jpeg'),
  });
  conferir('texto disfarcado de jpg -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('POST', '/uploads/fotos', {
    token: ana.token, form: formComArquivo(Buffer.alloc(9 * 1024 * 1024, 1), 'grande.png', 'image/png'),
  });
  conferir('arquivo de 9 MB -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('POST', '/uploads/fotos', {
    token: ana.token, form: formComArquivo(PNG, 'a.png', 'image/png', 'outroCampo'),
  });
  conferir('campo com nome errado -> 400', r.status === 400, `${r.status} ${r.texto}`);

  r = await chamar('POST', '/uploads/fotos', {
    token: ana.token, form: formComArquivo(PNG, '../../evil.exe', 'application/x-msdownload'),
  });
  const foto = r.json?.fotoUrl ?? '';
  conferir('png valido -> 201 com nome gerado pela API',
    r.status === 201 && /^\/uploads\/[a-f0-9]{32}\.png$/.test(foto), `${r.status} ${r.texto}`);
  r = await chamar('GET', foto);
  conferir('foto servida publicamente', r.status === 200 && r.headers.get('content-type') === 'image/png',
    `${r.status} ${r.headers.get('content-type')}`);
  r = await chamar('GET', '/uploads/..%2f.env');
  conferir('path traversal nao vaza o .env', r.status !== 200 || !r.texto.includes('JWT_SEGREDO'), `${r.status}`);

  return foto;
}

async function testarPontos(ana, bia, foto1) {
  console.log('\n== Validacao de ponto ==');
  const criar = corpo => chamar('POST', '/pontos', { token: ana.token, corpo });
  const casosInvalidos = [
    ['corpo vazio', {}],
    ['nome em branco', { ...pontoValido, nome: '   ' }],
    ['nome longo demais', { ...pontoValido, nome: 'x'.repeat(161) }],
    ['sem cidade', { ...pontoValido, cidade: undefined }],
    ['latitude fora da faixa', { ...pontoValido, latitude: 123 }],
    ['latitude como texto', { ...pontoValido, latitude: '-23.5' }],
    ['sem categoria', { ...pontoValido, categoriaIds: [] }],
    ['categoria inexistente', { ...pontoValido, categoriaIds: [1, 999999] }],
    ['fotoUrl local do aparelho', { ...pontoValido, fotoUrl: 'file:///var/mobile/foto.jpg' }],
    ['fotoUrl externa', { ...pontoValido, fotoUrl: 'https://evil.example.com/x.jpg' }],
  ];
  let r;
  for (const [nome, corpo] of casosInvalidos) {
    r = await criar(corpo);
    conferir(`${nome} -> 400`, r.status === 400, `${r.status} ${r.texto}`);
  }

  r = await chamar('POST', '/pontos', { corpo: pontoValido });
  conferir('criar ponto sem token -> 401', r.status === 401, `${r.status}`);
  r = await chamar('POST', '/pontos', { token: ana.token, corpoBruto: '{ json quebrado' });
  conferir('JSON malformado -> 400', r.status === 400, `${r.status}`);
  r = await chamar('POST', '/pontos', { token: ana.token, corpo: { nome: 'x'.repeat(2 * 1024 * 1024) } });
  conferir('corpo de 2 MB -> 413', r.status === 413, `${r.status}`);
  r = await chamar('GET', '/pontos/abc');
  conferir('GET /pontos/abc -> 404', r.status === 404, `${r.status}`);
  r = await chamar('GET', '/pontos?categoriaId=abc');
  conferir('categoriaId invalido -> 400', r.status === 400, `${r.status}`);

  r = await criar({ ...pontoValido, fotoUrl: foto1, usuarioId: bia.id, status: 'Inativo', id: 999999 });
  const ponto = r.json ?? {};
  conferir('ponto valido -> 201', r.status === 201, `${r.status} ${r.texto}`);
  conferir('dono vem do token, nao do corpo', ponto.usuarioId === ana.id, String(ponto.usuarioId));
  conferir('status do corpo e ignorado na criacao', ponto.status === 'Ativo', String(ponto.status));
  conferir('foto, cidade e categorias gravadas',
    ponto.fotoUrl === foto1 && ponto.cidade === CIDADE && ponto.categorias?.length === 2, r.texto);
  conferir('texto acentuado preservado', ponto.horarioFuncionamento === pontoValido.horarioFuncionamento,
    String(ponto.horarioFuncionamento));

  r = await chamar('GET', '/pontos');
  conferir('lista publica: mais recente primeiro, sem nome do autor',
    r.json?.[0]?.id === ponto.id && r.json.every(p => !('usuarioNome' in p)), r.texto.slice(0, 200));
  r = await chamar('GET', '/pontos?categoriaId=1');
  conferir('filtro por categoria inclui o ponto', r.json?.some(p => p.id === ponto.id), '');
  r = await chamar('GET', '/pontos?categoriaId=9');
  conferir('filtro por outra categoria exclui o ponto', !r.json?.some(p => p.id === ponto.id), '');

  console.log('\n== Permissao de dono ==');
  r = await chamar('PUT', `/pontos/${ponto.id}`, { corpo: { nome: 'Invadido' } });
  conferir('editar sem token -> 401', r.status === 401, `${r.status}`);
  r = await chamar('PUT', `/pontos/${ponto.id}`, { token: bia.token, corpo: { nome: 'Invadido' } });
  conferir('editar ponto alheio -> 403', r.status === 403, `${r.status} ${r.texto}`);
  r = await chamar('DELETE', `/pontos/${ponto.id}`, { token: bia.token });
  conferir('excluir ponto alheio -> 403', r.status === 403, `${r.status} ${r.texto}`);
  r = await chamar('GET', `/pontos/${ponto.id}`);
  conferir('ponto intacto apos as tentativas', r.json?.nome === pontoValido.nome, r.texto);
  r = await chamar('PUT', '/pontos/999999', { token: ana.token, corpo: { nome: 'x' } });
  conferir('editar ponto inexistente -> 404', r.status === 404, `${r.status}`);
  r = await chamar('PUT', `/pontos/${ponto.id}`, { token: ana.token, corpo: { latitude: 999 } });
  conferir('dono com dado invalido -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('PUT', `/pontos/${ponto.id}`, { token: ana.token, corpo: { nome: 'Ponto Renomeado', usuarioId: bia.id } });
  conferir('edicao parcial muda so o que foi enviado',
    r.status === 200 && r.json.nome === 'Ponto Renomeado' && r.json.fotoUrl === foto1 &&
    r.json.categorias.length === 2 && r.json.usuarioId === ana.id, `${r.status} ${r.texto}`);

  return ponto;
}

async function testarFavoritos(ana, bia, ponto) {
  console.log('\n== Favoritos ==');
  const favoritar = corpo => chamar('POST', '/favoritos', { token: bia.token, corpo });
  let r = await favoritar({ pontoId: 999999 });
  conferir('favoritar ponto inexistente -> 404', r.status === 404, `${r.status} ${r.texto}`);
  r = await favoritar({ pontoId: 'abc' });
  conferir('favoritar com id invalido -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('GET', '/favoritos/ponto/abc', { token: bia.token });
  conferir('status de favorito com id invalido -> falso', r.status === 200 && r.json.favorito === false, r.texto);

  const [f1, f2] = await Promise.all([favoritar({ pontoId: ponto.id }), favoritar({ pontoId: ponto.id })]);
  conferir('favoritar duas vezes ao mesmo tempo devolve o mesmo favorito',
    [200, 201].includes(f1.status) && [200, 201].includes(f2.status) && f1.json.id === f2.json.id,
    `${f1.status} ${f1.texto} | ${f2.status} ${f2.texto}`);
  r = await chamar('GET', `/favoritos/ponto/${ponto.id}`, { token: bia.token });
  conferir('status de favorito -> verdadeiro', r.json?.favorito === true && r.json.favoritoId === f1.json.id, r.texto);
  r = await chamar('GET', '/favoritos', { token: bia.token });
  conferir('lista tem o ponto uma vez so', r.json?.filter(f => f.id === ponto.id).length === 1, r.texto.slice(0, 200));
  r = await chamar('GET', '/favoritos', { token: ana.token });
  conferir('favoritos de um usuario nao aparecem para outro', !r.json?.some(f => f.id === ponto.id), '');
  r = await chamar('DELETE', `/favoritos/${f1.json.id}`, { token: ana.token });
  conferir('remover favorito de outro usuario -> 404', r.status === 404, `${r.status}`);
  r = await chamar('DELETE', `/favoritos/ponto/${ponto.id}`, { token: bia.token });
  conferir('remover favorito pelo ponto -> 204', r.status === 204, `${r.status}`);
}

async function testarComunidade(ana, bia, ponto) {
  console.log('\n== Comunidade ==');
  const cidadeNaUrl = encodeURIComponent(CIDADE);
  let r;

  for (const rota of ['/comunidade/pessoas', `/comunidade/pessoas/${ana.id}`, '/comunidade/cidades', '/comunidade/pontos']) {
    r = await chamar('GET', rota);
    conferir(`${rota.replace(String(ana.id), ':id')} sem token -> 401`, r.status === 401, `${r.status}`);
  }

  r = await chamar('GET', `/comunidade/pessoas?cidade=${cidadeNaUrl}`, { token: bia.token });
  conferir('pessoas da cidade: so quem tem ponto la, com o total',
    r.json?.length === 1 && r.json[0].id === ana.id && r.json[0].totalPontos === 1, r.texto.slice(0, 300));
  conferir('pessoas nao expoe email nem senha', !/email|senha|@/.test(r.texto), r.texto.slice(0, 300));

  r = await chamar('GET', `/comunidade/pessoas?cidade=${encodeURIComponent(CIDADE.toUpperCase().slice(0, 14))}`, { token: bia.token });
  conferir('filtro de cidade aceita prefixo e ignora maiusculas', r.json?.some(p => p.id === ana.id), r.texto.slice(0, 300));
  r = await chamar('GET', '/comunidade/pessoas?cidade=%25', { token: bia.token });
  conferir('curinga % no filtro nao casa com tudo', r.status === 200 && r.json.length === 0, r.texto.slice(0, 200));
  r = await chamar('GET', `/comunidade/pessoas?cidade=${'x'.repeat(121)}`, { token: bia.token });
  conferir('cidade longa demais -> 400', r.status === 400, `${r.status}`);

  r = await chamar('GET', `/comunidade/pessoas/${ana.id}`, { token: bia.token });
  conferir('perfil traz nome, total e pontos com autor',
    r.status === 200 && r.json.nome === 'Ana Renomeada' && r.json.totalPontos === 1 &&
    r.json.pontos.length === 1 && r.json.pontos[0].usuarioNome === 'Ana Renomeada', r.texto.slice(0, 300));
  conferir('perfil nao expoe email nem senha', !/email|senha|@/.test(r.texto), '');
  r = await chamar('GET', `/comunidade/pessoas/${bia.id}`, { token: ana.token });
  conferir('perfil de quem nao tem ponto -> 200 com lista vazia',
    r.status === 200 && r.json.totalPontos === 0 && r.json.pontos.length === 0, r.texto.slice(0, 200));
  r = await chamar('GET', '/comunidade/pessoas/999999', { token: bia.token });
  conferir('perfil inexistente -> 404', r.status === 404, `${r.status}`);
  r = await chamar('GET', '/comunidade/pessoas/abc', { token: bia.token });
  conferir('perfil com id invalido -> 404', r.status === 404, `${r.status}`);

  r = await chamar('GET', '/comunidade/cidades', { token: bia.token });
  const cidade = r.json?.find(c => c.cidade === CIDADE);
  conferir('cidades com contagem de pontos e pessoas', cidade?.totalPontos === 1 && cidade?.totalPessoas === 1, r.texto.slice(0, 300));

  r = await chamar('GET', `/comunidade/pontos?cidade=${cidadeNaUrl}`, { token: bia.token });
  conferir('pontos da cidade, com nome de quem cadastrou',
    r.json?.length === 1 && r.json[0].id === ponto.id && r.json[0].usuarioNome === 'Ana Renomeada', r.texto.slice(0, 300));
}

async function testarFotoEExclusao(ana, bia, ponto, foto1) {
  console.log('\n== Ciclo de vida da foto ==');
  // Outra pessoa aponta o proprio ponto para a mesma foto e depois o exclui.
  let r = await chamar('POST', '/pontos', { token: bia.token, corpo: { ...pontoValido, fotoUrl: foto1 } });
  r = await chamar('DELETE', `/pontos/${r.json.id}`, { token: bia.token });
  conferir('dona exclui o proprio ponto -> 204', r.status === 204, `${r.status}`);
  r = await chamar('GET', foto1);
  conferir('foto compartilhada continua no ar', r.status === 200, `${r.status}`);

  r = await chamar('POST', '/uploads/fotos', { token: ana.token, form: formComArquivo(PNG, 'b.png', 'image/png') });
  const foto2 = r.json.fotoUrl;
  r = await chamar('PUT', `/pontos/${ponto.id}`, { token: ana.token, corpo: { fotoUrl: foto2 } });
  conferir('trocar foto -> 200', r.status === 200 && r.json.fotoUrl === foto2, `${r.status} ${r.texto}`);
  r = await chamar('GET', foto1);
  conferir('foto antiga removida do servidor', r.status === 404, `${r.status}`);
  r = await chamar('PUT', `/pontos/${ponto.id}`, { token: ana.token, corpo: { fotoUrl: '' } });
  conferir('remover foto -> 200', r.status === 200 && r.json.fotoUrl === '', `${r.status} ${r.texto}`);
  r = await chamar('GET', foto2);
  conferir('foto removida some do servidor', r.status === 404, `${r.status}`);

  r = await chamar('POST', '/uploads/fotos', { token: ana.token, form: formComArquivo(PNG, 'c.png', 'image/png') });
  const foto3 = r.json.fotoUrl;
  await chamar('PUT', `/pontos/${ponto.id}`, { token: ana.token, corpo: { fotoUrl: foto3 } });

  console.log('\n== Exclusao de conta ==');
  r = await chamar('DELETE', '/usuarios/eu', { token: ana.token });
  conferir('excluir conta sem senha -> 400', r.status === 400, `${r.status} ${r.texto}`);
  r = await chamar('DELETE', '/usuarios/eu', { token: ana.token, corpo: { senha: 'senha-errada' } });
  conferir('excluir conta com senha errada -> 403', r.status === 403, `${r.status} ${r.texto}`);
  r = await chamar('GET', `/pontos/${ponto.id}`);
  conferir('conta e ponto intactos apos as tentativas', r.status === 200, `${r.status}`);

  r = await chamar('DELETE', '/usuarios/eu', { token: ana.token, corpo: { senha: contaAna.senha } });
  conferir('excluir conta com a senha certa -> 204', r.status === 204, `${r.status} ${r.texto}`);
  ana.excluida = true;
  r = await chamar('GET', `/pontos/${ponto.id}`);
  conferir('pontos da conta excluida somem', r.status === 404, `${r.status}`);
  r = await chamar('GET', foto3);
  conferir('fotos da conta excluida somem', r.status === 404, `${r.status}`);
  r = await chamar('GET', '/favoritos', { token: ana.token });
  conferir('token da conta excluida deixa de valer -> 401', r.status === 401, `${r.status}`);
  r = await chamar('POST', '/usuarios/login', { corpo: { email: contaAna.email, senha: contaAna.senha } });
  conferir('login da conta excluida -> 401', r.status === 401, `${r.status}`);
  r = await chamar('GET', `/comunidade/pessoas?cidade=${encodeURIComponent(CIDADE)}`, { token: bia.token });
  conferir('conta excluida sai da comunidade', r.status === 200 && r.json.length === 0, r.texto.slice(0, 200));
}

(async () => {
  const saude = await chamar('GET', '/').catch(() => null);
  if (!saude || saude.status !== 200) {
    throw new Error(`API fora do ar em ${API}. Suba o backend (npm run dev) antes de rodar os testes.`);
  }

  const ana = await criarContaELogar(contaAna);
  const bia = await criarContaELogar(contaBia);

  try {
    await testarContas(ana, bia);
    const foto1 = await testarUpload(ana);
    const ponto = await testarPontos(ana, bia, foto1);
    await testarFavoritos(ana, bia, ponto);
    await testarComunidade(ana, bia, ponto);
    await testarFotoEExclusao(ana, bia, ponto, foto1);
  } finally {
    // Limpeza: excluir a conta leva junto pontos, favoritos e fotos.
    for (const [pessoa, conta] of [[ana, contaAna], [bia, contaBia]]) {
      if (pessoa.excluida) continue;
      const exclusao = await chamar('DELETE', '/usuarios/eu', {
        token: pessoa.token, corpo: { senha: conta.senha },
      }).catch(() => null);
      // Sem limpeza (ex.: limite de requisicoes), a conta fica no banco: avisa.
      if (exclusao?.status !== 204) {
        console.warn(`AVISO: a conta temporaria ${conta.email} nao foi removida; apague-a do banco.`);
      }
    }
  }

  console.log(falhas === 0
    ? `\nTODOS OS ${total} TESTES PASSARAM`
    : `\n${falhas} DE ${total} TESTES FALHARAM`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO NO TESTE:', erro.message);
  process.exit(1);
});
