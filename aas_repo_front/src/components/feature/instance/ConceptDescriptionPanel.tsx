// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, BookOpen, ExternalLink, Copy, Check,
  Hash, Ruler, Tag, FileText, ChevronRight, X, Info,
  List, ArrowRight, Languages, Layers,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────*/
function mlText(arr: any, fallback = ""): string {
  if (!arr) return fallback;
  if (typeof arr === "string") return arr;
  if (Array.isArray(arr)) {
    const en = arr.find((d: any) => d.language === "en");
    const ko = arr.find((d: any) => d.language === "ko");
    return (en || ko || arr[0])?.text ?? fallback;
  }
  return fallback;
}

function mlAll(arr: any): Array<{ language: string; text: string }> {
  if (!Array.isArray(arr)) return [];
  return arr;
}

function getDataSpec(cd: any) {
  const specs = cd?.embeddedDataSpecifications;
  if (!Array.isArray(specs) || specs.length === 0) return null;
  return specs[0]?.dataSpecificationContent ?? null;
}

function isIri(id: string) {
  return id?.startsWith("http://") || id?.startsWith("https://") || id?.startsWith("urn:");
}

function extractCategories(cds: any[]): string[] {
  const cats = new Set<string>();
  cds.forEach((cd) => {
    if (cd.category) cats.add(cd.category);
    const ds = getDataSpec(cd);
    if (ds?.dataType) cats.add(ds.dataType);
  });
  return Array.from(cats).sort();
}

