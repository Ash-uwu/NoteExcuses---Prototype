"use client";

import { useCallback, useSyncExternalStore } from "react";

export type CustomEquation = {
  id: string;
  label: string;
  latex: string;
  createdAt: number;
};

const STORAGE_KEY = "latex-editor-custom-equations";

/** Stable empty snapshot for server render and empty storage */
const EMPTY_SNAPSHOT: CustomEquation[] = [];

function parseStored(raw: string | null): CustomEquation[] {
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_SNAPSHOT;
    const filtered = parsed.filter(
      (x): x is CustomEquation =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as CustomEquation).id === "string" &&
        typeof (x as CustomEquation).label === "string" &&
        typeof (x as CustomEquation).latex === "string",
    );
    return filtered.length === 0 ? EMPTY_SNAPSHOT : filtered;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

let lastSerialized: string | null = null;
let cachedSnapshot: CustomEquation[] = EMPTY_SNAPSHOT;

let undoStack: CustomEquation[][] = [];
let redoStack: CustomEquation[][] = [];

function pushUndoState(state: CustomEquation[]) {
  undoStack.push(state);
  if (undoStack.length > 100) {
    undoStack.shift();
  }
}

function clearRedo() {
  redoStack = [];
}

function getSnapshot(): CustomEquation[] {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === lastSerialized) {
    return cachedSnapshot;
  }
  lastSerialized = raw;
  cachedSnapshot = parseStored(raw);
  return cachedSnapshot;
}

function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      lastSerialized = null;
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function write(items: CustomEquation[]) {
  const serialized = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, serialized);
  lastSerialized = serialized;
  cachedSnapshot = items.length === 0 ? EMPTY_SNAPSHOT : items;
}

function notify() {
  listeners.forEach((l) => l());
}

function read(): CustomEquation[] {
  return getSnapshot();
}

export function useCustomEquations() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((label: string, latex: string) => {
    const trimmedLabel = label.trim();
    const trimmedLatex = latex.trim();
    if (!trimmedLabel || !trimmedLatex) return;
    const prev = read();
    pushUndoState(prev);
    clearRedo();
    const next: CustomEquation = {
      id: `custom-${crypto.randomUUID()}`,
      label: trimmedLabel,
      latex: trimmedLatex,
      createdAt: Date.now(),
    };
    write([next, ...prev]);
    notify();
  }, []);

  const remove = useCallback((id: string) => {
    const prev = read();
    const next = prev.filter((x) => x.id !== id);
    if (next.length === prev.length) return;
    pushUndoState(prev);
    clearRedo();
    write(next);
    notify();
  }, []);

  const undo = useCallback(() => {
    const current = read();
    if (undoStack.length === 0) return;
    const previous = undoStack.pop()!;
    redoStack.push(current);
    write(previous);
    notify();
  }, []);

  const redo = useCallback(() => {
    const current = read();
    if (redoStack.length === 0) return;
    const next = redoStack.pop()!;
    pushUndoState(current);
    write(next);
    notify();
  }, []);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return { items, add, remove, undo, redo, canUndo, canRedo };
}
