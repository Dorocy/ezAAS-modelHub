// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, ChevronDown, ChevronRight, ExternalLink, Copy, Check } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────*/
interface CDEntry {
  idShort: string;
  id: string;
  description?: Array<{ language: string; text: string }> | string;
  category?: string;
  displayName?: Array<{ language: string; text: string }>;
  valuePath?: string;
}

interface ConceptDescriptionPanelProps {
  conceptDescriptionTreeData?: any[];   // [{ children: CDEntry[] }]
  editMode: boolean;
  onAdd?: () => void;
  onDelete?: (node: any) => void;
}

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────*/
function getDescription(cd: CDEntry): string {
  if (!cd.description) return "";
  if (typeof cd.description === "string") return cd.description;
  if (Array.isArray(cd.description)) {
    const en = cd.description.find((d) => d.language === "en");
    const ko = cd.description.find((d) => d.language === "ko");
    return (en || ko || cd.description[0])?.text ?? "";
  }
  return "";
}

function getDisplayName(cd: CDEntry): string {
  if (!cd.displayName) return cd.idShort ?? "—";
  if (Array.isArray(cd.displayName)) {
    const en = cd.displayName.find((d) => d.language === "en");
    const ko = cd.displayName.find((d) => d.language === "ko");
    return (en || ko || cd.displayName[0])?.text ?? cd.idShort;
  }
  return cd.idShort;
}

function extractCategories(cds: CDEntry[]): string[] {
  const cats = new Set<string>();
  cds.forEach((cd) => { if (cd.category) cats.add(cd.category); });
  return Array.from(cats).sort();
}

function isIri(id: string) {
  return id?.startsWith("http://") || id?.startsWith("https://") || id?.startsWith("urn:");
}

/* ─────────────────────────────────────────────────────────────────────────
   CopyButton
───────────────────────────────────────────────────────────────────────────*/
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-zinc-400 hover:text-zinc-600 transition-colors"
      title="ID 복사"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CDCard
───────────────────────────────────────────────────────────────────────────*/
function CDCard({ cd, editMode, onDelete }: { cd: CDEntry; editMode: boolean; onDelete?: (node: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const desc = getDescription(cd);
  const displayName = getDisplayName(cd);
  const isLong = desc.length > 120;
  const shortDesc = isLong && !expanded ? desc.slice(0, 120) + "…" : desc;

  return (
    <div className="group bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-300 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <BookOpen size={15} className="text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 truncate leading-tight" title={displayName}>
              {displayName}
            </p>
            {displayName !== cd.idShort && (
              <p className="text-[11px] text-zinc-400 font-mono truncate leading-tight mt-0.5">{cd.idShort}</p>
            )}
          </div>
        </div>
        {cd.category && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
            {cd.category}
          </span>
        )}
      </div>

      {/* Description */}
      {desc ? (
        <div>
          <p className="text-xs text-zinc-600 leading-relaxed">{shortDesc}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
            >
              {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {expanded ? "접기" : "더 보기"}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 italic">설명 없음</p>
      )}

      {/* SemanticID */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100">
        <span className="text-[10px] text-zinc-400 font-mono shrink-0">ID</span>
        <span className="text-[10px] font-mono text-zinc-500 truncate flex-1 min-w-0" title={cd.id}>
          {cd.id}
        </span>
        <CopyButton text={cd.id} />
        {isIri(cd.id) && (
          <a
            href={cd.id}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-blue-500 transition-colors shrink-0"
            title="링크 열기"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main: ConceptDescriptionPanel
───────────────────────────────────────────────────────────────────────────*/
export default function ConceptDescriptionPanel({
  conceptDescriptionTreeData,
  editMode,
  onAdd,
  onDelete,
}: ConceptDescriptionPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const allCDs: CDEntry[] = useMemo(() => {
    if (!Array.isArray(conceptDescriptionTreeData)) return [];
    return conceptDescriptionTreeData[0]?.children ?? [];
  }, [conceptDescriptionTreeData]);

  const categories = useMemo(() => extractCategories(allCDs), [allCDs]);

  const filtered = useMemo(() => {
    let list = allCDs;
    if (activeCategory !== "all") list = list.filter((cd) => cd.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (cd) =>
          (cd.idShort ?? "").toLowerCase().includes(q) ||
          (cd.id ?? "").toLowerCase().includes(q) ||
          getDescription(cd).toLowerCase().includes(q) ||
          getDisplayName(cd).toLowerCase().includes(q),
      );
    }
    return list;
  }, [allCDs, search, activeCategory]);

  if (allCDs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <BookOpen size={24} className="text-zinc-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-700">개념 설명이 없습니다</p>
          <p className="text-xs text-zinc-400 mt-1">AAS 메타데이터에 ConceptDescriptions가 포함되어 있지 않습니다.</p>
        </div>
        {editMode && onAdd && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus size={14} className="mr-1.5" />CD 추가
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0">
      {/* ── Left: category sidebar ── */}
      <aside className="w-[200px] shrink-0 border-r border-zinc-100 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">카테고리</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
              activeCategory === "all"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            <span>전체</span>
            <span className={cn(
              "text-[11px] font-mono",
              activeCategory === "all" ? "text-zinc-300" : "text-zinc-400",
            )}>
              {allCDs.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = allCDs.filter((cd) => cd.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
                  activeCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <span className="truncate">{cat}</span>
                <span className={cn(
                  "text-[11px] font-mono shrink-0",
                  activeCategory === cat ? "text-zinc-300" : "text-zinc-400",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        {editMode && onAdd && (
          <div className="p-3 border-t border-zinc-100 shrink-0">
            <Button size="sm" variant="outline" className="w-full" onClick={onAdd}>
              <Plus size={13} className="mr-1.5" />CD 추가
            </Button>
          </div>
        )}
      </aside>

      {/* ── Right: search + card grid ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID, 이름, 설명으로 검색..."
              className="pl-8 h-8 text-sm bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>
          {search && (
            <p className="text-[11px] text-zinc-400 mt-2">
              {filtered.length}개 결과 / 전체 {allCDs.length}개
            </p>
          )}
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
              <Search size={20} />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((cd) => (
                <CDCard key={cd.id ?? cd.idShort} cd={cd} editMode={editMode} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