/* ─────────────────────────────────────────────────────────────────────────
   CopyButton
───────────────────────────────────────────────────────────────────────────*/
function CopyButton({ text, size = 12 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
      title="복사"
    >
      {copied
        ? <Check size={size} className="text-emerald-500" />
        : <Copy size={size} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DetailRow — 좌측 라벨 + 우측 값
───────────────────────────────────────────────────────────────────────────*/
function DetailRow({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-3.5 px-4 border-b border-zinc-100 last:border-b-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {label}
      </div>
      <div className="text-sm text-zinc-800 leading-relaxed min-w-0">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MultiLangBlock — 다국어 텍스트 렌더
───────────────────────────────────────────────────────────────────────────*/
function MultiLangBlock({ entries }: { entries: Array<{ language: string; text: string }> }) {
  if (entries.length === 0) return <span className="text-zinc-400 italic text-xs">—</span>;
  if (entries.length === 1) return <span className="leading-relaxed">{entries[0].text}</span>;
  return (
    <div className="flex flex-col gap-1.5">
      {entries.map((e) => (
        <div key={e.language} className="flex items-start gap-2">
          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{e.language}</span>
          <span className="text-sm text-zinc-800 leading-relaxed">{e.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CDDetailPanel — 선택된 CD의 모든 정보 표시
───────────────────────────────────────────────────────────────────────────*/
function CDDetailPanel({ cd, onClose }: { cd: any; onClose: () => void }) {
  const ds = getDataSpec(cd);
  const preferredName = mlAll(ds?.preferredName);
  const shortName = mlAll(ds?.shortName);
  const definition = mlAll(ds?.definition);
  const unit = ds?.unit ?? "";
  const unitId = ds?.unitId?.keys?.[0]?.value ?? "";
  const dataType = ds?.dataType ?? "";
  const levelType = ds?.levelType ?? null;
  const valueList = ds?.valueList?.valueReferencePairs ?? [];
  const isCaseOf = cd?.isCaseOf ?? [];

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 truncate">
              {preferredName.length > 0 ? mlText(preferredName) : cd.idShort}
            </h2>
          </div>
          {cd.category && (
            <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
              {cd.category}
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ID 섹션 */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-500 mb-3">식별자</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] text-zinc-400 shrink-0 w-14">ID</span>
              <span className="text-xs font-mono text-zinc-700 truncate flex-1 min-w-0" title={cd.id}>{cd.id}</span>
              <CopyButton text={cd.id} />
              {isIri(cd.id) && (
                <a href={cd.id} target="_blank" rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-blue-500 transition-colors shrink-0">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            {cd.idShort && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-zinc-400 shrink-0 w-14">idShort</span>
                <span className="text-xs font-mono text-zinc-700">{cd.idShort}</span>
              </div>
            )}
          </div>
        </div>

        {/* 이름/설명 섹션 */}
        {(preferredName.length > 0 || shortName.length > 0 || definition.length > 0 || cd.description) && (
          <div className="border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 px-5 pt-4 pb-1">개념 정보</p>
            <div>
              {preferredName.length > 0 && (
                <DetailRow icon={<Languages size={11} />} label="선호 이름">
                  <MultiLangBlock entries={preferredName} />
                </DetailRow>
              )}
              {shortName.length > 0 && (
                <DetailRow icon={<Tag size={11} />} label="약칭">
                  <MultiLangBlock entries={shortName} />
                </DetailRow>
              )}
              {definition.length > 0 && (
                <DetailRow icon={<FileText size={11} />} label="정의">
                  <MultiLangBlock entries={definition} />
                </DetailRow>
              )}
              {!definition.length && cd.description && (
                <DetailRow icon={<FileText size={11} />} label="설명">
                  <MultiLangBlock entries={mlAll(cd.description)} />
                </DetailRow>
              )}
            </div>
          </div>
        )}

        {/* 데이터 속성 섹션 */}
        {(unit || unitId || dataType || levelType) && (
          <div className="border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 px-5 pt-4 pb-1">데이터 속성</p>
            <div>
              {unit && (
                <DetailRow icon={<Ruler size={11} />} label="단위">
                  <span className="font-semibold text-zinc-900">{unit}</span>
                </DetailRow>
              )}
              {unitId && (
                <DetailRow icon={<Hash size={11} />} label="단위 ID">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-600 truncate">{unitId}</span>
                    <CopyButton text={unitId} size={11} />
                  </div>
                </DetailRow>
              )}
              {dataType && (
                <DetailRow icon={<Layers size={11} />} label="데이터 타입">
                  <span className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{dataType}</span>
                </DetailRow>
              )}
              {levelType && (
                <DetailRow icon={<Info size={11} />} label="레벨 타입">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(levelType)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <span key={k} className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {k}
                        </span>
                      ))}
                  </div>
                </DetailRow>
              )}
            </div>
          </div>
        )}

        {/* Value List */}
        {valueList.length > 0 && (
          <div className="border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 px-5 pt-4 pb-1">허용 값 목록</p>
            <div className="divide-y divide-zinc-100 px-5 pb-2">
              {valueList.map((vp: any, i: number) => (
                <div key={i} className="py-2 flex items-center gap-2">
                  <ArrowRight size={11} className="text-zinc-300 shrink-0" />
                  <span className="text-xs font-mono text-zinc-700 truncate">
                    {vp?.value ?? vp?.valueId?.keys?.[0]?.value ?? JSON.stringify(vp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* isCaseOf */}
        {isCaseOf.length > 0 && (
          <div className="border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 px-5 pt-4 pb-1">표준 참조</p>
            <div className="flex flex-col gap-1.5 px-5 pb-3">
              {isCaseOf.map((ref: any, i: number) => {
                const val = ref?.keys?.[0]?.value ?? "";
                return (
                  <div key={i} className="flex items-center gap-1.5 bg-zinc-50 rounded-lg px-3 py-2 min-w-0">
                    <ExternalLink size={11} className="text-zinc-400 shrink-0" />
                    <span className="text-xs font-mono text-zinc-600 truncate flex-1">{val}</span>
                    <CopyButton text={val} size={11} />
                    {isIri(val) && (
                      <a href={val} target="_blank" rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-blue-500 transition-colors shrink-0">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-6" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   CDListItem — 리스트 행 (왼쪽 패널)
───────────────────────────────────────────────────────────────────────────*/
function CDListItem({ cd, selected, onClick }: { cd: any; selected: boolean; onClick: () => void }) {
  const ds = getDataSpec(cd);
  const preferredName = mlText(ds?.preferredName);
  const definition = mlText(ds?.definition) || mlText(cd.description);
  const unit = ds?.unit;
  const dataType = ds?.dataType;
  const displayName = preferredName || cd.idShort || "—";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-zinc-100 last:border-b-0 transition-colors flex items-start gap-3 group",
        selected ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-zinc-50 border-l-2 border-l-transparent",
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
        selected ? "bg-blue-500" : "bg-zinc-100 group-hover:bg-zinc-200",
      )}>
        <BookOpen size={13} className={selected ? "text-white" : "text-zinc-500"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={cn("text-sm font-medium truncate leading-tight", selected ? "text-blue-700" : "text-zinc-800")}>
            {displayName}
          </p>
          {unit && (
            <span className="shrink-0 text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded leading-none">
              {unit}
            </span>
          )}
        </div>
        {definition && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{definition}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {dataType && (
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{dataType}</span>
          )}
          {cd.category && (
            <span className="text-[10px] text-zinc-400">{cd.category}</span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className={cn(
        "shrink-0 mt-1 transition-transform",
        selected ? "text-blue-400 translate-x-0.5" : "text-zinc-300",
      )} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main: ConceptDescriptionPanel
───────────────────────────────────────────────────────────────────────────*/
interface ConceptDescriptionPanelProps {
  conceptDescriptionTreeData?: any[];
  editMode: boolean;
  onAdd?: () => void;
  onDelete?: (node: any) => void;
}

export default function ConceptDescriptionPanel({
  conceptDescriptionTreeData,
  editMode,
  onAdd,
}: ConceptDescriptionPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allCDs: any[] = useMemo(() => {
    if (!Array.isArray(conceptDescriptionTreeData)) return [];
    return conceptDescriptionTreeData[0]?.children ?? [];
  }, [conceptDescriptionTreeData]);

  const categories = useMemo(() => extractCategories(allCDs), [allCDs]);

  const filtered = useMemo(() => {
    let list = allCDs;
    if (activeCategory !== "all") {
      list = list.filter((cd) => {
        const ds = getDataSpec(cd);
        return cd.category === activeCategory || ds?.dataType === activeCategory;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((cd) => {
        const ds = getDataSpec(cd);
        return (
          (cd.idShort ?? "").toLowerCase().includes(q) ||
          (cd.id ?? "").toLowerCase().includes(q) ||
          mlText(ds?.preferredName).toLowerCase().includes(q) ||
          mlText(ds?.definition).toLowerCase().includes(q) ||
          mlText(cd.description).toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [allCDs, search, activeCategory]);

  const selectedCD = useMemo(
    () => allCDs.find((cd) => cd.id === selectedId) ?? null,
    [allCDs, selectedId],
  );

  if (allCDs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
          <BookOpen size={24} className="text-zinc-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-700">개념 설명이 없습니다</p>
          <p className="text-xs text-zinc-400 mt-1">ConceptDescriptions가 포함되어 있지 않습니다.</p>
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
    <div className="flex h-full">
      {/* ── 1) Category sidebar ── */}
      <aside className="w-[180px] shrink-0 border-r border-zinc-100 flex flex-col overflow-y-auto bg-zinc-50/50">
        <div className="px-3 py-3 border-b border-zinc-100 shrink-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">카테고리</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
              activeCategory === "all" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            <span>전체</span>
            <span className={cn("text-[11px] font-mono", activeCategory === "all" ? "text-zinc-300" : "text-zinc-400")}>
              {allCDs.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = allCDs.filter((cd) => {
              const ds = getDataSpec(cd);
              return cd.category === cat || ds?.dataType === cat;
            }).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
                  activeCategory === cat ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <span className="truncate text-xs">{cat}</span>
                <span className={cn("text-[11px] font-mono shrink-0", activeCategory === cat ? "text-zinc-300" : "text-zinc-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        {editMode && onAdd && (
          <div className="p-2.5 border-t border-zinc-100 shrink-0">
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={onAdd}>
              <Plus size={12} className="mr-1" />CD 추가
            </Button>
          </div>
        )}
      </aside>

      {/* ── 2) List panel ── */}
      <div className={cn("flex flex-col border-r border-zinc-100 overflow-hidden transition-all", selectedCD ? "w-[320px] shrink-0" : "flex-1")}>
        {/* Search */}
        <div className="px-3 py-3 border-b border-zinc-100 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 정의, ID 검색..."
              className="pl-8 h-8 text-sm bg-white border-zinc-200"
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5">
            {filtered.length}개 / 전체 {allCDs.length}개
          </p>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-400">
              <List size={18} />
              <p className="text-xs">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filtered.map((cd) => (
              <CDListItem
                key={cd.id ?? cd.idShort}
                cd={cd}
                selected={selectedId === cd.id}
                onClick={() => setSelectedId(selectedId === cd.id ? null : cd.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 3) Detail panel ── */}
      {selectedCD && (
        <div className="flex-1 min-w-0 overflow-hidden">
          <CDDetailPanel cd={selectedCD} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
