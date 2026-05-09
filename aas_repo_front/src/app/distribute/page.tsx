"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_DISTRIBUTED } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
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
import { cn } from "@/lib/utils";
import { Plus, Search, Pencil } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  temporary: "outline",
  deprecated: "destructive",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function DistributePage() {
  const [searchKey, setSearchKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return MOCK_DISTRIBUTED.filter((m) => {
      const matchKey =
        !searchKey ||
        m.target_name.toLowerCase().includes(searchKey.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      const matchType = typeFilter === "all" || m.ty === typeFilter;
      return matchKey && matchStatus && matchType;
    });
  }, [searchKey, statusFilter, typeFilter]);

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
            onValueChange={(val) => setStatusFilter(val ?? "all")}
          >
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Publish All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Publish All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val ?? "all")}
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
                <TableHead className="w-24">Model Type</TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead className="w-20">Version</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead>Template ID</TableHead>
                <TableHead className="w-28">Published Date</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((model) => (
                <TableRow key={`${model.target_seq}-${model.ty}`}>
                  <TableCell>
                    <Badge
                      variant={model.ty === "aasmodel" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {model.ty === "aasmodel" ? "AAS" : "Submodel"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.DISTRIBUTE.VIEW({
                        modelType: model.ty as "aasmodel" | "submodel",
                        targetSeq: model.target_seq,
                      })}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {model.target_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {model.target_version && `v${model.target_version}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[model.status] ?? "outline"}>
                      {model.status_nm}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                    {model.tmp_seman_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(model.create_date)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.DISTRIBUTE.EDIT({
                        modelType: model.ty as "aasmodel" | "submodel",
                        targetSeq: model.target_seq,
                      })}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 text-xs"
                      )}
                    >
                      <Pencil className="size-3" data-icon="inline-start" />
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No published templates found.
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
