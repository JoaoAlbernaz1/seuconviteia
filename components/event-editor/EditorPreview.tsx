"use client";

import { useEffect, useRef } from "react";
import { InvitationRenderer, type InvitationRendererPage } from "@/components/invitation-renderer/InvitationRenderer";
import type { EventEditorDocument } from "@/lib/event-editor/document";

export function EditorPreview({
  document,
  page,
  focus,
  device,
  onDeviceChange,
}: {
  document: EventEditorDocument;
  page: InvitationRendererPage;
  focus?: string;
  device: "mobile" | "desktop";
  onDeviceChange: (device: "mobile" | "desktop") => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focus) return;
    const viewport = viewportRef.current;
    const section = viewport?.querySelector<HTMLElement>(`[data-sec="${focus}"]`);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "center" });
    section.dataset.editorHighlight = "true";
    const timer = window.setTimeout(() => delete section.dataset.editorHighlight, 1200);
    return () => window.clearTimeout(timer);
  }, [focus, page]);

  return (
    <section aria-label="Pré-visualização do convite" className="flex min-h-0 flex-col rounded-2xl border border-[#E4E4EA] bg-[#F6F6F8] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#6E6E76]">É assim que os convidados vão ver</span>
        <div className="flex rounded-lg border border-[#E4E4EA] bg-white p-1" role="group" aria-label="Dispositivo da prévia">
          {(["mobile", "desktop"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={device === option}
              onClick={() => onDeviceChange(option)}
              className={`rounded-md px-2.5 py-1 text-xs ${device === option ? "bg-[#7C3AED] text-white" : "text-[#6E6E76]"}`}
            >
              {option === "mobile" ? "Celular" : "Computador"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <div
          ref={viewportRef}
          className="h-[680px] w-full overflow-y-auto rounded-xl bg-white shadow-xl transition-[max-width] duration-300 [&_[data-editor-highlight=true]]:outline [&_[data-editor-highlight=true]]:outline-2 [&_[data-editor-highlight=true]]:outline-offset-[-2px] [&_[data-editor-highlight=true]]:outline-[#7C3AED]"
          style={{ maxWidth: device === "mobile" ? 390 : 1024 }}
        >
          <InvitationRenderer document={document} mode="preview" page={page} />
        </div>
      </div>
    </section>
  );
}
