

# Localizador de Consultórios de Proctologia

## Como funciona

1. O navegador pede permissão de localização ao usuário
2. Com as coordenadas (latitude/longitude), uma função backend consulta a Google Places API buscando por "proctologista" ou "proctologia" próximos
3. Os resultados são exibidos em cards com nome, endereço, telefone, avaliação e distância
4. Opcionalmente, um mapa interativo mostra os consultórios no mapa

## Arquitetura

```text
[Navegador]                    [Backend]                  [Google]
    |                              |                          |
    |-- navigator.geolocation ---->|                          |
    |                              |-- Places API (nearby) -->|
    |                              |<-- resultados ---------- |
    |<-- lista de consultórios ----|                          |
```

## O que precisa ser feito

### 1. Configurar API Key do Google Places
- Criar uma chave na Google Cloud Console com a Places API habilitada
- Armazenar como secret no backend (GOOGLE_PLACES_API_KEY)

### 2. Criar função backend `search-clinics`
- Recebe latitude, longitude e raio de busca
- Consulta Google Places API (Text Search ou Nearby Search) por termos como "proctologista", "proctologia"
- Retorna nome, endereco, telefone, avaliacao, horario de funcionamento e coordenadas

### 3. Nova página `/clinics`
- Solicita permissão de geolocalização
- Exibe os resultados em cards organizados por distância
- Cada card mostra: nome, endereço, avaliação (estrelas), telefone e botão para abrir no Google Maps
- Filtro de raio de busca (5km, 10km, 25km)
- Estado de loading com skeletons
- Fallback caso o usuário negue a localização (campo para digitar CEP/cidade)

### 4. Navegação
- Adicionar link na sidebar/menu do dashboard
- Rota protegida como as demais

## Detalhes Técnicos

### Função backend (`supabase/functions/search-clinics/index.ts`)
- Usa `GOOGLE_PLACES_API_KEY` do ambiente
- Endpoint: `https://maps.googleapis.com/maps/api/place/textsearch/json`
- Query: `proctologista` com `location` e `radius`
- Sem limites de uso para o usuário (não consome créditos internos)

### Página (`src/pages/Clinics.tsx`)
- `navigator.geolocation.getCurrentPosition()` para obter coordenadas
- Chama a edge function via `supabase.functions.invoke("search-clinics")`
- Exibe resultados em grid responsivo de cards

### Custos
- Google Places API tem camada gratuita generosa (sem custo para volume baixo)
- Nenhum dado precisa ser armazenado no banco

## Pré-requisito
- Criar uma chave de API no Google Cloud Console com a Places API (New) habilitada
- A chave será armazenada de forma segura como secret no backend

