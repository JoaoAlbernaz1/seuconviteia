---
name: brand
description: Use ao criar ou ajustar qualquer UI/visual do SeuConvite IA (cores, fontes, wordmark, gradientes, componentes de marketing/painel). Garante a identidade turquesa+roxo.
---

# Marca — SeuConvite IA

Paleta **turquesa + roxo**. Tokens definidos em `app/globals.css` (`@theme inline`);
use sempre as utilities do Tailwind, nao hex solto.

## Cores (tokens)

| Token          | Hex       | Utility (ex.)      | Uso                          |
| -------------- | --------- | ------------------ | ---------------------------- |
| `ink`          | `#0F172A` | `text-ink`, `bg-ink` | Texto e estrutura            |
| `turquesa`     | `#2DE2E6` | `bg-turquesa`      | Simbolo / acento vivo        |
| `teal`         | `#0EA5A6` | `text-teal`        | Acento de apoio              |
| `violeta`      | `#6D28D9` | `bg-violeta`       | **CTA / acento principal**   |
| `nevoa`        | `#F1F5F9` | `bg-nevoa`         | Fundo padrao                 |
| `lilas`        | `#EDE9FE` | `bg-lilas`         | Superficies / cards          |
| `texto-suave`  | `#64748B` | `text-texto-suave` | Texto secundario             |

## Gradientes

- `var(--grad-faisca)` — `135deg, turquesa -> teal -> violeta`. Para o **simbolo**
  e acentos visuais (fundos, icones, badges). Nao usar em texto pequeno.
- `var(--grad-texto)` — `90deg, teal -> violeta`. **So para TEXTO** sobre fundo claro
  (ex.: o "ia" do logo). Comeca no teal porque turquesa puro tem contraste baixo em texto.
  Atalho: classe `.text-gradient`.

## Fontes

- **Fraunces** — display/titulos (serif com italico). Utility `font-display`
  (carregada pelo next/font como `--font-fraunces`, mapeada no `@theme` para
  `font-display`). Para `h1`/`h2`/headlines editoriais.
- **Sora** — marca, UI e corpo. Utility `font-sans` (padrao do `<body>`),
  variavel `--font-sora`. Wordmark e textos de interface.

Ambas via `next/font/google` em `app/layout.tsx`.

## Wordmark

`seuconvite` + `ia` (com `.text-gradient`) + `.com`, em **Sora**.
Ex.: `seuconvite<span class="text-gradient">ia</span>.com`.

- **Nao** recriar o wordmark em outra fonte nem mudar o gradiente do "ia".
- O logo/simbolo real (SVG/PNG) vai em `public/brand/` quando existir — nao inventar
  arquivo de logo agora.

## Regras

- Fundo padrao `nevoa`, texto `ink`. CTA principal sempre `violeta`.
- Não desviar para azul/ciano puro como cor de marca em texto — use os gradientes acima.
