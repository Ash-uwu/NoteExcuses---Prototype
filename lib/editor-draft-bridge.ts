const KEY = "latex-editor-draft-import";

export type DraftImport = { name: string; content: string; nonce: number };

export function stashDraftImport(data: Omit<DraftImport, "nonce">) {
  const payload: DraftImport = {
    ...data,
    nonce: Date.now(),
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function takeDraftImport(): DraftImport | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    const p = JSON.parse(raw) as unknown;
    if (
      p &&
      typeof p === "object" &&
      typeof (p as DraftImport).name === "string" &&
      typeof (p as DraftImport).content === "string"
    ) {
      const nonce =
        typeof (p as DraftImport).nonce === "number"
          ? (p as DraftImport).nonce
          : Date.now();
      return { ...(p as DraftImport), nonce };
    }
  } catch {
    /* ignore */
  }
  return null;
}
