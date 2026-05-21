// @ts-nocheck
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── Type colours ───────────────────────────────────────────────── */
const TYPE_COLOR: Record<string, { dot: string; badge: string; text: string }> = {
  Submodel:                    { dot: "#059669", badge: "bg-emerald-50 text-emerald-700 border-emerald-200",  text: "Submodel" },
  SubmodelElementCollection:   { dot: "#7c3aed", badge: "bg-violet-50  text-violet-700  border-violet-200",   text: "Collection" },
  SubmodelElementList:         { dot: "#4f46e5", badge: "bg-indigo-50  text-indigo-700  border-indigo-200",   text: "List" },
  Property:                    { dot: "#d97706", badge: "bg-amber-50   text-amber-700   border-amber-200",    text: "Property" },
  MultiLanguageProperty:       { dot: "#0891b2", badge: "bg-cyan-50    text-cyan-700    border-cyan-200",     text: "MLP" },
  File:                        { dot: "#0284c7", badge: "bg-sky-50     text-sky-700     border-sky-200",      text: "File" },
  Range:                       { dot: "#ea580c", badge: "bg-orange-50  text-orange-700  border-orange-200",   text: "Range" },
  ReferenceElement:            { dot: "#db2777", badge: "bg-pink-50    text-pink-700    border-pink-200",     text: "Ref" },
  Entity:                      { dot: "#dc2626", badge: "bg-red-50     text-red-700     border-red-200",      text: "Entity" },
  RelationshipElement:         { dot: "#64748b", badge: "bg-slate-50   text-slate-600   border-slate-200",    text: "Relation" },
};

const getColor = (t: string) =>
  TYPE_COLOR[t] ?? { dot: "#94a3b8", badge: "bg-slate-50 text-slate-500 border-slate-200", text: t };

/* ── valueType → human label ───────────────────────────────────── */
const VALUE_TYPE_LABEL: Record<string, string> = {
  string: "string", xs_string: "string",
  "xs:string": "string",
  int: "integer", "xs:int": "integer", integer: "integer",
  float: "float", "xs:float": "float",
  double: "double", "xs:double": "double",
  boolean: "boolean", "xs:boolean": "boolean",
  date: "date", "xs:date": "date",
  dateTime: "dateTime", "xs:dateTime": "dateTime",
  anyURI: "URI", "xs:anyURI": "URI",
};
const vt = (t?: string) => (t ? (VALUE_TYPE_LABEL[t] ?? t) : null);

/* ── Leaf row ───────────────────────────────────────────────────── */
function LeafRow({ node, depth, showValues }: { node: any; depth: number; showValues?: boolean }) {
  const c = getColor(node.modelType);
  const typeLabel = vt(node.valueType);

  const preview = (() => {
    if (node.modelType === "MultiLanguageProperty" && Array.isArray(node.originalValue)) {
      return node.originalValue.map((v: any) => `[${v.language}] ${v.text}`).join("  ·  ") || null;
    }
    if (node.modelType === "File" && typeof node.originalValue === "string") {
      return node.originalValue.split("/").pop() || null;
    }
    if (node.originalValue !== undefined && node.originalValue !== null && node.originalValue !== "") {
      return String(node.originalValue);
    }
    return null;
  })();

  const hasValue = Boolean(preview);

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group",
        showValues && hasValue && "bg-amber-50/40 hover:bg-amber-50/70",
      )}
      style={{ paddingLeft: `${depth * 20 + 12}px` }}
    >
      {/* connector dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60"
        style={{ background: c.dot }}
      />

      {/* name */}
      <span className="text-sm text-foreground flex-1 min-w-0 truncate font-medium" title={node.idShort}>
        {node.idShort}
      </span>

      {/* type badge */}
      <span
        className={cn(
          "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none",
          c.badge
        )}
      >
        {c.text}
      </span>

      {/* valueType chip */}
      {typeLabel && (
        <span className="shrink-0 text-[10px] text-muted-foreground/60 font-mono bg-muted/60 px-1.5 py-0.5 rounded hidden sm:block">
          {typeLabel}
        </span>
      )}

      {/* value or empty slot */}
      <div className="shrink-0 w-44 text-right">
        {hasValue ? (
          <span
            className={cn(
              "text-xs font-mono truncate block max-w-full",
              showValues
                ? "text-foreground font-semibold bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 rounded"
                : "text-foreground/70"
            )}
            title={preview!}
          >
            {preview}
          </span>
        ) : (
          showValues ? (
            /* 인스턴스 뷰에서 빈 값 — 미입력 상태 명확히 표시 */
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded border border-dashed border-border/50">
              미입력
            </span>
          ) : (
            /* 템플릿 미리보기 — 채워야 할 슬롯 */
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/40 italic">
              <span className="h-px w-10 bg-border inline-block" />
              empty
            </span>
          )
        )}
      </div>
    </div>
  );
}

/* ── Group (SMC / SML) ──────────────────────────────────────────── */
function GroupSection({ node, depth, showValues }: { node: any; depth: number; showValues?: boolean }) {
  const [open, setOpen] = useState(true);
  const c = getColor(node.modelType);
  const childCount = Array.isArray(node.children) ? node.children.length : 0;

  return (
    <div className="mt-1">
      {/* group header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 py-1.5 px-3 rounded-md hover:bg-muted/40 transition-colors text-left"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {/* collapse icon */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={cn("shrink-0 transition-transform text-muted-foreground/50", !open && "-rotate-90")}
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* left accent */}
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: c.dot }} />

        <span className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate" title={node.idShort}>
          {node.idShort}
        </span>

        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0", c.badge)}>
          {c.text}
        </span>
        <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">{childCount}개</span>
      </button>

      {/* children */}
      {open && childCount > 0 && (
        <div className="relative ml-6 border-l border-dashed border-border/60 mt-0.5">
          <BlueprintChildren nodes={node.children} depth={depth + 1} showValues={showValues} />
        </div>
      )}
    </div>
  );
}

