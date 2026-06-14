"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getModelList, getCodeList } from "@/api/index";
import { rankByQuery } from "@/utils/search";
import { resolveThumbnailSrc } from "@/utils/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserRole } from "@/constants/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  FileStack,
  ArrowUpRight,
  LayoutGrid,
  AlignJustify,
  User as UserIcon,
  CalendarDays,
  FileText,
} from "lucide-react";

const PAGE_SIZE = 24;

// 생성일 표시용 포맷터. 값이 없거나 파싱 불가하면 "—" 반환.
function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// 모델 객체에서 생성자명을 안전하게 추출 (필드명이 백엔드에 따라 다를 수 있어 폴백 처리)
function getCreator(model: any): string {
  return model.creator || model.create_user_name || model.create_user_nm || "—";
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  published:  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:      { bg: "bg-zinc-100 border-zinc-200",      text: "text-zinc-600",    dot: "bg-zinc-400" },
  temporary:  { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   dot: "bg-amber-400" },
  deprecated: { bg: "bg-red-50 border-red-200",         text: "text-red-600",     dot: "bg-red-400" },
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

// 카테고리/타입/성숙도 등을 표시하는 소형 칩
function Chip({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "sky" | "amber";
}) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none max-w-full truncate",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// Guide 문서가 있을 때 표시되는 작은 아이콘 (hover 시 "Guide Available")
function GuideIcon() {
  const { t } = useLanguage();
  return (
    <span
      className="group/guide relative inline-flex shrink-0"
      title={t("Guide Available")}
    >
      <FileText className="w-4 h-4 text-blue-500" />
      <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/guide:opacity-100">
        {t("Guide Available")}
      </span>
    </span>
  );
}

function TemplateCard({ model }: { model: any }) {
  const { t } = useLanguage();
  const thumb = resolveThumbnailSrc(model);
  const hasGuide = !!model.guide_filename;
  return (
    <Link href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)} className="group block h-full">
      <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all duration-150">
        {/* top row: status + guide indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
          {hasGuide && <GuideIcon />}
        </div>

        {/* main: thumbnail + name + chips (가로 배치) */}
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb || "/placeholder.svg"}
                alt={`${model.aasmodel_name || "Template"} thumbnail`}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileStack className="w-5 h-5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">
              {model.aasmodel_name}
            </h3>
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <Chip tone="sky">{model.category_name || t("Uncategorized")}</Chip>
              {model.asset_type && <Chip>{model.asset_type}</Chip>}
              {model.aas_maturity_level && (
                <Chip tone="amber">{model.aas_maturity_level}</Chip>
              )}
            </div>
          </div>
        </div>

        {/* footer: creator (좌) | last modified (우) */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-zinc-100 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 min-w-0">
            <UserIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{getCreator(model)}</span>
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
            {formatDate(model.last_mod_date)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function TemplateRow({ model }: { model: any }) {
  const thumb = resolveThumbnailSrc(model);
  return (
    <Link
      href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)}
      className="group flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb || "/placeholder.svg"}
            alt={`${model.aasmodel_name || "Template"} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileStack className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors block">
          {model.aasmodel_name}
        </span>
        <p className="text-xs text-zinc-400 truncate mt-0.5">{model.description || "—"}</p>
      </div>
      <span className="hidden lg:flex items-center gap-1 shrink-0 w-28">
        <Chip tone="sky">{model.category_name || "—"}</Chip>
      </span>
      {model.guide_filename ? (
        <GuideIcon />
      ) : (
        <span className="w-4 shrink-0 hidden lg:block" />
      )}
      <span className="text-xs text-zinc-400 shrink-0 hidden lg:flex items-center gap-1 w-28 truncate">
        <UserIcon className="w-3 h-3 shrink-0" />
        <span className="truncate">{getCreator(model)}</span>
      </span>
      <span className="text-xs text-zinc-400 shrink-0 hidden md:flex items-center gap-1 w-24">
        <CalendarDays className="w-3 h-3 shrink-0" />
        {formatDate(model.last_mod_date)}
      </span>
      <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
    </Link>
  );
}

export default function AASPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [inputValue, setInputValue]       = useState("");
  const [searchKey, setSearchKey]         = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [layoutType, setLayoutType]       = useState<"grid" | "list">("grid");
  const [page, setPage]                   = useState(1);

  const { data: categoriesRaw = [] } = useSWR(
    "categories-aasmodel",
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
    ["aasmodel-list", page, searchKey, activeCategory],
    () => getModelList({ modelType: "aasmodel", pageNumber: page, pageSize: PAGE_SIZE, searchParams })
  );

  const rawModels: any[] = Array.isArray(modelData)
    ? modelData
    : Array.isArray(modelData?.list) ? modelData.list : [];
  const totalCount: number = modelData?.totalCount ?? modelData?.total ?? rawModels.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 배포상태 필터: 일반 사용자는 published 만, admin(Manager)은 draft·published 모두 조회.
  const isAdmin = user?.user_group_seq === UserRole.Manager;
  const statusFiltered = isAdmin
    ? rawModels
    : rawModels.filter((m) => m.status === "published");

  // 이름 일치를 최우선으로, 그다음 설명/ID/카테고리 키워드 순으로 재정렬
  const models = rankByQuery(statusFiltered, searchKey, {
    getName: (m) => m.aasmodel_name,
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
            <h1 className="text-lg font-bold text-zinc-900">{t("AAS Templates")}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isLoading ? t("Loading...") : `${totalCount} ${t("templates available")}`}
            </p>
          </div>
          {user && user.user_group_seq <= UserRole.User && (
            <Link href={ROUTES.AASMODEL.CREATE} className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t("New Template")}
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
                  placeholder={t("Search by name...")}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button size="sm" className="w-full h-8" onClick={handleSearch}>
                <Search className="w-3.5 h-3.5 mr-1.5" />
                {t("Search")}
              </Button>
            </div>

            {/* Category label */}
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
              {t("Category")}
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
              <span>{t("All")}</span>
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
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              {searchKey && <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>}
              {isLoading ? t("Loading...") : `${models.length} ${t("shown")}`}
              {isAdmin && !isLoading && (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {t("incl. draft")}
                </span>
              )}
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
              {t("Failed to load templates. Please check your connection and try again.")}
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
                  <p className="text-sm font-medium">{t("No templates found")}</p>
                  <p className="text-xs mt-1">{t("Try adjusting your search or category filter")}</p>
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
                  <p className="text-sm font-medium">{t("No templates found")}</p>
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
