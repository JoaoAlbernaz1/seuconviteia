# U5 — Editor: passo 2 (Capa e estilo) gravando de verdade — Implementation Plan

**Goal:** Ligar o **passo 2 do editor "Criar convite"** (`CriarConvite.tsx`) no site real:
foto de capa (upload), textos, tamanhos, cores e overlay deixam de ser estado local
(mock) e passam a gravar em `Event.customization`, refletindo na `Capa.tsx` do template
`quinze-anos-glamour-rose`. Preserva a fidelidade da capa Maria Clara (U1): os controles
mexem só no que a capa dela realmente mostra; valores atuais viram os defaults.

**Contexto (já pronto — não refazer):**
- Caminho de LEITURA da foto já existe: `customization.fotoUrl`/`fotoDesktopUrl` →
  `lib/eventoFesta.ts` (`fotoDesktopUrl: extras.fotoDesktopUrl ?? c.fotoUrl`) →
  `Capa.tsx` (lê `fotoUrl`/`fotoDesktopUrl`). O demo usa exatamente isso.
- Upload funciona local: `POST /api/upload` (auth, imagem ≤6MB) → storage em disco
  (`public/uploads/`). Helper client `enviarUpload(file)` exportado em
  `app/(dashboard)/painel/_ui/Uploads.tsx`.
- O passo 2 do editor já TEM a UI montada (foto placeholder, textos capaT/capaS/capaD,
  tamanhos szT/szS/szD, cores corTxt/corDet, overlay) — tudo estado local que NÃO salva.
- O editor grava via `criarConvite()` (`criar/acoes.ts`): `payloadSchema` (Zod) → `patch`
  (chaves do customization) → `mesclar()`. Dois montadores no client: `montarRascunho`
  (prévia ao vivo) e `montarPayload` (salvar) — ambos precisam dos novos campos.

**Constraints (U1 valem):** cores só via `--ev-*` no template (o `SILVER=#D7D7D7` do
lockup é neutro fora da paleta, já aceito); framboesa `#93264A`/`#9b2679` vetadas;
reduced-motion respeitado; fuso -03:00; sem tocar `.mkt`/`.dash` nem outros templates.
Verde: `pnpm exec tsc --noEmit` + `pnpm build` + `pnpm lint`. João confere **vendo**
(`app.localhost:3000/painel/criar` + `maria-clara.localhost:3000`), não headless.

---

### Fatia 1 — Foto da capa (upload real) → grava e reflete
A mais valiosa e 100% fiel (a capa da Maria Clara É uma foto). Escopo mínimo que exercita
o pipeline inteiro (editor → payload → patch → customization → template já lê).

**Files:**
- `CriarConvite.tsx`: `State.capaFoto` + INICIAL `capaFoto:""`; trocar o placeholder
  "Trocar foto" por `<label><input type=file>` real usando `enviarUpload`; thumbnail +
  estado enviando/erro; `montarRascunho`+`montarPayload` incluem `fotoUrl: S.capaFoto||undefined`.
- `criar/acoes.ts`: `payloadSchema` ganha `fotoUrl: z.string().trim().max(400).optional()`;
  `patch` ganha `fotoUrl: txt(d.fotoUrl)`.

**Aceite:** subo uma foto no passo 2 → aparece na prévia → salvo/publico → a capa real
(`<slug>.localhost:3000`) mostra a foto (mobile e desktop via fallback). tsc/build/lint verdes.

- [ ] S1.1 `State`+INICIAL `capaFoto`
- [ ] S1.2 upload real na UI (label+input+enviarUpload+thumb+erro)
- [ ] S1.3 `montarRascunho`+`montarPayload` enviam `fotoUrl`
- [ ] S1.4 `payloadSchema`+`patch` aceitam/gravam `fotoUrl`
- [ ] S1.5 tsc/build/lint verdes + conferência do João + commit

---

### Fatia 2 — Overlay + cor do lockup + tamanhos (os botões já existentes)
Ligar `overlay`, `corTxt`/`corDet` (cor do nome/detalhe do lockup) e `szT/szS/szD` na
`Capa.tsx`, com os valores atuais da Maria Clara como default (overlay on, prata `#D7D7D7`,
idade em `--ev-blush`, tamanhos médios). Novas chaves no `customization` (Zod U2) +
`Capa.tsx` passa a lê-las (defaults = hoje) + patch/payload. **Nada muda visualmente com
os defaults** (garantia de não-regressão do clone).

- [ ] S2.1 chaves `capaOverlay`/`capaCorTxt`/`capaCorDet`/`capaSz*` no customization+Zod
- [ ] S2.2 `Capa.tsx` lê-as (defaults = valores atuais)
- [ ] S2.3 editor envia (rascunho+payload) + patch grava
- [ ] S2.4 verdes + João + commit

---

### Fatia 3 — Textos da capa + fecho
Nome (= título, já flui) e rótulo "15 anos" (derivado do nicho hoje; permitir override).
Resolver o "Texto abaixo da capa" (capaD): a capa Maria Clara é minimalista e NÃO tem
essa linha — manter opcional/oculta por default para não quebrar a fidelidade (só renderiza
se preenchida, e mesmo assim discreta), OU deixar como campo de outros templates. Decidir
com o João VENDO. Fecho: build/lint/test verdes + conferência de página inteira + commit.

- [ ] S3.1 rótulo "N anos" override opcional
- [ ] S3.2 tratar capaD (fidelidade) — mostrar ao João
- [ ] S3.3 verdes + walk-through + commit + atualizar HANDOFF/memória (U5 fechado → U6)

---

## Self-review
- Fatia 1 é a de maior valor e menor risco (leitura já pronta) → ideal p/ mostrar cedo.
- Fatia 2 tem defaults = estado atual → zero regressão visual do clone.
- Fatia 3 tem a única decisão de fidelidade (capaD) → resolver com João vendo, não chumbar.
- Fora de U5: presentes/Pix (U6), RSVP+galeria/recados (U7), publicar+slug+QA E2E (U8),
  reconciliação p/ Postgres (tarefa à parte, spec §8).
