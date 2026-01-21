# 🏈 Kansas City Chiefs News Aggregator

Uma aplicação web moderna que agrega notícias sobre o Kansas City Chiefs de múltiplas fontes confiáveis, apresentando-as numa timeline dinâmica e atualizada automaticamente.

![Chiefs News Timeline](https://img.shields.io/badge/NFL-Chiefs-E31837?style=for-the-badge&logo=nfl&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

## 📋 Características

- ✅ **Agregação Automática**: Coleta notícias de múltiplas fontes via RSS feeds
- ✅ **Timeline Moderna**: Interface visual atraente com design inspirado nas cores do Chiefs
- ✅ **Atualização Automática**: Atualiza as notícias a cada 30 minutos automaticamente
- ✅ **Filtros por Fonte**: Filtre notícias por fonte específica (Chiefs.com, Arrowhead Pride, etc.)
- ✅ **Responsive Design**: Funciona perfeitamente em desktop, tablet e mobile
- ✅ **Banco de Dados Local**: Armazena artigos localmente usando SQLite
- ✅ **Sem Scraping Agressivo**: Usa RSS feeds oficiais respeitando as políticas dos sites

## 🎯 Fontes de Notícias

A aplicação agrega notícias das seguintes fontes:

1. **Chiefs.com** - Site oficial do Kansas City Chiefs
2. **Arrowhead Pride** - Principal site de fãs do Chiefs
3. **Bleacher Report** - Cobertura nacional da NFL
4. **CBS Sports** - Grande portal esportivo

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### Passo 3: Acessar a Aplicação

Abra o navegador e acesse:

```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
chiefs-news-aggregator/
├── backend/
│   ├── server.js          # Servidor Express principal
│   ├── database.js        # Módulo de banco de dados SQLite
│   ├── feedParser.js      # Parser de RSS feeds
│   └── feeds.json         # Configuração das fontes RSS
├── frontend/
│   ├── index.html         # Página principal
│   ├── style.css          # Estilos CSS
│   └── app.js             # JavaScript da aplicação
├── package.json           # Dependências do projeto
├── README.md              # Este arquivo
└── news.db               # Banco de dados SQLite (criado automaticamente)
```

## 🔧 API Endpoints

A aplicação expõe os seguintes endpoints REST:

### GET `/api/articles`
Retorna lista de artigos com paginação.

**Query Parameters:**
- `limit` (default: 50) - Número de artigos por página
- `offset` (default: 0) - Offset para paginação

**Exemplo:**
```bash
curl http://localhost:3000/api/articles?limit=10&offset=0
```

### GET `/api/articles/recent`
Retorna artigos recentes das últimas N horas.

**Query Parameters:**
- `hours` (default: 24) - Número de horas

**Exemplo:**
```bash
curl http://localhost:3000/api/articles/recent?hours=12
```

### GET `/api/articles/source/:source`
Retorna artigos de uma fonte específica.

**Exemplo:**
```bash
curl http://localhost:3000/api/articles/source/Chiefs.com
```

### GET `/api/sources`
Retorna estatísticas de todas as fontes.

### GET `/api/stats`
Retorna estatísticas gerais da aplicação.

### POST `/api/refresh`
Força atualização manual dos feeds RSS.

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/refresh
```

## ⚙️ Configuração

### Modificar Frequência de Atualização

Edite o arquivo `backend/server.js` na linha do cron job:

```javascript
// Atualizar a cada 30 minutos (default)
cron.schedule('*/30 * * * *', () => {
    // ...
});

// Exemplos de outras frequências:
// A cada 15 minutos: '*/15 * * * *'
// A cada hora: '0 * * * *'
// A cada 2 horas: '0 */2 * * *'
```

### Adicionar Novas Fontes RSS

Edite o arquivo `backend/feeds.json`:

```json
{
  "feeds": [
    {
      "name": "Nome da Fonte",
      "url": "https://exemplo.com/rss",
      "source": "Nome da Fonte"
    }
  ]
}
```

### Alterar Porta do Servidor

Defina a variável de ambiente `PORT`:

```bash
PORT=8080 npm start
```

Ou edite diretamente em `backend/server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

## 🎨 Personalização Visual

As cores do Chiefs podem ser modificadas no arquivo `frontend/style.css`:

```css
:root {
    --chiefs-red: #E31837;    /* Vermelho oficial dos Chiefs */
    --chiefs-gold: #FFB81C;   /* Dourado oficial dos Chiefs */
    --dark-bg: #1a1a1a;       /* Cor de fundo escura */
    --card-bg: #2a2a2a;       /* Cor de fundo dos cards */
}
```

## 📊 Funcionalidades da Interface

- **Filtros de Fonte**: Clique nos botões no topo para filtrar por fonte específica
- **Botão Refresh**: Atualiza manualmente os feeds RSS
- **Estatísticas**: Visualize total de artigos e artigos das últimas 24h
- **Timeline Interativa**: Cards com hover effects e links diretos para artigos
- **Load More**: Carregue mais artigos sob demanda
- **Auto-refresh Frontend**: A interface verifica novos artigos a cada 5 minutos

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **RSS-Parser** - Parser de feeds RSS
- **Better-SQLite3** - Banco de dados SQLite
- **Node-Cron** - Agendamento de tarefas
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilos e animações
- **JavaScript (Vanilla)** - Lógica da aplicação
- **Fetch API** - Requisições HTTP

## 🔍 Resolução de Problemas

### Erro: "Cannot find module"

Certifique-se de ter instalado as dependências:
```bash
npm install
```

### Erro: "Port already in use"

Altere a porta ou mate o processo usando a porta 3000:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Nenhum artigo aparece

1. Verifique a conexão com internet
2. Force um refresh manual clicando no botão "Refresh"
3. Verifique os logs do servidor no terminal

### Imagens não carregam

Algumas fontes RSS podem não incluir imagens ou podem estar bloqueadas por CORS. Isso é normal e não afeta a funcionalidade principal.

## 📝 Notas Importantes

- A aplicação usa RSS feeds oficiais, respeitando as políticas dos sites
- Os dados são armazenados localmente em SQLite
- Não há scraping agressivo ou violação de termos de serviço
- A aplicação é apenas para uso pessoal e educacional

## 🤝 Contribuições

Sinta-se à vontade para:
- Adicionar novas fontes RSS
- Melhorar o design
- Otimizar o código
- Reportar bugs

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🏈 Go Chiefs!

Desenvolvido com ❤️ para os fãs do Kansas City Chiefs!
