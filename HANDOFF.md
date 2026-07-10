# HANDOFF — SeuConviteIA (continuar em outro PC)

> Leia este arquivo primeiro. Ele resume **o que é o projeto, onde paramos, e como
> retomar** — inclusive as skills a instalar. Gerado em 2026-07-05.

## O que é

**SeuConviteIA** — SaaS para criar **sites de convite digital** (casamento, 15 anos,
aniversário) em minutos: escolhe modelo → edita textos/cores/fotos com preview ao
vivo → publica num link/subdomínio. Recursos: RSVP, presentes no Pix, galeria,
programação, contador, painel. Serve para **pessoa física** (evento próprio) e para
**profissionais** (cerimonialistas criam sites para clientes). Promessa: *"O seu site
de convite em minutos."*

Estamos num **RESET controlado para MVP em 14 dias**, na branch **`reset-mvp-convites`**
(NÃO na `main`). Estratégia: B2C-first, B2B-ready. Só 4 templates no MVP.

---

## Como retomar em outro PC (checklist)

```bash
# 1) Código (repo no GitHub)
git clone https://github.com/JoaoAlbernaz1/seuconviteia.git
cd seuconviteia
git checkout reset-mvp-convites
pnpm install

# 2) Segredos — .env.local NÃO vem no git (está no .gitignore).
#    Copie ~/seuconviteia/.env.local do PC antigo por fora (AirDrop/pendrive/gerenciador de senhas).
#    Contém as chaves do Supabase (projeto rphedglardgxfytlcweo) etc.

# 3) Banco de dev (Docker MySQL) + rodar — ver skill `run` do projeto:
#    (o app usa Prisma + MySQL; há um container de dev `sc-mysql`)
pnpm dev        # http://localhost:3000
```

**Skills a instalar** (no Claude Code do outro PC):
```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official
/plugin marketplace add czlonkowski/n8n-skills
/plugin install n8n-mcp-skills@n8n-mcp-skills
```
As skills **avulsas** (ui-ux-pro-max, high-end-visual-design, deep-research, pacote de
marketing…) foram adicionadas individualmente — se não vierem pelos plugins, copie
`~/.claude/skills/` + `~/.agents/skills/` + `~/.claude/plugins/` do PC antigo
(`tar czhf skills.tgz -C ~ .claude/skills .agents/skills .claude/plugins`, extrair no novo).
As skills **do projeto** (`brand`, `db`, `deploy`, `evt`, `run`, `tenant`,
`ui-ux-reviewer`) já estão versionadas em `.claude/skills/` — vêm no clone.

> **Skills de design a usar aqui:** `ui-ux-pro-max` + `high-end-visual-design`
> (+ apoio: `evt`, `brand`, `webapp-testing`, `brainstorming`, `verification`).
> **NÃO usar `frontend-design`** (preferência do dono).

---

## Stack & convenções

Next.js 16 (App Router, React 19, React Compiler) · TypeScript strict · Tailwind v4 ·
Prisma + PlanetScale (MySQL, `relationMode="prisma"`) · Auth.js · Mercado Pago (Pix) ·
Resend · Vercel Blob · Vercel. Gerenciador **pnpm**. Multi-tenant por subdomínio
(`<cliente>.seuconviteia.com`, rewrite → `app/_sites/[sub]`). `lib/plans.ts` = fonte
única do gating; `lib/templates.ts` = 4 templates do MVP. `CLAUDE.md` tem as regras.

Verificar: `pnpm exec tsc --noEmit`, `pnpm exec eslint`, `pnpm build`, `pnpm test`.

---

## Roadmap 14 dias — status

