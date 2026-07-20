# U1 — Fidelidade do template de 15 anos (clone visual da Maria Clara) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o template `quinze-anos/glamour-rose` **visualmente idêntico** ao site da Festa 15 anos Maria Clara, lendo todo o conteúdo de `EventoFesta` (sem strings/fotos/cores chumbadas), de modo que o evento-demo renderize igual ao site real.

**Architecture:** Porte fiel, componente a componente, do site fonte (`/Users/joaoalbernaz/festa-15-maria-clara` @ branch `build/festa-site`) para os componentes do template no SaaS. As **cores** (`lib/temas.ts` preset `rose`) e as **fontes** (`lib/fontes.ts` preset `classica` + `app/evt-fonts.ts`) já têm os valores EXATOS da festa — U1 NÃO mexe nelas. O trabalho é markup/layout/spacing/animações, consumindo as vars `--ev-*` e `--ev-font-*` já existentes. Nada de lib nova; nenhuma mudança de schema.

**Tech Stack:** Next 16 (App Router, Server Components), React 19 + React Compiler, Tailwind v4 (`@theme`, CSS-first), Prisma 6 + MySQL local (`sc-mysql`), Vitest, ESLint.

## Verificação nesta unidade (leia antes de começar)
U1 é **porte visual**, sem seam testável por unidade (adapter/tema/fontes já prontos e já testados). Portanto o "ciclo de teste" de cada task é:
1. `pnpm build` limpo + `pnpm exec tsc --noEmit` limpo + `pnpm lint` limpo.
2. **Conferência ao vivo pelo João** (`open` no navegador dele) comparando `maria-clara.localhost:3000/...` com `https://festa-15-maria-clara.vercel.app/...` — paridade visual é o critério de aceite. NÃO usar screenshot headless (mapa/reveals/ken-burns dão falso "bugado"); a extensão Claude-in-Chrome fica bloqueada no localhost.
3. Onde eu adiciono conteúdo NOVO de dados (só a Task 1, seed do demo), há checagem objetiva.

## Global Constraints (valem para TODA task)
- **Fonte da verdade visual:** `/Users/joaoalbernaz/festa-15-maria-clara`, branch **`build/festa-site`**. Ler o componente fonte por inteiro antes de portar.
- **Nada chumbado no template:** todo texto/nome/data/foto/cor vem de `EventoFesta` (props). Confirmar os nomes EXATOS dos campos em `lib/eventoFesta.ts` (tipo `EventoFesta`) — **não inventar campos**. Se um dado necessário não existir no `EventoFesta`, PARAR e sinalizar (é sinal de item para U2, não para chumbar).
- **Cores:** só via vars `--ev-*` (paleta em `lib/temas.ts`, preset `rose` = valores da festa). **Proibido hex solto** no template. Framboesa `#93264A`/`#9b2679` VETADAS.
- **Fontes:** só via vars `--ev-font-*` (preset `classica`). Classy Vogue (`--ev-font-display`) **não tem acentos** → usar só em número/data/texto sem acento.
- **Fuso:** datas/countdown fixados em **-03:00 (Brasília)** (server roda UTC).
- **Movimento:** respeitar `prefers-reduced-motion` (o João usa reduced-motion ON).
- **Escala Tailwind v4:** não existe `4.5/5.5/6.5` — usar `[18px]/[22px]/[26px]`.
- **Sem tocar** em `app/globals.css` blocos `.mkt`/`.dash`/`.scv` nem nos outros 3 templates.
- **Commits semânticos** (`feat:`/`fix:`/`style:`), frequentes, um por task.

---

### Task 1: Evento-demo "Maria Clara" renderizando (base de comparação)

Cria o alvo de comparação: um `Event` de 15 anos publicado, com `customization` espelhando o conteúdo real da Maria Clara, e as fotos-demo em `public/`. Sem isso não há como conferir "pixel a pixel".

