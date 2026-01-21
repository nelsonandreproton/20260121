# 🚀 Deployment Guide - KCNews

Este guia cobre o deployment da aplicação Kansas City Chiefs News Aggregator em várias plataformas.

## ⚠️ Importante: GitHub Pages NÃO é compatível

**GitHub Pages** apenas serve sites estáticos (HTML/CSS/JS). Esta aplicação requer:
- Backend Node.js com Express
- SQLite database
- RSS feed parsing server-side
- Scheduled cron jobs

**Use uma das plataformas abaixo que suportam Node.js backend.**

---

## 🎯 Plataformas Recomendadas

| Plataforma | Free Tier | Database | Melhor Para | Dificuldade |
|------------|-----------|----------|-------------|-------------|
| **Railway** | ✅ 500h/mês | ✅ Persistent | Produção | ⭐ Fácil |
| **Render** | ✅ Sim | ✅ Persistent | Produção | ⭐ Fácil |
| **Vercel** | ✅ Sim | ⚠️ Serverless | Teste/Dev | ⭐⭐ Médio |
| **Heroku** | ❌ Pago | ⚠️ Ephemeral | Produção | ⭐⭐ Médio |
| **VPS** | 💰 Pago | ✅ Total | Produção | ⭐⭐⭐ Difícil |

---

## 🥇 OPÇÃO 1: Railway (RECOMENDADO)

Railway oferece 500 horas gratuitas por mês e suporta SQLite persistente.

### Passo a Passo

1. **Criar conta no Railway**
   - Acesse: https://railway.app
   - Login com GitHub

2. **Criar novo projeto**
   ```bash
   # Via CLI (opcional)
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```

   **OU via Web:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Selecione seu repositório

3. **Configurar Variáveis de Ambiente**

   No dashboard do Railway, adicione:
   ```env
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://kcnews.up.railway.app
   LOG_LEVEL=info
   CRON_SCHEDULE=*/30 * * * *
   DATABASE_PATH=/app/data/news.db
   ```

4. **Configurar Volume Persistente (IMPORTANTE!)**

   No Railway dashboard:
   - Settings → Volumes
   - Add Volume
   - Mount Path: `/app/data`
   - Size: 1GB (suficiente)

5. **Deploy**
   ```bash
   git push
   # Railway faz deploy automático!
   ```

6. **Configurar Domínio (Opcional)**
   - Settings → Domains
   - Generate Domain → `kcnews.up.railway.app`
   - Ou adicione domínio custom

### Verificar Deploy

```bash
curl https://kcnews.up.railway.app/health
```

**URL Final:** `https://kcnews.up.railway.app`

---

## 🥈 OPÇÃO 2: Render

Render oferece free tier generoso e é muito fácil de usar.

### Passo a Passo

1. **Criar conta no Render**
   - Acesse: https://render.com
   - Login com GitHub

2. **Criar Web Service**
   - Dashboard → New → Web Service
   - Connect your repository
   - Name: `kcnews`
   - Branch: `main` ou `claude/chiefs-news-sources-IP1vA`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configurar Environment Variables**

   No Render dashboard:
   ```env
   NODE_ENV=production
   LOG_LEVEL=info
   CORS_ORIGIN=https://kcnews.onrender.com
   CRON_SCHEDULE=*/30 * * * *
   DATABASE_PATH=/opt/render/project/src/news.db
   ```

4. **Configurar Persistent Disk (CRÍTICO!)**

   ⚠️ **IMPORTANTE:** Free tier do Render não tem persistent disk!
   - Upgrade para Starter ($7/mês) para ter disk persistente
   - Ou aceite que o database será resetado em cada deploy

   Se usar Starter:
   - Add Disk
   - Name: `database`
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1GB
   - Update `DATABASE_PATH=/opt/render/project/src/data/news.db`

5. **Deploy**
   - Click "Create Web Service"
   - Render fará build e deploy automático

**URL Final:** `https://kcnews.onrender.com`

### ⚠️ Limitações Free Tier Render
- Service "hiberna" após 15min de inatividade
- Primeiro request pode demorar ~30s (cold start)
- Database é resetado em cada deploy (sem persistent disk)

---

## 🥉 OPÇÃO 3: Vercel

Vercel é excelente para frontend, mas tem limitações para backend Node.js com state persistente.

### ⚠️ Limitações Importantes

- **Serverless Functions:** Cada request cria nova instância
- **No Persistent Disk:** SQLite será resetado
- **10s Timeout:** Cron jobs não funcionam nativamente
- **Cold Starts:** Primeiros requests são lentos

### Solução: Database Externo

Para usar Vercel, você precisa de database externo:
- **Turso** (SQLite na nuvem) - Recomendado
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

