// @ts-nocheck
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Layers, Box, List, Tag, FileText, Link2, ToggleLeft, Hash, Info, Ruler } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─────────────────────────────────────────────
   Type icons & labels  (no per-type colors —
   everything uses zinc/slate, one blue accent)
───────────────────────────────────────────── */
const TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
  Submodel:                  { icon: Layers,      label: "Submodel" },
  SubmodelElementCollection: { icon: Box,         label: "Collection" },
  SubmodelElementList:       { icon: List,        label: "List" },
  Property:                  { icon: Tag,         label: "Property" },
  MultiLanguageProperty:     { icon: FileText,    label: "MLP" },
  File:                      { icon: FileText,    label: "File" },
  Range:                     { icon: Hash,        label: "Range" },
  ReferenceElement:          { icon: Link2,       label: "Ref" },
  Entity:                    { icon: Box,         label: "Entity" },
  RelationshipElement:       { icon: Link2,       label: "Relation" },
  Blob:                      { icon: FileText,    label: "Blob" },
  Operation:                 { icon: ToggleLeft,  label: "Operation" },
};
const getMeta = (t: string) => TYPE_META[t] ?? { icon: Tag, label: t };

/* valueType → short label */
const VT: Record<string, string> = {
  string: "str", xs_string: "str", "xs:string": "str",
  int: "int", "xs:int": "int", integer: "int",
  float: "float", "xs:float": "float",
  double: "double", "xs:double": "dbl",
  boolean: "bool", "xs:boolean": "bool",
  date: "date", "xs:date": "date",
  dateTime: "dt", "xs:dateTime": "dt",
  anyURI: "uri", "xs:anyURI": "uri",
};
const vt = (t?: string) => (t ? (VT[t] ?? t) : null);

/* extract display value from node */
function extractValue(node: any): string | null {
  if (node.modelType === "MultiLanguageProperty" && Array.isArray(node.originalValue)) {
    const v = node.originalValue.map((x: any) => `[${x.language}] ${x.text}`).join(" · ");
    return v || null;
  }
  if (node.modelType === "File" && typeof node.originalValue === "string") {
    return node.originalValue.split("/").pop() || node.originalValue || null;
  }
  const v = node.originalValue;
  if (v !== undefined && v !== null && v !== "") return String(v);
  return null;
}

/* ─────────────────────────────────────────────
   Semantic / ConceptDescription helpers
   - semanticId 와 (있다면) ConceptDescription 에서
     사람이 읽을 수 있는 개념 정보를 추출한다.
───────────────────────────────────────────── */
function mlText(arr: any): string {
  if (!arr) return "";
  if (typeof arr === "string") return arr;
  if (Array.isArray(arr)) {
    const en = arr.find((d: any) => d.language === "en");
    const ko = arr.find((d: any) => d.language === "ko");
    return (ko || en || arr[0])?.text ?? "";
  }
  return "";
}

function getSemanticIdValue(node: any): string {
  const keys = node?.semanticId?.keys;
  if (Array.isArray(keys) && keys.length > 0) return keys[0]?.value ?? "";
  return "";
}

/* ConceptDescription 의 dataSpecificationContent 추출 */
function getDataSpec(cd: any) {
  const specs = cd?.embeddedDataSpecifications;
  if (!Array.isArray(specs) || specs.length === 0) return null;
  return specs[0]?.dataSpecificationContent ?? null;
}

/* 노드에서 사람이 읽을 수 있는 개념 정보를 모은다. */
function getConceptInfo(node: any) {
  const semanticId = getSemanticIdValue(node);
  const cd = node?.ConceptDescription;
  const ds = getDataSpec(cd);

  const preferredName = mlText(ds?.preferredName);
  const definition = mlText(ds?.definition) || mlText(cd?.description);
  const unit = ds?.unit ?? "";
  const dataType = ds?.dataType ?? "";

  return {
    semanticId,
    // 사용자에게 보여줄 사람이 읽을 수 있는 이름 (없으면 빈 값)
    preferredName,
    definition,
    unit,
    dataType,
    hasInfo: Boolean(semanticId || preferredName || definition || unit),
  };
}

