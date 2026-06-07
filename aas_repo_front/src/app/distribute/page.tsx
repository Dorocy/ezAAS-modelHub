"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getPublishedList } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Layers,
  Boxes,
  Package,
  Hash,
} from "lucide-react";

const PAGE_SIZE = 15;

type ModelKind = "aasmodel" | "submodel";

interface PublishedRow {
  raw: any;
  type: ModelKind;
  seq: any;
  name: string;
  description: string;
  version?: string;
  templateId?: string;
  semanticId?: string;
  categoryName: string;
}

export default function DistributePage() {
  const { isAuthenticated } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ModelKind>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  // status는 published 고정 (배포 관리 화면)
  const { data: publishedData, isLoading, error } = useSWR(
    isAuthenticated ? ["published-list"] : null,
    () =>
      getPublishedList({
        status: "published",
        type: "all",
        pageNumber: 1,
        pageSize: 1000,
        searchParams: {},
      })
  );

  // 응답 구조 방어: 배열 / { data: [...] } / { data: { data: [...] } } 모두 처리
  const payload: any = publishedData?.data ?? publishedData;
  const rawModels: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.list)
        ? payload.list
        : [];

  // submodel_* / aas_* 필드를 공통 형태로 정규화
  const allModels: PublishedRow[] = useMemo(
    () =>
      rawModels.map((m: any) => {
        const isAas = m.aas_seq != null || m.aas_name != null || m.aas_id != null;
        return {
          raw: m,
          type: (isAas ? "aasmodel" : "submodel") as ModelKind,
          seq: m.submodel_seq ?? m.aas_seq ?? m.target_seq,
          name: m.submodel_name ?? m.aas_name ?? m.target_name ?? "(이름 없음)",
          description: m.description ?? "",
          version: m.version ?? m.target_version,
          templateId: m.submodel_id ?? m.aas_id ?? m.tmp_seman_id,
          semanticId: m.submodel_semantic_id ?? m.aas_semantic_id,
          categoryName: m.category_name ?? "Uncategorized",
        };
      }),
    [rawModels]
  );

  // 모델 타입별 개수
  const typeCounts = useMemo(() => {
    let aas = 0;
    let submodel = 0;
    for (const m of allModels) {
      if (m.type === "aasmodel") aas++;
      else submodel++;
    }
    return { all: allModels.length, aasmodel: aas, submodel };
  }, [allModels]);

  // 현재 타입 필터 기준 카테고리 목록 + 개수
  const categories = useMemo(() => {
    const base = allModels.filter(
      (m) => typeFilter === "all" || m.type === typeFilter
    );
    const map = new Map<string, number>();
    for (const m of base) map.set(m.categoryName, (map.get(m.categoryName) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allModels, typeFilter]);

  // 필터 적용
  const filtered = useMemo(() => {
    const q = searchKey.trim().toLowerCase();
    return allModels.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (categoryFilter !== "all" && m.categoryName !== categoryFilter) return false;
      if (q) {
        const haystack = `${m.name} ${m.templateId ?? ""} ${m.semanticId ?? ""} ${m.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allModels, typeFilter, categoryFilter, searchKey]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleType = (val: "all" | ModelKind) => {
    setTypeFilter(val);
    setCategoryFilter("all");
    setPage(1);
  };

  const handleCategory = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Publish</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isLoading
                ? "Loading..."
                : `${typeCounts.all} published templates · AAS ${typeCounts.aasmodel} · Submodel ${typeCounts.submodel}`}
            </p>
          </div>
          <Link href="/distribute/ins" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Register
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6 flex gap-6">
        {/* ── Left sidebar ── */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-6 space-y-1">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input
                className="h-8 pl-8 text-sm bg-white border-zinc-200 rounded-lg"
                placeholder="이름 / ID 검색..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Model type toggle */}
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
              Model Type
            </p>
            <div className="space-y-1 mb-4">
              {([
                { key: "all", label: "All", icon: Layers, count: typeCounts.all },
                { key: "aasmodel", label: "AAS", icon: Boxes, count: typeCounts.aasmodel },
                { key: "submodel", label: "Submodel", icon: Package, count: typeCounts.submodel },
              ] as const).map(({ key, label, icon: Icon, count }) => {
                const active = typeFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleType(key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left",
                      active
                        ? "bg-zinc-900 text-white font-medium"
                        : "text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        active ? "text-zinc-300" : "text-zinc-400"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category */}
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
              Category
            </p>
            <button
              onClick={() => handleCategory("all")}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                categoryFilter === "all"
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <span>All</span>
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  categoryFilter === "all" ? "text-zinc-300" : "text-zinc-400"
                )}
              >
                {categories.reduce((s, c) => s + c.count, 0)}
              </span>
            </button>
            {categories.map((c) => {
              const active = categoryFilter === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => handleCategory(c.name)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left",
                    active
                      ? "bg-zinc-900 text-white font-medium"
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums shrink-0",
                      active ? "text-zinc-300" : "text-zinc-400"
                    )}
                  >
                    {c.count}
                  </span>
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
              {searchKey && (
                <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>
              )}
              {isLoading ? "Loading..." : `${totalCount} templates`}
            </p>
          </div>

          {/* error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 mb-4">
              Failed to load data. Please check your connection or try again.
            </div>
          )}

          {/* loading */}
          {isLoading ? (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-16 rounded-none border-b border-zinc-100 last:border-b-0"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left">
                    <th className="px-4 py-3 w-24 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-4 py-3 w-32 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 w-16 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Ver.
                    </th>
                    <th className="px-4 py-3 w-24 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((model) => (
                    <tr
                      key={`${model.type}-${model.seq}`}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                            model.type === "aasmodel"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-violet-50 border-violet-200 text-violet-700"
                          )}
                        >
                          {model.type === "aasmodel" ? (
                            <Boxes className="w-3 h-3" />
                          ) : (
                            <Package className="w-3 h-3" />
                          )}
                          {model.type === "aasmodel" ? "AAS" : "SM"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={ROUTES.DISTRIBUTE.VIEW({
                            modelType: model.type,
                            targetSeq: model.seq,
                          })}
                          className="block group"
                        >
                          <span className="block text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                            {model.name}
                          </span>
                          {model.templateId && (
                            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                              <Hash className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[420px]">{model.templateId}</span>
                            </span>
                          )}
                          {model.description && (
                            <span className="mt-1 block text-xs text-zinc-500 line-clamp-1 max-w-[460px]">
                              {model.description}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-500 hidden md:table-cell">
                        {model.categoryName}
                      </td>
                      <td className="px-4 py-3 align-top text-zinc-500 tabular-nums">
                        {model.version ? `v${model.version}` : "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <Link
                          href={ROUTES.DISTRIBUTE.EDIT({
                            modelType: model.type,
                            targetSeq: model.seq,
                          })}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Pencil className="size-3.5 mr-1.5" />
                          수정
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="h-40">
                        <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                          <Layers className="size-8 opacity-30" />
                          <p className="text-sm">No published templates found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-zinc-500 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