**Files:**
- Create: `public/demo/maria-clara/` (fotos-demo copiadas do repo da festa: capa mobile, capa desktop, 10 da galeria, foto presentes)
- Modify: `prisma/seed.ts` (adicionar/garantir o evento-demo `maria-clara` idempotente) — confirmar o caminho real do seed (`package.json` → `db:seed`)
- Reference (ler, não editar): `/Users/joaoalbernaz/festa-15-maria-clara/lib/config.ts` (objeto `EVENTO`), `/Users/joaoalbernaz/festa-15-maria-clara/public/fotos/*`

**Interfaces:**
- Produces: um `Event { subdomain:"maria-clara", type:QUINZE_ANOS, status:PUBLISHED, plan:PREMIUM, customization:{...} }` + linhas `GiftItem`/`Photo` do demo. As tasks seguintes comparam contra `maria-clara.localhost:3000`.

- [ ] **Step 1: Copiar as fotos-demo para `public/`**

```bash
cd /Users/joaoalbernaz/seuconviteia
mkdir -p public/demo/maria-clara
# capa mobile, galeria (10), presentes — nomes vindos de EVENTO.fotos/config.ts do repo fonte
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05326.jpg public/demo/maria-clara/capa-mobile.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fototeste.jpg        public/demo/maria-clara/capa-desktop.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05305.jpg public/demo/maria-clara/g1.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05112.jpg public/demo/maria-clara/g2.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05446.jpg public/demo/maria-clara/g3.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05377.jpg public/demo/maria-clara/g4.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05269.jpg public/demo/maria-clara/g5.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05214.jpg public/demo/maria-clara/g6.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05758.jpg public/demo/maria-clara/g7.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05100.jpg public/demo/maria-clara/g8.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05346.jpg public/demo/maria-clara/g9.jpg
cp /Users/joaoalbernaz/festa-15-maria-clara/public/fotos/sel-05150.jpg public/demo/maria-clara/g10.jpg
```
Expected: `ls public/demo/maria-clara` mostra 13 arquivos.

- [ ] **Step 2: Ler `prisma/seed.ts` e o config fonte para montar o `customization`**

Ler `prisma/seed.ts` (padrão de upsert por `subdomain`) e `/Users/joaoalbernaz/festa-15-maria-clara/lib/config.ts`. Mapear `EVENTO.*` → chaves de `customization` já suportadas hoje (confirmar as chaves lendo `lib/convite.ts` + `lib/eventoFesta.ts`): `mensagem, local, endereco, mapsUrl, traje, programacao[], fotoUrl, fotoDesktopUrl, presentesFotoUrl, fotos[], pixNome, pixChave, pixQrUrl, presentesTexto, tema:"rose", fontes:"classica", template:"quinze-anos-glamour-rose", recursos:{...todos on}`. `title` = "Maria Clara"; `eventDate` = 2026-08-29T20:30:00-03:00.

- [ ] **Step 3: Escrever o upsert idempotente do demo no seed**

No `prisma/seed.ts`, adicionar um `prisma.event.upsert({ where:{ subdomain:"maria-clara" }, ... })` sob um `Professional` demo já existente (reusar o da conta `demo@seuconviteia.com`), criando também `GiftItem` (a lista real: Roupas P, Calças/shorts M·38, Calçados 36, Joias prata anel 14, Perfumes, Maquiagem) e `Photo` (as 10 `g1..g10`). Seguir EXATAMENTE o estilo de upsert/idempotência já usado no arquivo (deleteMany+create das relações, como em `salvarFotos`/`salvarPresentes`).

- [ ] **Step 4: Rodar o seed e subir**

```bash
docker start sc-mysql 2>/dev/null; sleep 2
pnpm db:push && pnpm db:seed
```
Expected: seed sem erro; log confirma o evento `maria-clara`.

- [ ] **Step 5: Conferir que renderiza (mesmo que ainda não idêntico)**

```bash
# dev server já roda em :3000; se não, PORT=3000 pnpm dev
node -e 'require("http").get({host:"maria-clara.localhost",port:3000,path:"/",headers:{Host:"maria-clara.localhost"}},r=>{console.log("home ->",r.statusCode);r.resume()})'
```
Expected: `home -> 200`. Abrir `http://maria-clara.localhost:3000` no navegador do João — renderiza o template atual (ainda "parecido", não idêntico). Serve de "antes".