| Dia | Entrega | Status |
|-----|---------|--------|
| **D1** | Auditoria + branch + **limpeza** (remoção de morto: event/*, payments, 5 templates, legado) | ✅ feito |
| **D2** | **Design system** claro/premium `ui-*` (11 componentes em `components/ui/` + tokens + demo `/ui-kit`) | ✅ feito |
| **D3** | **Landing** (hero + modelos + como funciona + recursos + profissionais + planos + FAQ + CTA) | 🔄 **AQUI** — v4 feita, aguardando aprovação visual |
| **D4** | Dashboard "Meus sites" (simples, não-ERP) | ⏳ próximo |
| **D5** | Fluxo de criação (6 etapas: Para quem? · Ocasião · Template · Dados · Personalizar · Publicar; data/hora bonitos) | ⏳ |
| **D6** | Galeria de templates (filtro ocasião + estilo + busca + Visualizar + Escolher) | ⏳ |
| **D7** | Editor guiado "Personalizar layout" (sidebar + preview grande desktop/tablet/mobile) | ⏳ |
| **D8–D11** | Os 4 templates completos (miolo próprio por template) | ⏳ |
| **D12** | Storage de produção (`VercelBlobStorage` real — hoje é stub que dá throw) | ⏳ |
| **D13** | QA E2E (criar conta → site → template → editar → publicar → mobile → RSVP → confirmação) | ⏳ |
| **D14** | Ajustes finais + build + checklist beta | ⏳ |

Spec do reset: `docs/superpowers/specs/2026-07-04-reset-mvp-convites-design.md`.

---

## Onde paramos HOJE — Dia 3 (Landing)

A landing passou por **4 direções** até chegar na atual (a identidade mudou por decisão
do dono, não por erro de escopo):

- **v1** clara/minimalista → rejeitada ("chapada, cara de template").
- **v2** fotográfica editorial → rejeitada ("virou revista de casamento").
- **v3** SaaS product-forward (mockups, off-white) → rejeitada ("genérica / pouco SaaS").
- **v4 (ATUAL) = TECH / SaaS-IA, DARK** ✅ construída, **aguardando aprovação visual do dono**.

### v4 — identidade e arquivos
- **Paleta obrigatória** (a original da marca): ciano `#2DE2E6`, turquesa `#0EA5A6`,
  roxo `#6D28D9`, grafite `#0F172A`, cinza `#F1F5F9` (+ neutros slate). **Proibido**
  rosé/champagne/dourado/bege romântico.
- **Fonte:** Space Grotesk (display, `--font-grotesk`/`.mkt`) + Sora (corpo). Sem serifa/manuscrita.
- **Zero foto** (tudo CSS/SVG). Fundo aurora (blooms ciano/roxo) + grid + glass + glow;
  animações CSS-only com `prefers-reduced-motion`.
- **11 seções:** Hero (composição de produto "Convite sendo criado" com progresso +
  mini-preview `ana-e-joao.seuconviteia.com` + badges Publicado/3 confirmações + 6 chips) ·
  Como funciona (4 passos) · Modelos (previews conceituais de layout) · Recursos (8) ·
  Do rascunho ao link (demo do fluxo) · Pessoa física × Profissional · Por que usar ·
  Planos (SEM preço: Convite Único/Profissional/Studio) · FAQ · CTA final.
- **Sem prova social falsa** (único número = "3 confirmações" conceitual). WhatsApp fake removido (contato = mailto).
- **Arquivos:** `app/(marketing)/page.tsx` (página), `app/globals.css` (bloco `.mkt`
  dark-tech, ~linha 162 em diante), `components/marketing/MarketingNav.tsx` (nav dark,
  client) e `components/marketing/Icon.tsx` (ícones de linha SVG). `app/layout.tsx`
  carrega Space Grotesk.
- **Verificado:** tsc/lint/build ✅; mobile 390px `scrollWidth == viewport` (sem overflow);
  revisão adversarial rodada e **8 achados corrigidos** (fúcsia→roxo nos modelos,
  "Mais popular"→"Recomendado", contraste do texto secundário AA, foco de teclado do
  menu, `:focus-visible`, corpo 14px, alvos de toque, fundo mais leve no mobile).

### Como ver / iterar a landing
Servidor de prod na `:3000` (o app é estático em `/`, não precisa de banco só pra landing):
```bash
pnpm build && PORT=3000 pnpm start   # abrir http://localhost:3000
```
Screenshot sem depender da extensão do Chrome (a extensão Claude-in-Chrome fica bloqueada no localhost):
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --hide-scrollbars --window-size=1440,6600 --screenshot=out.png http://localhost:3000/
```
> ⚠️ Gotcha: headless=new tem largura mínima **500px** (janela menor corta a captura →
> falso "overflow"). Para mobile real, use DevTools protocol `Emulation.setDeviceMetricsOverride`.

### Próximo passo imediato do Dia 3
1. Dono aprovar a v4 vendo no navegador (**ele decide VENDO** — sempre mostrar antes de fechar).
2. Se aprovar → a v4 já está commitada na branch; seguir para **D4 (dashboard "Meus sites")**.
3. Se pedir ajuste → iterar (intensidade do glow, alguma seção, copy) e re-mostrar.

---

## Decisões travadas (não reabrir sem o dono)
- Identidade da landing = **tech/SaaS-IA dark** (paleta ciano/roxo). NÃO voltar pro rosé/casamento.
- Landing **sem fotos**; templates mostrados como **previews conceituais**, não fotos.
- **Sem prova social inventada** (nada de "+10 mil", depoimentos, logos, estrelas).
- Planos **sem preço** ("em definição"); nomes Convite Único / Profissional / Studio.
- Sem WhatsApp com link falso.
- Painel/wizard continuam no design **claro `ui-*`** (D2); só a **landing** é dark.

## Pendências de $ / infra (só o dono resolve)
- **Preços** dos planos. **WhatsApp** do negócio. **Mercado Pago** (Pix real).
- **Storage prod:** `BLOB_READ_WRITE_TOKEN` (Vercel Blob) para o D12.
- **Deploy Vercel bloqueado:** git-author protection do time Pro + SSO + sem
  `DATABASE_URL` de prod (banco na nuvem). Ver `docs/ops/` e a memória
  `seuconviteia-vercel-deploy-block`.

## Como o dono trabalha (importante)
- **Decide VENDO** — sempre abrir no navegador / screenshot antes de considerar pronto.
- Dá **referências concretas → replicar fiel** (não oferecer A/B; já rejeitou AskUserQuestion).
- Aprova mockup e **rejeita o renderizado** com frequência → mostrar cedo, iterar rápido.
- **NÃO commitar** sem aprovação visual (esta v4 foi commitada só para transporte entre PCs, marcada como WIP).
