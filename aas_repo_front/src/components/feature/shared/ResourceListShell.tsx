"use client";

import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  AlignJustify,
  Table as TableIcon,
  ArrowUpRight,
} from "lucide-react";

/* ─────────────────────────── status badge ─────────────────────────── */
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  published:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  success:    { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:      { bg: "bg-zinc-100 border-zinc-200",      text: "text-zinc-600",    dot: "bg-zinc-400" },
  temporary:  { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-400" },
  fail:       { bg: "bg-red-50 border-red-200",         text: "text-red-600",     dot: "bg-red-400" },
  deprecated: { bg: "bg-red-50 border-red-200",         text: "text-red-600",     dot: "bg-red-400" },
};

export function StatusBadge({ status, label }: { status?: string; label?: string }) {
  if (!status && !label) return null;
  const key = (status ?? "").toLowerCase();
  const s = STATUS_COLORS[key] ?? STATUS_COLORS.draft;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {label ?? status}
    </span>
  );
}

/* ─────────────────────────── generic card ─────────────────────────── */
export interface ResourceCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  statusLabel?: string;
  metaId?: string;
}

export function ResourceCard({
  href, icon: Icon, title, description, category, status, statusLabel, metaId,
}: ResourceCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 hover:shadow-sm transition-all duration-150">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-zinc-500" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" />
        </div>

        <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2 mb-1.5">
          {title}
        </h3>

        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 flex-1 mb-4">
          {description || "No description provided."}
        </p>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
          <span className="text-[11px] text-zinc-400 font-medium truncate">
            {category || "—"}
          </span>
          <StatusBadge status={status} label={statusLabel ?? status} />
        </div>

        {metaId && (
          <p className="mt-2 text-[10px] font-mono text-zinc-400 truncate">{metaId}</p>
        )}
      </div>
    </Link>
  );
}

/* ─────────────────────────── generic row ─────────────────────────── */
export function ResourceRow({
  href, icon: Icon, title, description, category, status, statusLabel,
}: ResourceCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors block">
          {title}
        </span>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{description || "—"}</p>
      </div>
      <span className="text-xs text-zinc-400 shrink-0 hidden md:block">{category}</span>
      <StatusBadge status={status} label={statusLabel ?? status} />
      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
    </Link>
  );
}

/* ─────────────────────────── shell ─────────────────────────── */
export type ViewType = "grid" | "list" | "table";

export interface CategoryItem {
  id: string;
  label: string;
}

const VIEW_ICONS: Record<ViewType, React.ElementType> = {
  grid: LayoutGrid,
  list: AlignJustify,
  table: TableIcon,
};

interface ResourceListShellProps {
  /* header */
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  /* search */
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  searchPlaceholder?: string;
  /* categories */
  categories: CategoryItem[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  totalCount: number;
  sidebarExtra?: React.ReactNode;
  /* view */
  view: ViewType;
  views?: ViewType[];
  onViewChange: (v: ViewType) => void;
  /* result text */
  resultText?: React.ReactNode;
  /* pagination */
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  /* states */
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: unknown;
  errorText?: string;
  emptyIcon?: React.ElementType;
  emptyTitle?: string;
  emptyHint?: string;
  children: React.ReactNode;
}

export function ResourceListShell({
  title,
  subtitle,
  headerAction,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  categories,
  activeCategory,
  onCategoryChange,
  totalCount,
  sidebarExtra,
  view,
  views = ["grid", "list"],
  onViewChange,
  resultText,
  page,
  totalPages,
  onPageChange,
  isLoading,
  isEmpty,
  error,
  errorText = "Failed to load data. Please check your connection and try again.",
  emptyIcon: EmptyIcon,
  emptyTitle = "Nothing found",
  emptyHint = "Try adjusting your search or category filter",
  children,
}: ResourceListShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900">{title}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
          {headerAction}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6 flex gap-6">
        {/* ── Left sidebar ── */}
        <aside className="w-52 shrink-0">
          <div className="sticky top-6 space-y-1">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input
                className="h-8 pl-8 text-sm bg-white border-zinc-200 rounded-lg"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
              />
            </div>

            {sidebarExtra}

            {/* Category label */}
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1 pt-2">
              Category
            </p>

            <button
              onClick={() => onCategoryChange("all")}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                activeCategory === "all"
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <span>All</span>
              <span className={cn("text-[11px] tabular-nums", activeCategory === "all" ? "text-zinc-300" : "text-zinc-400")}>
                {totalCount}
              </span>
            </button>

            {categories.map((c) => {
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onCategoryChange(c.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left",
                    active
                      ? "bg-zinc-900 text-white font-medium"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-zinc-500 truncate">{resultText}</p>
            {views.length > 1 && (
              <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5 shrink-0">
                {views.map((v) => {
                  const Icon = VIEW_ICONS[v];
                  return (
                    <button
                      key={v}
                      onClick={() => onViewChange(v)}
                      aria-label={`${v} view`}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        view === v ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* error */}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 mb-4">
              {errorText}
            </div>
          ) : null}

          {/* loading */}
          {isLoading ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-none border-b border-zinc-100 last:border-b-0" />
                ))}
              </div>
            )
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 bg-white border border-zinc-200 rounded-xl">
              {EmptyIcon && <EmptyIcon className="w-10 h-10 mb-3 opacity-30" />}
              <p className="text-sm font-medium">{emptyTitle}</p>
              <p className="text-xs mt-1">{emptyHint}</p>
            </div>
          ) : (
            children
          )}

          {/* pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = i + Math.max(1, Math.min(page - 3, totalPages - 6));
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      p === page
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