- [ ] **Step 6: Commit**

```bash
git add public/demo/maria-clara prisma/seed.ts
git commit -m "feat(demo): evento-demo Maria Clara (15 anos) publicado para base de comparação visual"
```

---

### Task 2: Capa/Home cinematográfica idêntica

Porta a capa (hero) e a home. Fonte: `festa-15-maria-clara/components/HeroCinematic.tsx` + `app/page.tsx`. Alvo: `components/templates/quinze-anos/glamour-rose/{Capa,Home}.tsx` (+ helpers em `glam.tsx`).

**Files:**
- Modify: `components/templates/quinze-anos/glamour-rose/Capa.tsx`
- Modify: `components/templates/quinze-anos/glamour-rose/Home.tsx`
- Modify: `components/templates/quinze-anos/glamour-rose/glam.tsx` (helpers compartilhados do template, se precisar)
- Reference: `festa-15-maria-clara/components/HeroCinematic.tsx`, `festa-15-maria-clara/app/page.tsx`, `festa-15-maria-clara/app/globals.css` (classes `heroKen`, `.cta-confirmar`, `[data-reveal]`)

**Interfaces:**
- Consumes: `EventoFesta` (Task 1 fornece o demo). Confirmar campos reais em `lib/eventoFesta.ts`.
- Produces: `HomeQuinzeGlamour`/`Capa` idênticos à Maria Clara — mantidos os nomes de export atuais (`registro.tsx` os importa).

**Recriação fiel — ler o fonte inteiro e reproduzir o markup. Mapa de vínculos (literal do fonte → campo de `EventoFesta`):**
- Foto desktop `fototeste.jpg` (hardcoded no fonte) → `fotoDesktopUrl` (demo: `/demo/maria-clara/capa-desktop.jpg`)
- Foto mobile (config) → `fotoUrl` (demo: `/demo/maria-clara/capa-mobile.jpg`)
- Nome cursivo "Maria Clara" → nome do evento (`EventoFesta`); usar `var(--ev-font-script)`
- "15 ANOS"/"anos" → derivar do nicho (número 15); `var(--ev-font-display)` (sem acento — ok)
- Carta (2 parágrafos) + assinatura → `mensagem` + assinatura (nomes) do `EventoFesta`
- Card "Quando/Onde" resumido → data/hora/local do `EventoFesta`
- Cores prata/rosé literais → vars `--ev-*`
- Teasers "Presentes"/"Recados" → toggles `recursos`

- [ ] **Step 1: Ler os 3 arquivos-fonte por inteiro** (HeroCinematic, app/page, globals.css do repo da festa) e listar cada literal a externalizar.
- [ ] **Step 2: Reescrever `Capa.tsx`** reproduzindo o hero (Ken Burns, lockup, overlay) com as vars `--ev-*`/`--ev-font-*` e os campos de `EventoFesta`. Reduced-motion respeitado.
- [ ] **Step 3: Reescrever `Home.tsx`** reproduzindo teaser da carta + card Quando/Onde + CTA + teasers, tudo data-driven.
- [ ] **Step 4: Portar as classes de animação necessárias** (`heroKen`, `.cta-confirmar`, reveals) para o escopo `.evt` do `app/globals.css`, SE ainda não existirem lá (verificar antes; muitas já vieram no porte original).
- [ ] **Step 5: Verificar build/tsc/lint**

```bash
pnpm build && pnpm exec tsc --noEmit && pnpm lint
```
Expected: os 3 limpos.

- [ ] **Step 6: Conferência ao vivo (João)** — abrir `maria-clara.localhost:3000` ao lado de `festa-15-maria-clara.vercel.app`. Ajustar até a home ficar idêntica.
- [ ] **Step 7: Commit** — `git commit -m "feat(template-15): capa/home idênticas ao site da Maria Clara (data-driven)"`

