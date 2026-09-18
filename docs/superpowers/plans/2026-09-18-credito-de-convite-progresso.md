> **Ledger de execução** do plano `2026-09-18-credito-de-convite.md`, versionado
> para sobreviver à troca de máquina — o original vive em `.superpowers/sdd/`,
> que é scratch local e fora do git.
>
> Registra o que já foi feito, as decisões que tomei durante a execução
> (`Ruling:`) e os achados menores adiados para a revisão final. Ao retomar,
> **leia isto antes do plano**: ele diz em que task parar e o que já foi
> decidido e não deve ser reaberto.

# SDD ledger — plan: docs/superpowers/plans/2026-09-18-credito-de-convite.md

Spec: `docs/superpowers/specs/2026-09-18-credito-de-convite-design.md` (lida, alcançável).
Branch: `claude/dominios-e-creditos` · MERGE_BASE `35476e3` · HEAD no início `6296e0b`.

Ruling: trabalhar na branch existente em vez de criar worktree — a branch já está
isolada da master, e esta estação (Windows sem admin, `core.symlinks=false`) já
mostrou hoje que worktree/symlink aqui custa mais do que entrega. Custo se errado:
se o João quiser mexer na branch em paralelo, há risco de conflito de árvore.

## Preflight — varredura de conflitos

### Pares de tasks que compartilham arquivo ou interface

| A | B | Produz → consome | Achado |
|---|---|---|---|
| 1 | 2 | `lib/credito.test.ts`: T1 cria o arquivo, T2 acrescenta um segundo `describe` | ❌ **CONFLITO** — o `afterAll` do describe da T1 chama `prisma.$disconnect()`. Vitest roda o `afterAll` do describe 1 antes dos testes do describe 2, então a T2 rodaria com o cliente já fechado |
| 1 | 2 | `CreditoConvite` (modelo) → `saldoDeCreditos`/`gastarCredito` | ✅ campos batem: `status`, `eventId`, `professionalId`, `createdAt` |
| 2 | 4 | `saldoDeCreditos`/`gastarCredito` → porta de criar | ✅ `PrismaLike` aceita tanto `prisma` quanto o `db` do `$transaction` |
| 3 | 4 | `app/(dashboard)/painel/criar/acoes.ts` — as duas modificam | ✅ T4 reescreve o bloco de criar já usando o `ocupamVaga` da T3; o texto da T4 repete a linha da contagem de forma idêntica |
| 3 | 4 | `tests/credito-de-convite.test.ts`: T3 cria, T4 acrescenta ao mesmo `describe` | ✅ mesmo describe, mesmos helpers |
| 5 | 6 | `acharCreditoConvite`/`confirmarCreditoConvite` → webhook | ✅ nomes e assinaturas idênticos nos dois lados |
| 2 | 6 | `CREDITO_PRECO_CENTS` → action de compra | ✅ |
| 6 | 8 | `comprarCreditoConvite` (em `painel/creditos/acoes.ts`) → `CreditosCliente` importa `"./acoes"` | ✅ mesmo diretório |
| 2 | 8 | `saldoDeCreditos` → `page.tsx` | ✅ |
| 7 | 8 | T7 aponta um `<Link href="/painel/creditos">` para a rota que só existe na T8 | ⚠️ **janela de link morto** entre as duas tasks |

### Coerência interna de cada task

| Task | Achado |
|---|---|
| 1 | ✅ o teste usa só campos que o modelo declara; o `P2002` esperado bate com o `@unique` em `eventId` |
| 2 | ✅ testes e implementação concordam; a varredura de candidatos é o que o 5º teste exige |
| 3 | ⚠️ o teste da porta de publicar grava `draftData` com `as unknown as object` — provavelmente não passa no tipo do Prisma |
| 4 | ✅ o `SemCredito` é lançado dentro do `$transaction` e capturado fora; o `catch` re-lança o que não for dele |
| 5 | ✅ o CAS aceita `PENDING` e `FAILED`, e o 3º teste prova o `FAILED` |
| 6 | ✅ espelha `liberar/acoes.ts`, inclusive a janela de reaproveitamento |
| 7 | ✅ a prop nova é opcional, então os outros usos de `RecursoBloqueado` não mudam |
| 8 | ✅ consome só o que a T6 e a T2 produzem |

### Rulings do preflight

1. **Ruling: o `$disconnect()` sai do `afterAll` da T1 e passa a viver num `afterAll` de nível de arquivo**, fora dos dois `describe`. Motivo: é o único jeito de os dois blocos do `lib/credito.test.ts` coexistirem — o `afterAll` de um describe roda antes dos testes do seguinte. Custo se errado: o cliente Prisma fica aberto ao fim do arquivo e o vitest reclama de handle pendente (barulho, não falha). Carregar este ruling no brief da T1 e da T2.

