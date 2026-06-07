"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getInstanceList, getCodeList, exportModel } from "@/api/index";
import { rankByQuery } from "@/utils/search";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Download,
  Pencil,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

const PAGE_SIZE = 20;

function VerificationBadge({ value }: { value: string }) {
  const ok = value === "success";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
        ok
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-600"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-red-400")} />
      {value}
    </span>
  );
}

export default function InstancePage() {
  const { user, isAuthenticated } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchMode, setSearchMode] = useState<"my" | "all">("all");
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useSWR(
    isAuthenticated ? "categories-instance" : null,
    () => getCodeList("category")
  );

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (searchMode === "my" && user) searchParams.user_seq = String(user.user_seq);

  const { data: instanceData, isLoading, error } = useSWR(
    isAuthenticated ? ["instance-list", page, searchKey, categoryFilter, searchMode] : null,
    () =>
      getInstanceList({
        // 백엔드는 전체 조회 시 "all"을 기대한다. "0"을 보내면 빈 목록이 반환된다.
        category_seq: categoryFilter === "all" ? "all" : categoryFilter,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchParams,
      })
  );

  // 응답 구조: { result, msg, data: { recordsTotal, recordsFiltered, data: [...instances] } }
  // 다양한 형태를 방어적으로 처리한다.
  const payload = instanceData?.data ?? instanceData;
  const rawInstances: any[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : Array.isArray(instanceData)
        ? instanceData
        : [];
  const totalCount: number = payload?.recordsTotal ?? payload?.recordsFiltered ?? rawInstances.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 이름 일치를 최우선으로, 그다음 설명/카테고리 키워드 순으로 재정렬
  const instances = rankByQuery(rawInstances, searchKey, {
    getName: (i) => i.instance_name,
    getKeywords: (i) => [i.description, i.category_name],
  });

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleCategory = (val: string) => {
    setCategoryFilter(val);
    setPage(1);
  };

  const handleExport = async (instance: any, format: "json" | "xml" | "aasx") => {
    await exportModel({
      modelType: "aasmodel",
      modelSeq: instance.instance_seq,
      format,
      filename: instance.instance_name,
    });
  };

  const canCreate =
    user &&
    (user.user_group_seq === UserRole.User ||
      user.user_group_seq === UserRole.Manager);
  const showUser = user && user.user_group_seq <= UserRole.Approvedor;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">My AAS Instance</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isLoading ? "Loading..." : `${totalCount} instances`}
            </p>
          </div>
          {canCreate && (
            <Link href="/instance/ins" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create AAS
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

            {/* Scope toggle */}
            {user && user.user_group_seq !== UserRole.User && (
              <>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
                  Scope
                </p>
                <div className="flex rounded-lg border border-zinc-200 bg-white overflow-hidden mb-4 text-sm">
                  {(["my", "all"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setSearchMode(mode); setPage(1); }}
                      className={cn(
                        "flex-1 px-3 py-1.5 capitalize transition-colors",
                        searchMode === mode
                          ? "bg-zinc-900 text-white font-medium"
                          : "text-zinc-600 hover:bg-zinc-100"
                      )}
                    >
                      {mode === "my" ? "Mine" : "All"}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Category label */}
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
              Category
            </p>

            {/* All */}
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
              <span className={cn("text-[11px] tabular-nums", categoryFilter === "all" ? "text-zinc-300" : "text-zinc-400")}>
                {totalCount}
              </span>
            </button>

            {categories.map((c: any) => {
              const id = String(c.category_seq ?? c.id);
              const active = categoryFilter === id;
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
              {searchKey && <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>}
              {isLoading ? "Loading..." : `${instances.length} of ${totalCount}`}
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
                <Skeleton key={i} className="h-14 rounded-none border-b border-zinc-100 last:border-b-0" />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left">
                    <th className="px-4 py-3 w-36 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Instance</th>
                    <th className="px-4 py-3 w-28 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Verification</th>
                    {showUser && (
                      <th className="px-4 py-3 w-44 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">User</th>
                    )}
                    {canCreate && (
                      <th className="px-4 py-3 w-44 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {instances.map((instance: any) => {
                    const hasPermission =
                      user &&
                      (user.user_group_seq === UserRole.Manager ||
                        String(user.user_seq) === String(instance.create_user_seq));

                    return (
                      <tr
                        key={instance.instance_seq}
                        className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-zinc-500 align-middle">{instance.category_name}</td>
                        <td className="px-4 py-3 align-middle">
                          <Link
                            href={ROUTES.INSTANCE.VIEW(instance.instance_seq)}
                            className="block group"
                          >
                            <span className="block text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors truncate max-w-[320px]">
                              {instance.instance_name}
                            </span>
                            <span className="block text-xs text-zinc-400 truncate mt-0.5 max-w-[320px]">
                              {instance.description || "—"}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <VerificationBadge value={instance.verification} />
                        </td>
                        {showUser && (
                          <td className="px-4 py-3 align-middle text-zinc-500 hidden md:table-cell">
                            <span className="block max-w-[160px] truncate">{instance.user_id}</span>
                          </td>
                        )}
                        {canCreate && (
                          <td className="px-4 py-3 align-middle text-right">
                            {hasPermission && (
                              <div className="flex items-center justify-end gap-1.5">
                                <DropdownMenu>
                                  <DropdownMenuTrigger render={
                                    <Button variant="outline" size="sm">
                                      <Download className="size-3.5 mr-1.5" />
                                      내보내기
                                      <ChevronDown className="size-3 ml-1" />
                                    </Button>
                                  } />
                                  <DropdownMenuContent align="end">
                                    {(["json", "xml", "aasx"] as const).map((fmt) => (
                                      <DropdownMenuItem
                                        key={fmt}
                                        onClick={() => handleExport(instance, fmt)}
                                      >
                                        {fmt}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Link
                                  href={ROUTES.INSTANCE.EDIT(instance.instance_seq)}
                                  className={buttonVariants({ variant: "outline", size: "sm" })}
                                >
                                  <Pencil className="size-3.5 mr-1.5" />
                                  수정
                                </Link>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {instances.length === 0 && (
                    <tr>
                      <td colSpan={3 + (showUser ? 1 : 0) + (canCreate ? 1 : 0)} className="h-40">
                        <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
                          <Layers className="size-8 opacity-30" />
                          <p className="text-sm">No instances found.</p>
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