---

### Task 3: Página `/evento` idêntica (carta, contagem, quando/onde, traje, programação, CTA)

Fonte: `festa-15-maria-clara/app/evento/page.tsx` + `components/Countdown.tsx` + `components/Reveal.tsx`. Alvo: `components/templates/quinze-anos/glamour-rose/Evento.tsx` + `QgrCountdown.tsx`.

**Files:**
- Modify: `components/templates/quinze-anos/glamour-rose/Evento.tsx`
- Modify: `components/templates/quinze-anos/glamour-rose/QgrCountdown.tsx`
- Reference: `festa-15-maria-clara/app/evento/page.tsx`, `.../components/Countdown.tsx`, `.../lib/countdown.ts`

**Interfaces:**
- Consumes: `EventoFesta` (mensagem, assinatura, `eventDate`, local, endereco, mapsUrl, traje, `programacao[]`).
- Produces: `EventoQuinzeGlamour` idêntico; export mantido.

**Mapa de vínculos:** carta/assinatura → `mensagem`+nomes · "Sábado, 29 de agosto"/"20h30"/"Esplendor Hall" (literais no fonte) → data/hora/local formatados do `EventoFesta` (fuso -03:00) · "Abrir no Maps" → `mapsUrl` · traje → `traje` · timeline → `programacao[]` (`{hora,titulo}`) · countdown alvo → `eventDate`.

- [ ] **Step 1: Ler os arquivos-fonte por inteiro.**
- [ ] **Step 2: Reescrever `QgrCountdown.tsx`** replicando o visual/tick do `Countdown` da festa, alvo = `eventDate` do evento (usar o hook `useCountdown` já existente no SaaS; conferir `components/evt/useCountdown.ts`). Reduced-motion ok.
- [ ] **Step 3: Reescrever `Evento.tsx`** replicando seção a seção (carta → contagem → Quando&Onde+Maps → traje → programação → CTA), data-driven, vars `--ev-*`.
- [ ] **Step 4: build/tsc/lint** — `pnpm build && pnpm exec tsc --noEmit && pnpm lint` (limpos).
- [ ] **Step 5: Conferência ao vivo (João)** em `maria-clara.localhost:3000/evento` vs a produção. Ajustar até idêntico.
- [ ] **Step 6: Commit** — `git commit -m "feat(template-15): página /evento idêntica (carta, contagem, programação) data-driven"`

---

### Task 4: Presentes (lista + Pix) e Galeria (grade + lightbox) idênticas

Fonte: `festa-15-maria-clara/components/PainelPresentes.tsx` + `components/Galeria.tsx`. Alvo: `.../glamour-rose/{Presentes,Galeria}.tsx`.

**Files:**
- Modify: `components/templates/quinze-anos/glamour-rose/Presentes.tsx`
- Modify: `components/templates/quinze-anos/glamour-rose/Galeria.tsx`
- Reference: `festa-15-maria-clara/components/PainelPresentes.tsx`, `.../components/Galeria.tsx`

**Interfaces:**
- Consumes: `EventoFesta` → `gifts` (lista de presentes, tabela `GiftItem`), `pixNome/pixChave/pixQrUrl`, `presentesTexto`, `presentesFotoUrl`, `fotos[]` (Photo).
- Produces: `PresentesQuinzeGlamour`/`GaleriaQuinzeGlamour` idênticos; exports mantidos.

**Mapa de vínculos:** array de presentes hardcoded no fonte → `gifts` do `EventoFesta` · Pix copiável (QR) → `pixQrUrl`/`pixChave`/`pixNome` · foto da seção → `presentesFotoUrl` · grade+lightbox → `fotos[]` (teclado/swipe/contador preservados).

