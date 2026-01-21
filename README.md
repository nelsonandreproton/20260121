# 🏈 Kansas City Chiefs News Aggregator

Uma aplicação web moderna e **segura** que agrega notícias sobre o Kansas City Chiefs de múltiplas fontes confiáveis, apresentando-as numa timeline dinâmica e atualizada automaticamente.

![Chiefs News Timeline](https://img.shields.io/badge/NFL-Chiefs-E31837?style=for-the-badge&logo=nfl&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Security](https://img.shields.io/badge/Security-Hardened-green?style=for-the-badge)

## 📋 Características

### Funcionalidades Principais
- ✅ **Agregação Automática**: Coleta notícias de múltiplas fontes via RSS feeds
- ✅ **Timeline Moderna**: Interface visual atraente com design inspirado nas cores do Chiefs
- ✅ **Atualização Automática**: Atualiza as notícias a cada 30 minutos (configurável)
- ✅ **Filtros por Fonte**: Filtre notícias por fonte específica
- ✅ **Responsive Design**: Funciona perfeitamente em desktop, tablet e mobile
- ✅ **Banco de Dados SQLite**: Armazenamento local rápido e eficiente
- ✅ **Ético e Responsável**: Usa RSS feeds oficiais respeitando as políticas dos sites

### Segurança 🔒
- ✅ **XSS Protection**: Sanitização de conteúdo com DOMPurify
- ✅ **Rate Limiting**: Proteção contra abuso de API
- ✅ **Security Headers**: Helmet.js com CSP, X-Frame-Options, etc.
- ✅ **Input Validation**: Validação rigorosa de todos os inputs
- ✅ **Error Handling**: Mensagens genéricas aos clientes, logs detalhados server-side
- ✅ **CORS Configurável**: Controle de origens permitidas
- ✅ **URL Validation**: Whitelist de domínios para feeds RSS
- ✅ **Timeout Protection**: Timeouts em requisições HTTP

### Qualidade de Código 📊
- ✅ **Logging Profissional**: Winston com rotação diária de logs
- ✅ **Environment Variables**: Configuração via .env
- ✅ **Health Check**: Endpoint de monitoramento
- ✅ **Graceful Shutdown**: Encerramento limpo do servidor
- ✅ **Error Recovery**: Retry logic com exponential backoff
- ✅ **Package Security**: Versões fixas de dependências

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

### Passo 1: Clonar e Instalar

```bash
# Clone o repositório
git clone <repository-url>
cd chiefs-news-aggregator

# Instalar dependências
npm install
```

### Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.example .env

# Editar conforme necessário
nano .env
```

Configurações importantes no `.env`:

```env
# Porta do servidor
PORT=3000

# CORS - restringir em produção!
CORS_ORIGIN=*  # Em produção: https://yourdomain.com

# Logging
LOG_LEVEL=info

# Frequência de atualização (cron)
CRON_SCHEDULE=*/30 * * * *  # A cada 30 minutos
```

### Passo 3: Iniciar o Servidor

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

### Passo 4: Acessar a Aplicação

```
http://localhost:3000
```

## 🚀 Deploy em Produção

Esta aplicação requer um servidor Node.js e **NÃO** pode ser hospedada no GitHub Pages (apenas sites estáticos).

### Plataformas Recomendadas

| Plataforma | Free Tier | Database | Deploy Automático | Recomendação |
|------------|-----------|----------|-------------------|--------------|
| **Railway** | ✅ 500h/mês | ✅ Persistente | ✅ Sim | 🥇 **Melhor Opção** |
| **Render** | ✅ Limitado | ⚠️ Pago | ✅ Sim | 🥈 Boa opção |
| **Vercel** | ✅ Serverless | ❌ Requer DB externo | ✅ Sim | ⚠️ Complexo |
| **VPS** | 💰 Pago | ✅ Total | ❌ Manual | 🥉 Controle total |

### Deploy Rápido no Railway (Recomendado)

1. **Criar conta:** https://railway.app (login com GitHub)
2. **Novo Projeto:** Deploy from GitHub → selecione este repositório
3. **Configurar variáveis:**
   ```env
   NODE_ENV=production
   CORS_ORIGIN=https://kcnews.up.railway.app
   LOG_LEVEL=info
   ```
4. **Adicionar Volume:** Settings → Volumes → Mount Path: `/app/data`
5. **Deploy automático** acontece via Git push!

📖 **Guia Completo:** Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas de todas as plataformas.

## 📁 Estrutura do Projeto

```
chiefs-news-aggregator/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── database.js            # Módulo SQLite
│   ├── feedParser.js          # Parser de RSS feeds
│   ├── feeds.json             # Configuração das fontes RSS
│   └── utils/
│       ├── logger.js          # Sistema de logging (Winston)
│       └── validator.js       # Validação e sanitização
├── frontend/
│   ├── index.html             # Página principal
│   ├── style.css              # Estilos CSS
│   └── app.js                 # JavaScript da aplicação
├── logs/                      # Logs (criado automaticamente)
├── .env.example               # Template de configuração
├── .gitignore
├── package.json
├── README.md                  # Este arquivo
└── SECURITY_REVIEW.md         # Análise de segurança
```

## 🔧 API Endpoints

### GET `/health`
Health check do servidor

**Resposta:**
```json
{
  "status": "healthy",
  "uptime": 12345,
  "database": {
    "connected": true,
    "articles": 150
  },
  "timestamp": "2026-01-21T10:30:00.000Z"
}
```

### GET `/api/articles`
Retorna lista de artigos com paginação

**Query Parameters:**
- `limit` (1-100, default: 50) - Artigos por página
- `offset` (default: 0) - Offset para paginação

**Exemplo:**
```bash
curl http://localhost:3000/api/articles?limit=10&offset=0
```

### GET `/api/articles/recent`
Retorna artigos recentes

**Query Parameters:**
- `hours` (1-168, default: 24) - Últimas N horas

**Exemplo:**
```bash
curl http://localhost:3000/api/articles/recent?hours=12
```

### GET `/api/articles/source/:source`
Retorna artigos de uma fonte específica

**Fontes válidas:** Chiefs.com, Arrowhead Pride, Bleacher Report, CBS Sports

**Exemplo:**
```bash
curl http://localhost:3000/api/articles/source/Chiefs.com
```

### GET `/api/sources`
Retorna estatísticas de todas as fontes

### GET `/api/stats`
Retorna estatísticas gerais

### POST `/api/refresh`
Força atualização manual dos feeds RSS

**Rate Limit:** 5 requisições a cada 15 minutos

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/refresh
```

## ⚙️ Configuração Avançada

### Modificar Frequência de Atualização

Edite `.env`:
```env
# A cada 15 minutos
CRON_SCHEDULE=*/15 * * * *

# A cada hora
CRON_SCHEDULE=0 * * * *

# A cada 2 horas
CRON_SCHEDULE=0 */2 * * *
```

### Adicionar Novas Fontes RSS

1. Edite `backend/feeds.json`:

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

2. Adicione o domínio ao whitelist em `backend/feedParser.js`:

```javascript
const ALLOWED_FEED_DOMAINS = [
  'exemplo.com',
  // ... outros domínios
];
```

3. Adicione a fonte ao whitelist em `backend/server.js`:

```javascript
const VALID_SOURCES = ['Nome da Fonte', /* ... */];
```

### Configurar CORS para Produção

Em `.env`:
```env
CORS_ORIGIN=https://yourdomain.com
```

### Ajustar Rate Limits

Em `.env`:
```env
API_RATE_LIMIT_WINDOW_MS=900000          # 15 minutos
API_RATE_LIMIT_MAX_REQUESTS=100          # 100 reqs/window
REFRESH_RATE_LIMIT_WINDOW_MS=900000      # 15 minutos
REFRESH_RATE_LIMIT_MAX_REQUESTS=5        # 5 reqs/window
```

### Configurar Nível de Logging

Em `.env`:
```env
LOG_LEVEL=info
# Opções: error, warn, info, http, verbose, debug, silly
```

## 🔒 Segurança

### Medidas Implementadas

1. **XSS Prevention**
   - DOMPurify para sanitização no frontend
   - Validação e escape no backend
   - Content Security Policy headers

2. **Rate Limiting**
   - API global: 100 req/15min
   - Refresh endpoint: 5 req/15min

3. **Security Headers** (via Helmet)
   - Content-Security-Policy
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy

4. **Input Validation**
   - Todos os inputs validados e sanitizados
   - Limites máximos enforçados
   - Whitelist de fontes válidas

5. **Error Handling**
   - Mensagens genéricas aos clientes
   - Logs detalhados server-side
   - Sem exposição de stack traces

6. **URL Validation**
   - Whitelist de domínios RSS
   - Validação de protocolos (http/https apenas)
   - Sanitização de URLs maliciosos

### Boas Práticas de Deploy

#### Produção Checklist

- [ ] Configure `CORS_ORIGIN` para domínio específico
- [ ] Mude `LOG_LEVEL` para `warn` ou `error`
- [ ] Configure HTTPS (use nginx como proxy reverso)
- [ ] Configure firewall para limitar acesso à porta
- [ ] Use process manager (PM2, systemd)
- [ ] Configure backups automáticos do database
- [ ] Monitor logs regularmente
- [ ] Execute `npm audit` regularmente
- [ ] Configure alertas de erro
- [ ] Limite permissões de arquivos

#### Exemplo com PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start backend/server.js --name chiefs-news

# Configurar auto-start
pm2 startup
pm2 save

# Monitorar
pm2 monit

# Logs
pm2 logs chiefs-news
```

#### Exemplo com Nginx (HTTPS)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Monitoramento e Logs

### Localização dos Logs

```
logs/
├── combined-YYYY-MM-DD.log  # Todos os logs
└── error-YYYY-MM-DD.log     # Apenas erros
```

### Visualizar Logs em Tempo Real

```bash
# Todos os logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Apenas erros
tail -f logs/error-$(date +%Y-%m-%d).log
```

### Logs Importantes

```bash
# Startup
grep "Chiefs News Aggregator running" logs/combined-*.log

# Errors
grep "ERROR" logs/error-*.log

# Feed fetches
grep "Feed fetch" logs/combined-*.log

# Rate limit hits
grep "Too many requests" logs/combined-*.log
```

## 🔍 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Port already in use"
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou mude a porta em .env
PORT=8080
```

### Nenhum artigo aparece
1. Verifique a conexão com internet
2. Verifique os logs: `tail -f logs/error-*.log`
3. Force um refresh: `curl -X POST http://localhost:3000/api/refresh`
4. Verifique se os feeds RSS estão acessíveis

### Erro de permissão no database
```bash
chmod 644 news.db
chmod 755 .
```

### High memory usage
- Reduza `API_RATE_LIMIT_MAX_REQUESTS`
- Aumente intervalo do cron
- Limite `limit` máximo nas queries

## 🧪 Testing

### Testar Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Articles
curl http://localhost:3000/api/articles

# Stats
curl http://localhost:3000/api/stats

# Refresh (rate limited!)
curl -X POST http://localhost:3000/api/refresh
```

### Testar Rate Limiting

```bash
# Vai falhar após 5 tentativas em 15 minutos
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/refresh
  echo ""
done
```

### Security Audit

```bash
# Check vulnerabilities
npm audit

# Fix automaticamente (quando possível)
npm audit fix
```

## 📊 Performance

### Otimizações Implementadas

- SQLite com WAL mode para melhor concurrency
- Indexes em colunas frequentemente consultadas
- Rate limiting para prevenir abuse
- Timeout em requisições HTTP
- Concurrent feed fetching (limite de 3 simultâneos)
- Lazy loading de imagens no frontend
- Logs com rotação automática

### Benchmarks Típicos

- Fetch de 4 feeds: ~2-5 segundos
- Query de 50 artigos: ~5-10ms
- Database size: ~1MB por 1000 artigos

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### v1.1.0 (2026-01-21) - Security Hardening
- ✅ Added XSS protection with DOMPurify
- ✅ Implemented rate limiting
- ✅ Added security headers (Helmet)
- ✅ Input validation and sanitization
- ✅ Professional logging system
- ✅ Environment variables configuration
- ✅ Health check endpoint
- ✅ URL validation and whitelisting
- ✅ Improved error handling
- ✅ Retry logic with exponential backoff

### v1.0.0 (2026-01-21) - Initial Release
- ✅ RSS feed aggregation
- ✅ Timeline interface
- ✅ SQLite database
- ✅ Auto-refresh mechanism
- ✅ Source filtering

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## ⚠️ Disclaimer

Esta aplicação é para uso pessoal e educacional. Respeita as políticas de uso dos sites fontes. Não sobrecarregue os servidores RSS com requisições excessivas.

## 🏈 Go Chiefs!

Desenvolvido com ❤️ para os fãs do Kansas City Chiefs!

---

**Documentos Relacionados:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 🚀 **Guia completo de deployment**
- [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) - Análise detalhada de segurança
- [.env.example](./.env.example) - Template de configuração
