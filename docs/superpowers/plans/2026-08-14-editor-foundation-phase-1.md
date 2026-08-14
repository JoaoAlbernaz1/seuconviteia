# Editor Foundation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make edit → preview → autosave → reload → publish reliable without changing the current invitation design or implementing Phase 2 product work.

**Architecture:** Introduce a versioned `EventEditorDocument` as the sole invitation draft, keep `EventEditorUIState` separate, render the document through one React `InvitationRenderer`, and persist it with optimistic concurrency. Preserve the legacy `Event.customization` read path while new events use `draftData` and immutable publication snapshots in `publishedData`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod 4, Prisma 6/MySQL PlanetScale, Vitest, Playwright where the authenticated environment permits.

---

## File boundaries

- `lib/event-editor/document.ts`: canonical document types, defaults and schema version.
- `lib/event-editor/schema.ts`: central Zod validation.
- `lib/event-editor/state.ts`: immutable `updateField`, `updateSection` and `toggleSection` operations.
- `lib/event-editor/registry.ts`: section and toggle registries used by UI and tests.
- `lib/event-editor/legacy.ts`: legacy `Event + customization` adapter and compatibility serializer.
- `lib/event-editor/persistence.ts`: pure optimistic-version and publication-snapshot decisions.
- `components/invitation-renderer/InvitationRenderer.tsx`: shared React renderer for preview and published documents, reusing current template/page components.
- `components/event-editor/EditorPreview.tsx`: device frame and direct React preview; no iframe DOM mutation.
- `app/(dashboard)/painel/criar/CriarConvite.tsx`: form/UI migration to canonical document plus separate UI state.
- `app/(dashboard)/painel/criar/acoes.ts`: versioned autosave and publish actions.
- `prisma/schema.prisma`: additive draft/published snapshot columns; legacy columns remain.
- `app/%5Fsites/[sub]/**`: prefer `publishedData`, fall back to the legacy adapter.

## Task 1: Characterize toggle regressions before fixes

**Files:**
- Create: `lib/event-editor/characterization.test.ts`
- Create: `lib/event-editor/toggle-contract.test.ts`
- Inspect: `app/(dashboard)/painel/criar/CriarConvite.tsx`
- Inspect: `app/(dashboard)/painel/criar/acoes.ts`

- [ ] Define table-driven cases for parents, dress code, RSVP, companions, gifts, Pix, gallery, messages, footer, program, monogram, desktop cover, free contribution, animation, bold and overlay.
- [ ] Encode three ON → OFF → ON cycles and configuration-preservation expectations against the wished-for document API.
- [ ] Add a legacy payload characterization proving that disabled RSVP/parents data is currently removed by `undefined` plus `mesclar()`.
- [ ] Run `pnpm exec vitest run lib/event-editor/characterization.test.ts lib/event-editor/toggle-contract.test.ts` and capture the expected failures before production code exists.
- [ ] Commit as `test: characterize editor toggle regressions`.

## Task 2: Canonical document, schema, defaults and update helpers

**Files:**
- Create: `lib/event-editor/document.ts`
- Create: `lib/event-editor/schema.ts`
- Create: `lib/event-editor/state.ts`
- Create: `lib/event-editor/registry.ts`
- Create: `lib/event-editor/document.test.ts`
- Create: `lib/event-editor/state.test.ts`

- [ ] Write failing tests for complete defaults, schema validation, immutable nested field updates, partial section updates and toggles that change only `enabled`.
- [ ] Run the focused tests and verify failures are caused by missing APIs.
- [ ] Implement `EventEditorDocument`, `EventEditorUIState`, `createDefaultEventDocument`, `EventEditorDocumentSchema`, `updateField`, `updateSection` and `toggleSection`.
- [ ] Implement central section/toggle registries with `previewId`, `step` and `enabledPath` where applicable.
- [ ] Re-run focused tests and the existing suite.
- [ ] Commit as `refactor: introduce canonical event document`.

## Task 3: Legacy compatibility and non-destructive disabled sections

**Files:**
- Create: `lib/event-editor/legacy.ts`
- Create: `lib/event-editor/legacy.test.ts`
- Modify: `app/(dashboard)/painel/criar/acoes.ts`

- [ ] Write failing tests converting current `Event.customization`, gifts and photos into a valid canonical document.
- [ ] Write failing tests proving `undefined` means “not provided”, `enabled: false` preserves data and only explicit supported `null` values clear fields.
- [ ] Implement the legacy adapter and remove implicit deletion semantics from the editor persistence path.
- [ ] Keep `customization` populated as a compatibility projection for existing public rendering during the transition.
- [ ] Verify old adapter fixtures still render the same values.
- [ ] Commit as `fix: preserve disabled section configuration`.

## Task 4: Single React preview data flow

