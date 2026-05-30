// @ts-nocheck
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, Layers, Box, List, Tag, FileText, Link2, ToggleLeft, Hash, Info } from "lucide-react";

/* ─────────────────────────────────────────────
   ConceptDescription 개념 정보 호버
   - parsingAAS 단계에서 각 노드에 idShort, description, semanticId,
     그리고 semanticId 와 매칭된 ConceptDescription 객체가 붙는다.
   - 엘리먼트에 마우스를 올리면 선호 이름/정의/설명/단위/데이터타입/식별자 등
     개념의 의미를 바로 볼 수 있도록 호버 카드로 표시한다.
───────────────────────────────────────────── */
type MlEntry = { language: string; text: string };

const normMultiLang = (v: any): MlEntry[] => {
  if (!v) return [];
  if (typeof v === "string") return v.trim() ? [{ language: "", text: v }] : [];
  if (Array.isArray(v)) return v.filter((x: any) => x && (x.text ?? "").toString().trim());
  return [];
};

const getCdSpecContent = (cd: any) => {
  const specs = cd?.embeddedDataSpecifications;
  if (!Array.isArray(specs) || specs.length === 0) return null;
  return specs[0]?.dataSpecificationContent ?? null;
};

const extractConceptInfo = (node: any) => {
  const cd = node?.ConceptDescription ?? null;
  const ds = getCdSpecContent(cd);
  const descEntries = normMultiLang(node?.description);
  const preferredName = ds ? normMultiLang(ds.preferredName) : [];
  const definition = ds ? normMultiLang(ds.definition) : [];
  const unit = ds?.unit ?? "";
  const dataType = ds?.dataType ?? node?.valueType ?? "";
  const semId = node?.semanticId?.keys?.[0]?.value ?? "";
  const hasInfo =
    descEntries.length > 0 ||
    preferredName.length > 0 ||
    definition.length > 0 ||
    !!unit ||
    !!cd ||
    !!semId;
  return { cd, ds, descEntries, preferredName, definition, unit, dataType, semId, hasInfo };
};

const MlBlock = ({ entries }: { entries: MlEntry[] }) => {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-1.5">
          {e.language && (
            <span className="text-[9px] font-mono bg-zinc-100 text-zinc-500 rounded px-1 py-px shrink-0 mt-px">
              {e.language}
            </span>
          )}
          <span className="text-xs text-zinc-700 leading-relaxed break-words">{e.text}</span>
        </div>
      ))}
    </div>
  );
};

const HoverLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[9px] font-bold uppercase tracking-wide text-zinc-400 mb-1">{children}</div>
);