2. **Ruling: executar a Task 8 ANTES da Task 7.** Motivo: elimina a janela em que o popup aponta para uma rota inexistente. Nenhuma das duas depende da outra no sentido inverso — a T8 só precisa da T6. Custo se errado: nenhum que eu veja; a ordem das duas é livre.

3. **Ruling: no teste da porta de publicar (T3), o `draftData` vai como `as unknown as Prisma.InputJsonValue`**, com `Prisma` importado de `@prisma/client`. Motivo: `as unknown as object` não satisfaz o tipo de entrada do Prisma. Custo se errado: o implementador corrige na hora, é erro de compilação imediato.

Ordem de execução: **1 → 2 → 3 → 4 → 5 → 6 → 8 → 7**.

## Progresso

Task 1: dispatched (BASE 6296e0b, implementer sonnet, ruling do $disconnect carregado no brief)
Task 1: implementada — commit 39d6d14 (modelo + migration + 3 testes). Gate: tsc limpo,
        lint 0 erros (2 warnings pre-existentes), 573 passed | 1 skipped com banco.
        Ruling do $disconnect aplicado (lib/credito.test.ts:90). Implementador verificou
        que os dados reais do banco de dev seguem intactos.
Task 1: task reviewer dispatched (sonnet, BASE 6296e0b, HEAD 39d6d14)
Task 1: complete (commits 6296e0b..39d6d14, review clean — spec compliant, 0 Critical/Important)
Task 1: minor (deferred): alinhamento de coluna do campo `creditos` no model Professional
        (prisma/schema.prisma) destoa do bloco; cosmetico, e o `passwordResets` ja destoava.
        Verificado pelo revisor: a SQL da migration gera os DOIS unique e os DOIS
        comportamentos de FK (CASCADE no professional, SET NULL no event).
Task 2: dispatched (BASE 39d6d14, implementer haiku — brief tem o codigo completo,
        entao e transcricao + verificacao). Carregado: os helpers e o afterAll de arquivo
        ja existem no lib/credito.test.ts, o describe novo entra ANTES do afterAll final.
Task 2: implementada — commit 3980a95 (lib/credito.ts + 6 testes). Gate: tsc limpo,
        lint 0 erros, 579 passed com banco. Concerns do implementador: nenhuma.
Task 2: task reviewer dispatched (sonnet, BASE 39d6d14, HEAD 3980a95). Pedido explicito
        de julgar se o teste de concorrencia falharia mesmo contra uma implementacao
        ingenua — o implementador afirma que sim, e afirmacao dele nao e evidencia.
Task 2: complete (commits 39d6d14..3980a95, review clean — spec compliant, 0 Critical/Important)
        Revisor tracou as interleavings da concorrencia e confirmou: o teste de duas
        chamadas simultaneas FALHARIA contra uma implementacao ingenua (daria [true,false]),
        entao ele prova a varredura. Nenhuma interleaving recusa com saldo sobrando.
Task 2: minor (deferred): lint tem 2 warnings pre-existentes (lib/plans.ts, lib/tenant.ts)
        — o portao nao esta 100% limpo, mas sao de arquivos que este diff nao toca.
Task 2: minor (deferred): `gastarCredito` faz findMany sem teto; irrelevante na escala real
        (saldos pequenos), mas e leitura ilimitada por tentativa de gasto.
Task 2: minor (deferred): falta teste fixando isolamento por professionalId — o filtro
        existe no codigo (lib/credito.ts:30 e :58), mas nada trava regressao cross-tenant.
Task 3: dispatched (BASE 3980a95, implementer sonnet). Carregado o ruling do
        Prisma.InputJsonValue, o aviso de que `Prisma` ja esta importado em acoes.ts:16,
        e a ordem expressa de NAO mexer em tests/limite-de-convites.test.ts.
Task 3: implementada — commit d62610a (ocupamVaga + 3 testes). Gate: tsc limpo, lint 0
        erros, 582 passed com banco. tests/limite-de-convites.test.ts 5/5 sem alteracao.
        Verificado por mim (controller) com git diff --name-only 3980a95..HEAD: a suite de
        regressao NAO foi tocada — so acoes.ts e o teste novo. A afirmacao se sustenta.
