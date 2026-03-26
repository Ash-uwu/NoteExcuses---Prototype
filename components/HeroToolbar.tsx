import type { ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { subtleScaleHover } from "./interaction-styles";

export type LibrarySortMode = "recent" | "name";

const SORT_LABELS: Record<LibrarySortMode, string> = {
  recent: "Recently edited",
  name: "Name (A–Z)",
};

type HeroToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sort: LibrarySortMode;
  onSortChange: (value: LibrarySortMode) => void;
  toolbarEnd?: ReactNode;
};

export function HeroToolbar({
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
  toolbarEnd,
}: HeroToolbarProps) {
  return (
    <div className="flex flex-col gap-3 pb-5 pt-1 md:flex-row md:items-stretch md:gap-4 md:pb-6 md:pt-0">
      <label className="relative flex min-h-11 min-w-0 flex-1 items-center">
        <span className="pointer-events-none absolute left-3.5 text-gray-400">
          <Search className="size-5 shrink-0" strokeWidth={2} aria-hidden />
        </span>
        <span className="sr-only">Search projects</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects..."
          className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 py-2 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-gray-400 outline-none transition-[box-shadow,background-color] focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
        />
      </label>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-stretch md:flex-row">
        <details className="group relative md:min-w-[200px]">
          <summary
            className={`flex h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-left text-sm font-medium text-neutral-800 [&::-webkit-details-marker]:hidden ${subtleScaleHover} hover:bg-gray-100/80`}
          >
            <span>{SORT_LABELS[sort]}</span>
            <ChevronDown
              className="size-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180"
              strokeWidth={2}
              aria-hidden
            />
          </summary>
          <div className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {(Object.keys(SORT_LABELS) as LibrarySortMode[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSortChange(key);
                  const d = document.activeElement?.closest("details");
                  if (d instanceof HTMLDetailsElement) d.open = false;
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm ${
                  sort === key
                    ? "bg-gray-50 font-medium text-neutral-900"
                    : "text-neutral-700 hover:bg-gray-50"
                }`}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        </details>
        {toolbarEnd ? (
          <div className="flex items-stretch justify-stretch">{toolbarEnd}</div>
        ) : null}
      </div>
    </div>
  );
}
