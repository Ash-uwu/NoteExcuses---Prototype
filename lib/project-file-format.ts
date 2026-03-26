export const PROJECT_FILE_FORMAT = "latex-library-project" as const;
export const PROJECT_FILE_VERSION = 1 as const;

export type ProjectExportPayload = {
  format: typeof PROJECT_FILE_FORMAT;
  version: typeof PROJECT_FILE_VERSION;
  name: string;
  content: string;
  exportedAt: string;
};

export function buildProjectExportJson(name: string, content: string): string {
  const payload: ProjectExportPayload = {
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    name,
    content,
    exportedAt: new Date().toISOString(),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseImportedProjectFile(
  fileBaseName: string,
  text: string,
): { name: string; content: string } {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      if (
        j &&
        j.format === PROJECT_FILE_FORMAT &&
        typeof j.content === "string"
      ) {
        return {
          name:
            typeof j.name === "string" && j.name.trim()
              ? j.name.trim()
              : sanitizeFileStem(fileBaseName),
          content: j.content,
        };
      }
    } catch {
      /* fall through to plain text */
    }
  }
  return {
    name: sanitizeFileStem(fileBaseName),
    content: text.replace(/^\uFEFF/, ""),
  };
}

function sanitizeFileStem(name: string) {
  return name.replace(/\.(tex|json|txt)$/i, "").trim() || "Imported project";
}

export function sanitizeDownloadFilename(name: string, ext: string) {
  const base = name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "latex-project"}.${ext}`;
}

export function downloadTextFile(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