Task 3: task reviewer dispatched (sonnet, BASE 3980a95, HEAD d62610a). Pedidos explicitos:
        (a) conferir se o ocupamVaga foi aplicado em TODAS as portas, e nao so na de criar;
        (b) julgar se o teste da porta de publicar chega mesmo na checagem de cota, dado
        que o publicar tem varias precondicoes antes dela;
        (c) confirmar a semantica de `credito: { is: null }` no Prisma — se esse filtro
        estiver errado, toda decisao de cota do arquivo esta errada.
Task 3: review = spec FALHOU. Important: o teste da porta de publicar nao alcanca a
        checagem de cota — o publicar so cobra vaga quando o convite estava VENCIDO
        (acoes.ts:340), e o teste cria o convite com expiresAt 60 dias no futuro. Ele
        passava ANTES do conserto (confirmado pela propria evidencia RED do implementador:
        "1 failed | 2 passed"). O conserto de producao esta correto — o revisor verificou
        que ocupamVaga esta aplicado nas tres portas; o defeito e so na evidencia.
Task 3: Ruling: o teste 3 do PLANO era defeituoso e vai ser reescrito (convite vencido,
        reativado com data futura, depois publicado). O achado contraria o texto do plano,
        que fui eu quem escreveu — e a spec, que e a autoridade, exige provar as tres
        portas. Um teste que passa com o conserto revertido nao prova porta nenhuma.
        Custo se errado: nenhum; a mudanca so fortalece a evidencia, nao o codigo.
Task 3: Ruling: exigi prova NOS DOIS SENTIDOS na correcao (remover temporariamente o
        `credito: { is: null }` e mostrar o teste vermelho), que e o que o commit 36447f7
        de 24/08 ja fez para a cota. Sem isso, nao ha como distinguir um teste que prova
        de um que so passa. Custo se errado: gasta um ciclo a mais do implementador.
Task 3: minor (deferred): o doc-comment do `documentoDe` tem acentos, contra a convencao
        do repo. Veio do texto do MEU brief, nao e escolha do implementador.
Task 3: fix round 1/5 dispatched (resume do implementador original, FIX_BASE d62610a)
Task 3: fix round 1/5 — commit 3c017b2. Teste reescrito em torno de convite VENCIDO
        reativado com data futura. Implementador reporta prova nos dois sentidos: 3/3 com
        o ocupamVaga inteiro, 2/3 FALHANDO com o `credito: { is: null }` removido (o teste
        da terceira porta entre os que quebram), linha restaurada depois.
        Verificado por mim: o diff do fix toca SO tests/credito-de-convite.test.ts, e
        acoes.ts esta byte-identico ao d62610a.
Task 3: re-review escopada dispatched (sonnet, FIX_BASE d62610a, HEAD 3c017b2). Instrucao
        central: NAO aceitar "o teste passa" como evidencia — a versao quebrada tambem
        passava. Ler as datas do teste e confirmar que ele entra no ramo do acoes.ts:340,
        e conferir se a saida da prova reversa nomeia mesmo o teste da terceira porta.
Task 3: fix round 1/5 (1 addressed, 0 open; commits d62610a..3c017b2). Re-revisao confirmou
        os tres pontos: o convite nasce com expiresAt 8 dias no PASSADO e entra mesmo no
        ramo do acoes.ts:340; passa as demais precondicoes sem bailar antes; e a saida da
        prova reversa nomeia o teste da terceira porta, com mismatch real
        (ok:false/kind:'limit' vs ok:true). Nenhuma quebra nova no diff do fix.
Task 3: complete (commits 3980a95..3c017b2, review clean apos 1 round)
Task 4: dispatched (BASE 3c017b2, implementer sonnet). Carregado: os helpers que ja
        existem no arquivo de teste, a exigencia de que gastarCredito receba o `db` da
        transacao e nao o prisma global, e a licao da Task 3 — prova NOS DOIS SENTIDOS,
        desta vez desabilitando o gasto e exigindo que o teste do segundo convite falhe.

---

## Onde a execucao parou (18/09/2026, fim da sessao)

A sessao foi encerrada no meio da **Task 4**. O trabalho dela foi salvo no commit
`d9b46e9`, marcado como WIP e **nao verificado**: nao rodou o portao completo,
nao teve a prova nos dois sentidos e nao passou pela revisao de task.

Falta executar: **Task 4 (terminar) -> 5 -> 6 -> 8 -> 7**.

Ao retomar a Task 4, o primeiro passo NAO e escrever codigo: e rodar
`pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test` contra o
que ja esta no `d9b46e9`, e depois a prova reversa (desabilitar o gasto e exigir
que o teste do segundo convite falhe).

O Postgres local sobe com `Start-ScheduledTask -TaskName PostgreSQL-seuconviteia-logon`
e os testes de banco exigem `PAGAMENTO_DB_TESTS=1`.
