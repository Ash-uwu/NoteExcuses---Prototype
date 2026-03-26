"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  projectsStore,
  type LibraryFolder,
  type LibraryProjectFile,
} from "@/lib/projects-store";

export function useProjectsLibrary() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const createFolder = useCallback((name: string) => {
    return projectsStore.createFolder(name);
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    projectsStore.renameFolder(id, name);
  }, []);

  const deleteFolder = useCallback((id: string) => {
    projectsStore.deleteFolder(id);
  }, []);

  const createFile = useCallback(
    (input: {
      name: string;
      folderId: string | null;
      content: string;
    }) => {
      return projectsStore.createFile(input);
    },
    [],
  );

  const updateFile = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<LibraryProjectFile, "name" | "content" | "folderId">
      >,
    ) => {
      projectsStore.updateFile(id, patch);
    },
    [],
  );

  const deleteFile = useCallback((id: string) => {
    projectsStore.deleteFile(id);
  }, []);

  const getFile = useCallback((id: string) => {
    return projectsStore.getFile(id);
  }, []);

  return {
    folders: state.folders,
    files: state.files,
    createFolder,
    renameFolder,
    deleteFolder,
    createFile,
    updateFile,
    deleteFile,
    getFile,
  };
}

export type { LibraryFolder, LibraryProjectFile };
