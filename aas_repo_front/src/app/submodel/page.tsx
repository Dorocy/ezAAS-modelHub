"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getModelList, getCodeList } from "@/api/index";
import { rankByQuery } from "@/utils/search";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpRight,
  LayoutGrid,
  AlignJustify,
} from "lucide-react";

const PAGE_SIZE = 24;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  published: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:     { bg: "bg-zinc-100 border-zinc-200",      text: "text-zinc-600",    dot: "bg-zinc-400" },
  temporary: { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-400" },
  deprecated:{ bg: "bg-red-50 border-red-200",         text: "text-red-600",     dot: "bg-red-400" },
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {label}
    </span>
  );
}

function TemplateCard({ model }: { model: any }) {
  return (
    <Link href={ROUTES.SUBMODEL.VIEW(model.submodel_seq)} className="group block">
      <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 hover:shadow-sm transition-all duration-150">
        {/* top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* icon */}
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" />
        </div>

        {/* name */}
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2 mb-1.5">
          {model.submodel_name}
        </h3>

        {/* description */}
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 flex-1 mb-4">
          {model.description || "No description provided."}
        </p>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
          <span className="text-xs text-zinc-400 font-medium truncate">
            {model.category_name || "—"}
          </span>
          <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
        </div>

        {/* semantic id */}
        {model.submodel_semantic_id && (
          <p className="mt-2 text-xs font-mono text-zinc-400 truncate">
            {model.submodel_semantic_id}
          </p>
        )}
      </div>
    </Link>
  );
}

function TemplateRow({ model }: { model: any }) {
  return (
    <Link href={ROUTES.SUBMODEL.VIEW(model.submodel_seq)} className="group flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <Layers className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors">
            {model.submodel_name}
          </span>
        </div>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{model.description || "—"}</p>
      </div>
      <span className="text-xs text-zinc-400 shrink-0 hidden md:block">{model.category_name}</span>
      <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
    </Link>
  );
}

export default function SubmodelPage() {
  const { user } = useAuth();

  const [inputValue, setInputValue]   = useState("");
  const [searchKey, setSearchKey]     = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [layoutType, setLayoutType]   = useState<"grid" | "list">("grid");
  const [page, setPage]               = useState(1);

  const { data: categoriesRaw = [] } = useSWR(
    "categories-submodel",
    () => getCodeList("category")
  );

  // 카테고리 중복 제거: API가 같은 항목을 두 번 내려주는 경우를 대비해 고유 키로 dedupe
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return (categoriesRaw as any[]).filter((c) => {
      const key = String(c.category_seq ?? c.id ?? c.category_name ?? c.text);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoriesRaw]);

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (activeCategory !== "all") searchParams.category_seq = activeCategory;

  const { data: modelData, isLoading, error } = useSWR(
    ["submodel-list", page, searchKey, activeCategory],
    () => getModelList({ modelType: "submodel", pageNumber: page, pageSize: PAGE_SIZE, searchParams })
  );

  const rawModels: any[] = Array.isArray(modelData)
    ? modelData
    : Array.isArray(modelData?.list) ? modelData.list : [];
  const totalCount: number = modelData?.totalCount ?? modelData?.total ?? rawModels.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 이름 일치를 최우선으로, 그다음 설명/카테고리 키워드 순으로 재정렬
  const models = rankByQuery(rawModels, searchKey, {
    getName: (m) => m.submodel_name,
    getKeywords: (m) => [m.description, m.category_name],
  });

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleCategory = (val: string) => {
    setActiveCategory(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Submodel Templates</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isLoading ? "Loading..." : `${totalCount} templates available`}
            </p>
          </div>
          {user && user.user_group_seq <= UserRole.Approvedor && (
            <Link href={ROUTES.SUBMODEL.CREATE} className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Template
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6 flex gap-6">
        {/* ── Left sidebar ── */}
        <aside className="w-52 shrink-0">
          <div className="sticky top-6 space-y-1">
            {/* Search */}
            <div className="mb-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <Input
                  className="h-8 pl-8 text-sm bg-white border-zinc-200 rounded-lg"
                  placeholder="Search by name..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button size="sm" className="w-full h-8" onClick={handleSearch}>
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Search
              </Button>
            </div>

            {/* Category label */}
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
              Category
            </p>

            {/* All */}
            <button
              onClick={() => handleCategory("all")}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                activeCategory === "all"
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <span>All</span>
              <span className={cn("text-xs tabular-nums", activeCategory === "all" ? "text-zinc-300" : "text-zinc-400")}>
                {totalCount}
              </span>
            </button>

            {categories.map((c: any) => {
              const id = String(c.category_seq ?? c.id);
              const active = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => handleCategory(id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left",
                    active
                      ? "bg-zinc-900 text-white font-medium"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <span className="truncate">{c.category_name ?? c.text}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* toolbar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">
              {searchKey && <span className="text-zinc-900 font-medium">"{searchKey}" · </span>}
              {isLoading ? "Loading..." : `${models.length} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-0.5">
              <button
                onClick={() => setLayoutType("grid")}
                className={cn("p-1.5 rounded-md transition-colors", layoutType === "grid" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-600")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutType("list")}
                className={cn("p-1.5 rounded-md transition-colors", layoutType === "list" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-600")}
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 mb-4">
              Failed to load templates. Please check your connection and try again.
            </div>
          )}

          {/* loading skeletons */}
          {isLoading && layoutType === "grid" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          )}
          {isLoading && layoutType === "list" && (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-none border-b border-zinc-100 last:border-b-0" />
              ))}
            </div>
          )}

          {/* grid view */}
          {!isLoading && layoutType === "grid" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model: any) => (
                <TemplateCard key={model.submodel_seq} model={model} />
              ))}
              {models.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-400">
                  <Layers className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No templates found</p>
                  <p className="text-xs mt-1">Try adjusting your search or category filter</p>
                </div>
              )}
            </div>
          )}

          {/* list view */}
          {!isLoading && layoutType === "list" && (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              {models.map((model: any) => (
                <TemplateRow key={model.submodel_seq} model={model} />
              ))}
              {models.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                  <Layers className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No templates found</p>
                </div>
              )}
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = i + Math.max(1, Math.min(page - 3, totalPages - 6));
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
