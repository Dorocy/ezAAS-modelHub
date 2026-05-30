"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getModelList, getCodeList } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CategorySidebar, ViewToggle, ListPagination } from "@/components/feature/shared/ListControls";
import { cn } from "@/lib/utils";
import {
  Plus,
  FileStack,
  ArrowUpRight,
} from "lucide-react";

const PAGE_SIZE = 24;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  published:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:      { bg: "bg-zinc-100 border-zinc-200",      text: "text-zinc-600",    dot: "bg-zinc-400" },
  temporary:  { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-400" },
  deprecated: { bg: "bg-red-50 border-red-200",         text: "text-red-600",     dot: "bg-red-400" },
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-medium", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {label}
    </Badge>
  );
}

function TemplateCard({ model }: { model: any }) {
  return (
    <Link href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)} className="group block">
      <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-400 hover:shadow-sm transition-all duration-150">
        {/* top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
            <FileStack className="w-4 h-4 text-zinc-500" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" />
        </div>

        {/* name */}
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2 mb-1.5">
          {model.aasmodel_name}
        </h3>

        {/* description */}
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 flex-1 mb-4">
          {model.description || "No description provided."}
        </p>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
          <span className="text-[11px] text-zinc-400 font-medium truncate">
            {model.category_name || "—"}
          </span>
          <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
        </div>

        {/* template id */}
        {model.aasmodel_template_id && (
          <p className="mt-2 text-[10px] font-mono text-zinc-400 truncate">
            {model.aasmodel_template_id}
          </p>
        )}
      </div>
    </Link>
  );
}

function TemplateRow({ model }: { model: any }) {
  return (
    <Link
      href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)}
      className="group flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <FileStack className="w-3.5 h-3.5 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors block">
          {model.aasmodel_name}
        </span>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{model.description || "—"}</p>
      </div>
      <span className="text-xs text-zinc-400 shrink-0 hidden md:block">{model.category_name}</span>
      <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
    </Link>
  );
}

export default function AASPage() {
  const { user, isAuthenticated } = useAuth();

  const [inputValue, setInputValue]       = useState("");
  const [searchKey, setSearchKey]         = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [layoutType, setLayoutType]       = useState<"grid" | "list">("grid");
  const [page, setPage]                   = useState(1);

  const { data: categories = [] } = useSWR(
    isAuthenticated ? "categories-aasmodel" : null,
    () => getCodeList("category")
  );

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (activeCategory !== "all") searchParams.category_seq = activeCategory;

  const { data: modelData, isLoading, error } = useSWR(
    isAuthenticated ? ["aasmodel-list", page, searchKey, activeCategory] : null,
    () => getModelList({ modelType: "aasmodel", pageNumber: page, pageSize: PAGE_SIZE, searchParams })
  );

  const models: any[] = Array.isArray(modelData)
    ? modelData
    : Array.isArray(modelData?.list) ? modelData.list : [];
  const totalCount: number = modelData?.totalCount ?? modelData?.total ?? models.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            <h1 className="text-lg font-bold text-zinc-900">AAS Templates</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isLoading ? "Loading..." : `${totalCount} templates available`}
            </p>
          </div>
          {user && user.user_group_seq <= UserRole.User && (
            <Link href={ROUTES.AASMODEL.CREATE} className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Template
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6 flex gap-6">
        {/* ── Left sidebar ── */}
        <CategorySidebar
          searchValue={inputValue}
          onSearchChange={setInputValue}
          onSearchSubmit={handleSearch}
          categories={categories.map((c: any) => ({
            id: String(c.category_seq ?? c.id),
            label: c.category_name ?? c.text,
          }))}
          activeCategory={activeCategory}
          onCategoryChange={handleCategory}
          totalCount={totalCount}
        />

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* toolbar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-500">
              {searchKey && <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>}
              {isLoading ? "Loading..." : `${models.length} of ${totalCount}`}
            </p>
            <ViewToggle value={layoutType} onChange={setLayoutType} />
          </div>

          {/* error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 mb-4">
              Failed to load templates. Please check your connection and try again.
            </div>
          )}

          {/* loading */}
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
                <TemplateCard key={model.aasmodel_seq} model={model} />
              ))}
              {models.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-400">
                  <FileStack className="w-10 h-10 mb-3 opacity-30" />
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
                <TemplateRow key={model.aasmodel_seq} model={model} />
              ))}
              {models.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                  <FileStack className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No templates found</p>
                </div>
              )}
            </div>
          )}

          {/* pagination */}
          <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
