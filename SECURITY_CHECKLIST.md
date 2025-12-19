# 🔒 Checklist de Segurança - Travel Map

## ✅ Arquivos Sensíveis Protegidos

### Arquivos com Credenciais (NÃO devem ser commitados):
- [x] `.env.local` - **✅ PROTEGIDO** (no .gitignore)
- [x] `.env` - **✅ PROTEGIDO** (no .gitignore)
- [x] `.env*.local` - **✅ PROTEGIDO** (no .gitignore)

### Arquivos Seguros para Commit:
- [x] `.env.local.example` - **✅ SEGURO** (apenas template, sem valores reais)
- [x] `SUPABASE_SETUP.md` - **✅ SEGURO** (apenas instruções)

---

## 🔍 Auditoria de Código

### Verificações Realizadas:
- [x] **Sem chaves hardcoded**: Todas as chaves usam `process.env.*`
- [x] **Sem senhas no código**: Nenhuma senha encontrada
- [x] **Sem tokens expostos**: Apenas referências a variáveis de ambiente
- [x] **Arquivos .pem protegidos**: No .gitignore
- [x] **Node_modules ignorado**: No .gitignore
- [x] **Build folders ignorados**: `.next/`, `out/`, `build/` no .gitignore

### Variáveis de Ambiente Usadas (todas seguras):
```typescript
// Públicas (podem ser expostas no cliente)
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ✅ Segura para expor (protegida por RLS)

// Privadas (apenas servidor)
process.env.SUPABASE_SERVICE_ROLE_KEY      // ⚠️ NUNCA expor no cliente
```

---

## 📋 Antes de Fazer Push para GitHub

### 1. Verificar o que será commitado:
```bash
git status
```

### 2. Confirmar que .env.local NÃO aparece:
```bash
git check-ignore .env.local  # Deve retornar ".env.local"
```

### 3. Ver diff antes de commitar:
```bash
git diff
```

### 4. Commit seguro:
```bash
git add .
git commit -m "feat: integração completa com Supabase + autenticação Google OAuth"
git push origin master
```

---

## 🚀 Deploy na Vercel

### Variáveis de Ambiente a Configurar:

No **Vercel Dashboard** → **Settings** → **Environment Variables**, adicione:

| Nome | Valor | Onde obter |
|------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxxxx...` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxxxx...` | Supabase Dashboard → Project Settings → API → service_role |

⚠️ **IMPORTANTE**: Marque `SUPABASE_SERVICE_ROLE_KEY` como **"Production only"** (não usar em Preview)

---

## 🔐 Configurações Adicionais

### Google Cloud Console:
Após deploy, adicione a URL de produção:

1. **Authorized JavaScript origins**:
   - `https://seu-app.vercel.app`

2. **Authorized redirect URIs**:
   - `https://seu-projeto.supabase.co/auth/v1/callback`

### Supabase Dashboard:
1. Vá em **Authentication** → **URL Configuration**
2. Adicione em **Site URL**: `https://seu-app.vercel.app`
3. Adicione em **Redirect URLs**: `https://seu-app.vercel.app/**`

---

## ✅ Status Final

- **Código limpo**: ✅ Sem credenciais hardcoded
- **Gitignore configurado**: ✅ Arquivos sensíveis protegidos
- **Variáveis de ambiente**: ✅ Usando process.env corretamente
- **Pronto para deploy**: ✅ Seguro para subir no GitHub

---

## 🆘 Em Caso de Exposição Acidental

Se por acaso você commitou credenciais:

1. **Revoke imediatamente** no Supabase Dashboard
2. Gere novas chaves
3. Use `git filter-branch` ou `BFG Repo-Cleaner` para remover do histórico
4. Force push (com cuidado): `git push --force`

---

## 📞 Checklist de Verificação Rápida

Antes de cada push:
```bash
# 1. Verificar arquivos
git status

# 2. Ver o que vai ser commitado
git diff --cached

# 3. Buscar por possíveis credenciais (não deve retornar nada)
git diff --cached | grep -i "password\|secret\|key.*=.*['\"]"

# 4. Se tudo OK, prossiga com push
git push origin master
```

---

**✅ SEGURO PARA COMMIT E DEPLOY!**
