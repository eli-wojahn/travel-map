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
   ```

4. ⚠️ **IMPORTANTE**: Nunca commite o `.env.local` (já está no .gitignore)

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

