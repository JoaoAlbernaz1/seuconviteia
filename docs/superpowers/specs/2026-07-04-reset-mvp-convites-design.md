# Reset MVP — seuconviteia (spec)

Data: 2026-07-04 · Branch: `reset-mvp-convites` · Baseline: `385a61d`

## Objetivo

Reset CONTROLADO (não apagar tudo): limpar o morto, preservar o núcleo, e
reorganizar para um **MVP limpo em 14 dias**. Estratégia: **B2C-first, B2B-ready**
(pessoa física cria o próprio site; profissional cria para clientes).

Promessa: **"O seu site de convite em minutos."** Ocasiões do MVP: Casamento,
15 anos, Aniversário.

## Decisões aprovadas (João, 2026-07-04)

1. **Dropar o legado** `classico`/`editorial` + cauda. Fallback oficial =
   `casamento-classico-elegante`.
2. **Virar o design** do painel: abandonar o painel ESCURO; ir para claro/premium
   (off-white, champagne, rosé, grafite, bege claro). "Criador de sites bonito",
   não ERP/dashboard admin.
3. **Bodas/60 anos**: ficam no enum do banco (sem migration), FORA da UI do MVP.

## Núcleo PRESERVADO (nunca apagar)

Auth · `Professional`/`Event`/`Guest`/`GiftItem`/`Photo`/`Recado` · `Event.customization`
· multi-tenant (subdomínio) · RSVP · presentes/Pix · galeria · programação · contador
· recados · preview real (`/preview-evento`) · publicação por subdomínio · isolamento
por dono · Zod · e-mail · storage (abstração) · testes úteis · helpers (`eventoFesta`,
`convite`, `textos`, `temas`, `fontes`, `recursos`, `dates`, `slug`, `event`, `plans`).

## Dia 1 — LIMPEZA executada (feito)

**Removido (com evidência de 0 uso ativo):**
- `components/event/*` (single-page antigo) + bloco `.cv` do globals.css (~1014 linhas).
- `lib/payments/*` (stub 0-import).
- `app/(event)/layout.tsx` (route group sem page).
- 4 rotas redirect-stub: `painel/[id]/editar`, `painel/{eventos,convidados,presentes}`.
- 5 templates fora do MVP (editorial-moderno, noite-luxo, fashion-editorial,
  princesa-delicado, tropical-festa).
- Legado: `_base/*`, `PaginaInicioEditorial`, e evt legado-only (HeroCinematic,
  HeroEditorial, PhotoFrame, Countdown, PainelPresentes).
- Ações mortas em `actions.ts` (`criarEvento`/`editarEvento`/`publicarEvento`) +
  helpers órfãos + comentários do modelo abandonado (marca d'água/upsell).
- Fotos da Maria saíram do demo/preview (rights: usar set CC0 depois — `lib/demoFotos.ts`).

**Mantido/ajustado:** `registro.tsx` (4 templates, fallback = classico-elegante),
`lib/templates.ts` (4 entradas + tags/filtros/tipos da galeria já prontos),
`templates.test.ts` (147 testes verdes).

## 14 dias (roadmap)

- **D1** auditoria + branch + limpeza + estabilidade ✅
- **D2** design system claro/premium (`components/ui/` + tokens) — item pivô
- **D3** landing (hero + templates + como funciona + recursos + Para profissionais + planos + FAQ + CTA)
- **D4** dashboard "Meus sites" (simples, não-ERP)
- **D5** fluxo de criação (6 etapas: Para quem? · Ocasião · Template · Dados · Personalizar · Publicar; data/hora bonitos)
- **D6** galeria de templates (filtro ocasião + estilo/tag + busca + Visualizar + Escolher)
- **D7** editor guiado "Personalizar layout" (sidebar + preview grande desktop/tablet/mobile; salva só no "Salvar")
- **D8–D11** os 4 templates completos (já reconstruídos; revisar miolo próprio)
- **D12** storage de produção (`VercelBlobStorage` real; hoje é stub que dá throw)
- **D13** QA E2E (criar conta → site → template → editar → publicar → mobile → RSVP → ver confirmação)
- **D14** ajustes finais + build + checklist beta

## Arquitetura de templates (alvo)

`lib/templates.ts` (metadados + tags/filtros/`TemplateEditableGroup`/`TemplatePreviewMode`)
· `lib/template-types.ts` + `lib/template-utils.ts` (a criar) · `components/templates/registro.tsx`
(id → {Home,Evento,Presentes,Galeria}) · **`TemplateRenderer`** (a criar): recebe
event/customization/templateId/previewMode/dados-temporários. Fallback = classico-elegante.
Trocar template nunca apaga `customization`.

**Regra dos templates:** o template controla o VISUAL; o usuário controla o CONTEÚDO
e a ATIVAÇÃO dos módulos. Compartilha LÓGICA (dados/data/fallback/RSVP/presentes/
galeria/contador/módulos + botão/badge/container), **nunca** a mesma seção visual.

## Módulos editáveis (conteúdo, não layout)

convite · data/local · contador · programação · presentes (Pix: título/texto/chave/
recebedor/QR/link/itens{nome,descrição,valor,ordem}) · galeria · recados · RSVP
(título/texto/data-limite/acompanhantes/max/telefone/observação/texto-botão/sucesso).
SEM: arrastar campos, campos infinitos, mudar layout interno de RSVP/presentes, CSS por módulo.

## Congelado (pós-MVP)

Mercado Pago/recorrência · domínio próprio · WhatsApp · IA · CRM · pagar-por-site
automático · editor tipo Canva · os outros 5 templates · `model Transaction`.

## Pendências de decisão ($ / infra)

- Storage prod: `BLOB_READ_WRITE_TOKEN` (Vercel Blob) para o D12.
- Monetização: estrutura pronta (pessoa física = avulso; profissional = assinatura
  com limite); pagamento real depois.
