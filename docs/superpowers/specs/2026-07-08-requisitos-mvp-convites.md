# Análise de Requisitos — MVP seuconvite.ia

**Data:** 2026-07-08
**Objetivo:** documento de trabalho pra guiar o desenvolvimento. Trava o escopo do MVP (o que construir e em que ordem) e separa o que fica pra depois.
**Branch:** `reset-mvp-convites` (MVP de 14 dias).
**Não é** documento acadêmico — é prático, pra nós dois.

## Contexto do produto (1 parágrafo)

SaaS estilo iCasei, **multi-ocasião** (casamento / 15 anos / aniversário). Um **profissional** (ou pessoa física) cria sites de convite bonitos pros seus eventos/clientes em minutos, sem código. Cada site tem endereço próprio (subdomínio), RSVP, lista de presentes com Pix, galeria, recados, programação e contador. O visual vem de **templates** (o template manda no layout; o usuário manda no conteúdo). Monetização = **assinatura** por plano.

**Entidades (Prisma):** Professional, Event, Guest, GiftItem, Photo, Recado, Template, Transaction.
**Enums:** Plan (BASICO/CLASSICO/PREMIUM) · EventType (CASAMENTO/QUINZE_ANOS/SESSENTA_ANOS/BODAS/ANIVERSARIO) · EventStatus (DRAFT/PUBLISHED/EXPIRED) · GuestStatus (PENDING/CONFIRMED/DECLINED) · GiftMode (PIX/ITEM).
**Recursos ligáveis por site:** rsvp, presentes (+Pix), contador, programação, recados, galeria.

**Legenda de estado:** ✅ já existe · 🔨 falta construir (dia do roadmap) · ⚠️ stub/incompleto · 🕓 fora do MVP (backlog).

---

## Requisitos Funcionais (RF)

### A — Conta e acesso (Professional)
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF01 | Cadastro (nome, email, senha) → entra no plano Básico | ✔ | ✅ |
| RF02 | Login / logout | ✔ | ✅ |
| RF03 | Recuperar senha ("esqueci a senha") via e-mail | ✔ | 🔨 falta |
| RF04 | Ver / editar perfil | ✔ | ✅ |
| RF05 | Ver plano atual e limites | ✔ | ✅ |

### B — Meus sites (dashboard)
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF06 | Listar meus eventos com status (rascunho/publicado/expirado) | ✔ | 🔨 **D4** |
| RF07 | Criar evento pelo passo-a-passo (para quem · ocasião · template · dados · personalizar · publicar) | ✔ | 🔨 **D5** |
| RF08 | Editar dados do evento (salva só o que mudou — merge parcial) | ✔ | ✅ |
| RF09 | Publicar / tirar do ar | ✔ | ✅ |
| RF10 | Excluir evento | ✔ | ✅ |
| RF11 | Limite de eventos por plano | ✔ | ✅ |
| RF12 | Preview ao vivo (celular / computador) enquanto edita | ✔ | ✅ |

### C — Personalização (template + estilo)
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF13 | Escolher entre os 4 templates do MVP | ✔ | 🔨 **D6/D8–D11** |
| RF14 | Trocar cor/paleta e fontes | ✔ | ✅ |
| RF15 | Ligar/desligar recursos por site (rsvp, presentes, contador, programação, recados, galeria) — gate por plano | ✔ | ✅ |
| RF16 | Editor guiado "Personalizar layout" (sidebar + preview grande desktop/tablet/mobile) | ✔ | 🔨 **D7** |
| RF17 | Galeria de templates com filtro por ocasião/estilo + busca + Visualizar | ✔ | 🔨 **D6** |

**4 templates do MVP:** casamento-classico-elegante · quinze-anos-glamour-rose · aniversario-adulto-elegante · aniversario-infantil-ludico.

### D — Site publicado (o que o convidado vê)
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF18 | Capa/início (nome, data, contador) | ✔ | ✅ |
| RF19 | Página do evento (quando/onde, mapa, traje, programação) | ✔ | ✅ |
| RF20 | Confirmar presença (RSVP) — convidado confirma/recusa | ✔ | ✅ |
| RF21 | Lista de presentes com Pix (item ou Pix + QR) | ✔ | ✅ |
| RF22 | Galeria de fotos | ✔ | ✅ (depende de RNF05) |
| RF23 | Mural de recados — convidado deixa recado | ✔ | ✅ |
| RF24 | Endereço próprio (subdomínio `slug.dominio`) | ✔ | ✅ |
| RF25 | Capa bonita no WhatsApp (OG / compartilhamento) | ✔ | ⚠️ conferir |

