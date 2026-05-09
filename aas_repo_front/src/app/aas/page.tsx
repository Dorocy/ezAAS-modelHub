"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_AAS_TEMPLATES, MOCK_CATEGORIES } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Plus, Search } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  temporary: "outline",
  deprecated: "destructive",
};

export default function AASPage() {
  const { user } = useAuth();

  const [searchKey, setSearchKey] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [layoutType, setLayoutType] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    return MOCK_AAS_TEMPLATES.filter((m) => {
      const matchKey =
        !searchKey ||
        m.aasmodel_name.toLowerCase().includes(searchKey.toLowerCase()) ||
        m.description.toLowerCase().includes(searchKey.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || m.category_seq === categoryFilter;
      return matchKey && matchCategory;
    });
  }, [searchKey, categoryFilter]);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">AAS Template</h1>
              <nav className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Home</Link>
                <span>/</span>
                <span>AAS Template</span>
              </nav>
            </div>
            {user && user.user_group_seq <= UserRole.User && (
              <Link
                href={ROUTES.AASMODEL.CREATE}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <Plus data-icon="inline-start" />
                AAS Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <div className="mx-auto max-w-screen-2xl flex flex-wrap items-center gap-3">
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
                <SelectItem key={c.id} value={c.id}>{c.text}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="Keyword Search"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant={layoutType === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setLayoutType("grid")}
            >
              <LayoutGrid />
            </Button>
            <Button
              variant={layoutType === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setLayoutType("table")}
            >
              <List />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} results found
        </p>

        {layoutType === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((model) => (
              <Link key={model.aasmodel_seq} href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                        {model.aasmodel_name}
                      </CardTitle>
                      <Badge variant={STATUS_VARIANT[model.status] ?? "outline"} className="shrink-0 text-xs">
                        {model.status_nm}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p className="line-clamp-2">{model.description}</p>
                    <p className="font-medium text-foreground/70">{model.category_name}</p>
                    <p className="font-mono truncate">{model.aasmodel_template_id}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-36">Category</TableHead>
                  <TableHead>Template ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((model) => (
                  <TableRow key={model.aasmodel_seq}>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[model.status] ?? "outline"}>
                        {model.status_nm}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={ROUTES.AASMODEL.VIEW(model.aasmodel_seq)}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {model.aasmodel_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {model.description}
                    </TableCell>
                    <TableCell className="text-sm">{model.category_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {model.aasmodel_template_id}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No templates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
