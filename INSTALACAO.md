# 🚀 Guia de Instalação Rápida

## Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências necessárias:
- Next.js 14+
- React 18
- TypeScript
- React-Leaflet e Leaflet
- Tailwind CSS

### 2. Executar o Projeto

```bash
npm run dev
```

### 3. Acessar a Aplicação

Abra seu navegador em: **http://localhost:3000**

## 📋 Comandos Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção (após build)
- `npm run lint` - Executa o linter

## ⚠️ Observações Importantes

### SSR e Leaflet

O projeto já está configurado para lidar com Server-Side Rendering (SSR) do Next.js. O componente `Map` é carregado dinamicamente apenas no cliente, evitando erros de hidratação.

### Geocodificação

O projeto usa a API **Nominatim** do OpenStreetMap, que é gratuita e não requer chave API. No entanto, há um limite de **1 requisição por segundo**.

### localStorage

Todos os dados são salvos no localStorage do navegador. Se você limpar os dados do navegador, perderá suas cidades salvas.

## 🐛 Problemas Comuns

### Erro: "Module not found: Can't resolve 'leaflet'"

Execute novamente:
```bash
npm install
```

### Mapa não aparece

Certifique-se de que o componente está sendo renderizado apenas no cliente. O projeto já está configurado corretamente, mas se você criar novos componentes que usam Leaflet, lembre-se de usar `'use client'` e importação dinâmica.

### Erro de geocodificação

A API Nominatim pode estar temporariamente indisponível ou você pode estar fazendo muitas requisições. Aguarde alguns segundos e tente novamente.

## ✅ Pronto!

Agora você pode:
- Digitar o nome de uma cidade e adicioná-la
- Clicar no mapa para adicionar um local
- Ver todas as cidades na lista lateral
- Remover cidades clicando em "Remover"

