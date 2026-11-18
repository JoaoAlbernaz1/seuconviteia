# SeuConvite IA

**Plataforma de convites digitais e sites de eventos.** Um SaaS com arquitetura multi-tenant para pessoas que organizam seus próprios eventos e profissionais que administram convites para clientes.

**Estado:** em desenvolvimento. O repositório contém implementação de interfaces, fluxos, banco de dados e integrações, mas isso **não significa que todos os recursos estejam disponíveis em produção**.

[Explorar o código](https://github.com/JoaoAlbernaz1/seuconviteia) · [Arquitetura](#arquitetura) · [Executar localmente](#executar-localmente)

## O produto

O objetivo é permitir criar, personalizar e compartilhar um convite por um endereço próprio do evento. A experiência reúne conteúdo do evento, confirmações de presença, presentes e recursos de gerenciamento. O produto contempla tanto uso individual quanto profissionais de eventos, com estrutura para vários clientes/convites.

## Engenharia em destaque

| Área | Implementação presente no repositório |
|:--|:--|
| **Frontend** | Next.js 16, App Router, React 19, TypeScript e Tailwind CSS v4 |
| **Multi-tenancy** | Resolução de domínio e subdomínio no `middleware.ts` e `lib/tenant.ts`, com labels reservadas |
| **Dados** | Prisma com PostgreSQL; schema de profissionais, eventos, convidados, presentes e assinaturas |
| **Acesso** | Estrutura de autenticação com Auth.js, páginas de login e recuperação de senha |
| **Experiência** | Páginas de marketing, painel, criação e edição de convites, páginas públicas de evento |
| **Integrações** | Código para Mercado Pago, uploads e webhooks; configuração externa necessária |
| **Qualidade** | Testes com Vitest e Playwright; workflow de CI com lint, TypeScript, testes e build |

**Importante:** esta tabela descreve o que está versionado no código, não um conjunto de funcionalidades certificado como pronto para clientes.

## Arquitetura

O domínio e o subdomínio determinam a experiência:

```text
seuconviteia.com
 └─ Site institucional e entrada da plataforma

app.seuconviteia.com
 └─ Entrada e painel do organizador

<evento>.seuconviteia.com
 └─ Site público do convite

Next.js + Auth.js
       │
       └── Prisma + PostgreSQL
            └── Profissionais, eventos, convidados e cobranças
```

O `middleware.ts` interpreta o host; `lib/tenant.ts` contém funções de normalização e resolução de subdomínio. O painel também utiliza caminhos como `/painel`. Labels como `www`, `app`, `api`, `admin` e `send` não podem se tornar slugs de eventos.

As decisões de isolamento entre clientes, pagamentos e autenticação exigem validação de integração e segurança antes de disponibilização comercial.

## Executar localmente

Requisitos: Node.js e pnpm compatíveis com o projeto, além das variáveis configuradas para os serviços utilizados.

```bash
git clone https://github.com/JoaoAlbernaz1/seuconviteia.git
cd seuconviteia
pnpm install

# Configure .env.local com base em .env.example (não versionar segredos)
pnpm dev
```

Para testar os subdomínios em desenvolvimento, configure `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000` e abra, por exemplo, `http://cliente.localhost:3000`.

### Verificações

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Os testes E2E com Playwright podem precisar de um ambiente e serviços adicionais configurados:

```bash
pnpm test:e2e
```

As migrações do banco utilizam `pnpm db:migrate` em desenvolvimento e `pnpm db:deploy` no deploy. O projeto não utiliza mais PlanetScale/MySQL: a configuração atual do Prisma é **PostgreSQL**.

## Organização do código

- `app/(marketing)/`: experiência institucional e páginas públicas de apresentação.
- `app/(dashboard)/`: acesso, criação e gerenciamento de convites.
- `app/%5Fsites/`: rotas públicas de eventos servidas pelos subdomínios.
- `app/api/`: rotas de serviços e integrações.
- `lib/`: regras de negócio, domínio, planos e utilitários testáveis.
- `prisma/`: schema e migrações.
- `e2e/` e testes `*.test.ts`: verificações automatizadas.

## Próximas prioridades

Consolidar os fluxos ponta a ponta, validar integrações reais em ambiente controlado, reforçar isolamento multi-tenant, revisar segurança de autenticação e pagamentos, ampliar testes E2E e preparar a operação do produto. A evolução deve ser acompanhada pelos commits e testes do repositório, e não por alegações de recursos concluídos.

---

<sub>Projeto pessoal de engenharia de software · [Portfólio GitHub](https://github.com/JoaoAlbernaz1) · [Outros experimentos de IA e ML](https://github.com/JoaoAlbernaz1/JoaoAlbernaz1/tree/main/ml-lab)</sub>
