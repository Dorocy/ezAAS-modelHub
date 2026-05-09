"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_INSTANCES, MOCK_CATEGORIES } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { Plus, Search, Download, Pencil, ChevronDown } from "lucide-react";

export default function InstancePage() {
  const { user } = useAuth();

  const [searchKey, setSearchKey] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchMode, setSearchMode] = useState<"my" | "all">("all");

  const filtered = useMemo(() => {
    return MOCK_INSTANCES.filter((m) => {
      const matchKey =
        !searchKey ||
        m.instance_name.toLowerCase().includes(searchKey.toLowerCase()) ||
        m.description.toLowerCase().includes(searchKey.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || m.category_name === categoryFilter;
      const matchMode =
        searchMode === "all" ||
        (user && String(m.create_user_seq) === String(user.user_seq));
      return matchKey && matchCategory && matchMode;
    });
  }, [searchKey, categoryFilter, searchMode, user]);

  const canCreate =
    user &&
    (user.user_group_seq === UserRole.User ||
      user.user_group_seq === UserRole.Manager);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">My AAS Instance</h1>
              <nav className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <span>/</span>
                <span>My AAS Instance</span>
              </nav>
            </div>
            {canCreate && (
              <Link href="/instance/ins" className={cn(buttonVariants({ size: "sm" }))}>
                <Plus data-icon="inline-start" />
                Create AAS
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <div className="mx-auto max-w-screen-2xl flex flex-wrap items-center gap-3">
          {/* My / All toggle (non-User roles) */}
          {user && user.user_group_seq !== UserRole.User && (
            <div className="flex rounded-md border border-border overflow-hidden text-sm">
              {(["my", "all"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    searchMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {mode === "my" ? "My Instances" : "All Instances"}
                </button>
              ))}
            </div>
          )}

          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val ?? "all")}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MOCK_CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.text}>{c.text}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="Please enter a search term"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} results found
        </p>

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
              {filtered.map((instance) => {
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
                        variant={
                          instance.verification === "success" ? "default" : "destructive"
                        }
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
                              <DropdownMenuTrigger>
                                <span
                                  className={cn(
                                    buttonVariants({ variant: "outline", size: "sm" }),
                                    "h-7 text-xs gap-1 cursor-pointer"
                                  )}
                                >
                                  <Download className="size-3" />
                                  Export
                                  <ChevronDown className="size-3" />
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {["json", "xml", "aasx"].map((fmt) => (
                                  <DropdownMenuItem key={fmt}>{fmt}</DropdownMenuItem>
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No instances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
