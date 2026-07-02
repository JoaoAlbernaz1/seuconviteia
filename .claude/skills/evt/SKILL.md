---
name: evt
description: Use ao mexer em QUALQUER coisa do site publico do evento — capa, /evento, /presentes, /galeria, /recados, /confirmar (RSVP), paletas/temas, textos por nicho, contador, componentes em components/evt/*, ou o preview do editor. Mesmo que a tarefa diga so "convite" ou "site do cliente".
---

# Site do evento (o produto que o convidado ve)

E o **template real da festa da Maria Clara** (`/Users/joaoalbernaz/festa-15-maria-clara`)
portado FIEL pra ca — multi-pagina, data-driven, tematizavel. Regra do projeto: quando
houver duvida de visual/comportamento, **a festa e a referencia canonica**; nao
reinterpretar.

## Arquitetura

- Rotas em `app/%5Fsites/[sub]/` (servidas via rewrite do middleware — ver skill
  **tenant**): capa `/`, `/evento`, `/presentes`, `/galeria`, `/recados`,
  `/confirmar` -> `/obrigada`, `/agenda` (ICS sem extensao).
- Componentes em **`components/evt/`** (HeroCinematic, SiteNav, RsvpConvite,
  PainelPresentes, PhotoCarousel/Swiper, MapEmbed, Particles, Timeline...).
  ⚠️ `components/event/` e `components/Convite.tsx`-era sao CODIGO MORTO de versao
  antiga — nao usar, nao imitar.
- Dados: `lib/eventoFesta.ts` adapta `Event`+`customization` pro shape do template;
  fontes reais (Milton One cursiva do nome, Classy Vogue, Cormorant, Jost) carregadas
  no layout aninhado `app/%5Fsites/[sub]/layout.tsx`.

## Tematizacao (paletas prontas)

- 6 paletas em `lib/temas.ts` (rose = festa exata, dourado, azul, lavanda, verde,
  terracota) — viram vars `--ev-*` sob o escopo `.evt` e re-tingem o site INTEIRO.
- Cor nova = SEMPRE via var `--ev-*`/utility `evt-*`; nunca hex solto nem cor da
  marca do SaaS (turquesa/violeta) dentro do site do evento.

## Conteudo por nicho e plano

- Copy por nicho (casamento/15/60/bodas/aniversario) em `lib/textos.ts`
  (`textosDoNicho`) — um casamento NUNCA pode exibir texto de "15 anos".
- Recursos (RSVP/recados/galeria/white-label/dominio) gateados por `lib/plans.ts`
  (fonte unica): nav filtra abas, pagina bloqueada mostra `RecursoIndisponivel`.

## Gotchas ja pagos (nao repagar)

- **Fuso**: datas do evento parseiam FIXO em `-03:00` (`lib/dates.ts`) — nunca
  `new Date(\`${date}T${time}\`)` cru, que desloca 3h em servidor UTC.
- **Reduced-motion**: o Joao usa ON. A capa e CSS-only/server por isso — o lockup
  (nome/data) NUNCA pode sumir com reducao de movimento. Testar os dois modos.
- **Swiper/carrossel**: loop coverflow buga com poucas fotos — repetir slides ate um
  minimo (ja implementado em PhotoCarousel; manter o padrao).
- **MapEmbed**: iframe do Google leva ~6s; sempre com placeholder tematizado por
  baixo (nunca card branco).
- RSVP/recados gravam via server actions (`lib/rsvp.ts`/`lib/recados.ts`) com Zod +
  re-validacao de `eventoPublico` no servidor + consentimento LGPD.

## Checklist de mudanca visual no site do evento

1. Conferir contra o template da festa (fidelidade) e nas 6 paletas (nao so rose).
2. Testar com reduced-motion ON e OFF.
3. Testar num nicho != 15 anos (copy certa) e num plano Basico (gating certo).
4. Joao aprova VENDO ao vivo (`maria-clara.localhost:3000`), nao por screenshot.
