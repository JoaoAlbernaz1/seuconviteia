# Prompt Mestre — Painel v2 (templates + recursos configuráveis + didático)

> Cole tudo abaixo no Claude Code aberto em `/Users/joaoalbernaz/seuconviteia`.

---

Quero evoluir o painel do seuconviteia para a versão 2. Leia antes: `CLAUDE.md`, as skills do projeto em `.claude/skills/` (principalmente **evt**, **brand**, **db**, **tenant**, **run**) e `docs/brief-design.md`. Use as skills de forma inteligente durante todo o trabalho (as do projeto + as globais: `ui-ux-pro-max`/`frontend-design`/`web-design-guidelines` pro visual, `prisma-*` pro banco, `webapp-testing` pra verificar no navegador). Subagentes em **Opus**; escale pro Fable só no que for realmente complexo.

## O que NÃO muda

- O painel atual (sidebar escura + visão geral com KPIs + grade de eventos + editor 3-painéis com preview ao vivo) está **no caminho certo** — é pra **EVOLUIR em cima dele**, não jogar fora nem redesenhar o que já aprovei.
- Modelo de negócio = **assinatura** (`lib/plans.ts` é a fonte única de gating). Decisões de dinheiro/preço são MINHAS — não inventar valores.
- O site do evento (template festa, `components/evt/*`) é canônico — não mexer no visual dele.

## Objetivo — 3 evoluções

### 1. Sistema de TEMPLATES
Hoje o site do evento tem 1 visual (o template "festa"). Quero:
- **Galeria de templates** na criação do evento: cards com preview visual real (thumbnail ou miniatura ao vivo), nome e descrição curta de cada um.
- Template escolhido + paleta = a combinação visual do site. Dá pra **trocar o template depois no editor sem perder nenhum dado** preenchido.
- **Arquitetura plugável**: adicionar um template novo no futuro NÃO pode exigir refazer painel/editor — só registrar o template novo (avaliar usar/evoluir o model `Template` que já existe no schema Prisma sem uso). Documentar num `docs/como-criar-template.md` o passo a passo de plugar um template novo.
- O visual atual vira o primeiro da galeria (ex.: "Clássico"), fiel como está.
- Preparar o preview do editor pra renderizar conforme o template escolhido.

### 2. FÁCIL E DIDÁTICO (um leigo cria o primeiro evento sem manual)
- **Onboarding no primeiro login**: checklist "primeiros passos" (criar evento → personalizar → publicar → compartilhar) que acompanha o usuário e some quando completo.
- Editor com **linguagem simples** (zero jargão), dicas curtas contextuais onde há dúvida comum (dimensão de foto, o que é RSVP, o que o convidado vê), e o preview sempre visível como confirmação do que se está fazendo.
- **Empty states que ensinam** o próximo passo (painel sem eventos, evento sem fotos, sem confirmações ainda).
- **Mobile impecável** no painel inteiro (o profissional trabalha do celular).

### 3. RECURSOS CONFIGURÁVEIS POR EVENTO (os "extras"/upsells nas mãos do cliente)
- O profissional **liga/desliga cada recurso do site por evento**, do jeito que quiser: RSVP, mural de recados, galeria/álbum, lista de presentes + Pix, contador regressivo, programação — cada um com toggle claro + explicação de uma linha do que faz no site do convidado.
- Recurso que o plano não libera: **visível porém bloqueado**, com upgrade explicado (nunca esconder — é vitrine).
- O gating por plano continua 100% centralizado em `lib/plans.ts`; a configuração por evento entra como camada em cima (ex.: `Event.customization.recursos`). **Desacoplar a UI do modelo de monetização**: se um dia eu decidir vender recurso avulso em vez de por plano, só a camada de monetização muda.

## Processo (fases com checkpoint — eu decido VENDO)

- **FASE 1 — Proposta visual**: arquitetura dos templates + mockup/wireframe navegável do fluxo novo (galeria de templates, onboarding, painel de recursos). ME MOSTRAR ao vivo no navegador (ou imagens abertas no Preview) e **esperar meu ok antes de codar o resto**.
- **FASE 2 — Templates**: schema + galeria + integração com editor/preview. Commit + me mostrar ao vivo.
- **FASE 3 — Recursos por evento**: toggles + gating + reflexo no site publicado. Commit + me mostrar.
- **FASE 4 — Didática**: onboarding, empty states, microcopy, mobile. Commit + me mostrar.
- **FASE 5 — QA final**: percorrer como cliente novo (desktop + mobile), E2E real, tsc/lint/testes/build verdes, CI verde, dados reais intactos.

## Regras de execução

- Qualidade sênior: nada entra sem `tsc --noEmit` + lint + testes + build verdes; testar o fluxo de verdade no navegador antes de me mostrar.
- Commits semânticos em fatias (padrão do repo), push ao final de cada fase (CI valida).
- Nada de "cara de IA" no visual; se eu mandar referência concreta, replicar FIEL.
- Tudo em português, exceto código.
