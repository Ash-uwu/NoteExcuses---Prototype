"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  FileUp,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Save,
  Undo,
  Redo,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LATEX_MIME } from "@/lib/latex-library-data";
import { DEFAULT_PROJECT_LATEX } from "@/lib/default-project-content";
import {
  stashDraftImport,
  takeDraftImport,
  type DraftImport,
} from "@/lib/editor-draft-bridge";
import {
  buildProjectExportJson,
  downloadTextFile,
  parseImportedProjectFile,
  sanitizeDownloadFilename,
} from "@/lib/project-file-format";
import { projectsStore } from "@/lib/projects-store";
import { useCustomEquations } from "@/hooks/useCustomEquations";
import { SymbolLibrarySidebar } from "./SymbolLibrarySidebar";
import { subtleScaleHover } from "@/components/interaction-styles";

function insertAtSelection(
  value: string,
  start: number,
  end: number,
  insert: string,
): { next: string; caret: number } {
  const next = value.slice(0, start) + insert + value.slice(end);
  return { next, caret: start + insert.length };
}

function useClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function RedirectInvalidEditorProject() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/editor");
  }, [router]);
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-gray-500">
      Opening editor…
    </div>
  );
}

type LatexEditorInnerProps = {
  projectId: string | null;
  initialTitle: string;
  initialSource: string;
};