**Files:**
- Create: `components/invitation-renderer/InvitationRenderer.tsx`
- Create: `components/event-editor/EditorPreview.tsx`
- Create: `components/invitation-renderer/InvitationRenderer.test.tsx` if the existing Vitest environment can support React DOM; otherwise cover its pure adapter and add Playwright assertions.
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx`
- Retire from editor use: `app/(dashboard)/painel/_ui/PreviewSite.tsx`

- [ ] Write failing preview-contract tests that every registry toggle controls its section and three cycles restore it without remount-dependent state.
- [ ] Implement `InvitationRenderer({document, mode})` by reusing current template/page components and current CSS identity.
- [ ] Render it directly inside the device frame from the canonical document.
- [ ] Remove query-string document transport, DOM `textContent` mutation and RSVP-specific `postMessage` from the editor path.
- [ ] Ensure all form controls update the document through central immutable helpers; move step/focus/device/save status to `EventEditorUIState`.
- [ ] Verify immediate text and structural updates without network requests.
- [ ] Commit as `refactor: unify live preview data flow`.

## Task 5: Versioned autosave and stale CEP protection

**Files:**
- Create: `lib/event-editor/persistence.ts`
- Create: `lib/event-editor/persistence.test.ts`
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx`
- Modify: `app/(dashboard)/painel/criar/acoes.ts`

- [ ] Write failing tests for version 10 → 11 success and a second version-10 save returning an explicit conflict.
- [ ] Write a failing test for edits made while a save is in flight: only saved metadata changes, never the newer local document.
- [ ] Implement the client save protocol `{eventId, expectedVersion, document}` and conflict result.
- [ ] Implement a request-id/AbortController guard so an older CEP response cannot overwrite later input or a later CEP request.
- [ ] Keep the 800 ms debounce and status indicator, but autosave the canonical document only.
- [ ] Commit as `feat: add draft version concurrency`.

## Task 6: Additive draft/published persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `docs/ops/editor-document-rollout.md`
- Modify: `app/(dashboard)/painel/criar/acoes.ts`
- Create or modify tests for server-independent persistence decisions in `lib/event-editor/persistence.test.ts`

- [ ] Add nullable `draftData`, nullable `publishedData`, `draftVersion`, `publishedVersion`, `schemaVersion` and `publishedAt` fields without removing legacy fields.
- [ ] Document PlanetScale-safe expand/backfill/verify/rollback steps; do not execute destructive schema changes or production backfills.
- [ ] Implement atomic compare-and-swap using `updateMany` constrained by `id`, owner and `draftVersion`; zero updated rows means conflict.
- [ ] Implement publish as a validated snapshot: `publishedData = draftData`, `publishedVersion = draftVersion`, `publishedAt = now`.
- [ ] Expose `draftVersion > publishedVersion` as an unpublished-changes boolean.
- [ ] Commit as `feat: separate draft and published snapshots`.

## Task 7: Public-site snapshot compatibility

**Files:**
- Modify: `lib/eventoFesta.ts` and/or a focused public document loader.
- Modify: `app/%5Fsites/[sub]/layout.tsx`
- Modify: `app/%5Fsites/[sub]/page.tsx` and relevant child pages.
- Create: `lib/event-editor/public-document.test.ts`

- [ ] Write failing tests that new published events use `publishedData`, unpublished draft changes do not leak, and old published events fall back to legacy fields.
- [ ] Implement one loader that selects published snapshot first and legacy adapter second.
- [ ] Route preview and public modes through `InvitationRenderer` while preserving public forms/interactivity and the current template appearance.
- [ ] Run existing public-event and template tests.
- [ ] Commit as `test: cover editor state and publication` (or split implementation/test commits if clearer).

## Task 8: E2E and build diagnosis

**Files:**
- Create: `playwright.config.ts` and `e2e/editor-foundation.spec.ts` only if browser dependencies can be installed and authentication/database fixtures can be made deterministic.
- Inspect/modify only the concrete build blocker found by diagnostics.

- [ ] Add the required authenticated create/edit/toggle/reload/publish/public scenario, with three toggle cycles and a two-context conflict check.
- [ ] Run a timed/instrumented production build and inspect open handles, external font/network requests, Prisma startup and route generation rather than merely increasing timeout.
- [ ] Fix only a repository-owned root cause; document an environmental blocker explicitly if external access is required.
- [ ] Run fresh verification: `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and Playwright.
- [ ] Confirm `git diff --check`, inspect the full diff and ensure the nested legacy clone is untouched.
- [ ] Commit the final focused fixes; do not merge the branch.

## Self-review

- Phase 2 items (plans, billing, new templates, FontRegistry and redesign) are absent.
- Every production behavior begins with a failing focused test.
- Schema changes are additive and legacy `customization` remains available.
- Financial transactions and contribution records remain relational.
- Preview, autosave and publish consume the same canonical document.
- Completion is gated on fresh tests, lint, typecheck, build and E2E evidence; unmet environmental dependencies must be reported rather than hidden.
