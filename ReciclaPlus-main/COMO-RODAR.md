# Recicla+ — Como rodar em uma máquina nova

Guia passo a passo para clonar o projeto do GitHub e rodar do zero.

O projeto tem duas partes:
- **`backend/`** — API REST (Node.js + Express + MySQL), porta `3000`
- **`frontend/`** — App mobile (Expo / React Native)

> ⚠️ Os arquivos `.env` e as pastas `node_modules/` **não vão para o Git**.
> Por isso, numa máquina nova é preciso recriá-los (passos abaixo).

---

## 1. Pré-requisitos

Instale antes de começar:

| Ferramenta | Observação |
|---|---|
| **Node.js** | versão LTS (18+) |
| **MySQL** | servidor rodando localmente |
| **Git** | para clonar o repositório |
| **Expo Go** | app no celular (Play Store / App Store) |

O celular e o PC precisam estar na **mesma rede Wi-Fi**.

---

## 2. Clonar o repositório

```bash
git clone <URL-DO-SEU-REPOSITORIO>
cd ReciclaPlus-main
```

---

## 3. Instalar as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 4. Criar o banco de dados

O script `backend/sql/init.sql` cria o banco `reciclaplus`, todas as tabelas
e já popula as categorias.

```bash
# a partir da pasta backend/
mysql -u root -p < sql/init.sql
```

Digite a senha do MySQL quando pedir.

---

## 5. Configurar os arquivos `.env`

### 5.1 Backend

Copie o exemplo e edite:

```bash
# dentro de backend/
copy .env.example .env      # Windows (PowerShell/CMD)
# cp .env.example .env      # Linux/macOS
```

Edite `backend/.env` e ajuste principalmente a **senha do MySQL**:

```env
DB_SENHA=sua_senha_do_mysql
```

### 5.2 Frontend

```bash
# dentro de frontend/
copy .env.example .env      # Windows
# cp .env.example .env      # Linux/macOS
```

Edite `frontend/.env` e coloque o **IP da máquina** (não use `localhost`):

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
```

**Como descobrir o IP:**
- Windows: `ipconfig` → campo **Endereço IPv4** (ex.: `192.168.0.10`)
- Linux/macOS: `ifconfig` ou `ip addr`

> O IP pode mudar quando reconectar no Wi-Fi (DHCP). Se o app parar de
> conectar, confira o IP atual e atualize o `.env` (e reinicie o Expo).

---

## 6. Liberar o firewall (Windows)

O celular precisa alcançar as portas `3000` (API) e `8081` (Expo/Metro).
Por padrão o Windows bloqueia conexões de entrada. Abra um **PowerShell como
Administrador** e rode:

```powershell
New-NetFirewallRule -DisplayName "ReciclaPlus API 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Any
New-NetFirewallRule -DisplayName "ReciclaPlus Metro 8081" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -Profile Any
```

> No Linux/macOS isso normalmente não é necessário.

---

## 7. Rodar o projeto

Use **dois terminais**.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Esperado:
```
✅ Banco de dados conectado com sucesso.
🚀 Servidor rodando em http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npx expo start
```
Escaneie o QR Code com o **Expo Go** (celular na mesma Wi-Fi).

---

## 8. Testar

1. No **navegador do celular**, abra `http://SEU_IP_LOCAL:3000/`
   → deve aparecer `{"mensagem":"API Recicla+ funcionando!","versao":"1.0.0"}`
   - Se aparecer: rede OK.
   - Se não aparecer: firewall, IP errado ou Wi-Fi diferente.
2. No app, criar uma conta. Deve funcionar.

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Verifique sua conexão" ao cadastrar | IP errado no `frontend/.env`, ou firewall bloqueando | Conferir IP (`ipconfig`) e regras de firewall (passo 6) |
| API não sobe: erro de conexão MySQL | senha/usuário errado no `backend/.env`, MySQL parado | Conferir `DB_SENHA`/`DB_USUARIO` e se o MySQL está rodando |
| `EXPO_PUBLIC_API_URL nao definido` | `frontend/.env` ausente | Criar o `.env` (passo 5.2) e reiniciar `npx expo start` |
| App não recarrega após editar `.env` | Expo cacheia variáveis `EXPO_PUBLIC_*` | Reiniciar com `npx expo start -c` |
| Bundle **web** quebra (`react-native-maps`) | `react-native-maps` não roda na web | Testar no **dispositivo/Expo Go**, não no navegador web |
