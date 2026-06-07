"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getPublishedList } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Plus, Search, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function DistributePage() {
  const { isAuthenticated } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<"published" | "deprecated">("published");
  const [typeFilter, setTypeFilter] = useState<"all" | "aasmodel" | "submodel">("all");
  const [page, setPage] = useState(1);

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;

  const { data: publishedData, isLoading, error } = useSWR(
    isAuthenticated ? ["published-list", page, statusFilter, typeFilter, searchKey] : null,
    () =>
      getPublishedList({
        status: statusFilter,
        type: typeFilter,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchParams,
      })
  );

  // 응답 구조 방어: apiRequest가 result.data를 반환하므로 publishedData가
  // 배열이거나 { data: [...] } / { list: [...] } / { recordsTotal, data:[...] } 형태일 수 있다.
  const payload: any = publishedData?.data ?? publishedData;
  const rawModels: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.list)
        ? payload.list
        : [];

  // publish 목록 응답은 submodel_* / aas_* 필드를 사용하므로 공통 형태로 정규화한다.
  const models = rawModels.map((m: any) => {
    const isAas = m.aas_seq != null || m.aas_name != null;
    return {
      raw: m,
      type: (isAas ? "aasmodel" : "submodel") as "aasmodel" | "submodel",
      seq: m.submodel_seq ?? m.aas_seq ?? m.target_seq,
      name: m.submodel_name ?? m.aas_name ?? m.target_name ?? "(이름 없음)",
      version: m.version ?? m.target_version,
      templateId: m.submodel_id ?? m.aas_id ?? m.tmp_seman_id,
      semanticId: m.submodel_semantic_id ?? m.aas_semantic_id,
      categoryName: m.category_name,
    };
  });

  const totalCount: number =
    payload?.recordsTotal ?? payload?.recordsFiltered ?? publishedData?.totalCount ?? models.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Publish</h1>
              <nav className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <span>/</span>
                <span>Publish</span>
              </nav>
            </div>
            <Link href="/distribute/ins" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus data-icon="inline-start" />
              Register
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <div className="mx-auto max-w-screen-2xl flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter((val ?? "published") as "published" | "deprecated");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter((val ?? "all") as "all" | "aasmodel" | "submodel");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Model All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Model All</SelectItem>
              <SelectItem value="aasmodel">AAS</SelectItem>
              <SelectItem value="submodel">Submodel</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="Please enter a search term"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="size-3.5 mr-1.5" />검색
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${totalCount} results found`}
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-4">
            Failed to load data. Please check your connection or try again.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Model Type</TableHead>
                  <TableHead>Template Name</TableHead>
                  <TableHead className="w-28">Category</TableHead>
                  <TableHead className="w-20">Version</TableHead>
                  <TableHead>Template ID</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={`${model.type}-${model.seq}`}>
                    <TableCell>
                      <Badge
                        variant={model.type === "aasmodel" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {model.type === "aasmodel" ? "AAS" : "Submodel"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={ROUTES.DISTRIBUTE.VIEW({
                          modelType: model.type,
                          targetSeq: model.seq,
                        })}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {model.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {model.categoryName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {model.version ? `v${model.version}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[260px]">
                      {model.templateId ?? "—"}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No published templates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

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
            <span className="text-sm text-muted-foreground">
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
  );
}
