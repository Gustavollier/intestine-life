
# Remoção de IA e plano Pro do Intestine Life

Mantém só o que continua funcionando sem assinatura do Lovable: registros de evacuações, alimentação, hidratação, gamificação, escala de Bristol, guia digestivo, perfil, autenticação e o localizador de consultórios (usa Google Places com chave própria do usuário, não Lovable AI).

## O que será removido

### Funcionalidades de IA (Lovable AI)
- Chatbot "Dr. Intestine" — botão flutuante e janela de chat
- Análise do dia e do mês pelo Dr. Intestine (botões no calendário e no resumo do mês)
- Card de "Insights Inteligentes" (correlações automáticas)

### Plano Pro / Stripe
- Modal de upgrade (`ProUpgradeModal`)
- Tela de checkout embutida (`StripeCheckout`)
- Botões "Seja Pro", "Gerenciar assinatura", badge Crown/Pro no header e menu
- Verificação de assinatura e portal do cliente na tela de Perfil
- Limites diários (não fazem mais sentido sem IA)

## Arquivos a deletar

Frontend:
- `src/components/ChatWidget.tsx`
- `src/components/InsightsCard.tsx`
- `src/components/ProUpgradeModal.tsx`
- `src/components/StripeCheckout.tsx`

Edge functions (e remover do deploy):
- `supabase/functions/chat/`
- `supabase/functions/analyze-day/`
- `supabase/functions/get-insights/`
- `supabase/functions/check-subscription/`
- `supabase/functions/create-checkout/`
- `supabase/functions/customer-portal/`

Mantidos:
- `supabase/functions/search-clinics/` (Google Places, chave própria)
- `supabase/functions/get-gamification/` (sem IA)

## Arquivos a editar

- `src/pages/Dashboard.tsx`: remover imports e estados de IA (`analysisText`, `analysisLoading`, `analysisType`, modais de análise/insights/upgrade), botões "Analisar dia/mês", `<InsightsCard>`, `<ChatWidget>`, `<ProUpgradeModal>`, item "Seja Pro" / Crown do header e menu mobile, e consultas a `analysis_usage`.
- `src/pages/Profile.tsx`: remover importações Stripe, seção de assinatura (status, "Seja Pro", gerenciar assinatura), `checkSubscription`, `customer-portal`, e o componente `<StripeCheckout>`. Manter dados pessoais, logout, etc.
- Limpar imports não usados (`Bot`, `Crown`, `Lightbulb`, `Lock`, `ReactMarkdown` se órfão, etc.).

## Banco de dados

Migration para remover tabelas que ficam órfãs:
- `DROP TABLE` em `analysis_usage` e `chat_usage`.
- Manter `profiles` (a coluna `plan` fica, ignorada — sem risco de quebrar nada agora; podemos remover depois se quiser).

## Segredos

Não removo automaticamente, mas o `LOVABLE_API_KEY` e `STRIPE_SECRET_KEY` ficarão sem uso. Posso listá-los para você apagar manualmente em Project Settings → Secrets se quiser.

## GitHub

O projeto já está conectado, então todas as mudanças (deletes incluídos) sincronizam automaticamente para o repositório após a implementação. Nada a fazer manualmente.

## Validação

- Build sem erros e sem imports órfãos
- Dashboard carrega sem chat flutuante, sem botões de análise, sem card de insights, sem botão Pro
- Perfil carrega sem seção de assinatura
- Localizador de consultórios continua funcionando
