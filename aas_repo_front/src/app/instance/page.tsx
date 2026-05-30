"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getInstanceList, getCodeList, exportModel } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Plus, Search, Download, Pencil, ChevronDown, Layers } from "lucide-react";

const PAGE_SIZE = 20;

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

  // Only Managers may view instances created by other users.
  // Everyone else (Approvedor, User) is restricted to their own instances.
  const canViewAll = user?.user_group_seq === UserRole.Manager;
  // Whether the current view should be scoped to the signed-in user's instances.
  const showOnlyMine = !canViewAll || searchMode === "my";

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (showOnlyMine && user) searchParams.user_seq = String(user.user_seq);

  // When scoping to the current user we fetch a large page and filter/paginate
  // on the client, since the backend list endpoint does not honor user_seq.
  const requestPage = showOnlyMine ? 1 : page;
  const requestPageSize = showOnlyMine ? 1000 : PAGE_SIZE;

  const { data: instanceData, isLoading, error } = useSWR(
    isAuthenticated ? ["instance-list", requestPage, searchKey, categoryFilter, showOnlyMine] : null,
    () =>
      getInstanceList({
        category_seq: categoryFilter === "all" ? "all" : categoryFilter,
        pageNumber: requestPage,
        pageSize: requestPageSize,
        searchParams,
      })
  );

  // Backend returns DataTables shape: { recordsTotal, recordsFiltered, data: Instance[] }
  const rawInstances: any[] = Array.isArray(instanceData)
    ? instanceData
    : Array.isArray(instanceData?.data)
      ? instanceData.data
      : Array.isArray(instanceData?.list)
        ? instanceData.list
        : [];

  // Client-side visibility enforcement: non-managers (and managers in "my" mode)
  // only ever see instances they created.
  const scopedInstances = showOnlyMine && user
    ? rawInstances.filter(
        (i: any) => String(i.create_user_seq) === String(user.user_seq)
      )
    : rawInstances;

  const totalCount: number = showOnlyMine
    ? scopedInstances.length
    : (instanceData?.recordsFiltered ?? instanceData?.recordsTotal ?? rawInstances.length);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // For the scoped case we paginate the filtered list on the client.
  const instances: any[] = showOnlyMine
    ? scopedInstances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : scopedInstances;

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

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

  return (
    <div className="flex flex-col">
      <PageHeader
        title="My AAS Instance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "My AAS Instance" },
        ]}
        actions={
          canCreate ? (
            <Link href="/instance/ins" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="size-3.5" data-icon="inline-start" />
              Create AAS
            </Link>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="border-b border-border/60 bg-muted/30 px-6 py-2.5">
        <div className="mx-auto max-w-screen-2xl flex flex-wrap items-center gap-2.5">
          {canViewAll && (
            <ToggleGroup
              value={[searchMode]}
              onValueChange={(vals) => {
                const next = (vals as string[]).find((v) => v !== searchMode);
                if (next) { setSearchMode(next as "my" | "all"); setPage(1); }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="my">My Instances</ToggleGroupItem>
              <ToggleGroupItem value="all">All Instances</ToggleGroupItem>
            </ToggleGroup>
          )}

          <Select
            value={categoryFilter}
            onValueChange={(val) => { setCategoryFilter(val ?? "all"); setPage(1); }}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.category_seq ?? c.id} value={String(c.category_seq ?? c.id)}>
                  {c.category_name ?? c.text}
                </SelectItem>
              ))}
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
            <Button size="sm" className="h-8" onClick={handleSearch}>
              Search
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
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead>Instance Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference Template ID</TableHead>
                  <TableHead className="w-32">Verification</TableHead>
                  {user && user.user_group_seq <= UserRole.Approvedor && (
                    <TableHead className="w-24">User</TableHead>
                  )}
                  {canCreate && (
                    <TableHead className="w-44">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance: any) => {
                  const hasPermission =
                    user &&
                    (user.user_group_seq === UserRole.Manager ||
                      String(user.user_seq) === String(instance.create_user_seq));

                  return (
                    <TableRow key={instance.instance_seq}>
                      <TableCell className="text-sm">{instance.category_name}</TableCell>
                      <TableCell>
                        <Link
                          href={ROUTES.INSTANCE.VIEW(instance.instance_seq)}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {instance.instance_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {instance.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                        {instance.aasmodel_template_id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={instance.verification === "success" ? "default" : "destructive"}
                        >
                          {instance.verification}
                        </Badge>
                      </TableCell>
                      {user && user.user_group_seq <= UserRole.Approvedor && (
                        <TableCell className="text-sm">{instance.user_id}</TableCell>
                      )}
                      {canCreate && (
                        <TableCell>
                          {hasPermission && (
                            <div className="flex items-center gap-1.5">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
                                  <Download className="size-3" />
                                  Export
                                  <ChevronDown className="size-3" />
                                </DropdownMenuTrigger>
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
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "h-7 text-xs"
                                )}
                              >
                                <Pencil className="size-3" data-icon="inline-start" />
                                Edit
                              </Link>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {instances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Layers className="size-8 opacity-30" />
                        <p className="text-sm">No instances found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page === 1}
                  className={cn(page === 1 && "pointer-events-none opacity-40")}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage((p) => p - 1);
                  }}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = i + Math.max(1, Math.min(page - 3, totalPages - 6));
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={page === totalPages}
                  className={cn(page === totalPages && "pointer-events-none opacity-40")}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage((p) => p + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
