# ReciclaPlus

ReciclaPlus e um aplicativo mobile para localizar, cadastrar e favoritar pontos de coleta de materiais reciclaveis. O projeto tem um frontend em Expo/React Native e uma API REST em Node.js, Express, TypeScript e MySQL.

## Estrutura

```text
ReciclaPlus/
  backend/              API REST, autenticacao, regras de negocio e acesso ao MySQL
  frontend/             Aplicativo Expo/React Native
  .gitignore            Arquivos locais, builds e dependencias ignorados pelo Git
  LICENSE
  README.md
```

## Funcionalidades

- Cadastro e login de usuarios com JWT.
- Persistencia de sessao no app usando AsyncStorage.
- Listagem de pontos de coleta ativos.
- Busca por nome e bairro.
- Filtro por categoria de material.
- Mapa com marcadores, GPS do usuario e callout para detalhes.
- Cadastro de novo ponto com endereco, bairro, horario, GPS, foto local e categorias.
- Tela de detalhes do ponto com informacoes, materiais aceitos e coordenadas.
- Edicao de pontos cadastrados pelo usuario dono.
- Exclusao de pontos cadastrados pelo usuario dono, com confirmacao.
- Favoritar e remover pontos favoritos.
- Listagem de favoritos do usuario autenticado.
- Relatorios no backend para pontos por categoria e por bairro.

## Backend

Local: `backend/`

Tecnologias:

- Node.js
- Express
- TypeScript
- MySQL
- JWT
- bcryptjs
- mysql2
- dotenv

Principais pastas:

```text
backend/src/configuracao/    Configuracao de ambiente e banco
backend/src/controladores/   Logica das rotas
backend/src/middlewares/     Autenticacao, erros e wrapper async
backend/src/modelos/         Queries SQL
backend/src/rotas/           Definicao de endpoints
backend/src/utilitarios/     Conversao de snake_case para camelCase
```

Rotas principais:

```text
POST   /usuarios
POST   /usuarios/login
GET    /usuarios/:id

GET    /pontos
GET    /pontos/:id
POST   /pontos
PUT    /pontos/:id
DELETE /pontos/:id

GET    /categorias

GET    /favoritos
GET    /favoritos/ponto/:pontoId
POST   /favoritos
DELETE /favoritos/:id
DELETE /favoritos/ponto/:pontoId

GET    /relatorios/pontos-por-categoria
GET    /relatorios/pontos-por-bairro
```

Variaveis de ambiente esperadas em `backend/.env`:

```env
PORTA=3000
DB_HOST=localhost
DB_PORTA=3306
DB_USUARIO=root
DB_SENHA=sua_senha
DB_NOME=reciclaplus
JWT_SEGREDO=sua_chave_secreta
JWT_EXPIRACAO=7d
```

O arquivo `.env` e local e nao deve ser enviado ao Git.

## Frontend

Local: `frontend/`

Tecnologias:

- Expo SDK 54
- React Native
- Expo Router
- TypeScript
- Axios
- React Native Maps
- Expo Location
- Expo Image Picker
- AsyncStorage

Principais pastas:

```text
frontend/src/app/          Rotas e telas do Expo Router
frontend/src/constantes/   Tema visual e categorias locais
frontend/src/contextos/    Contextos globais
frontend/src/hooks/        Hooks usados pelas telas
frontend/src/servicos/     Cliente da API e servicos HTTP
frontend/src/tipos/        Tipos TypeScript compartilhados no app
frontend/assets/           Icones, splash e assets referenciados pelo app
```

Telas principais:

```text
/(auth)/entrar       Login
/(auth)/cadastrar    Cadastro
/(abas)              Home
/(abas)/lista        Lista de pontos
/(abas)/mapa         Mapa
/(abas)/favoritos    Favoritos
/ponto/[id]          Detalhes do ponto
/ponto/novo          Cadastro de novo ponto
/ponto/editar/[id]   Edicao de ponto existente
```

A URL da API pode ser configurada com:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP:3000
```

Se essa variavel nao existir, o app usa o fallback configurado em `frontend/src/servicos/api.ts`.

## Banco de Dados

O backend espera um banco MySQL chamado `reciclaplus` com estas tabelas:

```text
usuarios
pontos_coleta
categorias
ponto_categorias
favoritos
```

As respostas do backend sao convertidas automaticamente de `snake_case` para `camelCase`, para combinar com os tipos e telas do frontend.

## Como Rodar

Instalar dependencias do backend:

```bash
cd backend
npm install
```

Instalar dependencias do frontend:

```bash
cd frontend
npm install
```

Rodar backend em desenvolvimento:

```bash
cd backend
npm run dev
```

Rodar frontend:

```bash
cd frontend
npx expo start
```

Build do backend:

```bash
cd backend
npm run build
```

Rodar backend compilado:

```bash
cd backend
npm start
```

## Validacao

Comandos usados para validar o projeto:

```bash
cd backend
npx tsc --noEmit
npm run build

cd frontend
npx tsc --noEmit
```

## Correcoes Ja Aplicadas

- Ajuste de tipagem do JWT no backend.
- Troca de `AsyncStorage.multiRemove` por chamadas compatíveis com a versao instalada.
- Favoritos alinhados entre frontend e backend.
- Cadastro de pontos gravando categorias em `ponto_categorias`.
- Listagem e detalhe de pontos retornando categorias junto com o ponto.
- Remocao de favoritos usando o id correto do favorito.
- Protecao para usuario acessar apenas o proprio perfil.
- Atualizacao e remocao de ponto restritas ao dono do ponto.
- Edicao completa de ponto, incluindo dados basicos, foto, GPS e categorias.
- Exclusao de ponto com limpeza de categorias e favoritos relacionados.
- Tratamento centralizado de erros async no Express.
- Limpeza de assets e arquivos do template Expo que nao eram usados.

## Observacoes

- `node_modules/`, `.expo/` e `dist/` sao gerados localmente e nao devem ser versionados.
- `backend/.env` contem configuracoes locais e deve continuar fora do Git.
- Ao trocar de rede Wi-Fi, atualize `EXPO_PUBLIC_API_URL` ou o fallback em `frontend/src/servicos/api.ts` para o IP correto da maquina que roda o backend.