### E — Acompanhamento (dono do evento)
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF26 | Ver confirmações (confirmados / pendentes / recusados) | ✔ | ✅ |
| RF27 | Adicionar convidados manualmente | ✔ | ✅ |
| RF28 | Moderar recados (aprovar antes de aparecer) | ✖ | 🕓 backlog (decisão: recado aparece direto no MVP) |
| RF29 | Gerenciar presentes / programação / fotos | ✔ | ✅ |
| RF30 | Números do evento (nº de confirmados etc.) | ✔ | ✅ |

### F — Planos e pagamento
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF31 | Exibir / escolher planos | ✔ | ✅ (preço a fechar) |
| RF32 | Assinatura cobrada de verdade (Mercado Pago) | ✖ | 🕓 backlog (⚠️ stub) |
| RF33 | Registrar transação | ✖ | 🕓 backlog (⚠️ stub) |
| RF34 | Expirar evento automaticamente (cron) | ✔ | ⚠️ parcial |

### G — Profissional / white-label
| # | Requisito | MVP | Estado |
|---|-----------|-----|--------|
| RF35 | Um profissional cria vários sites pros clientes | ✔ | ✅ (modelo já é multi-cliente) |
| RF36 | Domínio próprio | ✖ | 🕓 backlog (sem código) |
| RF37 | Logo/marca do profissional no site do cliente | ✖ | 🕓 backlog (não usado) |

---

## Requisitos Não-Funcionais (RNF)

| # | Requisito | Por quê |
|---|-----------|---------|
| RNF01 | Mobile-first | público (noiva, mãe da debutante, convidado) usa muito celular |
| RNF02 | Performance — leve, rápido, nada que trave | percepção de qualidade + conexão de festa/salão ruim |
| RNF03 | Acessibilidade — contraste AA, foco visível, respeitar "redução de movimento" | público amplo; João usa reduced-motion |
| RNF04 | Segurança / isolamento multi-tenant — um profissional nunca vê dados de outro; painel protegido por login | dado sensível de terceiros |
| RNF05 | **Storage de produção real (Vercel Blob)** — hoje é stub que dá erro | ⚠️ **upload de foto quebra em produção → bloqueia lançar** (D12) |
| RNF06 | Confiabilidade — publicar e RSVP não podem falhar em silêncio | são os momentos críticos |
| RNF07 | LGPD — dados de convidados tratados com cuidado | exigência legal |
| RNF08 | Testável — manter a suíte (147 testes) verde | regressão sai caro |
| RNF09 | SEO / metadados — cada site indexável e com capa bonita | descoberta + compartilhamento |
| RNF10 | Manutenibilidade — **template manda no visual, usuário manda no conteúdo** (sem layout livre) | princípio de arquitetura do produto |
| RNF11 | Disponibilidade — hospedagem Vercel | site no ar 24/7 |

---

## Fora do MVP (backlog "depois")

- Pagamento real (Mercado Pago) + registro de transações (RF32/RF33)
- Domínio próprio (RF36)
- White-label completo — logo/marca do profissional no site do cliente (RF37)
- Moderação de recados (RF28)
- Bodas e 60 anos na interface (enum já existe, só não aparece na UI)
- RSVP multicanal / app mobile / assessoria na montagem

---

## O que falta pro MVP (resumo acionável)

Cruzando os RF marcados MVP com o estado atual, o que **ainda precisa ser construído**:

1. **RF03** — esqueci a senha (novo)
2. **RF06** — dashboard "Meus sites" → **D4**
3. **RF07** — passo-a-passo de criação → **D5**
4. **RF17 / RF13** — galeria de templates (escolher/visualizar) → **D6**
5. **RF16** — editor guiado "Personalizar layout" → **D7**
6. **RF13** — revisar os 4 templates (miolo próprio) → **D8–D11**
7. **RNF05** — storage real (Vercel Blob) → **D12** *(bloqueador de lançamento)*
8. **RF25 / RF34** — conferir OG do WhatsApp e a expiração por cron
9. **D13/D14** — QA E2E + build + checklist beta

Tudo o mais marcado ✅ já existe e só precisa de revisão de acabamento.

## Decisões registradas (2026-07-08)
- Esqueci-a-senha (RF03): **dentro do MVP**.
- Moderação de recados (RF28): **fora** — recado aparece direto; moderação vai pro backlog.
- Pagamento Mercado Pago (RF32/33): **fora do MVP** — no beta o plano é liberado na mão / cobrado por fora.
