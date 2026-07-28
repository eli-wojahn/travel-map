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

## 🛡️ RLS Hardening (Supabase)

### Resultado da Auditoria

- [x] `public.geocoding_cache`: RLS habilitado, sem grants para `anon`, status `PASS`
- [x] `public.places`: RLS habilitado, sem grants para `anon`, status `PASS`
- [ ] `public.spatial_ref_sys`: tabela da extensão PostGIS, alteração de owner não disponível no projeto

### Exceção Técnica Registrada

`public.spatial_ref_sys` é uma tabela de metadata da extensão PostGIS e pode ser gerenciada por owner do sistema. Em ambientes Supabase onde o projeto não é owner dessa tabela, comandos de hardening (ALTER/REVOKE/POLICY) podem falhar por privilégio insuficiente. O risco funcional para dados do app foi mitigado com `PASS` nas tabelas de aplicação.

### Runbook: `rls_disabled_in_public` em `public.spatial_ref_sys`

1. Execute `supabase/rls_hardening.sql`.
2. Se houver `SQLSTATE 42501` (`must be owner of table spatial_ref_sys`), execute `supabase/fix_spatial_ref_sys_rls.sql` para coletar diagnóstico.
3. Verifique se ainda existem grants para `anon` e `authenticated` em `public.spatial_ref_sys`.
4. Abra ticket no suporte Supabase com:
   - Erro `SQLSTATE 42501`
   - Resultado de owner da tabela (`table_owner`)
   - Resultado de owner da extensão (`extension_owner`)
   - Lista de grants remanescentes para `anon` e `authenticated`
5. Solicite remediação owner-level: habilitar RLS e remover grants de `anon`/`authenticated` na tabela `public.spatial_ref_sys`.

Template sugerido para o ticket:

```text
Security Advisor reports rls_disabled_in_public on public.spatial_ref_sys.
Our project role cannot remediate it: SQLSTATE 42501 must be owner of table spatial_ref_sys.
Current grants still include anon/authenticated privileges.
Please apply owner-level remediation in this project: enable RLS on public.spatial_ref_sys and remove anon/authenticated table grants.
```

### Evidências e Scripts

- Hardening inicial: `supabase/rls_hardening.sql`
- Hardening de privilégios da tabela principal: `supabase/places_privileges_hardening.sql`
- Validação técnica: `supabase/rls_validation.sql`
- Auditoria focada em tabelas da aplicação: `supabase/rls_audit_app_tables.sql`

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
