# Plano de lançamento — SeuConvite IA

**Estratégia (decidida com o João):** terminar **TUDO no ambiente de teste (local)** primeiro
— que já é completo e grátis (banco Docker + app + subdomínios `slug.localhost:3000`) —
e só depois fazer o **cutover pra produção** (banco na nuvem + domínio), UMA vez.

> Não existe "ambiente de teste hospedado" mais barato: hospedar exige o mesmo
> banco-na-nuvem + domínio que produção. Então o **local é o ambiente de teste**.

Verificação contínua: o teste E2E da jornada do cliente (`scratchpad/e2e.py`) passa
**10/10** (entrar → criar → dados → capa → galeria → presente/Pix → publicar → site
público → RSVP → confirmação no painel). Rodar a cada mudança grande.

---

## FASE A — Terminar no ambiente de teste (local)

### A1. Templates de design *(em andamento)*
- [x] Encanamento: `customization.template` + `lib/templates.ts` + `EventoFesta.template` + branch na `PaginaInicio`
- [x] Capa **Editorial** (desktop + celular, themeável, reduced-motion OK)
- [x] Seletor Clássico/Editorial na tela "Trocar o estilo" + persistência (`salvarEstilo`) + preview ao vivo
- [ ] **DECISÃO:** modelo *template (design)* × *estilo (cor/fonte)* — hoje os nomes colidem (template "Editorial" × card de cor "Editorial")
- [ ] Seletor de template também no **wizard** (criar evento) — mesmo padrão
- [ ] **Fase 2:** seções editoriais da **home** + **/evento**
- [ ] **Fase 3:** presentes/galeria + extrair e reestilizar recados/confirmar/obrigada (hoje inline nas rotas)
- [ ] **Fase 4:** templates 2 e 3 (Minimalista, Bold) — capa + páginas

### A2. Fotos / storage *(crítico pra prod)*
- [ ] Implementar o **provider Vercel Blob** (`lib/storage/index.ts` — hoje `throw`). Sem isso, upload de foto **quebra em produção** (disco serverless não persiste). Dá pra codar no local; só testa com `BLOB_READ_WRITE_TOKEN`.

### A3. Pagamento / Pix
- [ ] **DECISÃO:** manter **Pix manual** (chave + QR, como está e já funciona) OU integrar **Mercado Pago** (Pix real / split) — decisão de conta/custo.

### A4. Preços / planos
- [ ] Definir os **preços** (slot ainda vazio) e a página de assinatura.

### A5. E-mails (Resend)
- [ ] Hoje stub sem chave. Precisa da **chave Resend** pra enviar de verdade (pode ficar pro cutover).

### A6. QA / polimento
- [ ] Rodar o E2E a cada leva.
- [ ] Testar visual nas 6 paletas + reduced-motion + nicho ≠ 15 anos (checklist da skill `evt`).
- [ ] Commitar as levas conforme forem aprovadas (hoje há bastante coisa boa **não commitada**).

---

## FASE B — Cutover pra produção (uma vez, quando a Fase A fechar)

Pré-requisitos (decisões suas): **banco MySQL na nuvem** + **domínio**.

- [ ] **Banco:** criar MySQL na nuvem (ex.: Railway/TiDB) → me passar a `DATABASE_URL`.
- [ ] **Domínio:** comprar `seudominio.com` + apontar DNS: apex → Vercel; **wildcard `*.seudominio.com` → CNAME `cname.vercel-dns.com`** (sem wildcard, os sites por subdomínio não abrem).
- [ ] **Vercel env (produção):** `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_ROOT_DOMAIN=seudominio.com`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `MERCADOPAGO_ACCESS_TOKEN` (se A3), `CRON_SECRET`.
- [ ] **Vercel domínios:** adicionar apex + wildcard no projeto.
- [ ] **Schema/dados:** rodar `prisma db push` (ou migrations) + seed no banco de prod.
- [ ] **Destravar deploy:** git-author protection + Vercel Authentication (ver `memory/seuconviteia-vercel-deploy-block`).
- [ ] **Deploy + smoke:** publicar e rodar o **E2E contra o domínio real**.

---

## Decisões pendentes do João (destravam a Fase A)
1. **Template × cor/fonte** (A/B do choque de nomes) → destrava A1.
2. **Pix manual vs Mercado Pago** → destrava A3.
3. **Preços** → destrava A4.
4. **Banco na nuvem + domínio** → só na hora do cutover (Fase B).