- [ ] **Step 1: Ler os dois arquivos-fonte por inteiro.**
- [ ] **Step 2: Reescrever `Presentes.tsx`** (foto + lista + card Pix copiável com feedback "Copiado!"), data-driven.
- [ ] **Step 3: Reescrever `Galeria.tsx`** (grade 2/3 col + lightbox portal/teclado/swipe/contador), lendo `fotos[]`.
- [ ] **Step 4: build/tsc/lint** (limpos).
- [ ] **Step 5: Conferência ao vivo (João)** em `/presentes` e `/galeria`. Ajustar até idêntico.
- [ ] **Step 6: Commit** — `git commit -m "feat(template-15): presentes+Pix e galeria+lightbox idênticos, data-driven"`

---

### Task 5: Unificar paleta de `/confirmar` e `/obrigada` ao tema (fidelidade visual)

As telas compartilhadas de RSVP/obrigada usavam uma paleta local escura (plum/wine) herdada. Fazê-las seguir o tema `--ev-*` (mantendo o layout), para o convite ficar coeso. **Só visual — a configuração funcional do RSVP é U7.**

**Files:**
- Modify: `components/evt/RsvpConvite.tsx` (trocar hex plum/wine locais por vars `--ev-*`)
- Modify: `app/%5Fsites/[sub]/obrigada/page.tsx` (idem) e o componente que ela usa
- Reference: as telas equivalentes da festa (`app/confirmar`, `app/obrigada`) — mas seguindo o tema, não a paleta escura antiga

**Interfaces:**
- Consumes: vars `--ev-*` já aplicadas pelo layout `.evt`.
- Produces: RSVP/obrigada tematizados; nenhuma mudança de comportamento/props.

- [ ] **Step 1: Localizar os hex locais** (ex.: `#CE578B/#7C1A5E/#3E1030/#FCEBF1`) nesses arquivos.
- [ ] **Step 2: Substituir** cada um pela var `--ev-*` correspondente (ink/rosa/rosa-ink/blush/ivory). Nenhum hex solto restante.
- [ ] **Step 3: build/tsc/lint** (limpos).
- [ ] **Step 4: Conferência ao vivo (João)** em `/confirmar` e `/obrigada` — coeso com o resto do convite (rosé).
- [ ] **Step 5: Commit** — `git commit -m "style(template-15): confirmar/obrigada seguem o tema do convite (remove plum/wine herdado)"`

---

### Task 6: Fechamento de U1 — QA visual de página inteira + verde total

Passada final de paridade e saúde do projeto.

**Files:** nenhum novo (ajustes finos pontuais se a conferência pedir).

- [ ] **Step 1: `pnpm build && pnpm exec tsc --noEmit && pnpm lint && pnpm test`** — tudo verde (os 147 testes de lib continuam passando; U1 não mexeu em lib).
- [ ] **Step 2: Conferência ao vivo final (João)** — percorrer TODAS as rotas do demo lado a lado com a produção: `/`, `/evento`, `/presentes`, `/galeria`, `/recados`, `/confirmar`, `/obrigada`. Critério: idêntico.
- [ ] **Step 3: Registrar no HANDOFF/memória** que U1 fechou e o próximo é U2 (ampliar `customization`).
- [ ] **Step 4: Commit final** (se houve ajuste) — `git commit -m "chore(template-15): fecha U1 — template 15 anos idêntico à Maria Clara"`

---

## Self-Review (feito)
- **Cobertura do spec (U1 = §5.1 + §5.5-parcial do spec):** capa/home (T2), evento (T3), presentes/galeria (T4), unificação confirmar/obrigada (T5), assets+demo (T1), verde final (T6). ✔
- **Placeholders:** os "ler o fonte e reproduzir" apontam para arquivos-fonte exatos (o markup autoritativo vive lá; reproduzi-lo é o trabalho) + tabelas de vínculo concretas — não são TODO. ✔
- **Consistência de tipos:** exports dos componentes preservados (`registro.tsx` os importa por nome). Campos de `EventoFesta` a confirmar em `lib/eventoFesta.ts` (constraint global — não inventar). ✔
- **Fora de U1 (próximos planos):** U2 amplia `customization`; U3 parametriza copy; U4–U7 ligam o editor; U8 publica+QA E2E. Reconciliação Postgres = tarefa à parte (spec §8).
