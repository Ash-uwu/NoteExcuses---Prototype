"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Folder,
  MoreHorizontal,
  PlusCircle,
  FolderPlus,
} from "lucide-react";
import { useCallback, useMemo, useState, createContext, useContext } from "react";
import { DashboardNavbar, type DashboardViewMode } from "@/components/DashboardNavbar";
import { HeroToolbar, type LibrarySortMode } from "@/components/HeroToolbar";
import { subtleScaleHover } from "@/components/interaction-styles";
import { formatRelativeTime } from "@/lib/relative-time";
import { DEFAULT_PROJECT_LATEX } from "@/lib/default-project-content";
import type { FolderColor, LibraryFolder, LibraryProjectFile } from "@/lib/projects-store";
import { useProjectsLibrary } from "@/hooks/useProjectsLibrary";

const FOLDER_ICON: Record<FolderColor, string> = {
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
};

const MenuContext = createContext<{
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
}>({
  openMenu: null,
  setOpenMenu: () => {},
});

function cardHoverClass() {
  return `${subtleScaleHover} transition-shadow hover:shadow-md`;
}

function CardMenu({
  children,
  align = "right",
  menuId,
}: {
  children: ReactNode;
  align?: "left" | "right";
  menuId: string;
}) {
  const { openMenu, setOpenMenu } = useContext(MenuContext);
  const isOpen = openMenu === menuId;

  return (
    <div
      className={`relative ${align === "right" ? "ml-auto" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenMenu(isOpen ? null : menuId);
        }}
        className={`rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 ${subtleScaleHover}`}
        aria-expanded={isOpen}
        aria-label="More actions"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpenMenu(null)}
          />
          <div
            className={`absolute top-full z-40 mt-0.5 min-w-[10rem] rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
              align === "right" ? "right-0" : "left-0"
            }`}
            onClick={() => setOpenMenu(null)}
          >
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}

function menuBtnClass() {
  return "block w-full px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-gray-50";
}

export function LibraryHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");

  const {
    folders,
    files,
    createFolder,
    renameFolder,
    deleteFolder,
    createFile,
    deleteFile,
    updateFile,
  } = useProjectsLibrary();

  const [view, setView] = useState<DashboardViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<LibrarySortMode>("recent");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<LibraryProjectFile | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderTarget, setRenameFolderTarget] = useState<LibraryFolder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameFileTarget, setRenameFileTarget] = useState<LibraryProjectFile | null>(null);
  const [renameFileName, setRenameFileName] = useState("");

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === folderId) ?? null,
    [folders, folderId],
  );

  const q = searchQuery.trim().toLowerCase();

  const visibleFolders = useMemo(() => {
    if (folderId) return [];
    let list = folders;
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return sorted;
  }, [folders, folderId, q, sort]);

  const visibleFiles = useMemo(() => {
    let list = files.filter((f) =>
      folderId ? f.folderId === folderId : f.folderId === null,
    );
    if (q) list = list.filter((f) => f.name.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return sorted;
  }, [files, folderId, q, sort]);

  const folderFileCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of files) {
      if (f.folderId) m.set(f.folderId, (m.get(f.folderId) ?? 0) + 1);
    }
    return m;
  }, [files]);

  const folderLatestEdit = useCallback(
    (fid: string) => {
      const inFolder = files.filter((f) => f.folderId === fid);
      if (inFolder.length === 0) return null;
      return Math.max(...inFolder.map((f) => f.updatedAt), 0);
    },
    [files],
  );

  const startNewProject = () => {
    const f = createFile({
      name: "Untitled project",
      folderId: folderId,
      content: DEFAULT_PROJECT_LATEX,
    });
    router.push(`/editor?project=${f.id}`);
  };

  const submitNewFolder = () => {
    const name = newFolderName.trim() || "New folder";
    createFolder(name);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const submitRenameFolder = () => {
    if (!renameFolderTarget) return;
    renameFolder(renameFolderTarget.id, renameFolderName);
    setRenameFolderTarget(null);
    setRenameFolderName("");
  };

  const submitRenameFile = () => {
    if (!renameFileTarget) return;
    updateFile(renameFileTarget.id, { name: renameFileName });
    setRenameFileTarget(null);
    setRenameFileName("");
  };

  return (
    <MenuContext.Provider value={{ openMenu, setOpenMenu }}>
      <div
        className="min-h-screen bg-gray-50 text-neutral-900"
        onClick={() => setOpenMenu(null)}
      >
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <DashboardNavbar view={view} onViewChange={setView} />
          </div>
        </header>
      <section
        className="border-b border-gray-200 bg-white"
        aria-label="Search and sort"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <HeroToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sort={sort}
            onSortChange={setSort}
            toolbarEnd={
              <button
                type="button"
                onClick={() => setNewFolderOpen(true)}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-neutral-800 sm:w-auto ${subtleScaleHover} hover:bg-gray-50`}
              >
                <FolderPlus className="size-4 shrink-0" aria-hidden />
                New folder
              </button>
            }
          />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <Link
            href="/"
            className="font-medium text-neutral-900 hover:underline"
          >
            Library
          </Link>
          {folderId && activeFolder ? (
            <>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-neutral-900">
                {activeFolder.name}
              </span>
            </>
          ) : null}
        </nav>

        {folderId && !activeFolder ? (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This folder no longer exists.{" "}
            <Link href="/" className="font-medium underline">
              Back to library
            </Link>
          </p>
        ) : null}

        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={startNewProject}
              className={`flex min-h-[9.5rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-600 ${cardHoverClass()}`}
            >
              <PlusCircle className="size-12 stroke-[1.25] text-gray-400" />
              <span className="text-sm font-medium">New project</span>
            </button>

            {!folderId ? (
              <button
                type="button"
                onClick={() => setNewFolderOpen(true)}
                className={`flex min-h-[9.5rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-600 ${cardHoverClass()}`}
              >
                <FolderPlus className="size-11 text-gray-400" />
                <span className="text-sm font-medium">New folder</span>
              </button>
            ) : null}

            {!folderId
              ? visibleFolders.map((folder) => {
                  const count = folderFileCounts.get(folder.id) ?? 0;
                  const latest =
                    folderLatestEdit(folder.id) ?? folder.updatedAt;
                  return (
                    <div
                      key={folder.id}
                      className={`relative flex min-h-[9.5rem] flex-col rounded-2xl border border-gray-200 bg-gray-50/80 p-4 pt-12 shadow-sm ${cardHoverClass()} ${
                        dropTarget === folder.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDropTarget(folder.id);
                      }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedFile) {
                          updateFile(draggedFile.id, { folderId: folder.id });
                          setDraggedFile(null);
                          setDropTarget(null);
                        }
                      }}
                    >
                      <div className="absolute right-2 top-2">
                        <CardMenu menuId={`folder-${folder.id}`}>
                          <button
                            type="button"
                            className={menuBtnClass()}
                            onClick={() => {
                              setRenameFolderTarget(folder);
                              setRenameFolderName(folder.name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className={`${menuBtnClass()} text-red-600`}
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete folder “${folder.name}”? Projects inside will move to the library root.`,
                                )
                              ) {
                                deleteFolder(folder.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </CardMenu>
                      </div>
                      <Link
                        href={`/?folder=${folder.id}`}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${FOLDER_ICON[folder.color]}`}
                        >
                          <Folder className="size-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate font-semibold text-neutral-900">
                            {folder.name}
                          </h2>
                          <p className="mt-1 text-xs text-gray-500">
                            {count} file{count === 1 ? "" : "s"} ·{" "}
                            {formatRelativeTime(latest)}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })
              : null}

            {visibleFiles.map((file) => (
              <div
                key={file.id}
                draggable={!folderId}
                onDragStart={() => setDraggedFile(file)}
                onDragEnd={() => setDraggedFile(null)}
                className={`relative flex min-h-[9.5rem] flex-col rounded-2xl border border-gray-200 bg-gray-50/80 p-4 pt-12 shadow-sm ${cardHoverClass()} ${
                  draggedFile?.id === file.id ? 'opacity-50' : ''
                }`}
              >
                <div className="absolute right-2 top-2">
                  <CardMenu menuId={`file-${file.id}`}>
                    <Link
                      href={`/editor?project=${file.id}`}
                      className={menuBtnClass()}
                    >
                      Open in editor
                    </Link>
                    <button
                      type="button"
                      className={menuBtnClass()}
                      onClick={() => {
                        setRenameFileTarget(file);
                        setRenameFileName(file.name);
                      }}
                    >
                      Rename
                    </button>
                    {!folderId ? (
                      <div className="border-t border-gray-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                        Move to folder
                      </div>
                    ) : null}
                    {!folderId
                      ? folders.map((fd) => (
                          <button
                            key={fd.id}
                            type="button"
                            className={menuBtnClass()}
                            onClick={() =>
                              updateFile(file.id, { folderId: fd.id })
                            }
                          >
                            {fd.name}
                          </button>
                        ))
                      : null}
                    {folderId ? (
                      <button
                        type="button"
                        className={menuBtnClass()}
                        onClick={() =>
                          updateFile(file.id, { folderId: null })
                        }
                      >
                        Move to library root
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`${menuBtnClass()} text-red-600`}
                      onClick={() => {
                        if (confirm(`Delete “${file.name}”?`)) {
                          deleteFile(file.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </CardMenu>
                </div>
                <Link
                  href={`/editor?project=${file.id}`}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 ring-1 ring-gray-200">
                    <FileText className="size-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-neutral-900">
                      {file.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatRelativeTime(file.updatedAt)}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <li>
              <button
                type="button"
                onClick={startNewProject}
                className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50"
              >
                <PlusCircle className="size-9 shrink-0 text-gray-400" />
                <span className="font-medium text-neutral-900">New project</span>
              </button>
            </li>
            {!folderId ? (
              <li>
                <button
                  type="button"
                  onClick={() => setNewFolderOpen(true)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-gray-50"
                >
                  <FolderPlus className="size-8 shrink-0 text-gray-400" />
                  <span className="font-medium text-neutral-900">New folder</span>
                </button>
              </li>
            ) : null}
            {!folderId
              ? visibleFolders.map((folder) => {
                  const count = folderFileCounts.get(folder.id) ?? 0;
                  const latest =
                    folderLatestEdit(folder.id) ?? folder.updatedAt;
                  return (
                    <li key={folder.id}>
                      <div 
                        className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 ${
                          dropTarget === folder.id ? 'bg-blue-50' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDropTarget(folder.id);
                        }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedFile) {
                            updateFile(draggedFile.id, { folderId: folder.id });
                            setDraggedFile(null);
                            setDropTarget(null);
                          }
                        }}
                      >
                        <Link
                          href={`/?folder=${folder.id}`}
                          className="flex min-w-0 flex-1 items-center gap-4"
                        >
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${FOLDER_ICON[folder.color]}`}
                          >
                            <Folder className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-neutral-900">
                              {folder.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {count} file{count === 1 ? "" : "s"} ·{" "}
                              {formatRelativeTime(latest)}
                            </p>
                          </div>
                        </Link>
                        <CardMenu align="right" menuId={`folder-${folder.id}`}>
                          <button
                            type="button"
                            className={menuBtnClass()}
                            onClick={() => {
                              setRenameFolderTarget(folder);
                              setRenameFolderName(folder.name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className={`${menuBtnClass()} text-red-600`}
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete folder “${folder.name}”? Projects inside will move to the library root.`,
                                )
                              ) {
                                deleteFolder(folder.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </CardMenu>
                      </div>
                    </li>
                  );
                })
              : null}
            {visibleFiles.map((file) => (
              <li key={file.id}>
                <div 
                  className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 ${
                    draggedFile?.id === file.id ? 'opacity-50' : ''
                  }`}
                  draggable={!folderId}
                  onDragStart={() => setDraggedFile(file)}
                  onDragEnd={() => setDraggedFile(null)}
                >
                  <Link
                    href={`/editor?project=${file.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-200">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-neutral-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(file.updatedAt)}
                      </p>
                    </div>
                  </Link>
                  <CardMenu align="right" menuId={`file-${file.id}`}>
                    <Link
                      href={`/editor?project=${file.id}`}
                      className={menuBtnClass()}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      className={menuBtnClass()}
                      onClick={() => {
                        setRenameFileTarget(file);
                        setRenameFileName(file.name);
                      }}
                    >
                      Rename
                    </button>
                    {!folderId
                      ? folders.map((fd) => (
                          <button
                            key={fd.id}
                            type="button"
                            className={menuBtnClass()}
                            onClick={() =>
                              updateFile(file.id, { folderId: fd.id })
                            }
                          >
                            Move to {fd.name}
                          </button>
                        ))
                      : null}
                    {folderId ? (
                      <button
                        type="button"
                        className={menuBtnClass()}
                        onClick={() =>
                          updateFile(file.id, { folderId: null })
                        }
                      >
                        Move to root
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`${menuBtnClass()} text-red-600`}
                      onClick={() => {
                        if (confirm(`Delete “${file.name}”?`)) {
                          deleteFile(file.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </CardMenu>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            LaTeX editor
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Open the editor for symbols, drag-and-drop snippets, and live preview.
            Save projects to this library or export a file to continue on another
            device.
          </p>
          <Link
            href="/editor"
            className={`mt-4 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 ${subtleScaleHover}`}
          >
            New blank editor session
          </Link>
        </div>
      </main>

      {newFolderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-labelledby="new-folder-title"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="new-folder-title"
              className="text-lg font-semibold text-neutral-900"
            >
              New folder
            </h2>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewFolder();
                if (e.key === "Escape") setNewFolderOpen(false);
              }}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className={`rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium ${subtleScaleHover}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewFolder}
                className={`rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameFolderTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">
              Rename folder
            </h2>
            <input
              autoFocus
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRenameFolder();
                if (e.key === "Escape") setRenameFolderTarget(null);
              }}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameFolderTarget(null)}
                className={`rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium ${subtleScaleHover}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRenameFolder}
                className={`rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameFileTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">
              Rename project
            </h2>
            <input
              autoFocus
              value={renameFileName}
              onChange={(e) => setRenameFileName(e.target.value)}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRenameFile();
                if (e.key === "Escape") setRenameFileTarget(null);
              }}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameFileTarget(null)}
                className={`rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium ${subtleScaleHover}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRenameFile}
                className={`rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white ${subtleScaleHover}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </MenuContext.Provider>
  );
}
