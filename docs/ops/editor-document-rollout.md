# Rollout do documento canônico do editor

O schema da Fase 1 é somente expansivo. `customization`, colunas legadas, presentes, fotos, convidados, contribuições e transações não são removidos nem movidos para JSON.

## Infraestrutura confirmada

| Ambiente | Banco | Prisma provider | Serviço/runtime |
| --- | --- | --- | --- |
| Local real | MySQL | `mysql` | container Docker local `sc-mysql` |
| Produção real | PostgreSQL | `postgresql` na linha implantada | Supabase, consumido pela Vercel |

A branch desta Fase 1 deriva da linha local MySQL, enquanto a linha efetivamente implantada em produção já contém a migração PostgreSQL/Supabase. Essa divergência deve ser reconciliada antes da promoção. Não se deve gerar nem aplicar SQL de produção a partir do provider MySQL.

## Estados de compatibilidade

### Estado A — coluna não existe

O Prisma seleciona os escalares declarados no schema. Se `draftData`, `draftVersion`, `publishedData`, `publishedVersion`, `schemaVersion` ou `publishedAt` não existir fisicamente, queries comuns podem falhar antes de alcançar qualquer fallback legado. A aplicação nova **não é compatível** com esse estado. Não existe fallback confiável no ORM para uma coluna ausente.

### Estado B — coluna existe e valor é `NULL`

A aplicação nova é compatível com `draftData = NULL` e `publishedData = NULL`: o adapter constrói o documento a partir de `Event + customization + gifts + photos`. Em evento legado já publicado, a primeira abertura autorizada no editor inicializa, por compare-and-set idempotente, `draftData` e `publishedData` com o estado legado corrente antes de qualquer edição.

## Ordem obrigatória do rollout

1. Criar e verificar backup recuperável do banco de produção.
2. Expandir o schema no provider real de produção, sem remover ou alterar colunas legadas.
3. Validar que todas as novas colunas existem, aceitam os valores esperados e que eventos antigos continuam legíveis.
4. Implantar a aplicação.
5. Validar eventos antigos publicados, abertura no editor, autosave, conflito e isolamento entre draft e publicação.

Nunca implantar a aplicação antes da expansão: `deploy → schema` expõe o Estado A e pode produzir HTTP 500.

## Expansão

Adicionar a `Event`, preservando todo o schema legado:

- `draftData JSON/JSONB NULL`;
- `draftVersion INT NOT NULL DEFAULT 0`;
- `publishedData JSON/JSONB NULL`;
- `publishedVersion INT NOT NULL DEFAULT 0`;
- `schemaVersion INT NOT NULL DEFAULT 1`;
- `publishedAt` timestamp nullable compatível com PostgreSQL.

O SQL deve ser gerado e revisado para PostgreSQL na linha de produção. `prisma db push` não deve ser executado automaticamente nem contra produção.

## Compatibilidade e backfill

Não é obrigatório um backfill global para liberar a aplicação após o schema expandido. A leitura segue:

1. editor: `draftData`, quando válido;
2. editor sem `draftData`: adapter legado;
3. site público: `publishedData`, quando válido;
4. site antigo sem `publishedData`: renderização legada;
5. primeira abertura autorizada de evento legado `PUBLISHED`: congelamento idempotente do estado legado em draft e publicação.

Um backfill futuro deve operar em lotes idempotentes, com auditoria e comparação visual por amostragem.

## Verificação

- Nenhum registro perdeu `customization`.
- Contagens por status permaneceram iguais.
- Eventos antigos publicados continuam acessíveis.
- Um autosave com versão esperada incrementa `draftVersion` uma vez.
- Duas gravações com a mesma versão: uma vence e a outra retorna conflito.
- Alterar o draft após publicação não modifica `publishedData`.
- IDs e centavos de presentes com contribuições permanecem intactos.

## Rollback

Reverter somente a aplicação para o leitor legado. As colunas expansivas podem permanecer e a versão anterior as ignora. Não apagar as colunas no rollback: remoção exige migração separada, retenção e auditoria. Como o deploy novo só ocorre após alcançar o Estado B, o rollback não depende de desfazer o schema.

## Dívida explícita da Fase 2

O documento canônico já é a fonte de persistência e do modelo compartilhado de renderização, mas a UI monolítica ainda mantém uma view `State` derivada e faz conversões testadas em ambos os sentidos. Não adicionar campos a esse `State` sem mapeá-los no documento.

- Preview: `InvitationRenderer`.
- Publicado: componentes legados de página + modelo compartilhado de renderização.

A migração integral da UI e do site público para uma única árvore de renderer pertence à Fase 2; não faz parte deste rollout.
