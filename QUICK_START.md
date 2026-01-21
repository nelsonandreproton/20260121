# ⚡ Quick Start - Deploy KCNews em 5 Minutos

Guia ultra-rápido para colocar sua aplicação online.

## 🎯 Opção Mais Rápida: Railway

### 1. Preparar Repositório GitHub

```bash
# Criar novo repositório chamado "KCNews" no GitHub
# Depois execute:

git remote add kcnews https://github.com/SEU-USUARIO/KCNews.git
git push kcnews claude/chiefs-news-sources-IP1vA:main
```

### 2. Deploy no Railway

1. **Acesse:** https://railway.app
2. **Login** com sua conta GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Escolha **"KCNews"**
6. Aguarde o build (2-3 minutos)

### 3. Configurar Variáveis

No dashboard do Railway, vá em **Variables** e adicione:

```
NODE_ENV=production
CORS_ORIGIN=*
LOG_LEVEL=info
```

### 4. Adicionar Storage Persistente

**IMPORTANTE** para não perder os dados:

1. No Railway, vá em **Settings**
2. Click em **Volumes**
3. Click **"Add Volume"**
4. Mount Path: `/app/data`
5. Size: `1` (1GB)
6. Click **"Add"**

Depois, adicione nas **Variables**:
```
DATABASE_PATH=/app/data/news.db
```

### 5. Obter URL

1. No Railway, vá em **Settings**
2. Click em **Generate Domain**
3. Sua URL será algo como: `kcnews.up.railway.app`

### 6. Testar

```bash
curl https://kcnews.up.railway.app/health
```

Acesse no navegador:
```
https://kcnews.up.railway.app
```

## 🎉 Pronto!

Sua aplicação está no ar!

### Próximos passos:

1. **Custom Domain (Opcional)**
   - Railway Settings → Domains → Add custom domain
   - Configure DNS do seu domínio

2. **Monitorar**
   - Railway Dashboard → Metrics
   - Veja uso de CPU, RAM, etc.

3. **Logs**
   - Railway Dashboard → Deployments → View Logs

4. **Updates Automáticos**
   - Todo `git push` faz novo deploy automaticamente!

---

## 🆘 Problemas?

### "No feeds configured"
- Aguarde 1-2 minutos após deploy
- O servidor está iniciando

### "Database locked"
- Verifique se o Volume está montado corretamente
- Path deve ser `/app/data/news.db`

### Site muito lento
- Free tier do Railway pode ter cold starts
- Considere upgrade ou use VPS

### Deploy falhou
- Verifique os logs no Railway
- Certifique-se que `package.json` está correto
- Rode `npm install` localmente primeiro

---

## 📖 Mais Opções

Para outras plataformas (Render, Vercel, VPS), veja:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia completo

---

🏈 **Go Chiefs!** Boa sorte!
