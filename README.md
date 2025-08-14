# 🎉 Event Management Platform

Uma plataforma moderna de gerenciamento de eventos construída com React.js, TypeScript, Express.js e PostgreSQL. Projetada para simplificar o planejamento, acompanhamento e engajamento de eventos através de design intuitivo e recursos poderosos.

## 🚀 Características Principais

- **Autenticação Completa**: Sistema local + OAuth (Google, Facebook)
- **Gerenciamento de Eventos**: Criação, edição e acompanhamento de eventos
- **Registro de Participantes**: Sistema de inscrições e confirmações
- **Upload de Imagens**: Para eventos com suporte a múltiplos formatos
- **Dashboard Analítico**: Estatísticas e métricas em tempo real
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Logs de Atividade**: Rastreamento completo de ações do sistema

## 🛠️ Stack Tecnológica

- **Frontend**: React.js + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Banco de Dados**: PostgreSQL + Drizzle ORM
- **UI/UX**: shadcn/ui + Tailwind CSS
- **Autenticação**: Passport.js (Local + OAuth)
- **Upload**: Multer
- **Email**: Nodemailer
- **Deploy**: Vercel (configurado)

## 🏁 Deploy na Vercel

### Pré-requisitos
1. Conta na Vercel (vercel.com)
2. Repositório GitHub com o código
3. Banco de dados PostgreSQL (recomendo Neon, Supabase, ou Railway)

### Passos para Deploy

#### 1. Configurar Variáveis de Ambiente na Vercel
Acesse o dashboard da Vercel > Project Settings > Environment Variables e adicione:

```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
SESSION_SECRET=sua_chave_secreta_aleatoria_muito_forte
GOOGLE_CLIENT_ID=seu_google_client_id (opcional)
GOOGLE_CLIENT_SECRET=seu_google_client_secret (opcional)  
EMAIL_USER=seu_email@gmail.com (opcional)
EMAIL_PASS=sua_senha_de_app (opcional)
FACEBOOK_CLIENT_ID=seu_facebook_app_id (opcional)
FACEBOOK_CLIENT_SECRET=seu_facebook_app_secret (opcional)
NODE_ENV=production
```

#### 2. Deploy via GitHub
1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente a configuração via `vercel.json`
3. O deploy será executado automaticamente

#### 3. Configuração do Banco de Dados
Após o primeiro deploy, execute as migrações:
```bash
npm run db:push
```

### Estrutura de Deploy

- **Frontend**: Build com Vite → `dist/public`
- **Backend**: Função serverless → `api/index.ts`
- **Banco**: PostgreSQL com Drizzle ORM
- **Uploads**: Configurados para memória (requer integração com serviço de nuvem)

### URLs de Produção
- Frontend: `https://seu-projeto.vercel.app`
- API: `https://seu-projeto.vercel.app/api/*`

### Observações Importantes

1. **Upload de Arquivos**: No ambiente de produção da Vercel, o upload de arquivos está configurado para usar memória. Para produção real, integre com:
   - AWS S3
   - Cloudinary  
   - Vercel Blob
   - Outros serviços de armazenamento

2. **OAuth Callbacks**: Configure os URLs de callback nos serviços OAuth:
   - Google: `https://seu-projeto.vercel.app/auth/google/callback`
   - Facebook: `https://seu-projeto.vercel.app/auth/facebook/callback`

3. **Banco de Dados**: Use um serviço gerenciado como:
   - Neon (recomendado para Vercel)
   - Supabase
   - Railway
   - PlanetScale

### Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build do projeto
npm run build

# Verificar tipos TypeScript
npm run check

# Push do schema do banco
npm run db:push
```

### Solução de Problemas

1. **Erro de conexão com banco**: Verifique se DATABASE_URL está correto
2. **Erro de OAuth**: Confirme os URLs de callback
3. **Erro de upload**: Configure serviço de armazenamento em nuvem
4. **Erro de sessão**: Verifique se SESSION_SECRET está definido

### Suporte
Para problemas específicos do projeto, consulte o arquivo `replit.md`