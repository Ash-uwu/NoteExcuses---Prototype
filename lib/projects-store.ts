export type FolderColor = "teal" | "blue" | "violet" | "amber";

export type LibraryFolder = {
  id: string;
  name: string;
  color: FolderColor;
  updatedAt: number;
};

export type LibraryProjectFile = {
  id: string;
  name: string;
  folderId: string | null;
  content: string;
  updatedAt: number;
};

export type ProjectsLibraryState = {
  folders: LibraryFolder[];
  files: LibraryProjectFile[];
};

const STORAGE_KEY = "latex-library-projects-v1";

const FOLDER_COLORS: FolderColor[] = ["teal", "blue", "violet", "amber"];

const EMPTY: ProjectsLibraryState = {
  folders: [],
  files: [],
};

function isFolderColor(x: unknown): x is FolderColor {
  return x === "teal" || x === "blue" || x === "violet" || x === "amber";
}

function normalize(raw: unknown): ProjectsLibraryState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const o = raw as Record<string, unknown>;
  const foldersIn = o.folders;
  const filesIn = o.files;
  if (!Array.isArray(foldersIn) || !Array.isArray(filesIn)) return EMPTY;

  const folders: LibraryFolder[] = foldersIn
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      id: String(f.id ?? ""),
      name: String(f.name ?? "Folder"),
      color: isFolderColor(f.color) ? f.color : "teal",
      updatedAt: Number(f.updatedAt) || 0,
    }))
    .filter((f) => f.id.length > 0);

  const files: LibraryProjectFile[] = filesIn
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      id: String(f.id ?? ""),
      name: String(f.name ?? "Untitled"),
      folderId:
        f.folderId === null || f.folderId === undefined
          ? null
          : String(f.folderId),
      content: typeof f.content === "string" ? f.content : "",
      updatedAt: Number(f.updatedAt) || 0,
    }))
    .filter((f) => f.id.length > 0);

  if (folders.length === 0 && files.length === 0) return EMPTY;

  return { folders, files };
}

let lastSerialized: string | null = null;
let cachedSnapshot: ProjectsLibraryState = EMPTY;

const listeners = new Set<() => void>();

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function getSnapshot(): ProjectsLibraryState {
  if (typeof window === "undefined") {
    return EMPTY;
  }
  const raw = readRaw();
  if (raw === lastSerialized) {
    return cachedSnapshot;
  }
  lastSerialized = raw;
  if (!raw) {
    cachedSnapshot = EMPTY;
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = normalize(JSON.parse(raw));
  } catch {
    cachedSnapshot = EMPTY;
  }
  return cachedSnapshot;
}

export function getServerSnapshot(): ProjectsLibraryState {
  return EMPTY;
}

export function subscribe(callback: () => void) {
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

function notify() {
  listeners.forEach((l) => l());
}

function commit(state: ProjectsLibraryState) {
  const next =
    state.folders.length === 0 && state.files.length === 0 ? EMPTY : state;
  const serialized = JSON.stringify(next);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, serialized);
  }
  lastSerialized = serialized;
  cachedSnapshot = next;
  notify();
}

function nextColor(folders: LibraryFolder[]): FolderColor {
  return FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
}

export const projectsStore = {
  getSnapshot,
  createFolder(name: string): LibraryFolder {
    const state = getSnapshot();
    const trimmed = name.trim() || "New folder";
    const folder: LibraryFolder = {
      id: `fld-${crypto.randomUUID()}`,
      name: trimmed,
      color: nextColor(state.folders),
      updatedAt: Date.now(),
    };
    commit({
      folders: [...state.folders, folder],
      files: state.files,
    });
    return folder;
  },

  renameFolder(id: string, name: string) {
    const state = getSnapshot();
    const trimmed = name.trim();
    if (!trimmed) return;
    commit({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name: trimmed, updatedAt: Date.now() } : f,
      ),
      files: state.files,
    });
  },

  deleteFolder(id: string) {
    const state = getSnapshot();
    commit({
      folders: state.folders.filter((f) => f.id !== id),
      files: state.files.map((f) =>
        f.folderId === id ? { ...f, folderId: null, updatedAt: Date.now() } : f,
      ),
    });
  },

  createFile(input: {
    name: string;
    folderId: string | null;
    content: string;
  }): LibraryProjectFile {
    const state = getSnapshot();
    const file: LibraryProjectFile = {
      id: `prj-${crypto.randomUUID()}`,
      name: input.name.trim() || "Untitled project",
      folderId: input.folderId,
      content: input.content,
      updatedAt: Date.now(),
    };
    const now = Date.now();
    const folders = state.folders.map((f) =>
      input.folderId && f.id === input.folderId
        ? { ...f, updatedAt: now }
        : f,
    );
    commit({
      folders,
      files: [file, ...state.files],
    });
    return file;
  },

  updateFile(
    id: string,
    patch: Partial<Pick<LibraryProjectFile, "name" | "content" | "folderId">>,
  ) {
    const state = getSnapshot();
    const now = Date.now();
    const folders = state.folders.map((f) => ({ ...f }));
    const files = state.files.map((f) => {
      if (f.id !== id) return f;
      const next: LibraryProjectFile = {
        ...f,
        ...patch,
        name: patch.name !== undefined ? patch.name.trim() || f.name : f.name,
        updatedAt: now,
      };
      if (patch.folderId !== undefined && patch.folderId !== f.folderId) {
        if (f.folderId) {
          const i = folders.findIndex((x) => x.id === f.folderId);
          if (i >= 0) folders[i] = { ...folders[i], updatedAt: now };
        }
        if (patch.folderId) {
          const j = folders.findIndex((x) => x.id === patch.folderId);
          if (j >= 0) folders[j] = { ...folders[j], updatedAt: now };
        }
      }
      return next;
    });
    commit({ folders, files });
  },

  deleteFile(id: string) {
    const state = getSnapshot();
    commit({
      folders: state.folders,
      files: state.files.filter((f) => f.id !== id),
    });
  },

  getFile(id: string): LibraryProjectFile | undefined {
    return getSnapshot().files.find((f) => f.id === id);
  },
};
