"use client";

import { ChevronDown, GripVertical, Plus, Trash2, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  LATEX_LIBRARY,
  LATEX_MIME,
  type LibraryItem,
} from "@/lib/latex-library-data";
import type { CustomEquation } from "@/hooks/useCustomEquations";
import { subtleScaleHover } from "@/components/interaction-styles";

type SymbolLibrarySidebarProps = {
  custom: CustomEquation[];
  onAddCustom: (label: string, latex: string) => void;
  onRemoveCustom: (id: string) => void;
  onInsertSnippet: (latex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function dragPayload(e: React.DragEvent, latex: string) {
  e.dataTransfer.setData(LATEX_MIME, latex);
  e.dataTransfer.setData("text/plain", latex);
  e.dataTransfer.effectAllowed = "copy";
}

function LibraryRow({
  item,
  onInsert,
}: {
  item: Pick<LibraryItem, "label" | "latex">;
  onInsert: (latex: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => dragPayload(e, item.latex)}
      onClick={() => onInsert(item.latex)}
      title="Drag into the editor or click to insert at cursor"
      className="flex cursor-grab items-center gap-2 rounded-lg border border-transparent bg-white/60 px-2 py-1.5 text-left text-sm active:cursor-grabbing hover:border-gray-200 hover:bg-gray-50"
    >
      <GripVertical className="size-3.5 shrink-0 text-gray-400" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-neutral-800">
        {item.label}
      </span>
      <code className="max-w-[45%] truncate text-xs text-gray-500">
        {item.latex}
      </code>
    </div>
  );
}

export function SymbolLibrarySidebar({
  custom,
  onAddCustom,
  onRemoveCustom,
  onInsertSnippet,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: SymbolLibrarySidebarProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newLatex, setNewLatex] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);

  const saveCustom = () => {
    onAddCustom(newLabel, newLatex);
    setNewLabel("");
    setNewLatex("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      <div className="border-b border-gray-200 px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-800 ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RotateCcw className="size-3" aria-hidden />
            Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-800 ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RotateCw className="size-3" aria-hidden />
            Redo
          </button>
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Library
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Drag items into the editor, or click to insert at the cursor.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <details
          open
          className="group/cust rounded-xl border border-gray-200 bg-white [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 shrink-0 text-gray-500 transition-transform group-open/cust:rotate-180" />
            My equations
          </summary>
          <div className="space-y-2 border-t border-gray-100 px-2 py-3">
            <div className="space-y-2 rounded-lg bg-gray-50 p-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. My integral)"
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900/15"
              />
              <textarea
                value={newLatex}
                onChange={(e) => setNewLatex(e.target.value)}
                placeholder="LaTeX snippet…"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-neutral-900/15"
              />
              <button
                type="button"
                onClick={saveCustom}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
              >
                <Plus className="size-4" aria-hidden />
                Save to library
              </button>
            </div>
            {custom.length === 0 ? (
              <p className="px-1 text-xs text-gray-500">
                No saved equations yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {custom.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-stretch gap-1 rounded-lg border border-gray-100 bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <LibraryRow
                        item={{ label: c.label, latex: c.latex }}
                        onInsert={onInsertSnippet}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCustom(c.id)}
                      className={`flex shrink-0 items-center rounded-r-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-600 ${subtleScaleHover}`}
                      aria-label={`Remove ${c.label}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        <div className="mt-4 space-y-3">
          {LATEX_LIBRARY.map((subject) => (
            <details
              key={subject.id}
              className="group/subj rounded-xl border border-gray-200 bg-white [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-4 shrink-0 text-gray-500 transition-transform group-open/subj:rotate-180" />
                {subject.title}
              </summary>
              <div className="space-y-2 border-t border-gray-100 px-2 py-2">
                {subject.categories.map((cat) => (
                  <details
                    key={cat.id}
                    className="group/cat rounded-lg bg-gray-50/80 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="size-3.5 shrink-0 text-gray-400 transition-transform group-open/cat:rotate-180" />
                      {cat.title}
                    </summary>
                    <div className="space-y-0.5 px-1 pb-2">
                      {cat.items.map((item) => (
                        <LibraryRow
                          key={item.id}
                          item={item}
                          onInsert={onInsertSnippet}
                        />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
