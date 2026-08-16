# Fontes locais

Todas as fontes do projeto sao servidas pelo proprio site, via `next/font/local`
(`app/layout.tsx` para a marca/painel, `app/evt-fonts.ts` para o site do evento).

**Por que:** `next/font/google` baixa os `.woff2` **em tempo de build**. Quando o Google
rotaciona os arquivos, as URLs antigas viram 404 e o build inteiro quebra
(`Failed to fetch font file from https://fonts.gstatic.com/...`) — ja derrubou deploy de
producao. Agravante: o CSS dessas fontes fica em `node_modules/.cache`, que `rm -rf .next`
**nao** limpa, entao o build insiste no arquivo morto ate limpar esse cache tambem.

## O que tem aqui

- `MiltonOneBold.otf` e `ClassyVogueRegular.ttf` — a tipografia original da festa (nao sao
  do Google Fonts).
- `<familia>/<familia>-<peso>[-italic].woff2` — 26 familias do Google Fonts, subset `latin`,
  so os pesos/estilos que o codigo declara. Sao os **mesmos arquivos** que o Google serve
  (conferidos por sha1 contra o que o `next/font/google` baixava), entao as metricas — e a
  calibracao por familia de `lib/fontes.ts` (`capaFator`/`fonteFator`) — nao mudam.
- `<familia>/OFL.txt` — a licenca **SIL Open Font License 1.1** de cada familia, com os
  direitos autorais dos autores, copiada de <https://github.com/google/fonts>.

## Como adicionar um peso ou uma familia

1. Pegue a URL do `.woff2` no CSS do Google (bloco `/* latin */`):
   `https://fonts.googleapis.com/css2?family=<Familia>:ital,wght@0,400;1,400&display=swap`
   (com User-Agent de navegador, senao o Google devolve `.ttf`).
2. Salve como `app/fonts/<familia>/<familia>-<peso>[-italic].woff2` e traga o `OFL.txt`.
3. Declare no `localFont({ src: [...] })` correspondente. O loader do Next exige **literais
   estaticos**: nada de montar o `src` com helper/variavel, o build reclama.
