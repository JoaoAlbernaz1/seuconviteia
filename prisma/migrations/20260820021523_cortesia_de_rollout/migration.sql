-- CORTESIA DE ROLLOUT — migration de USO UNICO.
--
-- A branch fechou o convite para edicao depois de publicado, e `edicaoAte` nasce
-- NULL: sem este UPDATE, no dia do deploy TODO convite ja publicado em producao
-- amanhece fechado, sem cortesia e sem aviso — inclusive quem comprou
-- acreditando que podia editar. A decisao foi dar 48h a todos para atravessar a
-- virada.
--
-- USO UNICO: nao ha nada aqui para rodar de novo. Se um dia esta migration for
-- reaplicada num banco ja migrado, ela vai reabrir a edicao de todo convite vivo
-- — o que ninguem quer. Ela existe pelo momento do deploy, e so.
--
-- A ultima clausula e o cuidado que importa: `edicaoAte` so anda para FRENTE.
-- Quem ja pagou um passe (48h a partir do pagamento) ou empilhou varios nao pode
-- ter a janela ENCOLHIDA pela cortesia.
--
-- `AT TIME ZONE 'UTC'` pelo mesmo motivo de `lib/passeEdicao.ts`: `edicaoAte` e
-- `expiresAt` sao `timestamp` (sem fuso) guardando UTC, e `now()` e `timestamptz`
-- — comparar/atribuir direto faria o Postgres converter pelo TimeZone da SESSAO
-- e a conta sairia 3h torta em America/Sao_Paulo, calada.
UPDATE "Event"
   SET "edicaoAte" = (now() AT TIME ZONE 'UTC') + interval '48 hours'
 WHERE "status" = 'PUBLISHED'
   AND "expiresAt" > (now() AT TIME ZONE 'UTC')
   AND (
         "edicaoAte" IS NULL
      OR "edicaoAte" < (now() AT TIME ZONE 'UTC') + interval '48 hours'
       );