/* idShort 옆에 표시할 개념 정보 툴팁 */
function ConceptHint({ node }: { node: any }) {
  const info = getConceptInfo(node);
  if (!info.hasInfo) return null;

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              role="button"
              tabIndex={0}
              className="inline-flex text-zinc-300 hover:text-primary transition-colors shrink-0 cursor-help"
              aria-label="개념 정보 보기"
            >
              <Info className="size-3.5" />
            </span>
          }
        />
        <TooltipContent side="top" className="max-w-sm flex-col items-start gap-2 py-2.5 px-3 text-left">
          {info.preferredName && (
            <div className="font-semibold text-[13px] leading-snug">{info.preferredName}</div>
          )}
          {info.definition && (
            <div className="text-xs leading-relaxed opacity-90">{info.definition}</div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {info.unit && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-background/15 px-1.5 py-0.5 rounded">
                <Ruler className="size-3" />
                {info.unit}
              </span>
            )}
            {info.dataType && (
              <span className="text-xs font-mono bg-background/15 px-1.5 py-0.5 rounded">
                {info.dataType}
              </span>
            )}
          </div>
          {info.semanticId && (
            <div className="text-xs font-mono opacity-70 break-all border-t border-background/20 pt-1.5 mt-0.5 w-full">
              {info.semanticId}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─────────────────────────────────────────────
   Property row  — key : value table row
───────────────────────────────────────────── */
function PropertyRow({
  node,
  showValues,
  isLast,
}: {
  node: any;
  showValues: boolean;
  isLast: boolean;
}) {
  const meta = getMeta(node.modelType);
  const Icon = meta.icon;
  const typeLabel = vt(node.valueType);
  const value = showValues ? extractValue(node) : null;
  const hasValue = Boolean(value);
  const concept = getConceptInfo(node);

  return (
    <div
      className={cn(
        "grid items-center gap-3 px-4 py-2 text-sm",
        "grid-cols-[1fr_auto_minmax(160px,_40%)]",
        !isLast && "border-b border-zinc-100",
        showValues && hasValue && "hover:bg-zinc-50",
        !showValues && "hover:bg-zinc-50/60",
      )}
    >
      {/* col 1: name + icon (+ 개념 이름) */}
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-3.5 text-zinc-400 shrink-0" />
        <div className="min-w-0 flex flex-col">
          <span className="text-zinc-700 font-medium truncate leading-tight" title={node.idShort}>
            {node.idShort}
          </span>
          {concept.preferredName && concept.preferredName !== node.idShort && (
            <span
              className="text-xs text-zinc-400 truncate leading-tight"
              title={concept.preferredName}
            >
              {concept.preferredName}
            </span>
          )}
        </div>
        {typeLabel && (
          <span className="text-xs font-mono text-zinc-400 shrink-0 hidden sm:block">
            {typeLabel}
          </span>
        )}
        <ConceptHint node={node} />
      </div>

      {/* col 2: type label chip */}
      <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
        {meta.label}
      </span>

      {/* col 3: value */}
      <div className="text-right min-w-0">
        {showValues ? (
          hasValue ? (
            <span
              className="text-xs font-mono text-primary bg-primary/8 px-2 py-0.5 rounded truncate inline-block max-w-full"
              title={value!}
            >
              {value}
            </span>
          ) : (
            <span className="text-xs text-zinc-300 italic">—</span>
          )
        ) : (
          <span className="text-xs text-zinc-300">——</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Group block  (Collection / List / Entity)
───────────────────────────────────────────── */
function GroupBlock({
  node,
  depth,
  showValues,
}: {
  node: any;
  depth: number;
  showValues: boolean;
}) {
  const [open, setOpen] = useState(true);
  const meta = getMeta(node.modelType);
  const Icon = meta.icon;
  const children: any[] = Array.isArray(node.children) ? node.children : [];

  return (
    <div className={cn("mt-1", depth > 0 && "ml-4 border-l border-zinc-100 pl-3")}>
      {/* group header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-zinc-50 transition-colors group"
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-zinc-400 shrink-0 transition-transform duration-150",
            open && "rotate-90",
          )}
        />
        <Icon className="size-3.5 text-zinc-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 truncate flex-1 min-w-0">
          {node.idShort}
        </span>
        <ConceptHint node={node} />
        <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
          {meta.label}
        </span>
        <span className="text-xs text-zinc-400 shrink-0 tabular-nums mr-1">
          {children.length}
        </span>
      </button>

      {/* children */}
      {open && children.length > 0 && (
        <div className="mt-0.5">
          <NodeList nodes={children} depth={depth + 1} showValues={showValues} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Node list dispatcher
───────────────────────────────────────────── */
function NodeList({
  nodes,
  depth,
  showValues,
}: {
  nodes: any[];
  depth: number;
  showValues: boolean;
}) {
  if (!nodes.length) return null;

  // Split into groups and leaves at this level
  const groups = nodes.filter(
    (n) =>
      n.modelType === "SubmodelElementCollection" ||
      n.modelType === "SubmodelElementList" ||
      n.modelType === "Entity",
  );
  const leaves = nodes.filter(
    (n) =>
      n.modelType !== "SubmodelElementCollection" &&
      n.modelType !== "SubmodelElementList" &&
      n.modelType !== "Entity",
  );

  return (
    <div>
      {/* leaves as a compact table block */}
      {leaves.length > 0 && (
        <div
          className={cn(
            "rounded border border-zinc-100 overflow-hidden bg-white",
            depth > 0 && "ml-4",
            groups.length > 0 && "mb-2",
          )}
        >
          {leaves.map((leaf, i) => (
            <PropertyRow
              key={leaf.value ?? leaf.idShort ?? i}
              node={leaf}
              showValues={showValues}
              isLast={i === leaves.length - 1}
            />
          ))}
        </div>
      )}

      {/* groups */}
      {groups.map((g, i) => (
        <GroupBlock
          key={g.value ?? g.idShort ?? i}
          node={g}
          depth={depth}
          showValues={showValues}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Submodel section card
───────────────────────────────────────────── */
function SubmodelSection({
  node,
  index,
  showValues,
}: {
  node: any;
  index: number;
  showValues: boolean;
}) {
  const [open, setOpen] = useState(true);
  const children: any[] = Array.isArray(node.children) ? node.children : [];

  /* stats for instance mode */
  const countLeaves = (n: any): number =>
    !Array.isArray(n.children) || !n.children.length
      ? 1
      : n.children.reduce((s: number, c: any) => s + countLeaves(c), 0);
  const countFilled = (n: any): number => {
    if (!Array.isArray(n.children) || !n.children.length) {
      const v = n.originalValue;
      return v !== undefined && v !== null && v !== "" ? 1 : 0;
    }
    return n.children.reduce((s: number, c: any) => s + countFilled(c), 0);
  };

  const total = children.reduce((s, c) => s + countLeaves(c), 0);
  const filled = showValues ? children.reduce((s, c) => s + countFilled(c), 0) : 0;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-zinc-200 overflow-hidden bg-white shadow-xs">
      {/* header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 hover:bg-zinc-100/70 transition-colors text-left border-b border-zinc-200"
      >
        {/* index */}
        <span className="w-5 h-5 rounded bg-zinc-200 text-zinc-600 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
          {index + 1}
        </span>

        {/* name + id */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 truncate">{node.idShort}</span>
            {node.id && (
              <span className="text-xs font-mono text-zinc-400 truncate hidden md:block max-w-[220px]">
                {node.id}
              </span>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="flex items-center gap-2 shrink-0">
          {showValues ? (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums border",
                pct === 100
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : pct > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-zinc-100 text-zinc-500 border-zinc-200",
              )}
            >
              {filled}/{total}
            </span>
          ) : (
            <span className="text-xs text-zinc-400 tabular-nums">{total} fields</span>
          )}
          <span className="text-xs font-medium text-zinc-400 bg-zinc-200 px-1.5 py-0.5 rounded">SM</span>
          <ChevronRight
            className={cn(
              "size-3.5 text-zinc-400 transition-transform duration-150",
              open && "rotate-90",
            )}
          />
        </div>
      </button>

      {/* body */}
      {open && (
        <div className="px-3 py-3">
          {children.length > 0 ? (
            <NodeList nodes={children} depth={0} showValues={showValues} />
          ) : (
            <p className="text-xs text-zinc-400 px-2 py-4 text-center italic">No elements defined.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */
interface TemplateBlueprintProps {
  treeData: any[];
  showValues?: boolean;
}

export default function TemplateBlueprint({ treeData, showValues = false }: TemplateBlueprintProps) {
  if (!Array.isArray(treeData) || treeData.length === 0) {
    return (
      <p className="text-xs text-zinc-400 px-4 py-6 text-center">구조 데이터가 없습니다.</p>
    );
  }

  const root = treeData[0];
  const isAASRoot = root.modelType === "AssetAdministrationShell";
  const submodels: any[] = isAASRoot
    ? (Array.isArray(root.children) ? root.children : [])
    : treeData;

  /* global stats */
  const countAll = (nodes: any[]): number =>
    nodes.reduce(
      (s, n) =>
        s + (Array.isArray(n.children) && n.children.length ? countAll(n.children) : 1),
      0,
    );
  const countFilled = (nodes: any[]): number =>
    nodes.reduce((s, n) => {
      if (Array.isArray(n.children) && n.children.length) return s + countFilled(n.children);
      const v = n.originalValue;
      return s + (v !== undefined && v !== null && v !== "" ? 1 : 0);
    }, 0);

  const totalFields = countAll(submodels);
  const filledFields = showValues ? countFilled(submodels) : 0;
  const fillPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* AAS summary bar */}
      {isAASRoot && (
        <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
              <Layers className="size-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-800 leading-none truncate">
                {root.idShort}
              </p>
              {root.id && (
                <p className="text-xs font-mono text-zinc-400 mt-0.5 truncate max-w-[300px]">
                  {root.id}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
            <span>
              <span className="font-semibold text-zinc-700">{submodels.length}</span> submodels
            </span>
            <span className="text-zinc-300">|</span>
            {showValues ? (
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full border",
                    fillPct === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : fillPct > 0
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200",
                  )}
                >
                  {filledFields}/{totalFields} filled
                </span>
              </span>
            ) : (
              <span>
                <span className="font-semibold text-zinc-700">{totalFields}</span> fields
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submodel sections */}
      {submodels.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-8">Submodel이 없습니다.</p>
      ) : (
        submodels.map((sm, i) => (
          <SubmodelSection
            key={sm.value ?? sm.idShort ?? i}
            node={sm}
            index={i}
            showValues={showValues}
          />
        ))
      )}
    </div>
  );
}
