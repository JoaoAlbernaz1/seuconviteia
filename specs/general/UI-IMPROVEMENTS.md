# UI/UX — Auditoria do painel (2026-07-03)

Auditoria completa do painel (`/painel/*`): login, home, wizard 4 passos, telas
focadas por evento, perfil e plano. Método: navegação real via Playwright
(desktop 1440 + mobile 390, 32 screenshots), inspeção de computed styles e
leitura do código. Zero erros de JS no console.

## Resumo

O painel está **completo em fluxos** (criar → montar → publicar → acompanhar,
com preview ao vivo em toda tela de edição) e com ótimos padrões de UX
(confirmação de exclusão em 2 toques, feedback "Copiado ✓", empty states com
próxima ação, checklist de publicação com "Pronto ✓"). Porém uma **regressão
sistêmica de tema** estava degradando TODAS as telas silenciosamente, e as
linhas dinâmicas de presentes/programação estavam quebradas.

## Críticos (corrigidos nesta sessão)

### 1. Tokens `scv-*` não geravam utilities — tema inteiro em fallback
**Estado**: `globals.css` define os tokens do painel (`--scv-card`,
`--scv-line`, `--scv-muted`…) no escopo `.scv`, mas o bloco `@theme inline`
que os mapeava para `--color-scv-*` foi removido junto com o modo escuro
(commit `96afd69`). O comentário "As utilities vem do @theme inline abaixo"
ficou órfão — o bloco não existia mais.
**Problema**: `bg-scv-card`, `border-scv-line`, `text-scv-muted`,
`bg-scv-btn` etc. simplesmente **não existiam no CSS compilado**. Computed
styles provaram: aba ativa transparente (usuário não sabe em que aba está),
cards transparentes, **todas as bordas pretas** (fallback `currentColor` do
preflight), hierarquia de texto morta (muted/faint = preto), caixa "Publicar
o site" sem o fundo tinta do mockup.
**Correção**: bloco `@theme inline` restaurado com os 16 mapeamentos
`--color-scv-*: var(--scv-*)`.
**Impacto**: o painel volta a renderizar como o mockup aprovado — bordas
suaves, aba ativa visível, cards brancos, texto com hierarquia.

### 2. Campo colapsado nas linhas de Presentes e Programação
**Estado**: nas linhas dinâmicas, o campo de valor/hora usava
`${INPUT} w-[100px]` — mas `INPUT` já traz `w-full`. Utilities de width
conflitantes no mesmo elemento: quem decide é a ordem do stylesheet, e
`w-full` ganhava.
**Problema**: o campo de valor/hora engolia a linha (~400px) e o campo de
**nome do presente / atividade ficava com 30px** — impossível de usar; o
usuário nem percebia que existia.
**Correção**: `basis-[100px]/[90px] shrink-0` no lugar do `w-[…]`
(flex-basis vence width em linha flex, sem conflito).

### 3. Wizard passo 3 — "Veja o site ao lado" mentia no celular
No mobile o preview vem **abaixo do formulário**, depois dos botões.
**Correção**: texto responsivo ("ao lado" no desktop, "logo abaixo" no
celular) — aqui e no subtítulo de "Editar o site".

### 4. Wizard passo 3 — botão Continuar desabilitado sem explicação
Sem nome/data o botão fica morto e nada diz por quê.
**Correção**: dica curta sob o botão enquanto faltar preenchimento.

## Pendências de produto (não corrigidas — decisão do dono)

- **"Esqueci minha senha"**: não existe fluxo de reset. Precisa de e-mail
  transacional (Resend, Fase 7). Até lá, suporte manual.
- **Preços no /painel/plano**: cards sem valor (slot aguardando decisão).
- **Preload de fontes do evento** dispara warnings no console em todas as
  páginas do painel (as fontes servem os cards de capa). Inofensivo; otimizar
  quando o painel ganhar bundle próprio de fontes.

## Menores (aceitáveis, registrados)

- Stepper mobile esconde os rótulos (só bolinhas) — padrão comum, ok.
- Na tela "Trocar o estilo", nenhum card fica marcado quando a combinação
  atual não bate com um preset curado — comportamento intencional.
- `input[type=date/time]` renderiza no formato do navegador (mm/dd/yyyy em
  browser en-US). Não controlável de forma confiável; usuários BR veem
  dd/mm/aaaa.

## Positivos (preservar)

- Preview do site REAL (iframe) reagindo ao vivo em toda tela de edição.
- Exclusão em 2 toques inline (sem dialog do navegador), desarma em 6s.
- "Copiar link" → "Copiado ✓" (1,8s).
- Empty states orientados a ação (convidados, confirmações recentes).
- Checklist de publicação com opcionais explícitos ("Pronto ✓" / "Preencher").
- Rotas antigas redirecionam (sem 404 pra links salvos).
- Login demo, wizard com sugestão de textos por nicho e slug automático.
