"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  Card,
  Modal,
  EmptyState,
  Stepper,
  Tabs,
  FilterChips,
  DevicePreview,
  TemplateCard,
  EventCard,
  type DeviceMode,
} from "@/components/ui";

/* ── Icones inline simples ────────────────────────────────────────────────── */
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M3 13l2.5-7A2 2 0 0 1 7.4 5h9.2a2 2 0 0 1 1.9 1.3L21 13v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 13h5l1 2h6l1-2h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const PASSOS = [
  { label: "Ocasião" },
  { label: "Template" },
  { label: "Detalhes" },
  { label: "Estilo" },
  { label: "Recursos" },
  { label: "Publicar" },
];

const ABAS = [
  { label: "Todos", value: "todos" },
  { label: "Rascunhos", value: "rascunho" },
  { label: "Publicados", value: "publicado" },
];

const FILTROS = [
  { label: "Casamento", value: "casamento" },
  { label: "15 anos", value: "15anos" },
  { label: "Bodas", value: "bodas" },
  { label: "Aniversário", value: "aniversario" },
];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-ui-line pt-10">
      <h2 className="font-display text-2xl text-ui-ink">{titulo}</h2>
      {children}
    </section>
  );
}

function Amostra({ nome, varName, className }: { nome: string; varName: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 w-full rounded-ui border border-ui-line ${className}`} />
      <p className="text-xs font-medium text-ui-ink">{nome}</p>
      <p className="text-[0.7rem] text-ui-ink-faint">{varName}</p>
    </div>
  );
}

export function UiKitDemo() {
  const [modalAberto, setModalAberto] = useState(false);
  const [passo, setPasso] = useState(2);
  const [aba, setAba] = useState("todos");
  const [filtro, setFiltro] = useState<string | null>("casamento");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [templateSel, setTemplateSel] = useState("aurora");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16">
      {/* Cabecalho */}
      <header className="flex flex-col gap-3">
        <Badge tone="novo">Design System</Badge>
        <h1 className="font-display text-4xl text-ui-ink sm:text-5xl">
          Design System — <span className="italic text-ui-rose-ink">seuconviteia</span>
        </h1>
        <p className="max-w-2xl text-ui-ink-soft">
          Biblioteca de componentes do painel. Claro, premium, com respiro — um ateliê digital de
          eventos. Página interna de referência.
        </p>
      </header>

      {/* TOKENS */}
      <Secao titulo="Tokens de cor">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Amostra nome="Fundo" varName="ui-bg" className="bg-ui-bg" />
          <Amostra nome="Fundo quente" varName="ui-bg-warm" className="bg-ui-bg-warm" />
          <Amostra nome="Superfície" varName="ui-surface" className="bg-ui-surface" />
          <Amostra nome="Superfície 2" varName="ui-surface-2" className="bg-ui-surface-2" />
          <Amostra nome="Tinta" varName="ui-ink" className="bg-ui-ink" />
          <Amostra nome="Tinta suave" varName="ui-ink-soft" className="bg-ui-ink-soft" />
          <Amostra nome="Rosé" varName="ui-rose" className="bg-ui-rose" />
          <Amostra nome="Rosé wash" varName="ui-rose-soft" className="bg-ui-rose-soft" />
          <Amostra nome="Champagne" varName="ui-champagne" className="bg-ui-champagne" />
          <Amostra nome="Champagne soft" varName="ui-champagne-soft" className="bg-ui-champagne-soft" />
          <Amostra nome="Sucesso" varName="ui-success" className="bg-ui-success" />
          <Amostra nome="Perigo" varName="ui-danger" className="bg-ui-danger" />
        </div>
      </Secao>

      {/* BOTOES */}
      <Secao titulo="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Perigo</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">Pequeno</Button>
          <Button variant="primary" size="md">Médio</Button>
          <Button variant="primary" size="lg">Grande</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<IconPlus />}>Criar site</Button>
          <Button variant="secondary" iconRight={<IconArrow />}>Continuar</Button>
          <Button variant="primary" loading>Salvando</Button>
          <Button variant="ghost" href="#exemplo">Como link</Button>
        </div>
      </Secao>

      {/* BADGES */}
      <Secao titulo="Badges">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="publicado">Publicado</Badge>
          <Badge tone="rascunho">Rascunho</Badge>
          <Badge tone="premium">Premium</Badge>
          <Badge tone="novo">Novo</Badge>
          <Badge tone="em-breve">Em breve</Badge>
          <Badge tone="selecionado">Selecionado</Badge>
          <Badge tone="neutro">Neutro</Badge>
        </div>
      </Secao>

      {/* INPUTS */}
      <Secao titulo="Campos de formulário">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Nome do evento" placeholder="Casamento da Ana & Léo" helper="Aparece na capa do site." />
          <Input label="E-mail" type="email" placeholder="voce@exemplo.com" error="Informe um e-mail válido." />
          <Select label="Ocasião" defaultValue="">
            <option value="" disabled>Selecione…</option>
            <option value="casamento">Casamento</option>
            <option value="15anos">15 anos</option>
            <option value="bodas">Bodas</option>
          </Select>
          <Textarea label="Mensagem de boas-vindas" placeholder="Escreva um recado para os convidados…" helper="Máx. 240 caracteres." />
        </div>
      </Secao>

      {/* CARDS */}
      <Secao titulo="Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="default">
            <p className="font-display text-lg text-ui-ink">Default</p>
            <p className="mt-1 text-sm text-ui-ink-soft">Superfície branca, borda suave.</p>
          </Card>
          <Card variant="premium">
            <p className="font-display text-lg text-ui-ink">Premium</p>
            <p className="mt-1 text-sm text-ui-ink-soft">Acento champagne/rosé sutil.</p>
          </Card>
          <Card variant="clickable" onClick={() => {}}>
            <p className="font-display text-lg text-ui-ink">Clicável</p>
            <p className="mt-1 text-sm text-ui-ink-soft">Hover eleva o card.</p>
          </Card>
          <Card variant="selected">
            <p className="font-display text-lg text-ui-ink">Selecionado</p>
            <p className="mt-1 text-sm text-ui-ink-soft">Anel rosé de seleção.</p>
          </Card>
        </div>
      </Secao>

      {/* TABS + CHIPS */}
      <Secao titulo="Tabs & Filtros">
        <Tabs items={ABAS} value={aba} onChange={setAba} />
        <p className="text-sm text-ui-ink-faint">Aba ativa: {aba}</p>
        <FilterChips items={FILTROS} value={filtro} onChange={setFiltro} />
        <p className="text-sm text-ui-ink-faint">Filtro: {filtro ?? "todos"}</p>
      </Secao>

      {/* STEPPER */}
      <Secao titulo="Stepper (fluxo de 6 etapas)">
        <Stepper steps={PASSOS} current={passo} onStepClick={setPasso} />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPasso((p) => Math.max(0, p - 1))}>
            Voltar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setPasso((p) => Math.min(PASSOS.length - 1, p + 1))}>
            Avançar
          </Button>
        </div>
      </Secao>

      {/* EMPTY STATE */}
      <Secao titulo="Empty state">
        <Card variant="default">
          <EmptyState
            icon={<IconInbox />}
            title="Nenhum site ainda"
            description="Crie seu primeiro site de convite em poucos minutos."
            action={<Button variant="primary" icon={<IconPlus />}>Criar site</Button>}
          />
        </Card>
      </Secao>

      {/* MODAL */}
      <Secao titulo="Modal">
        <div>
          <Button variant="primary" onClick={() => setModalAberto(true)}>Abrir modal</Button>
        </div>
        <Modal
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          title="Publicar site"
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => setModalAberto(false)}>Publicar agora</Button>
            </>
          }
        >
          <p className="text-ui-ink-soft">
            O site ficará disponível em <span className="font-medium text-ui-ink">ana-e-leo.seuconviteia.com</span>.
            Você pode continuar editando depois.
          </p>
        </Modal>
      </Secao>

      {/* DEVICE PREVIEW */}
      <Secao titulo="Device preview">
        <DevicePreview mode={device} onModeChange={setDevice}>
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-ui-rose-soft via-ui-bg to-ui-champagne-soft p-10 text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-ui-rose-ink">
              Save the date
            </p>
            <p className="font-display text-3xl italic text-ui-ink">Ana &amp; Léo</p>
            <p className="text-sm text-ui-ink-soft">Prévia responsiva — modo {device}</p>
          </div>
        </DevicePreview>
      </Secao>

      {/* TEMPLATE CARDS */}
      <Secao titulo="Template cards">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <TemplateCard
            nome="Aurora"
            ocasiao="Casamento"
            descricao="Capa cinematográfica com tipografia editorial e tons pastel."
            tags={["Clássico", "Romântico"]}
            planoBadge={<Badge tone="premium">Premium</Badge>}
            selecionado={templateSel === "aurora"}
            onEscolher={() => setTemplateSel("aurora")}
          />
          <TemplateCard
            nome="Confete"
            ocasiao="15 anos"
            descricao="Vibrante e festiva, com contagem regressiva e galeria."
            tags={["Moderno", "Festa"]}
            planoBadge={<Badge tone="novo">Novo</Badge>}
            selecionado={templateSel === "confete"}
            onEscolher={() => setTemplateSel("confete")}
          />
          <TemplateCard
            nome="Sereno"
            ocasiao="Bodas"
            descricao="Minimalista e elegante, foco na história do casal."
            tags={["Minimalista"]}
            selecionado={templateSel === "sereno"}
            onEscolher={() => setTemplateSel("sereno")}
          />
        </div>
      </Secao>

      {/* EVENT CARDS */}
      <Secao titulo="Event cards (Meus sites)">
        <div className="grid gap-5 sm:grid-cols-2">
          <EventCard
            nome="Casamento Ana & Léo"
            status="publicado"
            template="Aurora"
            data="12 out 2026"
            confirmacoes={87}
            onEditar={() => {}}
            onVisualizar={() => {}}
            onCopiarLink={() => {}}
          />
          <EventCard
            nome="15 anos da Maria Clara"
            status="rascunho"
            template="Confete"
            data="29 ago 2026"
            confirmacoes={0}
            onEditar={() => {}}
            onVisualizar={() => {}}
            onCopiarLink={() => {}}
          />
        </div>
      </Secao>
    </div>
  );
}
