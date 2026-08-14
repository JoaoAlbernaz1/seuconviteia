# Rollout do documento canônico do editor

O schema da Fase 1 é somente expansivo. `customization`, colunas legadas, presentes, fotos, convidados, contribuições e transações não são removidos nem movidos para JSON.

## Pré-condições

1. Confirmar que o branch de produção e o schema do PlanetScale correspondem ao commit que será promovido.
2. Criar branch de banco/backup conforme o processo vigente da conta PlanetScale.
3. Registrar contagens de `Event` por status e uma amostra dos JSONs de `customization`.
4. Executar `prisma validate` e revisar o SQL gerado antes de aplicar.

## Expand

Adicionar a `Event`, sem alterar colunas existentes:

- `draftData JSON NULL`;
- `draftVersion INT NOT NULL DEFAULT 0`;
- `publishedData JSON NULL`;
- `publishedVersion INT NOT NULL DEFAULT 0`;
- `schemaVersion INT NOT NULL DEFAULT 1`;
- `publishedAt DATETIME(3) NULL`.

O deploy de aplicação deve aceitar simultaneamente registros com e sem snapshots.

## Compatibilidade e backfill

Não é obrigatório fazer backfill para liberar a aplicação. A leitura segue:

1. editor: `draftData`, quando válido;
2. editor sem `draftData`: adapter de `Event + customization + gifts + photos`;
3. site público: `publishedData`, quando válido;
4. site antigo sem `publishedData`: renderer legado atual.

Um backfill futuro deve operar em lotes idempotentes e preencher somente `draftData IS NULL`. Para eventos `PUBLISHED`, pode também criar `publishedData` com o mesmo documento, `publishedVersion = draftVersion` e `publishedAt = updatedAt`, após comparação visual por amostragem.

## Verificação

- Nenhum registro perdeu `customization`.
- Contagem de eventos por status permaneceu igual.
- Eventos antigos publicados continuam acessíveis.
- Um autosave com versão esperada incrementa `draftVersion` uma vez.
- Duas gravações com a mesma versão: uma vence e a outra retorna conflito.
- Alterar o draft após publicação não modifica `publishedData`.

## Rollback

Reverter a aplicação para o leitor legado. As novas colunas podem permanecer sem afetar a versão anterior. Não apagar as colunas durante o rollback; remoção, se algum dia necessária, exige uma migração separada depois da retenção e auditoria dos dados.

## Aplicação

Este repositório historicamente usa `prisma db push`. Não executar `db push` automaticamente contra produção. A aplicação do schema exige revisão do ambiente/branch PlanetScale e aprovação operacional explícita.
