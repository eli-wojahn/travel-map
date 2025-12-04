# 🌍 Lugares do Mundo

Um mapa interativo onde você pode marcar e visualizar todos os lugares que já visitou no mundo.

## 🚀 Funcionalidades

- **Mapa Interativo**: Visualize seus lugares em um mapa usando OpenStreetMap
- **Adicionar Cidades**: 
  - Digite o nome da cidade em um campo de busca
  - Clique diretamente no mapa para adicionar um local
- **Geocodificação Automática**: Conversão automática de nomes de cidades em coordenadas
- **Lista de Cidades**: Visualize todas as cidades visitadas em uma lista organizada
- **Persistência Local**: Todos os dados são salvos no localStorage do navegador
- **Remoção de Lugares**: Remova facilmente qualquer cidade da lista

## 🛠️ Tecnologias

- **Next.js 14+** (App Router)
- **React 18** com TypeScript
- **React-Leaflet** para mapas interativos
- **OpenStreetMap / Nominatim** para geocodificação (gratuito e open-source)
- **Tailwind CSS** para estilização
- **localStorage** para persistência de dados
 - **react-simple-maps** para visualização simplificada de países (mapa estático)
 - **world-countries** para metadados de países usados pelo mapa simplificado

## 📦 Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
mapa/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── Map.tsx           # Componente do mapa (React-Leaflet)
│   ├── CityInput.tsx     # Input para adicionar cidades
│   └── CityList.tsx      # Lista de cidades visitadas
├── hooks/                # Hooks customizados
│   └── usePlaces.ts      # Hook para gerenciar lugares
├── lib/                  # Utilitários
│   ├── geocoding.ts      # Função de geocodificação (Nominatim)
│   └── storage.ts        # Funções de localStorage
└── types/                # Tipos TypeScript
    └── index.ts          # Interfaces e tipos
```

## 🎯 Como Usar

1. **Adicionar cidade por nome:**
   - Digite o nome da cidade no campo de input
   - Clique em "Adicionar"
   - O sistema buscará automaticamente as coordenadas

2. **Adicionar cidade clicando no mapa:**
   - Clique em qualquer ponto do mapa
   - O sistema tentará identificar o nome do local automaticamente

3. **Remover cidade:**
   - Clique no botão "Remover" ao lado de qualquer cidade na lista

## 🔧 Configurações Importantes

### SSR e Leaflet

O Leaflet não funciona com Server-Side Rendering (SSR). Por isso, o componente `Map` é importado dinamicamente com `ssr: false`:

```typescript
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
});
```

### Geocodificação

O projeto usa a API **Nominatim** do OpenStreetMap, que é:
- ✅ Gratuita
- ✅ Open-source
- ✅ Não requer chave API
- ⚠️ Requer um User-Agent adequado nas requisições

### Limites da API Nominatim

A API Nominatim tem limites de uso:
- **1 requisição por segundo** (rate limiting)
- Para uso intensivo, considere usar uma instância própria ou alternativas pagas

## 🚧 Funcionalidades Futuras

- [ ] Autenticação de usuários
- [ ] Sincronização com banco de dados
- [ ] Exportar/importar lista de cidades
- [ ] Contagem de países e continentes visitados
- [ ] Estatísticas e gráficos
- [ ] Compartilhamento de mapas

## 📝 Licença

Este projeto é open-source e está disponível para uso livre.

## 🙏 Créditos

- **OpenStreetMap** pelos dados de mapas
- **Nominatim** pela API de geocodificação
- **Leaflet** pela biblioteca de mapas

