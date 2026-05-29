"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getInstanceList, getCodeList, exportModel } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Plus, Download, Pencil, ChevronDown, Boxes } from "lucide-react";
import {
  ResourceListShell,
  ResourceCard,
  ResourceRow,
  StatusBadge,
  type ViewType,
  type CategoryItem,
} from "@/components/feature/shared/ResourceListShell";

const PAGE_SIZE = 20;

export default function InstancePage() {
  const { user, isAuthenticated } = useAuth();

  const [inputValue, setInputValue]         = useState("");
  const [searchKey, setSearchKey]           = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchMode, setSearchMode]         = useState<"my" | "all">("all");
  const [view, setView]                     = useState<ViewType>("table");
  const [page, setPage]                     = useState(1);

  const { data: rawCategories = [] } = useSWR(
    isAuthenticated ? "categories-instance" : null,
    () => getCodeList("category")
  );

  const categories: CategoryItem[] = (rawCategories as any[]).map((c) => ({
    id: String(c.category_seq ?? c.id),
    label: c.category_name ?? c.text,
  }));

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (searchMode === "my" && user) searchParams.user_seq = String(user.user_seq);

  const { data: instanceData, isLoading, error } = useSWR(
    isAuthenticated ? ["instance-list", page, searchKey, activeCategory, searchMode] : null,
    () =>
      getInstanceList({
        // 백엔드는 전체 조회 시 "all"을 기대한다. "0"을 보내면 빈 목록이 반환된다.
        category_seq: activeCategory === "all" ? "all" : activeCategory,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchParams,
      })
  );

  // 응답 구조: { recordsTotal, recordsFiltered, data: [...instances] } (apiRequest가 .data 언래핑)
  const payload = instanceData?.data ?? instanceData;
  const instances: any[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : Array.isArray(instanceData)
        ? instanceData
        : [];
  const totalCount: number =
    instanceData?.recordsTotal ??
    instanceData?.recordsFiltered ??
    payload?.recordsTotal ??
    payload?.recordsFiltered ??
    instances.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleCategory = (val: string) => {
    setActiveCategory(val);
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
    (user.user_group_seq === UserRole.User || user.user_group_seq === UserRole.Manager);

  const canManageRow = (instance: any) =>
    user &&
    (user.user_group_seq === UserRole.Manager ||
      String(user.user_seq) === String(instance.create_user_seq));

  /* sidebar: My / All toggle (only for elevated roles) */
  const sidebarExtra =
    user && user.user_group_seq !== UserRole.User ? (
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 pb-1">
          Scope
        </p>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
          {(["my", "all"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setSearchMode(mode); setPage(1); }}
              className={cn(
                "flex-1 px-2 py-1.5 transition-colors",
                searchMode === mode
                  ? "bg-zinc-900 text-white font-medium"
                  : "bg-white text-zinc-500 hover:bg-zinc-100"
              )}
            >
              {mode === "my" ? "Mine" : "All"}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <ResourceListShell
      title="My AAS Instance"
      subtitle={isLoading ? "Loading..." : `${totalCount} instances`}
      headerAction={
        canCreate ? (
          <Link href={ROUTES.INSTANCE.CREATE} className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create AAS
          </Link>
        ) : undefined
      }
      searchValue={inputValue}
      onSearchChange={setInputValue}
      onSearchSubmit={handleSearch}
      searchPlaceholder="Search instances..."
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategory}
      totalCount={totalCount}
      sidebarExtra={sidebarExtra}
      view={view}
      views={["table", "grid", "list"]}
      onViewChange={setView}
      resultText={
        <>
          {searchKey && <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>}
          {isLoading ? "Loading..." : `${instances.length} of ${totalCount}`}
        </>
      }
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      isLoading={isLoading}
      isEmpty={!isLoading && instances.length === 0}
      error={error}
      errorText="Failed to load instances. Please check your connection and try again."
      emptyIcon={Boxes}
      emptyTitle="No instances found"
      emptyHint="Create one from an AAS template to get started"
    >
      {view === "table" ? (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Category</TableHead>
                <TableHead>Instance Name</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead className="w-28">Verification</TableHead>
                {user && user.user_group_seq <= UserRole.Approvedor && (
                  <TableHead className="w-24">User</TableHead>
                )}
                {canCreate && <TableHead className="w-44">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance: any) => (
                <TableRow key={instance.instance_seq}>
                  <TableCell className="text-sm">{instance.category_name}</TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.INSTANCE.VIEW(instance.instance_seq)}
                      className="font-medium text-zinc-900 hover:text-blue-600 hover:underline"
                    >
                      {instance.instance_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500 hidden lg:table-cell max-w-[260px] truncate">
                    {instance.description}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={instance.verification} label={instance.verification} />
                  </TableCell>
                  {user && user.user_group_seq <= UserRole.Approvedor && (
                    <TableCell className="text-sm">{instance.user_id}</TableCell>
                  )}
                  {canCreate && (
                    <TableCell>
                      {canManageRow(instance) && (
                        <div className="flex items-center gap-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="outline" size="sm">
                                <Download className="size-3.5 mr-1.5" />
                                Export
                                <ChevronDown className="size-3 ml-1" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end">
                              {(["json", "xml", "aasx"] as const).map((fmt) => (
                                <DropdownMenuItem key={fmt} onClick={() => handleExport(instance, fmt)}>
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
                            Edit
                          </Link>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance: any) => (
            <ResourceCard
              key={instance.instance_seq}
              href={ROUTES.INSTANCE.VIEW(instance.instance_seq)}
              icon={Boxes}
              title={instance.instance_name}
              description={instance.description}
              category={instance.category_name}
              status={instance.verification}
              statusLabel={instance.verification}
              metaId={instance.aasmodel_template_id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {instances.map((instance: any) => (
            <ResourceRow
              key={instance.instance_seq}
              href={ROUTES.INSTANCE.VIEW(instance.instance_seq)}
              icon={Boxes}
              title={instance.instance_name}
              description={instance.description}
              category={instance.category_name}
              status={instance.verification}
              statusLabel={instance.verification}
            />
          ))}
        </div>
      )}
    </ResourceListShell>
  );
}
