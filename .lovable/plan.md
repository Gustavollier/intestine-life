
# Pagina Educativa: Guia do Sistema Digestivo

## Objetivo
Criar uma pagina interativa e visualmente atraente que explica cada parte do sistema digestivo, sua funcao, sinais de alerta e dicas de saude. A pagina tera animacoes com `framer-motion` e ilustracoes SVG inline para engajar o usuario.

## Estrutura da Pagina

A pagina sera dividida em secoes scrollaveis, cada uma representando uma parte do trato digestivo:

1. **Hero / Introducao** — Titulo animado + ilustracao do sistema digestivo completo
2. **Boca e Esofago** — Onde tudo comeca (mastigacao, degluticao)
3. **Estomago** — Digestao acida e enzimas
4. **Intestino Delgado** — Absorcao de nutrientes (duodeno, jejuno, ileo)
5. **Intestino Grosso** — Absorcao de agua, formacao das fezes
6. **Reto e Anus** — Eliminacao
7. **Dicas Gerais de Saude Intestinal** — Card final com recomendacoes praticas

Cada secao tera:
- Icone/ilustracao SVG animada
- Titulo e descricao da funcao
- Card de "Sinais de Alerta" (com icone de alerta)
- Card de "Dicas de Saude" (com icone de coracao/check)

## Navegacao

- Botao de voltar ao Dashboard (mesmo padrao da pagina Bristol Scale)
- Link acessivel a partir do Dashboard (botao ou menu)
- Rota protegida: `/digestive-guide`

## Animacoes (framer-motion)

- **Fade-in + slide-up** nas secoes conforme o usuario faz scroll (viewport entry)
- **Stagger** nos cards de cada secao (aparecem um apos o outro)
- **Hover scale** nos cards de dicas e sinais de alerta
- **Pulse suave** nos icones SVG inline para dar vida

## Detalhes Tecnicos

### Arquivos a criar
1. **`src/pages/DigestiveGuide.tsx`** — Pagina principal com todas as secoes
2. **`src/components/DigestiveSection.tsx`** — Componente reutilizavel para cada secao do trato digestivo

### Arquivos a modificar
1. **`src/App.tsx`** — Adicionar rota `/digestive-guide` protegida
2. **`src/pages/Dashboard.tsx`** — Adicionar botao/link para acessar a pagina
3. **`package.json`** — Instalar `framer-motion`

### Dependencia nova
- `framer-motion` — biblioteca de animacoes para React

### Padrao de design
- Seguir o mesmo esquema de cores do projeto (primary verde, cards com bg-card, dark mode completo)
- Usar componentes existentes: `Card`, `Button`, `ScrollArea`
- Ilustracoes feitas com SVG inline ou emojis estilizados (sem necessidade de assets externos)
- Responsivo: layout em coluna unica no mobile, cards lado a lado no desktop

### Conteudo das secoes (resumo)

| Orgao | Funcao | Sinal de Alerta | Dica |
|-------|--------|-----------------|------|
| Boca/Esofago | Mastigacao e transporte | Dificuldade para engolir, azia frequente | Mastigar bem, comer devagar |
| Estomago | Digestao acida | Queimacao, nausea, refluxo | Evitar comer deitado, reduzir alimentos acidos |
| Intestino Delgado | Absorcao de nutrientes | Inchaço, diarreia cronica, perda de peso | Dieta balanceada, probioticos |
| Intestino Grosso | Absorcao de agua, fezes | Constipacao, sangue nas fezes | Fibras, hidratacao, exercicio |
| Reto/Anus | Eliminacao | Dor ao evacuar, hemorroidas | Nao segurar, postura correta |

### Dark mode
- Todos os cards e secoes terao variantes dark completas, seguindo o padrao ja existente no projeto (ex: `dark:bg-card dark:text-card-foreground`)
