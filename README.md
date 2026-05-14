# Queijaria Corp - Gestão de Vendas & Materiais

Queijaria Corp é uma aplicação corporativa para controle de vendas e materiais de uma queijaria. A aplicação foi desenvolvida com front-end em React e back-end em Node.js + Express + MongoDB Atlas.

## Estrutura do Projeto

```
queijaria-corp/
├── backend/          # Backend REST API (Node.js + Express)
│   ├── index.js      # Ponto de entrada da API
│   ├── package.json  # Dependências e scripts
│   ├── .env.example  # Variáveis de ambiente (exemplo)
│   ├── .env          # Variáveis de ambiente (ignorado pelo Git)
│   ├── config/       # Configurações do banco de dados
│   ├── controllers/  # Lógica de negócio
│   ├── models/       # Modelos Mongoose
│   ├── routes/       # Rotas da API
│   └── seed.js       # Script de inicialização do banco
├── src/              # Front-end (React + React Router)
│   ├── api.js        # Cliente API configurado para Render
│   ├── components/   # Componentes reutilizáveis
│   ├── pages/        # Páginas da aplicação
│   ├── router.js     # Configuração de rotas
│   └── index.js      # Ponto de entrada do front-end
├── index.html        # Página inicial (GitHub Pages)
├── package.json      # Scripts de deploy
├── .gitignore        # Arquivos ignorados
└── README.md         # Este arquivo
```

## Deploy no GitHub Pages + Render

### Pré-requisitos

1. **MongoDB Atlas** - Crie um cluster gratuito em [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Render** - Crie uma conta em [render.com](https://render.com)

### Passo a Passo

#### 1. Configurar Variáveis de Ambiente no Render

- No painel do Render, crie um novo serviço "Web Service"
- Nomeie o serviço (ex: `queijaria-corp-backend`)
- Conecte ao repositório GitHub
- Em "Environment", adicione as variáveis:

```
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb://<user>:<password>@<cluster>.mongodb.net/queijaria-corp?ssl=true&authSource=admin&retryWrites=true&w=majority&directConnection=true
```

Substitua `<user>`, `<password>`, `<cluster>` pelos dados do seu MongoDB Atlas.

#### 2. Configurar GitHub Pages

- No repositório GitHub, vá em **Settings > Pages**
- Escolha a branch `main` (ou a branch desejada)
- Salve

#### 3. Configurar Render para Usar o Diretório `backend/`

- No serviço Render, em **Build Command**, use:
  ```
  npm install && npm start
  ```
- Em **Start Command**, use:
  ```
  node index.js
  ```
- Em **Root Directory**, selecione `backend/`

#### 4. Atualizar URL da API no Front-end

O front-end usa `src/api.js` que automaticamente detecta se está rodando no Render ou local. Para produção, a URL é `https://queijaria-corp-backend.onrender.com/api`.

#### 5. Deploy

- Faça commit e push das alterações
- O Render irá buildar e iniciar automaticamente
- O GitHub Pages irá servir o front-end

## Como Executar Localmente

### Backend

```bash
cd backend
npm install
npm run seed   # Popula o banco com dados de exemplo
npm start      # Inicia a API em http://localhost:3001
```

### Frontend

```bash
# O front-end é estático, basta abrir index.html no navegador
# ou usar um servidor local:
npx serve .
```

## Endpoints da API

- `GET /api/health` - Health check
- `GET /api/produtos` - Listar produtos
- `POST /api/produtos` - Criar produto
- `GET /api/materiais` - Listar materiais
- `POST /api/materiais` - Criar material
- `GET /api/vendas` - Listar vendas
- `POST /api/vendas` - Criar venda

## Tecnologias

- **Front-end:** React, React Router, Axios
- **Back-end:** Node.js, Express, Mongoose, MongoDB Atlas
- **Deploy:** GitHub Pages, Render

## Licença

MIT