function LatexEditorInner({
  projectId,
  initialTitle,
  initialSource,
}: LatexEditorInnerProps) {
  const router = useRouter();
  const [projectTitle, setProjectTitle] = useState(initialTitle);
  const [source, setSource] = useState(initialSource);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const pendingCaretRef = useRef<number | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);
  const [saveFlash, setSaveFlash] = useState(false);

  const { items: customEquations, add, remove, undo: undoLibrary, redo: redoLibrary, canUndo: canUndoLibrary, canRedo: canRedoLibrary } = useCustomEquations();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);

  // History for undo/redo
  const undoStack = useRef<string[]>([initialSource]);
  const redoStack = useRef<string[]>([]);
  const isUndoRedo = useRef(false);

  const setSourceWithHistory = useCallback((newSource: string | ((prev: string) => string)) => {
    setSource((prev) => {
      const next = typeof newSource === 'function' ? newSource(prev) : newSource;
      if (!isUndoRedo.current && next !== prev) {
        undoStack.current.push(prev);
        redoStack.current.length = 0; // Clear redo stack
      }
      isUndoRedo.current = false;
      return next;
    });
  }, []);

  const syncSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = {
      start: el.selectionStart,
      end: el.selectionEnd,
    };
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length > 0) {
      const prev = undoStack.current.pop()!;
      redoStack.current.push(source);
      isUndoRedo.current = true;
      setSource(prev);
    }
  }, [source]);

  const redo = useCallback(() => {
    if (redoStack.current.length > 0) {
      const next = redoStack.current.pop()!;
      undoStack.current.push(source);
      isUndoRedo.current = true;
      setSource(next);
    }
  }, [source]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const applyInsert = useCallback((latex: string) => {
    const { start, end } = selectionRef.current;
    setSourceWithHistory((prev) => {
      const { next, caret } = insertAtSelection(prev, start, end, latex);
      pendingCaretRef.current = caret;
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos === null) return;
    pendingCaretRef.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos);
    selectionRef.current = { start: pos, end: pos };
  }, [source]);

  const previewHtml = useMemo(() => {
    try {
      return katex.renderToString(source, {
        displayMode: true,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      return "";
    }
  }, [source]);

  const onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const latex =
      e.dataTransfer.getData(LATEX_MIME) ||
      e.dataTransfer.getData("text/plain");
    if (!latex) return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setSourceWithHistory((prev) => {
      const { next, caret } = insertAtSelection(prev, start, end, latex);
      pendingCaretRef.current = caret;
      return next;
    });
  };

  const saveToLibrary = useCallback(() => {
    const title = projectTitle.trim() || "Untitled project";
    if (projectId && projectsStore.getFile(projectId)) {
      projectsStore.updateFile(projectId, { name: title, content: source });
    } else {
      const f = projectsStore.createFile({
        name: title,
        folderId: null,
        content: source,
      });
      router.replace(`/editor?project=${f.id}`);
    }
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1200);
  }, [projectId, projectTitle, source, router]);

  const downloadJson = useCallback(() => {
    const title = projectTitle.trim() || "Untitled project";
    downloadTextFile(
      sanitizeDownloadFilename(title, "json"),
      buildProjectExportJson(title, source),
      "application/json",
    );
  }, [projectTitle, source]);

  const downloadTex = useCallback(() => {
    const title = projectTitle.trim() || "Untitled project";
    downloadTextFile(
      sanitizeDownloadFilename(title, "tex"),
      source.endsWith("\n") ? source : `${source}\n`,
      "text/plain",
    );
  }, [projectTitle, source]);

  const onImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const text = await file.text();
      const { name, content } = parseImportedProjectFile(file.name, text);
      if (projectId) {
        stashDraftImport({ name, content });
        router.replace("/editor");
        return;
      }
      setProjectTitle(name);
      setSourceWithHistory(content);
    },
    [projectId, router],
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-neutral-900">
      <header className="flex shrink-0 flex-col gap-3 border-b border-gray-200 bg-white px-3 py-3 sm:px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 lg:hidden ${subtleScaleHover}`}
            onClick={() => setMobileLibraryOpen(true)}
            aria-label="Open symbol library"
          >
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            className={`hidden rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-700 lg:flex ${subtleScaleHover}`}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Hide library" : "Show library"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeft className="size-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="project-title">
              Project name
            </label>
            <input
              id="project-title"
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full max-w-md border-b border-transparent bg-transparent text-lg font-bold tracking-tight outline-none focus:border-gray-300"
              placeholder="Project name"
            />
            <p className="truncate text-xs text-gray-500">
              {projectId ? "Saved in library · " : "Not saved yet · "}
              Type LaTeX or drag from the library
            </p>
          </div>
          <input
            ref={fileImportRef}
            type="file"
            accept=".tex,.json,text/plain,.txt"
            className="hidden"
            onChange={onImportFile}
            aria-label="Import .tex or backup JSON file"
          />
          <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 sm:flex">
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.current.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Undo className="size-4" aria-hidden />
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.current.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Redo className="size-4" aria-hidden />
              Redo
            </button>
            <button
              type="button"
              onClick={() => fileImportRef.current?.click()}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover}`}
            >
              <FileUp className="size-4" aria-hidden />
              Import
            </button>
            <button
              type="button"
              onClick={downloadTex}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover}`}
            >
              <Download className="size-4" aria-hidden />
              .tex
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover}`}
            >
              <Download className="size-4" aria-hidden />
              Backup
            </button>
            <button
              type="button"
              onClick={saveToLibrary}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
            >
              <Save className="size-4" aria-hidden />
              {saveFlash ? "Saved!" : "Save to library"}
            </button>
            <Link
              href="/"
              className={`inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover}`}
            >
              Library home
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={undo}
            disabled={undoStack.current.length === 0}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.current.length === 0}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => fileImportRef.current?.click()}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover}`}
          >
            Import
          </button>
          <button
            type="button"
            onClick={downloadTex}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover}`}
          >
            .tex
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover}`}
          >
            Backup
          </button>
          <button
            type="button"
            onClick={saveToLibrary}
            className={`rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
          >
            Save
          </button>
          <Link
            href="/"
            className={`rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium ${subtleScaleHover}`}
          >
            Home
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {mobileLibraryOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-label="Close library overlay"
            onClick={() => setMobileLibraryOpen(false)}
          />
        )}

        <aside
          className={[
            "flex w-[min(100%,20rem)] flex-col border-r border-gray-200 bg-gray-50",
            "max-lg:fixed max-lg:top-0 max-lg:bottom-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-200",
            mobileLibraryOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
            "lg:static lg:shrink-0 lg:translate-x-0",
            !sidebarOpen && "lg:hidden",
          ].join(" ")}
        >
          <div className="flex items-center justify-end border-b border-gray-200 p-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileLibraryOpen(false)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 ${subtleScaleHover}`}
            >
              Close
            </button>
          </div>
          <SymbolLibrarySidebar
            custom={customEquations}
            onAddCustom={add}
            onRemoveCustom={remove}
            onInsertSnippet={(latex) => {
              applyInsert(latex);
              setMobileLibraryOpen(false);
            }}
            onUndo={undoLibrary}
            onRedo={redoLibrary}
            canUndo={canUndoLibrary}
            canRedo={canRedoLibrary}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-gray-200 lg:border-r">
            <label className="sr-only" htmlFor="latex-source">
              LaTeX source
            </label>
            <textarea
              id="latex-source"
              ref={textareaRef}
              value={source}
              onChange={(e) => setSourceWithHistory(e.target.value)}
              onSelect={syncSelection}
              onKeyUp={syncSelection}
              onMouseUp={syncSelection}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={onDrop}
              spellCheck={false}
              className="min-h-[12rem] w-full flex-1 resize-none border-0 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-900 outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-900/10 lg:min-h-0"
              placeholder="Enter LaTeX here…"
            />
          </div>
          <section
            className="flex max-h-[40vh] min-h-[10rem] flex-col border-t border-gray-200 bg-gray-50 lg:max-h-none lg:w-[min(100%,28rem)] lg:shrink-0 lg:border-t-0 lg:border-l"
            aria-label="Preview"
          >
            <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div
                className="katex-preview overflow-x-auto text-center [&_.katex]:text-base"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type DraftBootstrap = {
  reactKey: string;
  title: string;
  source: string;
};

export function LatexEditorPage() {
  const ready = useClientReady();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const bootstrap = useMemo((): DraftBootstrap => {
    if (projectId) {
      const file = projectsStore.getFile(projectId);
      if (!file) {
        return {
          reactKey: "invalid",
          title: "Untitled project",
          source: DEFAULT_PROJECT_LATEX,
        };
      }
      return {
        reactKey: projectId,
        title: file.name,
        source: file.content,
      };
    }
    const d: DraftImport | null = takeDraftImport();
    if (d) {
      return {
        reactKey: `draft-${d.nonce}`,
        title: d.name,
        source: d.content,
      };
    }
    return {
      reactKey: "draft-0",
      title: "Untitled project",
      source: DEFAULT_PROJECT_LATEX,
    };
  }, [projectId]);

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-gray-500">
        Loading editor…
      </div>
    );
  }

  if (projectId && !projectsStore.getFile(projectId)) {
    return <RedirectInvalidEditorProject />;
  }

  return (
    <LatexEditorInner
      key={bootstrap.reactKey}
      projectId={projectId}
      initialTitle={bootstrap.title}
      initialSource={bootstrap.source}
    />
  );
}
