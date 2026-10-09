# Recicla+

Aplicativo mobile para encontrar, cadastrar e compartilhar pontos de coleta de
materiais recicláveis. Quem usa vê no mapa onde já existe um ponto perto de si,
cadastra novos pontos com foto e localização, e acompanha o que a comunidade da
sua cidade já mapeou.

O projeto tem duas partes: um app em **Expo / React Native** e uma **API REST**
em Node.js, Express e MySQL.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API](#api)
- [Banco de dados](#banco-de-dados)
- [Testes](#testes)
- [Segurança](#segurança)
- [Limitações conhecidas](#limitações-conhecidas)
- [Licença](#licença)

## Funcionalidades

**Pontos de coleta**

- Mapa com marcadores coloridos por categoria; toque longo no mapa cadastra um
  ponto naquele local.
- Lista com busca por nome, bairro ou cidade (ignora acentos) e filtro por
  categoria de material.
- Cadastro com foto, endereço, horário, categorias e GPS. Endereço, bairro e
  cidade são preenchidos automaticamente a partir da localização.
- Edição e exclusão apenas por quem cadastrou o ponto.
- Tela de detalhe com "Como chegar" (abre o app de mapas) e "Compartilhar".
- Favoritos por usuário.

**Perto de você**

- A tela inicial mostra os pontos da cidade onde a pessoa está.
- Distância até cada ponto, com as listas ordenadas do mais perto para o mais
  longe.

**Comunidade**

- Busca por cidade, com atalhos para as cidades que já têm pontos.
- Lista de pessoas com o total de pontos cadastrados por cada uma.
- Perfil de cada pessoa com um mapa só dos pontos dela.

**Conta**

- Cadastro e login com JWT.
- Alterar nome, trocar senha e excluir a conta.

## Tecnologias

| Parte | Principais tecnologias |
|---|---|
| App | Expo SDK 57, React Native 0.86, Expo Router, TypeScript, Axios, React Native Maps, Reanimated |
| App (web) | React Native Web e Leaflet com OpenStreetMap, para desenvolvimento e testes |
| API | Node.js, Express 4, TypeScript, MySQL 8 (`mysql2`), JWT, bcryptjs, Multer, Helmet, express-rate-limit |

Requisitos: **Node.js 20.19.4 ou superior** e **MySQL 8**.

## Estrutura do repositório

```text
ReciclaPlus/
├── backend/                 API REST
│   ├── sql/                 Criação do banco (init.sql) e migrações
│   ├── src/
│   │   ├── configuracao/    Variáveis de ambiente e conexão com o MySQL
│   │   ├── controladores/   Regras de cada rota
│   │   ├── middlewares/     Autenticação e tratamento de erros
│   │   ├── modelos/         Consultas SQL
│   │   ├── rotas/           Definição dos endpoints
│   │   └── utilitarios/     Validação, fotos e conversão para camelCase
│   └── testes/              Testes de ponta a ponta da API
├── frontend/                App Expo / React Native
│   ├── assets/              Ícones e splash
│   └── src/
│       ├── app/             Telas e rotas (Expo Router)
│       ├── componentes/     Componentes reutilizáveis
│       ├── constantes/      Tema visual e categorias
│       ├── contextos/       Estado global de autenticação
│       ├── hooks/           Hooks de dados e localização
│       ├── servicos/        Cliente da API e serviços do aparelho
│       └── tipos/           Tipos TypeScript
├── COMO-RODAR.md            Passo a passo para rodar em uma máquina nova
└── README.md
```

Telas do app:

| Rota | Tela |
|---|---|
| `/(auth)/entrar` e `/(auth)/cadastrar` | Login e cadastro |
| `/(abas)` | Início |
| `/(abas)/mapa` | Mapa |
| `/(abas)/lista` | Pontos |
| `/(abas)/comunidade` | Comunidade |
| `/(abas)/favoritos` | Favoritos |
| `/ponto/[id]`, `/ponto/novo`, `/ponto/editar/[id]` | Detalhe, cadastro e edição de ponto |
| `/pessoa/[id]` | Perfil de uma pessoa da comunidade |
| `/perfil` | Minha conta |

## Como rodar

O guia completo, com firewall do Windows e solução de problemas, está em
[COMO-RODAR.md](COMO-RODAR.md). O resumo:

```bash
# 1. Dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Banco de dados (a partir de backend/)
mysql -u root -p -e "source sql/init.sql"

# 3. Arquivos .env: copie os exemplos e preencha
#    backend/.env.example  -> backend/.env
#    frontend/.env.example -> frontend/.env

# 4. API (terminal 1)
cd backend && npm run dev

# 5. App (terminal 2)
cd frontend && npx expo start
```

Abra o app pelo **Expo Go** no celular, na mesma rede Wi-Fi do computador.
No `frontend/.env`, use o IP da máquina na rede local, e não `localhost`.

Para a versão web, usada em desenvolvimento: `npx expo start --web`.

## Variáveis de ambiente

`backend/.env`

| Variável | Para que serve |
|---|---|
| `PORTA` | Porta da API (padrão 3000) |
| `DB_HOST`, `DB_PORTA`, `DB_USUARIO`, `DB_SENHA`, `DB_NOME` | Conexão com o MySQL |
| `JWT_SEGREDO` | Chave que assina os tokens. Obrigatória; use um valor longo e aleatório |
| `JWT_EXPIRACAO` | Validade do token (padrão `7d`) |
| `CORS_ORIGENS` | Origens de navegador permitidas, separadas por vírgula |
| `NODE_ENV` | Use `development` ao rodar localmente |

`frontend/.env`

| Variável | Para que serve |
|---|---|
| `EXPO_PUBLIC_API_URL` | Endereço da API, por exemplo `http://192.168.0.10:3000`. Obrigatória |

Os arquivos `.env` são locais e não vão para o Git.

## API

Todas as respostas são JSON em camelCase. Rotas marcadas com 🔒 exigem o
cabeçalho `Authorization: Bearer <token>`.

**Usuários**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/usuarios` | Cria uma conta |
| POST | `/usuarios/login` | Autentica e devolve o token |
| GET | `/usuarios/:id` 🔒 | Dados do próprio usuário |
| PUT | `/usuarios/eu` 🔒 | Altera o próprio nome |
| PUT | `/usuarios/eu/senha` 🔒 | Troca a senha (confirma a atual) e devolve um token novo |
| DELETE | `/usuarios/eu` 🔒 | Exclui a conta (confirma a senha) |

**Pontos de coleta**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/pontos` | Lista os pontos ativos; aceita `?categoriaId=` |
| GET | `/pontos/:id` | Detalhe de um ponto |
| POST | `/pontos` 🔒 | Cadastra um ponto |
| PUT | `/pontos/:id` 🔒 | Atualiza um ponto (só o dono) |
| DELETE | `/pontos/:id` 🔒 | Remove um ponto (só o dono) |
| GET | `/categorias` | Lista as categorias de material |

**Fotos**

| Método | Rota | Descrição |
|---|---|---|
| POST | `/uploads/fotos` 🔒 | Envia uma foto (multipart, campo `foto`; JPEG, PNG ou WebP até 8 MB) |
| GET | `/uploads/:arquivo` | Serve a foto |

**Favoritos**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/favoritos` 🔒 | Favoritos do usuário |
| GET | `/favoritos/ponto/:pontoId` 🔒 | Diz se o ponto está nos favoritos |
| POST | `/favoritos` 🔒 | Adiciona um ponto aos favoritos |
| DELETE | `/favoritos/:id` 🔒 | Remove pelo id do favorito |
| DELETE | `/favoritos/ponto/:pontoId` 🔒 | Remove pelo id do ponto |

**Comunidade**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/comunidade/cidades` 🔒 | Cidades que já têm pontos, com totais |
| GET | `/comunidade/pessoas` 🔒 | Pessoas que cadastraram pontos; aceita `?cidade=` |
| GET | `/comunidade/pessoas/:id` 🔒 | Perfil de uma pessoa e os pontos dela |
| GET | `/comunidade/pontos` 🔒 | Pontos de todas as pessoas, com o nome de quem cadastrou; aceita `?cidade=` |

**Relatórios**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/relatorios/pontos-por-categoria` | Total de pontos ativos por categoria |
| GET | `/relatorios/pontos-por-bairro` | Total de pontos ativos por bairro |

## Banco de dados

O script `backend/sql/init.sql` cria o banco `reciclaplus`, as tabelas e as
nove categorias de material.

| Tabela | Conteúdo |
|---|---|
| `usuarios` | Contas (senha armazenada como hash bcrypt) |
| `pontos_coleta` | Pontos, com endereço, cidade, coordenadas, foto e dono |
| `categorias` | Tipos de material aceitos |
| `ponto_categorias` | Relação entre pontos e categorias |
| `favoritos` | Pontos favoritados por cada usuário |

Bancos criados em versões anteriores precisam das migrações em `backend/sql/`
(`migracao-001-cidade.sql` e `migracao-002-senha-alterada.sql`), uma vez cada.

As fotos ficam em `backend/uploads/`, fora do Git. O banco guarda só o caminho
relativo (`/uploads/arquivo.jpg`) e o app monta o endereço completo a partir de
`EXPO_PUBLIC_API_URL`.

## Testes

A API tem testes de ponta a ponta, que chamam o servidor e o banco de verdade:

```bash
cd backend
npm run dev      # em um terminal
npm test         # em outro
```

Os testes criam contas e dados temporários e apagam tudo no final; dados já
existentes não são alterados.

Verificações de código:

```bash
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit && npx expo lint
```

## Segurança

- Senhas guardadas com bcrypt; a API nunca devolve o hash.
- Editar e excluir um ponto exige ser o dono dele.
- Trocar a senha encerra as sessões abertas em outros aparelhos. Tokens de
  contas excluídas deixam de valer.
- Trocar a senha e excluir a conta exigem a senha atual.
- Limite de tentativas em login, cadastro, upload e confirmação de senha.
- O tipo da foto é conferido pelo conteúdo do arquivo, não pela extensão.
- As rotas da Comunidade exigem login e expõem apenas o nome dos usuários,
  nunca o e-mail.

## Limitações conhecidas

- O alvo principal é o celular. A versão web serve para desenvolvimento: nela o
  token fica no `localStorage` e a origem do navegador precisa estar em
  `CORS_ORIGENS`.
- Notificações e uso offline não estão implementados.
- A API serve as fotos a partir do disco local; para produção, o ideal é um
  serviço de armazenamento de arquivos.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
