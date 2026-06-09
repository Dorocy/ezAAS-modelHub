"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, LayoutGrid, AlignJustify } from "lucide-react";

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategorySidebarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  categories: CategoryOption[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  totalCount: number;
}

/** Left sidebar with search input and category list, shared by list pages. */
export function CategorySidebar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  categories,
  activeCategory,
  onCategoryChange,
  totalCount,
}: CategorySidebarProps) {
  return (
    <aside className="w-52 shrink-0">
      <div className="sticky top-6 space-y-1">
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-sm"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          />
        </div>

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1">
          Category
        </p>

        <Button
          variant={activeCategory === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => onCategoryChange("all")}
          className="w-full justify-between font-normal data-[active=true]:font-medium"
          data-active={activeCategory === "all"}
        >
          <span>All</span>
          <span
            className={cn(
              "text-xs tabular-nums",
              activeCategory === "all" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {totalCount}
          </span>
        </Button>

        {categories.map((c) => {
          const active = activeCategory === c.id;
          return (
            <Button
              key={c.id}
              variant={active ? "default" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange(c.id)}
              className="w-full justify-start font-normal data-[active=true]:font-medium"
              data-active={active}
            >
              <span className="truncate">{c.label}</span>
            </Button>
          );
        })}
      </div>
    </aside>
  );
}

interface ViewToggleProps {
  value: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}

/** Grid/list view switcher built on shadcn ToggleGroup. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(vals) => {
        const next = (vals as string[]).find((v) => v !== value);
        if (next === "grid" || next === "list") onChange(next);
      }}
      variant="outline"
      size="sm"
      className="shrink-0 bg-background"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="w-3.5 h-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <AlignJustify className="w-3.5 h-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  className?: string;
}

/** shadcn-based numbered pagination shared across list pages. */
export function ListPagination({ page, totalPages, onPageChange, className }: ListPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <Pagination className={className ?? "mt-8"}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page === 1}
            className={cn(page === 1 && "pointer-events-none opacity-40")}
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
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
                  onPageChange(p);
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
              if (page < totalPages) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
