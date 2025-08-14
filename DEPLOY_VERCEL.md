# 🚀 Guia Completo de Deploy na Vercel

## ✅ Checklist Pré-Deploy

- [ ] Conta na Vercel criada (vercel.com)
- [ ] Repositório GitHub com o código
- [ ] Banco PostgreSQL configurado (Neon, Supabase, etc.)

## 📋 Passo a Passo

### 1. Preparar o Banco de Dados
Crie um banco PostgreSQL em um destes serviços (recomendado):
- **Neon** (neon.tech) - Gratuito, integração perfeita com Vercel
- **Supabase** (supabase.com) - Gratuito com 500MB
- **Railway** (railway.app) - $5/mês

### 2. Configurar Variáveis de Ambiente
No dashboard da Vercel, vá em **Project Settings > Environment Variables**:

**OBRIGATÓRIAS:**
```
DATABASE_URL=postgresql://usuario:senha@host:5432/database
SESSION_SECRET=sua_chave_secreta_super_forte_aqui
NODE_ENV=production
```

**OPCIONAIS (OAuth):**
```
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
FACEBOOK_CLIENT_ID=seu_facebook_app_id
FACEBOOK_CLIENT_SECRET=seu_facebook_app_secret
```

**OPCIONAIS (Email):**
```
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail
```

### 3. Deploy na Vercel

#### Opção A: Via Interface Web
1. Conecte seu GitHub à Vercel
2. Selecione o repositório
3. A Vercel detectará automaticamente a configuração
4. Clique em **Deploy**

#### Opção B: Via CLI
```bash
npm i -g vercel
vercel
```

### 4. Configurar URLs de Callback (OAuth)

Se usar OAuth, configure nos respectivos serviços:

**Google Cloud Console:**
- Authorized redirect URIs: `https://seu-projeto.vercel.app/auth/google/callback`

**Facebook Developers:**
- Valid OAuth Redirect URIs: `https://seu-projeto.vercel.app/auth/facebook/callback`

### 5. Executar Migrações do Banco

Após o primeiro deploy, execute via terminal local:
```bash
# Configure a DATABASE_URL localmente ou use .env
npm run db:push
```

## 🎯 URLs Finais

- **Frontend:** `https://seu-projeto.vercel.app`
- **API:** `https://seu-projeto.vercel.app/api/...`
- **Admin:** Login com credenciais criadas

## ⚠️ Pontos Importantes

### Upload de Arquivos
- **Desenvolvimento:** Funciona normalmente
- **Produção:** Arquivos ficam na memória (temporário)
- **Recomendação:** Integrar com Cloudinary, AWS S3 ou Vercel Blob

### Banco de Dados
- Use sempre SSL em produção
- Neon oferece conexão automática com SSL
- Configure connection pooling para melhor performance

### Debugging
Se algo não funcionar:
1. Verifique os logs na Vercel (Functions tab)
2. Confirme variáveis de ambiente
3. Teste a conexão com banco
4. Verifique URLs de callback

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build local
npm run build

# Verificar tipos
npm run check

# Migração do banco
npm run db:push
```

## 📞 Suporte

- **Vercel Docs:** vercel.com/docs
- **Drizzle ORM:** orm.drizzle.team
- **Issues do projeto:** Via GitHub Issues

---

**🎉 Seu app estará rodando em `https://seu-projeto.vercel.app` após o deploy!**