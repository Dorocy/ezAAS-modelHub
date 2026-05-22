"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, AlertCircle, Eye, EyeOff, Plus, Trash2, Code2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────*/
interface SubmodelFormEditorProps {
  treeData: any[];                              // parsingAAS() 결과
  state: Record<string, any>;                   // treeDataRef.current[rootId]
  editMode: boolean;
  onValueChange: (path: string, value: any, file?: File) => void;
  onSave: () => void;
  onToggleAdvanced: () => void;
  showAdvanced: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────*/
const LEAF_TYPES = new Set([
  "Property", "MultiLanguageProperty", "File",
  "Range", "ReferenceElement", "RelationshipElement",
]);

const GROUP_TYPES = new Set([
  "SubmodelElementCollection", "SubmodelElementList", "Entity",
]);

function getDisplayLabel(idShort: string): string {
  // camelCase / PascalCase → 사람이 읽기 쉬운 이름
  return idShort
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
}

function resolveValue(node: any, state: Record<string, any>): any {
  if (!node.valuePath) return node.originalValue ?? "";
  const key = `${node.valuePath}.originalValue`;
  if (key in state) return state[key];
  return node.originalValue ?? "";
}

function countLeaves(node: any): number {
  if (!Array.isArray(node.children) || node.children.length === 0) return 1;
  return node.children.reduce((s: number, c: any) => s + countLeaves(c), 0);
}

function countFilledLeaves(node: any, state: Record<string, any>): number {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    const v = resolveValue(node, state);
    return v !== undefined && v !== null && v !== "" ? 1 : 0;
  }
  return node.children.reduce(
    (s: number, c: any) => s + countFilledLeaves(c, state),
    0
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FileFieldInput — separate component so useRef is always at the top level
───────────────────────────────────────────────────────────────────────────*/
function FileFieldInput({
  node, state, editMode, onValueChange, depth = 0,
}: {
  node: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; depth?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = getDisplayLabel(node.idShort);
  const stateKey = `${node.valuePath}.originalValue`;
  const val = stateKey in state ? state[stateKey] : (node.originalValue ?? "");
  const filled = val !== "" && val !== null && val !== undefined;

  return (
    <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
      <div className="flex items-center gap-2 pt-0.5">
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", filled ? "bg-blue-500" : "bg-zinc-300")} />
        <label className="text-sm text-zinc-700 font-medium truncate">{label}</label>
        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">File</span>
      </div>
      {editMode ? (
        <div className="flex gap-2 items-center">
          <Input
            value={val}
            onChange={(e) => onValueChange(stateKey, e.target.value)}
            placeholder="File path or URL..."
            className="h-8 text-sm flex-1"
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const path = `/files/${file.name}`;
              onValueChange(stateKey, path, file);
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="h-8 shrink-0">
            Browse
          </Button>
        </div>
      ) : (
        <span className={cn("text-sm py-1", filled ? "text-zinc-900 font-medium" : "text-zinc-400 italic")}>
          {filled ? val : "—"}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Field Input — renders one Property / MLP / File / Range row
───────────────────────────────────────────────────────────────────────────*/
function FieldInput({
  node,
  state,
  editMode,
  onValueChange,
  depth = 0,
}: {
  node: any;
  state: Record<string, any>;
  editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"];
  depth?: number;
}) {
  const label = getDisplayLabel(node.idShort);
  const valuePath = node.valuePath;

  /* ── Property ── */
  if (node.modelType === "Property") {
    const stateKey = `${valuePath}.originalValue`;
    const val = stateKey in state ? state[stateKey] : (node.originalValue ?? "");
    const filled = val !== "" && val !== null && val !== undefined;

    return (
      <div
        className={cn(
          "grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60 transition-colors",
          depth > 0 && "pl-6",
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pt-0.5">
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-px", filled ? "bg-blue-500" : "bg-zinc-300")} />
          <label className="text-sm text-zinc-700 font-medium truncate leading-tight" title={node.idShort}>
            {label}
          </label>
          {node.valueType && (
            <span className="shrink-0 text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">
              {node.valueType?.replace("xs:", "")}
            </span>
          )}
        </div>
        {editMode ? (
          <Input
            value={val}
            onChange={(e) => onValueChange(stateKey, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="h-8 text-sm"
          />
        ) : (
          <span className={cn("text-sm py-1", filled ? "text-zinc-900 font-medium" : "text-zinc-400 italic")}>
            {filled ? val : "—"}
          </span>
        )}
      </div>
    );
  }

  /* ── MultiLanguageProperty ── */
  if (node.modelType === "MultiLanguageProperty") {
    const stateKey = `${valuePath}.originalValue`;
    const raw = stateKey in state ? state[stateKey] : (node.originalValue ?? []);
    const mlp: { language: string; text: string }[] = Array.isArray(raw) ? raw : [];
    const filled = mlp.some((m) => m.text?.trim());

    const setMLP = (next: typeof mlp) => onValueChange(stateKey, next);

    return (
      <div className={cn("py-3 px-4 border-b border-zinc-100 last:border-b-0", depth > 0 && "pl-6")}>
        <div className="grid grid-cols-[240px_1fr] items-start gap-4">
          <div className="flex items-center gap-2 pt-0.5">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", filled ? "bg-blue-500" : "bg-zinc-300")} />
            <label className="text-sm text-zinc-700 font-medium truncate">{label}</label>
            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">MLP</span>
          </div>
          <div className="space-y-2">
            {mlp.length === 0 && !editMode && (
              <span className="text-sm text-zinc-400 italic py-1 inline-block">—</span>
            )}
            {mlp.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                {editMode ? (
                  <>
                    <Input
                      value={item.language}
                      onChange={(e) => { const n = [...mlp]; n[idx] = { ...n[idx], language: e.target.value }; setMLP(n); }}
                      placeholder="lang"
                      className="w-16 h-7 text-xs font-mono shrink-0"
                    />
                    <Input
                      value={item.text}
                      onChange={(e) => { const n = [...mlp]; n[idx] = { ...n[idx], text: e.target.value }; setMLP(n); }}
                      placeholder="Text value..."
                      className="flex-1 h-7 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setMLP(mlp.filter((_, i) => i !== idx))}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-zinc-800">
                    <span className="text-[11px] font-mono text-zinc-400 mr-2">[{item.language}]</span>
                    {item.text || <span className="italic text-zinc-400">—</span>}
                  </span>
                )}
              </div>
            ))}
            {editMode && (
              <button
                type="button"
                onClick={() => setMLP([...mlp, { language: "en", text: "" }])}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
              >
                <Plus size={12} /> Add language
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── File: delegated to a proper sub-component so useRef is at the top level ── */
  if (node.modelType === "File") {
    return (
      <FileFieldInput
        node={node}
        state={state}
        editMode={editMode}
        onValueChange={onValueChange}
        depth={depth}
      />
    );
  }

  /* ── Range ── */
  if (node.modelType === "Range") {
    const minKey = `${valuePath}.min`;
    const maxKey = `${valuePath}.max`;
    const minVal = minKey in state ? state[minKey] : (node.min ?? "");
    const maxVal = maxKey in state ? state[maxKey] : (node.max ?? "");
    const filled = minVal !== "" || maxVal !== "";

    return (
      <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
        <div className="flex items-center gap-2 pt-0.5">
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", filled ? "bg-blue-500" : "bg-zinc-300")} />
          <label className="text-sm text-zinc-700 font-medium truncate">{label}</label>
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">Range</span>
        </div>
        <div className="flex gap-2 items-center">
          {editMode ? (
            <>
              <Input value={minVal} onChange={(e) => onValueChange(minKey, e.target.value)} placeholder="Min" className="h-8 text-sm flex-1" />
              <span className="text-zinc-400 text-sm shrink-0">to</span>
              <Input value={maxVal} onChange={(e) => onValueChange(maxKey, e.target.value)} placeholder="Max" className="h-8 text-sm flex-1" />
            </>
          ) : (
            <span className={cn("text-sm py-1", filled ? "text-zinc-900" : "text-zinc-400 italic")}>
              {filled ? `${minVal} — ${maxVal}` : "—"}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── ReferenceElement / RelationshipElement (read-only preview) ── */
  const fallbackKey = `${valuePath}.originalValue`;
  const fallbackVal = fallbackKey in state ? state[fallbackKey] : (node.originalValue ?? "");
  const fallbackFilled = fallbackVal !== "" && fallbackVal !== null;

  return (
    <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
      <div className="flex items-center gap-2 pt-0.5">
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", fallbackFilled ? "bg-blue-500" : "bg-zinc-300")} />
        <label className="text-sm text-zinc-700 font-medium truncate">{label}</label>
        <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">{node.modelType}</span>
      </div>
      {editMode ? (
        <Input
          value={fallbackVal}
          onChange={(e) => onValueChange(fallbackKey, e.target.value)}
          placeholder="Value..."
          className="h-8 text-sm"
        />
      ) : (
        <span className={cn("text-sm py-1 font-mono break-all", fallbackFilled ? "text-zinc-700" : "text-zinc-400 italic")}>
          {fallbackFilled ? fallbackVal : "—"}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   GroupSection — renders a collapsible SMC / SML section
───────────────────────────────────────────────────────────────────────────*/
function GroupSection({
  node,
  state,
  editMode,
  onValueChange,
  depth = 0,
  defaultOpen = true,
}: {
  node: any;
  state: Record<string, any>;
  editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"];
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const children: any[] = Array.isArray(node.children) ? node.children : [];
  const total = children.reduce((s, c) => s + countLeaves(c), 0);
  const filled = children.reduce((s, c) => s + countFilledLeaves(c, state), 0);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className={cn("border-b border-zinc-100 last:border-b-0", depth > 0 && "border-l-2 border-l-zinc-100 ml-4")}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors text-left"
      >
        {open
          ? <ChevronDown size={13} className="text-zinc-400 shrink-0" />
          : <ChevronRight size={13} className="text-zinc-400 shrink-0" />
        }
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
          {node.modelType === "SubmodelElementCollection" ? "SMC" : node.modelType === "SubmodelElementList" ? "SML" : "GRP"}
        </span>
        <span className="text-sm font-semibold text-zinc-800 truncate flex-1">
          {getDisplayLabel(node.idShort)}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {total > 0 && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              pct === 100 ? "bg-emerald-100 text-emerald-700" :
              pct > 0 ? "bg-amber-100 text-amber-700" :
              "bg-zinc-100 text-zinc-500"
            )}>
              {filled}/{total}
            </span>
          )}
        </div>
      </button>

      {/* Children */}
      {open && children.length > 0 && (
        <div className={cn(depth > 0 ? "bg-white" : "bg-zinc-50/30")}>
          {children.map((child, i) => (
            <NodeRenderer
              key={child.valuePath ?? i}
              node={child}
              state={state}
              editMode={editMode}
              onValueChange={onValueChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NodeRenderer — dispatches to FieldInput or GroupSection
───────────────────────────────────────────────────────────────────────────*/
function NodeRenderer({
  node, state, editMode, onValueChange, depth = 0,
}: {
  node: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; depth?: number;
}) {
  if (LEAF_TYPES.has(node.modelType)) {
    return <FieldInput node={node} state={state} editMode={editMode} onValueChange={onValueChange} depth={depth} />;
  }
  if (GROUP_TYPES.has(node.modelType)) {
    return <GroupSection node={node} state={state} editMode={editMode} onValueChange={onValueChange} depth={depth} defaultOpen={depth < 2} />;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   SubmodelPanel — right content area for one Submodel
───────────────────────────────────────────────────────────────────────────*/
function SubmodelPanel({
  submodel, state, editMode, onValueChange, onSave,
}: {
  submodel: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; onSave: () => void;
}) {
  const children: any[] = Array.isArray(submodel.children) ? submodel.children : [];
  const total = children.reduce((s, c) => s + countLeaves(c), 0);
  const filled = children.reduce((s, c) => s + countFilledLeaves(c, state), 0);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  const description = useMemo(() => {
    const desc = submodel.description;
    if (!desc) return null;
    if (Array.isArray(desc)) {
      const en = desc.find((d: any) => d.language === "en") ?? desc[0];
      return en?.text || null;
    }
    return typeof desc === "string" ? desc : null;
  }, [submodel.description]);

  return (
    <div className="flex flex-col h-full">
      {/* Submodel header */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 leading-tight text-pretty">
              {getDisplayLabel(submodel.idShort)}
            </h2>
            {description && (
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed line-clamp-2">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Completion badge */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-zinc-200"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-semibold tabular-nums",
                pct === 100 ? "text-emerald-600" : pct > 0 ? "text-amber-600" : "text-zinc-400"
              )}>
                {pct}%
              </span>
            </div>
            {editMode && (
              <Button type="button" size="sm" onClick={onSave} className="h-8 text-xs">
                Save
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            {pct === 100
              ? <CheckCircle2 size={13} className="text-emerald-500" />
              : pct > 0
              ? <AlertCircle size={13} className="text-amber-500" />
              : <Circle size={13} className="text-zinc-300" />
            }
            {filled} of {total} fields filled
          </span>
          {submodel.id && (
            <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[300px]" title={submodel.id}>
              {submodel.id}
            </span>
          )}
        </div>
      </div>

      {/* Field rows */}
      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="grid grid-cols-[240px_1fr] gap-4 px-4 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Field</span>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Value</span>
        </div>

        {children.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            No elements defined in this submodel.
          </div>
        ) : (
          <div>
            {children.map((child, i) => (
              <NodeRenderer
                key={child.valuePath ?? i}
                node={child}
                state={state}
                editMode={editMode}
                onValueChange={onValueChange}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SubmodelFormEditor — main export
───────────────────────────────────────────────────────────────────────────*/
export default function SubmodelFormEditor({
  treeData,
  state,
  editMode,
  onValueChange,
  onSave,
  onToggleAdvanced,
  showAdvanced,
}: SubmodelFormEditorProps) {
  const root = treeData[0];
  const submodels: any[] = useMemo(() => {
    if (!root) return [];
    if (root.modelType === "AssetAdministrationShell") {
      return Array.isArray(root.children) ? root.children : [];
    }
    return treeData.filter((n) => n.modelType === "Submodel");
  }, [treeData, root]);

  const [activeIdx, setActiveIdx] = useState(0);
  const activeSubmodel = submodels[activeIdx];

  /* Completion per submodel */
  const completions = useMemo(() =>
    submodels.map((sm) => {
      const children = Array.isArray(sm.children) ? sm.children : [];
      const total = children.reduce((s: number, c: any) => s + countLeaves(c), 0);
      const filled = children.reduce((s: number, c: any) => s + countFilledLeaves(c, state), 0);
      return { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
    }),
    [submodels, state]
  );

  const totalAll = completions.reduce((s, c) => s + c.total, 0);
  const filledAll = completions.reduce((s, c) => s + c.filled, 0);
  const pctAll = totalAll > 0 ? Math.round((filledAll / totalAll) * 100) : 0;

  if (submodels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-400">
        No submodels found.
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white rounded-lg border border-zinc-200">
      {/* ── Left sidebar ── */}
      <div className="w-56 shrink-0 flex flex-col border-r border-zinc-200 bg-zinc-50">
        {/* AAS identity header */}
        <div className="px-4 py-3 border-b border-zinc-200">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Asset</div>
          <div className="text-sm font-semibold text-zinc-800 truncate leading-tight" title={root?.idShort}>
            {root?.idShort ?? "AAS"}
          </div>
          {/* Overall progress */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pctAll === 100 ? "bg-emerald-500" : pctAll > 0 ? "bg-amber-500" : "bg-zinc-300"
                )}
                style={{ width: `${pctAll}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 tabular-nums shrink-0">{pctAll}%</span>
          </div>
        </div>

        {/* Submodel nav list */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-1">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Submodels</span>
          </div>
          {submodels.map((sm, i) => {
            const { filled, total, pct } = completions[i];
            const isActive = i === activeIdx;

            return (
              <button
                key={sm.valuePath ?? i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "w-full text-left px-3 py-2 mx-0 rounded-md transition-colors flex items-start gap-2.5 group",
                  isActive
                    ? "bg-white shadow-sm border border-zinc-200 text-zinc-900"
                    : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                )}
              >
                {/* Completion dot */}
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0 mt-1.5",
                  pct === 100 ? "bg-emerald-500" :
                  pct > 0 ? "bg-amber-400" :
                  "bg-zinc-300"
                )} />

                <div className="flex-1 min-w-0">
                  <div className={cn("text-[13px] leading-snug font-medium truncate", isActive ? "text-zinc-900" : "text-zinc-600 group-hover:text-zinc-800")}>
                    {getDisplayLabel(sm.idShort)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {filled}/{total}
                    </span>
                    {pct === 100 && (
                      <CheckCircle2 size={10} className="text-emerald-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Advanced toggle */}
        <div className="shrink-0 px-3 py-2 border-t border-zinc-200">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors w-full py-1"
          >
            <Code2 size={12} />
            {showAdvanced ? "Hide advanced view" : "Advanced (Tree) view"}
          </button>
        </div>
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {activeSubmodel ? (
          <SubmodelPanel
            submodel={activeSubmodel}
            state={state}
            editMode={editMode}
            onValueChange={onValueChange}
            onSave={onSave}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">
            Select a submodel from the left.
          </div>
        )}
      </div>
    </div>
  );
}