/* ── Children dispatcher ─────────────────────────────────────────── */
function BlueprintChildren({ nodes, depth, showValues }: { nodes: any[]; depth: number; showValues?: boolean }) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  return (
    <>
      {nodes.map((child, i) => {
        const mt = child.modelType;
        if (mt === "SubmodelElementCollection" || mt === "SubmodelElementList" || mt === "Entity") {
          return <GroupSection key={child.value ?? i} node={child} depth={depth} showValues={showValues} />;
        }
        return <LeafRow key={child.value ?? i} node={child} depth={depth} showValues={showValues} />;
      })}
    </>
  );
}

/* ── Submodel card ───────────────────────────────────────────────── */
function SubmodelCard({ node, index, showValues }: { node: any; index: number; showValues?: boolean }) {
  const [open, setOpen] = useState(true);
  const childCount = Array.isArray(node.children) ? node.children.length : 0;

  // count leaf nodes (Properties)
  const countLeaves = (n: any): number => {
    if (!Array.isArray(n.children) || n.children.length === 0) return 1;
    return n.children.reduce((sum: number, c: any) => sum + countLeaves(c), 0);
  };
  const totalFields = node.children ? node.children.reduce((s: number, c: any) => s + countLeaves(c), 0) : 0;

  const c = getColor("Submodel");

  return (
    <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-sm">
      {/* submodel header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors text-left border-b border-border/60"
      >
        {/* index pill */}
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{node.idShort}</span>
            {node.id && (
              <span className="text-[10px] text-muted-foreground/50 font-mono truncate hidden md:block max-w-[240px]" title={node.id}>
                {node.id}
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{
              Array.isArray(node.description)
                ? node.description[0]?.text ?? ""
                : node.description
            }</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{totalFields} fields</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", c.badge)}>SM</span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={cn("transition-transform text-muted-foreground/40", !open && "-rotate-90")}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* submodel body */}
      {open && (
        <div className="py-1.5 px-1">
          {childCount > 0 ? (
            <BlueprintChildren nodes={node.children} depth={0} showValues={showValues} />
          ) : (
            <p className="text-xs text-muted-foreground/50 px-4 py-3 italic">No elements defined.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────── */
interface TemplateBlueprintProps {
  treeData: any[];     // result of parsingAAS()
  showValues?: boolean; // true = instance view (highlight filled values, mark empty)
}

export default function TemplateBlueprint({ treeData, showValues = false }: TemplateBlueprintProps) {
  if (!Array.isArray(treeData) || treeData.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-4 py-6 text-center">구조 데이터가 없습니다.</p>
    );
  }

  const root = treeData[0];

  // root가 AAS인 경우 children이 submodels, 아니면 root 자체를 단일 카드로
  const isAASRoot = root.modelType === "AssetAdministrationShell";
  const submodels: any[] = isAASRoot
    ? (Array.isArray(root.children) ? root.children : [])
    : treeData; // single submodel or list

  // Count filled values (for instance view stat)
  const countAll = (nodes: any[]): number =>
    nodes.reduce((s, n) => s + (Array.isArray(n.children) && n.children.length ? countAll(n.children) : 1), 0);
  const countFilled = (nodes: any[]): number =>
    nodes.reduce((s, n) => {
      if (Array.isArray(n.children) && n.children.length) return s + countFilled(n.children);
      const v = n.originalValue;
      return s + (v !== undefined && v !== null && v !== "" ? 1 : 0);
    }, 0);

  const totalFields = countAll(submodels);
  const filledFields = countFilled(submodels);
  const fillPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* AAS / summary strip */}
      {isAASRoot && (
        <div className={cn(
          "flex items-center justify-between rounded-lg px-4 py-2.5 border",
          showValues ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-100"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", showValues ? "bg-slate-600" : "bg-blue-600")}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="white" strokeWidth="1.5"/>
                <path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className={cn("text-xs font-semibold leading-none", showValues ? "text-slate-700" : "text-blue-800")}>
                {root.idShort}
              </p>
              {root.id && (
                <p className={cn("text-[10px] font-mono mt-0.5 truncate max-w-[340px]", showValues ? "text-slate-400" : "text-blue-500/80")}>
                  {root.id}
                </p>
              )}
            </div>
          </div>
          <div className={cn("flex items-center gap-3 text-xs shrink-0", showValues ? "text-slate-600" : "text-blue-600")}>
            <span><span className="font-bold">{submodels.length}</span> submodels</span>
            <span className={showValues ? "text-slate-300" : "text-blue-300"}>|</span>
            {showValues ? (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-600">{filledFields}</span>
                <span className="text-muted-foreground">/ {totalFields} filled</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  fillPct === 100 ? "bg-emerald-100 text-emerald-700" : fillPct > 50 ? "bg-amber-100 text-amber-700" : "bg-red-50 text-red-500"
                )}>{fillPct}%</span>
              </span>
            ) : (
              <span><span className="font-bold">{totalFields}</span> fields</span>
            )}
          </div>
        </div>
      )}

      {/* One card per Submodel */}
      {submodels.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8 italic">Submodel이 없습니다.</p>
      ) : (
        submodels.map((sm, i) => (
          <SubmodelCard key={sm.value ?? i} node={sm} index={i} showValues={showValues} />
        ))
      )}
    </div>
  );
}
