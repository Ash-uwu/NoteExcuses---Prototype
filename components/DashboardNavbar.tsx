"use client";

import { subtleScaleHover } from "./interaction-styles";

export type DashboardViewMode = "grid" | "list";

type DashboardNavbarProps = {
  view: DashboardViewMode;
  onViewChange: (view: DashboardViewMode) => void;
};

export function DashboardNavbar({ view, onViewChange }: DashboardNavbarProps) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
      <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        Latex Library
      </h1>
      <div
        className="inline-flex self-start rounded-xl border border-gray-200 bg-gray-50/80 p-1 sm:self-auto"
        role="group"
        aria-label="Project view"
      >
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover} ${
            view === "grid"
              ? "bg-white shadow-sm ring-1 ring-gray-200/80"
              : "text-neutral-600 hover:bg-white/60"
          }`}
        >
          Grid
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-neutral-800 ${subtleScaleHover} ${
            view === "list"
              ? "bg-white shadow-sm ring-1 ring-gray-200/80"
              : "text-neutral-600 hover:bg-white/60"
          }`}
        >
          List
        </button>
      </div>
    </div>
  );
}