### Deploy com Turso (SQLite na nuvem)

1. **Criar Database no Turso**
   ```bash
   # Instalar Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # Login
   turso auth login

   # Criar database
   turso db create kcnews

   # Obter URL e token
   turso db show kcnews
   turso db tokens create kcnews
   ```

2. **Modificar código para usar Turso**

   Instale: `npm install @libsql/client`

   Atualize `backend/database.js` para usar libSQL/Turso

3. **Deploy no Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

4. **Configurar Environment Variables**
   ```env
   TURSO_DATABASE_URL=libsql://kcnews-xxx.turso.io
   TURSO_AUTH_TOKEN=seu-token-aqui
   NODE_ENV=production
   CORS_ORIGIN=https://kcnews.vercel.app
   ```

⚠️ **Nota:** Esta opção requer modificações no código. Não recomendado sem experiência.

**URL Final:** `https://kcnews.vercel.app`

---

## 📦 OPÇÃO 4: VPS (DigitalOcean, Linode, AWS EC2)

Para controle total e melhor performance.

### Requisitos Mínimos
- 1 CPU
- 512MB RAM
- 10GB storage
- Ubuntu 20.04+

### Setup Rápido

1. **Conectar ao VPS**
   ```bash
   ssh root@your-ip
   ```

2. **Instalar Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Configurar aplicação**
   ```bash
   cd /var/www
   git clone https://github.com/seu-usuario/20260121.git kcnews
   cd kcnews
   npm install
   cp .env.example .env
   nano .env  # Configurar
   ```

4. **Instalar PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start backend/server.js --name kcnews
   pm2 startup
   pm2 save
   ```

5. **Configurar Nginx**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/kcnews
   ```

   ```nginx
   server {
       listen 80;
       server_name kcnews.yourdomain.com;

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

   ```bash
   sudo ln -s /etc/nginx/sites-available/kcnews /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Configurar SSL (Certbot)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d kcnews.yourdomain.com
   ```

7. **Configurar Firewall**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

**URL Final:** `https://kcnews.yourdomain.com`

---

## 🔒 Checklist Pré-Deploy

Antes de fazer deploy em QUALQUER plataforma:

### Segurança
- [ ] `CORS_ORIGIN` configurado para domínio específico
- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=warn` ou `info`
- [ ] Secrets não commitados no Git
- [ ] Rate limits configurados adequadamente

### Performance
- [ ] Testar localmente em modo produção
- [ ] Verificar uso de memória
- [ ] Ajustar `CRON_SCHEDULE` se necessário
- [ ] Database backup strategy definida

### Monitoramento
- [ ] Health check funcionando (`/health`)
- [ ] Logs configurados
- [ ] Alertas configurados (se disponível)

---

## 📊 Comparação de Custos

| Plataforma | Grátis | Pago Inicial | Escalabilidade |
|------------|--------|--------------|----------------|
| Railway | 500h/mês | $5/mês | ⭐⭐⭐⭐ |
| Render | ✅ (limitado) | $7/mês | ⭐⭐⭐⭐ |
| Vercel | ✅ (sem DB) | $20/mês + DB | ⭐⭐⭐⭐⭐ |
| DigitalOcean | ❌ | $6/mês | ⭐⭐⭐⭐⭐ |

---

## 🆘 Troubleshooting

### "Database locked" error
- Use WAL mode (já configurado)
- Aumente timeout: `db.pragma('busy_timeout = 5000')`

### "Cannot find module" em produção
```bash
# Rebuild dependencies
npm ci --only=production
```

### Cold starts lentos
- Use Railway ou VPS (sempre online)
- Ou configure health check pings

### Database perdendo dados
- Verifique persistent storage configurado
- Backup regularmente

### Rate limit muito restritivo
```env
API_RATE_LIMIT_MAX_REQUESTS=200
REFRESH_RATE_LIMIT_MAX_REQUESTS=10
```

---

## 🎯 Recomendação Final

Para **KCNews** em produção:

1. **Melhor opção:** Railway
   - Free tier generoso
   - Persistent storage incluído
   - Deploy automático
   - Fácil de usar

2. **Segunda opção:** Render Starter
   - $7/mês
   - Mais estável que free tier
   - Persistent disk incluído

3. **Para escala futura:** VPS
   - Controle total
   - Melhor custo-benefício longo prazo
   - Requer mais manutenção

---

## 📝 Próximos Passos

1. Escolha sua plataforma
2. Siga o guia específico acima
3. Configure as variáveis de ambiente
4. Faça deploy!
5. Verifique: `curl https://seu-dominio/health`
6. Acesse no navegador: `https://seu-dominio`

**Suporte:**
- Railway: https://railway.app/help
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs

---

🏈 **Go Chiefs!** Boa sorte com o deploy!
