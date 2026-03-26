import { Suspense } from "react";
import { LatexEditorPage } from "@/components/latex-editor/LatexEditorPage";

function EditorFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-gray-500">
      Loading editor…
    </div>
  );
}

export default function EditorRoute() {
  return (
    <Suspense fallback={<EditorFallback />}>
      <LatexEditorPage />
    </Suspense>
  );
}