// 개념 정보 호버 카드. 정보가 있을 때만 idShort 라벨을 감싸 표시한다.
function ConceptHover({
  node,
  children,
}: {
  node: any;
  children: React.ReactNode;
}) {
  const info = useMemo(() => extractConceptInfo(node), [node]);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: "top" | "bottom"; maxH: number }>({
    top: 0,
    left: 0,
    placement: "bottom",
    maxH: 300,
  });

  if (!info.hasInfo) return <>{children}</>;

  const { descEntries, preferredName, definition, unit, dataType, semId } = info;
  const meta = getMeta(node.modelType);

  const CARD_W = 320;
  const MARGIN = 8;

  const show = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 가로: 화면 밖으로 넘치지 않도록 보정
    let left = r.left;
    if (left + CARD_W > vw - MARGIN) left = vw - CARD_W - MARGIN;
    if (left < MARGIN) left = MARGIN;

    // 세로: 위/아래 가용 공간 중 넓은 쪽에 배치하고, 그 공간에 맞춰 최대 높이를 제한(필요시 카드 내부 스크롤)
    const spaceBelow = vh - r.bottom - MARGIN - 6;
    const spaceAbove = r.top - MARGIN - 6;
    const placement: "top" | "bottom" = spaceBelow >= spaceAbove ? "bottom" : "top";
    const maxH = Math.max(140, Math.floor(placement === "bottom" ? spaceBelow : spaceAbove));
    const top = placement === "bottom" ? r.bottom + 6 : r.top - 6;

    setPos({ top, left, placement, maxH });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span
      ref={anchorRef}
      className="inline-flex items-center gap-1 max-w-full align-middle"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span className="truncate decoration-dotted decoration-zinc-300 underline-offset-2 underline cursor-help">
        {children}
      </span>
      <Info className={cn("size-3 shrink-0 transition-colors", open ? "text-primary" : "text-zinc-300")} />
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: CARD_W,
              transform: pos.placement === "top" ? "translateY(-100%)" : undefined,
              zIndex: 9999,
            }}
            className="pointer-events-none"
          >
            <div className="flex flex-col rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden text-left" style={{ maxHeight: pos.maxH }}>
              {/* header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <span className="text-[9px] font-bold text-white bg-primary rounded px-1.5 py-0.5 shrink-0">
                  {meta.label}
                </span>
                <span className="font-semibold text-zinc-900 text-[13px] truncate">{node.idShort}</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-0">
                {preferredName.length > 0 && (
                  <div>
                    <HoverLabel>선호 이름 (Preferred Name)</HoverLabel>
                    <MlBlock entries={preferredName} />
                  </div>
                )}
                {definition.length > 0 && (
                  <div>
                    <HoverLabel>정의 (Definition)</HoverLabel>
                    <MlBlock entries={definition} />
                  </div>
                )}
                {descEntries.length > 0 && (
                  <div>
                    <HoverLabel>설명 (Description)</HoverLabel>
                    <MlBlock entries={descEntries} />
                  </div>
                )}
                {(unit || dataType) && (
                  <div className="flex gap-4 flex-wrap">
                    {dataType && (
                      <div>
                        <HoverLabel>데이터 타입</HoverLabel>
                        <span className="text-[11px] font-mono bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5">{dataType}</span>
                      </div>
                    )}
                    {unit && (
                      <div>
                        <HoverLabel>단위</HoverLabel>
                        <span className="text-xs font-semibold text-primary">{unit}</span>
                      </div>
                    )}
                  </div>
                )}
                {semId && (
                  <div>
                    <HoverLabel>Semantic ID</HoverLabel>
                    <span className="block text-[10px] font-mono text-zinc-500 break-all leading-snug">{semId}</span>
                  </div>
                )}
                {preferredName.length === 0 && definition.length === 0 && descEntries.length === 0 && !unit && (
                  <div className="text-[11px] text-zinc-400 italic">연결된 개념 설명 정보가 없습니다.</div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

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
      {/* col 1: name + icon */}
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-3.5 text-zinc-400 shrink-0" />
        <ConceptHover node={node}>
          <span className="text-zinc-700 font-medium truncate" title={node.idShort}>
            {node.idShort}
          </span>
        </ConceptHover>
        {typeLabel && (
          <span className="text-[10px] font-mono text-zinc-400 shrink-0 hidden sm:block">
            {typeLabel}
          </span>
        )}
      </div>

      {/* col 2: type label chip */}
      <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
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
          <ConceptHover node={node}>{node.idShort}</ConceptHover>
        </span>
        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
          {meta.label}
        </span>
        <span className="text-[10px] text-zinc-400 shrink-0 tabular-nums mr-1">
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
  collapseSignal = 0,
}: {
  node: any;
  index: number;
  showValues: boolean;
  collapseSignal?: number;
}) {
  const [open, setOpen] = useState(true);
  const children: any[] = Array.isArray(node.children) ? node.children : [];

  // Collapse this submodel node whenever the parent bumps the collapse signal
  // (e.g. right before running verification). Skip the initial mount.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setOpen(false);
  }, [collapseSignal]);

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
        <span className="w-5 h-5 rounded bg-zinc-200 text-zinc-600 text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
          {index + 1}
        </span>

        {/* name + id */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 truncate">
              <ConceptHover node={node}>{node.idShort}</ConceptHover>
            </span>
            {node.id && (
              <span className="text-[10px] font-mono text-zinc-400 truncate hidden md:block max-w-[220px]">
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
                "text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums border",
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
            <span className="text-[10px] text-zinc-400 tabular-nums">{total} fields</span>
          )}
          <span className="text-[10px] font-medium text-zinc-400 bg-zinc-200 px-1.5 py-0.5 rounded">SM</span>
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
  collapseSignal?: number;
}

export default function TemplateBlueprint({ treeData, showValues = false, collapseSignal = 0 }: TemplateBlueprintProps) {
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
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate max-w-[300px]">
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
            collapseSignal={collapseSignal}
          />
        ))
      )}
    </div>
  );
}
