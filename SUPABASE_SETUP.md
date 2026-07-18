# 🚀 Guia de Setup - Supabase

## 📋 Checklist de Configuração

### 1️⃣ Executar SQL no Supabase Dashboard

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor** (ícone de banco de dados na lateral)
3. Clique em **"New Query"**
4. Copie TODO o conteúdo do arquivo `supabase/schema.sql`
5. Cole no editor e clique em **"Run"** (ou Ctrl+Enter)
6. ✅ Você deve ver a mensagem "Success. No rows returned"

**O que isso cria:**
- ✅ Tabela `places` com todos os campos necessários
- ✅ Índices para performance (incluindo geoespacial)
- ✅ Row Level Security (RLS) - segurança automática por usuário
- ✅ Funções SQL para estatísticas e busca por proximidade
- ✅ Tabela de cache de geocoding (opcional)

---

### 2️⃣ Configurar Variáveis de Ambiente

1. Copie suas credenciais do Supabase:
   - Vá em **Project Settings** > **API**
   - Copie a **Project URL**
   - Copie a **anon public key**
   - Copie a **service_role key** (⚠️ privada)

2. Abra o arquivo `.env.local` na raiz do projeto

3. Preencha com suas credenciais:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada-aqui
   KEEP_ALIVE_SECRET=gere-um-token-longo-e-aleatorio
   ```

4. ⚠️ **IMPORTANTE**: Nunca commite o `.env.local` (já está no .gitignore)

5. O `KEEP_ALIVE_SECRET` deve existir também no provedor onde a aplicação está hospedada
   - Na Vercel: **Project Settings** > **Environment Variables**
   - Use o mesmo valor que será configurado no GitHub Actions

---

### 3️⃣ Configurar Google OAuth (Autenticação)

1. No Supabase Dashboard, vá em **Authentication** > **Providers**

2. Encontre **Google** e clique para expandir

3. **Habilite** o provider Google

4. Você precisa criar um projeto no Google Cloud:
   
   **4.1. Criar projeto no Google Cloud Console**
   - Acesse: https://console.cloud.google.com/
   - Crie um novo projeto (ex: "Travel Map")
   
   **4.2. Configurar OAuth Consent Screen**
   - Vá em **APIs & Services** > **OAuth consent screen**
   - Escolha **External**
   - Preencha:
     - App name: `Travel Map`
     - User support email: seu email
     - Developer contact: seu email
   - Clique em **Save and Continue**
   - Em **Scopes**, adicione: `email`, `profile`, `openid`
   - Clique em **Save and Continue**
   - Em **Test users**, adicione seu email para testar
   - Clique em **Save and Continue**
   
   **4.3. Criar OAuth Client ID**
   - Vá em **APIs & Services** > **Credentials**
   - Clique em **Create Credentials** > **OAuth client ID**
   - Escolha **Web application**
   - Nome: `Travel Map Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-dominio.vercel.app` (para produção)
   - **Authorized redirect URIs**:
     - `https://xxxxx.supabase.co/auth/v1/callback` (copie do Supabase)
   - Clique em **Create**
   - ✅ Copie o **Client ID** e **Client Secret**

5. **De volta ao Supabase:**
   - Cole o **Client ID** do Google
   - Cole o **Client Secret** do Google
   - Clique em **Save**

---

### 4️⃣ Instalar Dependências

Execute no terminal:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

### 5️⃣ Verificar Setup

Para verificar se tudo está funcionando:

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Verifique se não há erros no console

3. As próximas etapas serão:
   - ✅ Criar cliente Supabase (`lib/supabase.ts`)
   - ✅ Implementar páginas de login/signup
   - ✅ Proteger rotas com middleware
   - ✅ Migrar hook `usePlaces` para usar Supabase
   - ✅ Adicionar migração automática de localStorage

### 6️⃣ Configurar Keep-Alive Automático

Se quiser reduzir a chance de o projeto free-tier entrar em pausa por inatividade:

1. Faça deploy da aplicação com a variável `KEEP_ALIVE_SECRET` configurada.
2. No GitHub, abra **Settings** > **Secrets and variables** > **Actions**.
3. Crie os secrets:
   - `KEEP_ALIVE_URL`: URL completa da rota publicada, por exemplo `https://seu-dominio.com/api/keep-alive`
   - `KEEP_ALIVE_SECRET`: o mesmo valor usado em `KEEP_ALIVE_SECRET` no deploy
4. O workflow [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) roda a cada 6 horas e também pode ser disparado manualmente.
5. Para testar localmente ou manualmente:

   ```bash
   curl -H "Authorization: Bearer $KEEP_ALIVE_SECRET" http://localhost:3000/api/keep-alive
   ```

### Endpoint Implementado

- Rota: `/api/keep-alive`
- Autenticação: `Authorization: Bearer <KEEP_ALIVE_SECRET>` (ou `CRON_SECRET`) e também suporta header `x-keep-alive-secret`
- Comportamento: faz uma consulta leve na tabela `places` para registrar atividade no projeto Supabase

### Checklist Operacional

Use esta sequência para configurar sem erro:

1. Gere ou reutilize um token forte para `KEEP_ALIVE_SECRET`.
2. No provedor de deploy, adicione a env `KEEP_ALIVE_SECRET` com esse valor.
3. Faça redeploy da aplicação para publicar a nova env.
4. No GitHub, abra **Settings** > **Secrets and variables** > **Actions**.
5. Crie `KEEP_ALIVE_URL` com a URL pública completa da rota, por exemplo `https://seu-dominio.com/api/keep-alive`.
6. Crie `KEEP_ALIVE_SECRET` com exatamente o mesmo valor do deploy.
7. Abra **Actions** > **Supabase Keep Alive** > **Run workflow** para testar manualmente.
8. Confirme que o job terminou com sucesso e que a chamada retornou HTTP 200.

### Recomendação Importante (Confiabilidade)

- Workflows agendados do GitHub podem ser desativados automaticamente em repositórios sem atividade por longos períodos.
- Para reduzir esse risco, configure também um segundo agendador externo (ex.: cron do provedor de deploy ou UptimeRobot) chamando `/api/keep-alive` com o mesmo secret.
- Em deploys na Vercel, você pode usar `CRON_SECRET` e agendar chamadas internas para a rota sem depender apenas do GitHub Actions.

### Como Validar

Se quiser testar antes do cron:

```bash
curl -i -H "Authorization: Bearer $KEEP_ALIVE_SECRET" https://seu-dominio.com/api/keep-alive
```

Resultado esperado:

- `200 OK`: keep-alive funcionando
- `401 Unauthorized`: secret do request diferente do deploy
- `500 No keep-alive secret is configured`: faltou configurar `KEEP_ALIVE_SECRET` ou `CRON_SECRET`
- `500 Supabase admin credentials are not configured`: faltou `SUPABASE_SERVICE_ROLE_KEY` no deploy
- `503 Supabase keep-alive failed`: a rota respondeu, mas a consulta no Supabase falhou

---

## 🆘 Problemas Comuns

### "relation 'places' does not exist"
- ✅ Execute o SQL no Supabase SQL Editor
- ✅ Verifique se a query rodou sem erros

### "Invalid API key"
- ✅ Verifique se copiou as chaves corretas do Supabase
- ✅ Reinicie o servidor de desenvolvimento após alterar `.env.local`

### "Google OAuth not working"
- ✅ Verifique se adicionou a Redirect URI correta no Google Cloud Console
- ✅ Verifique se habilitou o provider Google no Supabase
- ✅ Verifique se o Client ID e Secret estão corretos

---

## 📞 Próximas Etapas

Após completar este setup, me avise e vamos implementar:
1. Cliente Supabase e tipos TypeScript
2. Sistema de autenticação (login/signup)
3. Migração do hook `usePlaces`
4. Migração automática de dados do localStorage

