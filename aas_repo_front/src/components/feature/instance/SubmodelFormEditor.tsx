"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, AlertCircle, Plus, Trash2, Code2,
  Settings2, Tag, FileText, Hash, Languages, Ruler, Link2, Boxes, ArrowRight,
  BookText, Check,
} from "lucide-react";

/* Property/Range 등에서 선택 가능한 XSD value types */
const VALUE_TYPES = [
  "xs:string", "xs:boolean", "xs:integer", "xs:int", "xs:long",
  "xs:double", "xs:float", "xs:decimal", "xs:date", "xs:dateTime",
  "xs:time", "xs:anyURI",
];

/* 각 modelType 별 아이콘 (드로어 헤더 표시용) */
const TYPE_ICON: Record<string, React.ReactNode> = {
  Property: <Hash size={14} />,
  MultiLanguageProperty: <Languages size={14} />,
  Range: <Ruler size={14} />,
  File: <FileText size={14} />,
  ReferenceElement: <Link2 size={14} />,
  RelationshipElement: <Link2 size={14} />,
  SubmodelElementCollection: <Boxes size={14} />,
  SubmodelElementList: <Boxes size={14} />,
  Entity: <Boxes size={14} />,
};

/* 추가 가능한 SubmodelElement 타입 목록 */
const ELEMENT_TYPES = [
  "Property",
  "MultiLanguageProperty",
  "Range",
  "File",
  "ReferenceElement",
  "RelationshipElement",
  "SubmodelElementCollection",
  "SubmodelElementList",
  "Entity",
];

/* 각 타입에 대한 짧은 설명 — 사용자가 타입 특성을 이해하도록 돕는다 */
const ELEMENT_TYPE_HINTS: Record<string, string> = {
  Property: "단일 값 (텍스트/숫자/날짜 등)",
  MultiLanguageProperty: "언어별 다국어 텍스트 값",
  Range: "최소/최대 범위 값",
  File: "파일 경로 또는 업로드",
  ReferenceElement: "다른 요소에 대한 참조",
  RelationshipElement: "두 요소 간의 관계",
  SubmodelElementCollection: "하위 요소들을 담는 그룹",
  SubmodelElementList: "동일 타입 요소들의 목록",
  Entity: "자산 엔티티 (statements 포함)",
};

/* 엘리먼트 추가 시 함께 연결할 개념(ConceptDescription) 정보
   · mode "new"     → 새 개념을 정의하고 semanticId 로 연결 (id/preferredName/definition)
   · mode "existing"→ 기존 개념의 id 로 semanticId 만 연결
   · mode "none"    → 개념 연결 없음 (semanticId 비움) */
type ConceptLink =
  | { mode: "new"; id: string; preferredName: string; definition: string }
  | { mode: "existing"; id: string }
  | { mode: "none" };

type AddElementHandler = (
  parentNode: any,
  elementType: string,
  idShort: string,
  concept?: ConceptLink,
) => void;
type DeleteElementHandler = (node: any) => void;

/* AddElementDialog 에서 기존 개념 검색용으로 사용할 CD 목록 컨텍스트 */
const ConceptListContext = React.createContext<any[]>([]);

/* 새 엘리먼트 추가 직후 상세 드로어를 열기 위한 컨텍스트 (prop drilling 회피) */
const DrawerRequestContext = React.createContext<
  ((parentNode: any, idShort: string) => void) | null
>(null);

/* 기존 엘리먼트를 선택해 상세 입력 드로어를 열기 위한 컨텍스트 */
const OpenDetailContext = React.createContext<((node: any) => void) | null>(null);

/* 인라인에서 Reference/Relationship 값을 바로 편집하기 위한 컨텍스트
   (treeData = ModelReference 후보 탐색용, onValueChange = 값 반영용) */
const InlineRefContext = React.createContext<{
  treeData: any[];
  onValueChange: SubmodelFormEditorProps["onValueChange"];
} | null>(null);

/* 상세 입력 드로어를 지원하는 엘리먼트 타입 (단순 value 입력 외 부가 정보가 있는 타입) */
const DETAIL_TYPES = new Set([
  "Property", "MultiLanguageProperty", "Range", "File",
  "ReferenceElement", "RelationshipElement", "AnnotatedRelationshipElement",
]);

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
  conceptDescriptions?: any[];                  // aasmodel_metadata.conceptDescriptions
  onAddSubmodel?: () => void;                   // "Submodel 추가" — 템플릿 선택 모달 오픈
  onAddElement?: AddElementHandler;             // 하위 엘리먼트 추가
  onDeleteElement?: DeleteElementHandler;       // 엘리먼트/서브모델 삭제
}

/* semanticId key[0].value → { idShort, description } 맵 */
type CDMap = Map<string, { idShort: string; description: string }>;

function buildCDMap(cds: any[]): CDMap {
  const map: CDMap = new Map();
  if (!Array.isArray(cds)) return map;
  cds.forEach((cd) => {
    if (!cd?.id) return;
    const desc = Array.isArray(cd.description)
      ? cd.description.find((d: any) => d.language === "en")?.text || cd.description[0]?.text || ""
      : typeof cd.description === "string" ? cd.description : "";
    map.set(cd.id, { idShort: cd.idShort ?? cd.id, description: desc });
  });
  return map;
}

function getSemanticKey(node: any): string | null {
  return node?.semanticId?.keys?.[0]?.value || null;
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

function getDisplayLabel(idShort: string | undefined | null): string {
  if (!idShort) return "—";
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

/* ─────�������───────────────────────────────────────────────────────────────────
   AddElementDialog — 타입 선택 + idShort 입력 후 onAdd 호출
─────────────────────────���─────────────────────────────────────────────────*/
function AddElementDialog({
  parentNode,
  parentLabel,
  onAdd,
  trigger,
  allowedTypes = ELEMENT_TYPES,
}: {
  parentNode: any;
  parentLabel: string;
  onAdd: AddElementHandler;
  trigger: React.ReactNode;
  allowedTypes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("Property");
  const [idShort, setIdShort] = useState("");
  // 개념 연결 상태
  const [conceptMode, setConceptMode] = useState<"new" | "existing">("new");
  const [definition, setDefinition] = useState("");
  const [customId, setCustomId] = useState("");      // 비우면 idShort 기반 자동 생성
  const [existingId, setExistingId] = useState("");   // 기존 개념 연결 시 선택된 CD id
  const [conceptSearch, setConceptSearch] = useState("");
  const requestDrawer = React.useContext(DrawerRequestContext);
  const conceptList = React.useContext(ConceptListContext);

  // 다이얼로그를 열 때마다 입력값 초기화
  useEffect(() => {
    if (open) {
      setType("Property");
      setIdShort("");
      setConceptMode("new");
      setDefinition("");
      setCustomId("");
      setExistingId("");
      setConceptSearch("");
    }
  }, [open]);

  const trimmedIdShort = idShort.trim();
  // idShort 기반 자동 생성 ID — 이 사이트에서 만드는 CD 는 항상 ezmodel-hub.re.kr 도메인 사용
  //   규칙: https://ezmodel-hub.re.kr/cd/{idShort}/{version}/{revision}
  const autoId = trimmedIdShort
    ? `https://ezmodel-hub.re.kr/cd/${encodeURIComponent(trimmedIdShort)}/1/0`
    : "";
  const effectiveNewId = customId.trim() || autoId;

  // 기존 개념 검색 결과
  const filteredConcepts = useMemo(() => {
    const q = conceptSearch.trim().toLowerCase();
    const list = Array.isArray(conceptList) ? conceptList : [];
    if (!q) return list.slice(0, 50);
    return list
      .filter((cd: any) =>
        (cd.idShort ?? "").toLowerCase().includes(q) ||
        (cd.id ?? "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [conceptList, conceptSearch]);

  // 추가 가능 여부: idShort 필수 + (새 개념이면 정의 필수 / 기존이면 선택 필수)
  const conceptValid =
    conceptMode === "new" ? definition.trim().length > 0 : existingId !== "";
  const canAdd = !!type && !!trimmedIdShort && conceptValid;

  const handleAdd = () => {
    if (!canAdd) return;
    const concept: ConceptLink =
      conceptMode === "new"
        ? { mode: "new", id: effectiveNewId, preferredName: trimmedIdShort, definition: definition.trim() }
        : { mode: "existing", id: existingId };
    onAdd(parentNode, type, trimmedIdShort, concept);
    setOpen(false);
    // 추가 직후 상세 입력 드로어 오픈 요청
    requestDrawer?.(parentNode, trimmedIdShort);
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {"하위 엘리먼트 추가"}
              <span className="block text-xs font-normal text-zinc-400 mt-1 truncate">
                {parentLabel}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">Element Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as string)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((t) => (
                    <SelectItem key={t} value={t} className="text-sm">
                      <span className="flex flex-col">
                        <span className="font-medium">{t}</span>
                        <span className="text-[11px] text-zinc-400">{ELEMENT_TYPE_HINTS[t]}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">idShort</Label>
              <Input
                value={idShort}
                onChange={(e) => setIdShort(e.target.value)}
                placeholder="예: ManufacturerId"
                className="h-9 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && conceptMode === "new") handleAdd(); }}
                autoFocus
              />
            </div>

            {/* ── 개념(ConceptDescription) 연결 ── */}
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
              <div className="flex items-center gap-1.5">
                <BookText size={13} className="text-zinc-500" />
                <Label className="text-xs font-semibold text-zinc-700">개념 정의 연결</Label>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                모든 엘리먼트는 개념사전과 연결됩니다. 도움말(?) 설명에 사용돼요.
              </p>

              {/* 모드 토글 */}
              <div className="inline-flex w-full gap-0.5 p-0.5 bg-zinc-200/70 rounded-md">
                {([["new", "새 개념 정의"], ["existing", "기존 개념 연결"]] as const).map(([m, lbl]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setConceptMode(m)}
                    className={cn(
                      "flex-1 text-[11px] font-medium py-1 rounded transition-colors",
                      conceptMode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {conceptMode === "new" ? (
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-zinc-500">
                      정의 (Definition) <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="이 개념이 무엇을 의미하는지 한 줄로 설명하세요."
                      className="text-sm min-h-[60px] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-zinc-500">ID (자동 생성)</Label>
                    <Input
                      value={customId || autoId}
                      onChange={(e) => setCustomId(e.target.value)}
                      placeholder="idShort 입력 시 자동 생성됩니다"
                      className="h-8 text-xs font-mono bg-white text-zinc-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <Input
                    value={conceptSearch}
                    onChange={(e) => setConceptSearch(e.target.value)}
                    placeholder="개념 이름 또는 ID 검색..."
                    className="h-8 text-sm bg-white"
                  />
                  <div className="max-h-44 overflow-y-auto rounded-md border border-zinc-200 bg-white divide-y divide-zinc-100">
                    {filteredConcepts.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-zinc-400">
                        연결할 개념이 없습니다.
                      </div>
                    ) : (
                      filteredConcepts.map((cd: any) => (
                        <button
                          key={cd.id}
                          type="button"
                          onClick={() => setExistingId(cd.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 transition-colors",
                            existingId === cd.id ? "bg-blue-50" : "hover:bg-zinc-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {existingId === cd.id && <Check size={12} className="text-blue-500 shrink-0" />}
                            <span className="text-sm font-medium text-zinc-700 truncate">{cd.idShort}</span>
                          </div>
                          <span className="block text-[10px] text-zinc-400 font-mono truncate mt-0.5">{cd.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!canAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* 작은 삭제 아이콘 버튼 (확인 prompt 포함) */
function DeleteIconButton({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <button
      type="button"
      title={`'${label}' 삭제`}
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm(`'${label}' 항목을 삭제하시겠습니까?`)) onDelete();
      }}
      className="text-zinc-300 hover:text-red-500 transition-colors p-1 shrink-0"
    >
      <Trash2 size={14} />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   DrawerField — 드로어 내부의 라벨 + 입력 한 줄 (개념사전 DetailRow 스타일 차용)
───────────────────────────────────────────────────────────────────────────*/
function DrawerField({
  icon, label, hint, children,
}: {
  icon?: React.ReactNode; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3.5 px-5 border-b border-zinc-100 last:border-b-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {label}
      </div>
      {children}
      {hint && <p className="text-[11px] text-zinc-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

/* 서브모델 하위의 모든 엘리먼트를 평탄화하여 ModelReference 후보 목록을 만든다.
   각 후보는 [Submodel, ...중첩엘리먼트] 형태의 AAS keys 배열을 가진다. */
function collectRefTargets(submodelNode: any): {
  keys: { type: string; value: string }[];
  labelPath: string;
  idShort: string;
  modelType: string;
}[] {
  const out: { keys: { type: string; value: string }[]; labelPath: string; idShort: string; modelType: string }[] = [];
  const submodelKey = { type: "Submodel", value: submodelNode.id };
  const walk = (node: any, ancestorKeys: any[], ancestorLabels: string[]) => {
    const children: any[] = Array.isArray(node.children) ? node.children : [];
    for (const child of children) {
      const key = { type: child.modelType, value: child.idShort };
      const keys = [...ancestorKeys, key];
      const labels = [...ancestorLabels, child.idShort];
      out.push({
        keys: [submodelKey, ...keys],
        labelPath: labels.join(" / "),
        idShort: child.idShort,
        modelType: child.modelType,
      });
      walk(child, keys, labels);
    }
  };
  walk(submodelNode, [], []);
  return out;
}

/* AAS 인스턴스 전체(모든 서브모델)의 엘리먼트를 평탄화한 ModelReference 후보 목록.
   사용자는 엘리먼트 하나만 고르면 되고, 소속 서브모델 경로는 자동으로 채워진다.
   sig 는 서브모델별로 idShort가 겹쳐도 구분되도록 submodelId 를 포함한다. */
function collectAllRefTargets(treeData: any[]): {
  sig: string;
  keys: { type: string; value: string }[];
  elementPath: string;
  submodelLabel: string;
  submodelId: string;
  idShort: string;
  modelType: string;
}[] {
  const submodels: any[] = Array.isArray(treeData?.[0]?.children) ? treeData[0].children : [];
  const out: ReturnType<typeof collectAllRefTargets> = [];
  for (const sm of submodels) {
    const submodelLabel = getDisplayLabel(sm.idShort);
    for (const t of collectRefTargets(sm)) {
      out.push({
        sig: `${sm.id}::${t.keys.slice(1).map((k) => k.value).join("/")}`,
        keys: t.keys,
        elementPath: t.labelPath,
        submodelLabel,
        submodelId: sm.id,
        idShort: t.idShort,
        modelType: t.modelType,
      });
    }
  }
  return out;
}
function summarizeReference(ref: any): { text: string; filled: boolean } {
  const keys: any[] = Array.isArray(ref?.keys) ? ref.keys : [];
  if (keys.length === 0 || !keys[keys.length - 1]?.value) {
    return { text: "참조 없음", filled: false };
  }
  if (ref?.type === "ExternalReference") {
    return { text: keys[keys.length - 1].value, filled: true };
  }
  // ModelReference: 서브모델 idShort는 알 수 없으니 마지막 엘리먼트 경로만 강조
  const elementPath = keys.slice(1).map((k) => k.value).join(" / ");
  return { text: elementPath || keys[0]?.value || "참조 없음", filled: true };
}

/* ─────────────────────────────────────────────────────────────────────────
   ReferencePicker ����� 단일 Reference 값을 선택/입력하는 재사용 컴포넌트
   · ModelReference : 현재 AAS 인스턴스 내부의 (서브모델 + 엘리먼트 idShort) 경로 선택
   · ExternalReference : 사용자가 외부 식별자(id)를 직접 입력
   value 는 { type, keys } 형태의 AAS Reference 객체, onChange 로 즉시 반영.
───────────────────────────────────────────────────────────────────────────*/
function ReferencePicker({
  value, treeData, onChange,
}: {
  value: any;
  treeData: any[];
  onChange: (ref: any) => void;
}) {
  const current = value ?? { type: "ModelReference", keys: [] };
  const refType: "ModelReference" | "ExternalReference" =
    current?.type === "ExternalReference" ? "ExternalReference" : "ModelReference";

  // 전체 인스턴스의 모든 엘리먼트를 후보로 (소속 서브모델은 자동 매핑)
  const targets = useMemo(() => collectAllRefTargets(treeData), [treeData]);

  // 현재 값에 해당하는 후보 sig 계산 (서브모델 id + 엘리먼트 경로로 매칭)
  const currentSig = useMemo(() => {
    const keys: any[] = current?.keys ?? [];
    if (refType !== "ModelReference" || keys.length === 0) return "";
    const submodelId = keys[0]?.type === "Submodel" ? keys[0].value : "";
    const path = keys.slice(1).map((k) => k.value).join("/");
    return submodelId ? `${submodelId}::${path}` : "";
  }, [current, refType]);

  const selected = targets.find((t) => t.sig === currentSig);
  const externalId =
    refType === "ExternalReference" ? (current?.keys?.[0]?.value ?? "") : "";

  const setRefType = (t: string | null) => {
    if (t === "ExternalReference") {
      onChange({ type: "ExternalReference", keys: [{ type: "GlobalReference", value: "" }] });
    } else {
      onChange({ type: "ModelReference", keys: [] });
    }
  };

  const handleElement = (sig: string | null) => {
    const target = targets.find((t) => t.sig === sig);
    if (target) onChange({ type: "ModelReference", keys: target.keys });
  };

  return (
    <div className="space-y-2">
      {/* Reference Type 토글 (콘텐츠 너비, 콤팩트) */}
      <div className="inline-flex gap-0.5 p-0.5 bg-zinc-100 rounded-md w-fit">
        {(["ModelReference", "ExternalReference"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setRefType(t)}
            className={cn(
              "text-[11px] font-medium px-2.5 py-1 rounded transition-colors",
              refType === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {t === "ModelReference" ? "내부 참조" : "외부 참조"}
          </button>
        ))}
      </div>

      {refType === "ModelReference" ? (
        <>
          {/* 엘리먼트 하나만 선택 → 서브모델 경로 자동 입력 */}
          <Select value={currentSig || undefined} onValueChange={handleElement} disabled={targets.length === 0}>
            <SelectTrigger className="h-9 text-sm">
              <span className="flex items-center gap-1.5 min-w-0">
                <Link2 size={13} className="text-zinc-400 shrink-0" />
                <SelectValue placeholder="참조할 엘리먼트 선택..." />
              </span>
            </SelectTrigger>
            <SelectContent>
              {treeData?.[0]?.children?.map((sm: any) => {
                const group = targets.filter((t) => t.submodelId === sm.id);
                if (group.length === 0) return null;
                return (
                  <SelectGroup key={sm.id}>
                    <SelectLabel className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                      <Boxes size={11} /> {getDisplayLabel(sm.idShort)}
                    </SelectLabel>
                    {group.map((t) => (
                      <SelectItem key={t.sig} value={t.sig} className="text-sm">
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[9px] font-mono shrink-0">{t.modelType}</Badge>
                          <span className="font-mono text-xs truncate max-w-[220px]">{t.elementPath}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>

          {selected && (
            <div className="flex items-start gap-1.5 text-[11px] text-zinc-500 bg-zinc-50 rounded-md px-2 py-1.5">
              <Boxes size={12} className="text-zinc-400 shrink-0 mt-0.5" />
              <span className="font-mono break-all leading-relaxed">
                <span className="text-zinc-400">{selected.submodelLabel} › </span>
                <span className="text-zinc-700">{selected.elementPath.replaceAll(" / ", " › ")}</span>
              </span>
            </div>
          )}
        </>
      ) : (
        <Input
          value={externalId}
          onChange={(e) =>
            onChange({
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: e.target.value }],
            })
          }
          placeholder="https://example.com/ids/..."
          className="h-9 text-sm font-mono"
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   InlineReferencePicker — Simple View 한 줄 입력용 (타입 토글 + 값 입력 동일 라인)
   · 내부 참조 : 엘리먼트 선택 → 트리거에는 idShort 만 표시 (상세 경로는 드로어에서)
   · 외부 참조 : 식별자 직접 입력
───────────────────────────────────────────────────────────────────────────*/
function InlineReferencePicker({
  value, treeData, onChange,
}: {
  value: any;
  treeData: any[];
  onChange: (ref: any) => void;
}) {
  const current = value ?? { type: "ModelReference", keys: [] };
  const refType: "ModelReference" | "ExternalReference" =
    current?.type === "ExternalReference" ? "ExternalReference" : "ModelReference";

  const targets = useMemo(() => collectAllRefTargets(treeData), [treeData]);

  const currentSig = useMemo(() => {
    const keys: any[] = current?.keys ?? [];
    if (refType !== "ModelReference" || keys.length === 0) return "";
    const submodelId = keys[0]?.type === "Submodel" ? keys[0].value : "";
    const path = keys.slice(1).map((k) => k.value).join("/");
    return submodelId ? `${submodelId}::${path}` : "";
  }, [current, refType]);

  const externalId =
    refType === "ExternalReference" ? (current?.keys?.[0]?.value ?? "") : "";

  const selectedTarget = targets.find((t) => t.sig === currentSig);

  const setRefType = (t: "ModelReference" | "ExternalReference") => {
    if (t === "ExternalReference") {
      onChange({ type: "ExternalReference", keys: [{ type: "GlobalReference", value: "" }] });
    } else {
      onChange({ type: "ModelReference", keys: [] });
    }
  };

  const handleElement = (sig: string | null) => {
    const target = targets.find((t) => t.sig === sig);
    if (target) onChange({ type: "ModelReference", keys: target.keys });
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* 타입 토글 (콤팩트) */}
      <div className="inline-flex gap-0.5 p-0.5 bg-zinc-100 rounded-md shrink-0">
        {(["ModelReference", "ExternalReference"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setRefType(t)}
            className={cn(
              "text-[11px] font-medium px-2 py-1 rounded transition-colors",
              refType === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {t === "ModelReference" ? "내부" : "외부"}
          </button>
        ))}
      </div>

      {/* 값 입력 (같은 라인) */}
      {refType === "ModelReference" ? (
        <Select value={currentSig || undefined} onValueChange={handleElement} disabled={targets.length === 0}>
          <SelectTrigger className="h-8 text-sm flex-1 min-w-0">
            {selectedTarget ? (
              <span className="truncate">
                <span className="text-zinc-400">{selectedTarget.submodelLabel} › </span>
                <span className="text-zinc-700">{getDisplayLabel(selectedTarget.idShort)}</span>
              </span>
            ) : (
              <SelectValue placeholder="엘리먼트 선택..." />
            )}
          </SelectTrigger>
          <SelectContent>
            {treeData?.[0]?.children?.map((sm: any) => {
              const group = targets.filter((t) => t.submodelId === sm.id);
              if (group.length === 0) return null;
              return (
                <SelectGroup key={sm.id}>
                  <SelectLabel className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                    <Boxes size={11} /> {getDisplayLabel(sm.idShort)}
                  </SelectLabel>
                  {group.map((t) => (
                    <SelectItem key={t.sig} value={t.sig} className="text-sm">
                      {getDisplayLabel(t.idShort)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={externalId}
          onChange={(e) =>
            onChange({ type: "ExternalReference", keys: [{ type: "GlobalReference", value: e.target.value }] })
          }
          placeholder="외부 식별자 (URI/IRI)..."
          className="h-8 text-sm font-mono flex-1 min-w-0"
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ReferenceElementEditor — ReferenceElement 전용 참조값 편집기
───────────────────────────────────────────────────────────────────────────*/
function ReferenceElementEditor({
  node, state, treeData, onValueChange,
}: {
  node: any;
  state: Record<string, any>;
  treeData: any[];
  onValueChange: SubmodelFormEditorProps["onValueChange"];
}) {
  const valueKey = `${node.valuePath}.value`;
  const current = (valueKey in state ? state[valueKey] : node.originalValue) ?? { type: "ModelReference", keys: [] };
  return (
    <DrawerField icon={<Link2 size={11} />} label="참조 대상" hint="내부 참조는 서브모델 id 기준으로 선택합니다 (idShort는 중복될 수 있음).">
      <ReferencePicker value={current} treeData={treeData} onChange={(ref) => onValueChange(valueKey, ref)} />
    </DrawerField>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RelationshipElementEditor — first / second 두 엘리먼트 간의 연계 입력
   각 값은 ReferenceElement 와 동일한 Reference 구조로 저장된다.
───────────────────────────────────────────────────────────────────────────*/
function RelationshipElementEditor({
  node, state, treeData, onValueChange,
}: {
  node: any;
  state: Record<string, any>;
  treeData: any[];
  onValueChange: SubmodelFormEditorProps["onValueChange"];
}) {
  const firstKey = `${node.valuePath}.first`;
  const secondKey = `${node.valuePath}.second`;
  // parsingAAS는 first/second를 node.Submodel(원본 객체)에만 보관하므로 거기서도 fallback
  const first = (firstKey in state ? state[firstKey] : (node.first ?? node.Submodel?.first)) ?? { type: "ModelReference", keys: [] };
  const second = (secondKey in state ? state[secondKey] : (node.second ?? node.Submodel?.second)) ?? { type: "ModelReference", keys: [] };

  const firstSummary = summarizeReference(first);
  const secondSummary = summarizeReference(second);

  return (
    <>
      {/* 관계 요약 시각화: First → Second */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex-1 min-w-0 rounded-lg border px-3 py-2",
            firstSummary.filled ? "border-blue-200 bg-blue-50" : "border-dashed border-zinc-200 bg-zinc-50"
          )}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-0.5">First</div>
            <div className={cn("text-xs font-mono truncate", firstSummary.filled ? "text-zinc-700" : "text-zinc-400 italic")}>
              {firstSummary.text}
            </div>
          </div>
          <ArrowRight size={16} className="text-zinc-400 shrink-0" />
          <div className={cn(
            "flex-1 min-w-0 rounded-lg border px-3 py-2",
            secondSummary.filled ? "border-emerald-200 bg-emerald-50" : "border-dashed border-zinc-200 bg-zinc-50"
          )}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-0.5">Second</div>
            <div className={cn("text-xs font-mono truncate", secondSummary.filled ? "text-zinc-700" : "text-zinc-400 italic")}>
              {secondSummary.text}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">
          {"First 엘리먼트에서 Second 엘리먼트로의 관계를 정의합니다."}
        </p>
      </div>

      <DrawerField icon={<span className="text-blue-500 font-bold text-[10px]">1st</span>} label="First (시작 엘리먼트)">
        <ReferencePicker value={first} treeData={treeData} onChange={(ref) => onValueChange(firstKey, ref)} />
      </DrawerField>

      <DrawerField icon={<span className="text-emerald-600 font-bold text-[10px]">2nd</span>} label="Second (대상 엘리먼트)">
        <ReferencePicker value={second} treeData={treeData} onChange={(ref) => onValueChange(secondKey, ref)} />
      </DrawerField>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ElementDetailDrawer — 새 엘리먼트(또는 선택한 엘리먼트) 상세 입력 드로어
   타입별로 입력 필드가 달라진다. 값은 onValueChange(path,value)로 즉시 반영.
───────────────────────────────────────────────────────────────────────────*/
function ElementDetailDrawer({
  node, state, treeData, open, onClose, onValueChange,
}: {
  node: any | null;
  state: Record<string, any>;
  treeData: any[];
  open: boolean;
  onClose: () => void;
  onValueChange: SubmodelFormEditorProps["onValueChange"];
}) {
  if (!node) return null;

  const valuePath = node.valuePath;
  const label = getDisplayLabel(node.idShort);
  const modelType = node.modelType;

  // 공통 헬퍼: state 우선, 없으면 노드 원본
  const read = (key: string, fallback: any) => (key in state ? state[key] : fallback);

  /* 타입별 본문 */
  let body: React.ReactNode = null;

  if (modelType === "Property") {
    const valueKey = `${valuePath}.originalValue`;
    const typeKey = `${valuePath}.valueType`;
    const val = read(valueKey, node.originalValue ?? "");
    const vType = read(typeKey, node.valueType ?? "xs:string");
    body = (
      <>
        <DrawerField icon={<Code2 size={11} />} label="Value Type">
          <Select value={vType} onValueChange={(v) => onValueChange(typeKey, v as string)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VALUE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-sm font-mono">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>
        <DrawerField icon={<Hash size={11} />} label="Value">
          <Input
            value={val}
            onChange={(e) => onValueChange(valueKey, e.target.value)}
            placeholder="값을 입력하세요..."
            className="h-9 text-sm"
          />
        </DrawerField>
      </>
    );
  } else if (modelType === "MultiLanguageProperty") {
    const valueKey = `${valuePath}.originalValue`;
    const raw = read(valueKey, node.originalValue ?? []);
    const mlp: { language: string; text: string }[] = Array.isArray(raw) ? raw : [];
    const setMLP = (next: typeof mlp) => onValueChange(valueKey, next);
    body = (
      <DrawerField icon={<Languages size={11} />} label="다국어 값" hint="언어 코드별로 텍스트를 입력합니다 (예: ko, en).">
        <div className="space-y-2">
          {mlp.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                value={item.language}
                onChange={(e) => { const n = [...mlp]; n[idx] = { ...n[idx], language: e.target.value }; setMLP(n); }}
                placeholder="lang" className="w-16 h-8 text-xs font-mono shrink-0"
              />
              <Input
                value={item.text}
                onChange={(e) => { const n = [...mlp]; n[idx] = { ...n[idx], text: e.target.value }; setMLP(n); }}
                placeholder="텍스트..." className="flex-1 h-8 text-sm"
              />
              <button type="button" onClick={() => setMLP(mlp.filter((_, i) => i !== idx))}
                className="text-zinc-400 hover:text-red-500 transition-colors p-1 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setMLP([...mlp, { language: "ko", text: "" }])}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
            <Plus size={12} /> 언어 추가
          </button>
        </div>
      </DrawerField>
    );
  } else if (modelType === "Range") {
    const minKey = `${valuePath}.min`;
    const maxKey = `${valuePath}.max`;
    const typeKey = `${valuePath}.valueType`;
    const minVal = read(minKey, node.min ?? "");
    const maxVal = read(maxKey, node.max ?? "");
    const vType = read(typeKey, node.valueType ?? "xs:integer");
    body = (
      <>
        <DrawerField icon={<Code2 size={11} />} label="Value Type">
          <Select value={vType} onValueChange={(v) => onValueChange(typeKey, v as string)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VALUE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-sm font-mono">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>
        <DrawerField icon={<Ruler size={11} />} label="범위 (Min / Max)">
          <div className="flex gap-2 items-center">
            <Input value={minVal} onChange={(e) => onValueChange(minKey, e.target.value)} placeholder="Min" className="h-9 text-sm flex-1" />
            <span className="text-zinc-400 text-sm shrink-0">~</span>
            <Input value={maxVal} onChange={(e) => onValueChange(maxKey, e.target.value)} placeholder="Max" className="h-9 text-sm flex-1" />
          </div>
        </DrawerField>
      </>
    );
  } else if (modelType === "File") {
    const valueKey = `${valuePath}.originalValue`;
    const ctKey = `${valuePath}.contentType`;
    const val = read(valueKey, node.originalValue ?? "");
    const ct = read(ctKey, node.contentType ?? "");
    body = (
      <>
        <DrawerField icon={<FileText size={11} />} label="파일 경로 / URL">
          <Input value={val} onChange={(e) => onValueChange(valueKey, e.target.value)} placeholder="/files/example.pdf" className="h-9 text-sm" />
        </DrawerField>
        <DrawerField icon={<Tag size={11} />} label="Content Type" hint="예: application/pdf, image/png">
          <Input value={ct} onChange={(e) => onValueChange(ctKey, e.target.value)} placeholder="application/octet-stream" className="h-9 text-sm font-mono" />
        </DrawerField>
      </>
    );
  } else if (modelType === "ReferenceElement") {
    body = (
      <ReferenceElementEditor
        node={node}
        state={state}
        treeData={treeData}
        onValueChange={onValueChange}
      />
    );
  } else if (modelType === "RelationshipElement" || modelType === "AnnotatedRelationshipElement") {
    body = (
      <RelationshipElementEditor
        node={node}
        state={state}
        treeData={treeData}
        onValueChange={onValueChange}
      />
    );
  } else {
    // RelationshipElement / 기타 — 단순 값 입력
    const valueKey = `${valuePath}.originalValue`;
    const val = read(valueKey, node.originalValue ?? "");
    body = (
      <DrawerField icon={<Link2 size={11} />} label="참조 값" hint={`${modelType} 의 참조 키 값을 입력합니다.`}>
        <Textarea
          value={typeof val === "string" ? val : JSON.stringify(val ?? "", null, 2)}
          onChange={(e) => onValueChange(valueKey, e.target.value)}
          placeholder="참조 값을 입력하세요..."
          className="text-sm font-mono min-h-[80px]"
        />
      </DrawerField>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              {TYPE_ICON[modelType] ?? <Settings2 size={14} />}
            </div>
            <SheetTitle className="text-base font-semibold text-zinc-900 truncate">{label}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">엘리먼트 상세 입력</SheetDescription>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] font-mono">{modelType}</Badge>
            <span className="text-[11px] text-zinc-400 font-mono truncate">{node.idShort}</span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">{body}</div>

        <SheetFooter className="px-5 py-4 border-t border-zinc-100">
          <Button type="button" className="w-full" onClick={onClose}>완료</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* 트리에서 valuePath로 노드를 찾는다 (드로어 타깃 동기화용) */
function findNodeByPath(nodes: any[], path: string): any | null {
  for (const n of nodes) {
    if (n?.valuePath === path) return n;
    if (Array.isArray(n?.children)) {
      const found = findNodeByPath(n.children, path);
      if (found) return found;
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────���────
   FieldLabelWithHint — label + CD 설명 tooltip
───────────────────────────────────────────────────────────────────────────*/
function FieldLabelWithHint({
  label, idShort, filled, typeLabel, cdHint, node,
}: {
  label: string;
  idShort: string;
  filled: boolean;
  typeLabel?: string;
  cdHint?: { idShort: string; description: string } | null;
  node?: any;
}) {
  const [open, setOpen] = useState(false);
  const openDetail = React.useContext(OpenDetailContext);
  const canDetail = !!openDetail && !!node && DETAIL_TYPES.has(node.modelType);

  return (
    <div className="flex items-center gap-2 min-w-0 pt-0.5">
      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-px", filled ? "bg-blue-500" : "bg-zinc-300")} />
      {canDetail ? (
        <button
          type="button"
          onClick={() => openDetail!(node)}
          className="text-sm text-zinc-700 font-medium truncate leading-tight text-left hover:text-blue-600 hover:underline decoration-dotted underline-offset-2 transition-colors"
          title={`${idShort} — 상세 입력 열기`}
        >
          {label}
        </button>
      ) : (
        <label className="text-sm text-zinc-700 font-medium truncate leading-tight" title={idShort}>
          {label}
        </label>
      )}
      {typeLabel && (
        <span className="shrink-0 text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded hidden lg:block">
          {typeLabel}
        </span>
      )}
      {cdHint && (
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="w-4 h-4 rounded-full border border-zinc-300 text-zinc-400 hover:border-blue-400 hover:text-blue-500 flex items-center justify-center text-[10px] font-bold transition-colors focus:outline-none"
            aria-label={`${cdHint.idShort} 설명 보기`}
          >
            ?
          </button>
          {open && (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-72 bg-white border border-zinc-200 rounded-lg shadow-lg p-3 pointer-events-none">
              {/* 화살표 */}
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-l border-b border-zinc-200 rotate-45" />
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                {cdHint.idShort}
              </p>
              {cdHint.description ? (
                <p className="text-xs text-zinc-700 leading-relaxed">{cdHint.description}</p>
              ) : (
                <p className="text-xs text-zinc-400 italic">설명 없음</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────���──────────────────────────────────────────────────────────
   FileFieldInput — separate component so useRef is always at the top level
───────────────────────────────────────────────────────────────────────────*/
function FileFieldInput({
  node, state, editMode, onValueChange, depth = 0, cdHint,
}: {
  node: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; depth?: number;
  cdHint?: { idShort: string; description: string } | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = getDisplayLabel(node.idShort);
  const stateKey = `${node.valuePath}.originalValue`;
  const val = stateKey in state ? state[stateKey] : (node.originalValue ?? "");
  const filled = val !== "" && val !== null && val !== undefined;

  return (
    <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
      <FieldLabelWithHint label={label} idShort={node.idShort} filled={filled} typeLabel="File" cdHint={cdHint} node={node} />
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
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="shrink-0">
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

/* ─────────────────────────────────────────────��───────────────────────────
   Field Input — renders one Property / MLP / File / Range row
───────────────────────────────────────────────────────────────────────────*/
function FieldInput({
  node,
  state,
  editMode,
  onValueChange,
  depth = 0,
  cdHint,
}: {
  node: any;
  state: Record<string, any>;
  editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"];
  depth?: number;
  cdHint?: { idShort: string; description: string } | null;
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
        <FieldLabelWithHint
          label={label} idShort={node.idShort} filled={filled}
          typeLabel={node.valueType?.replace("xs:", "")}
          cdHint={cdHint} node={node}
        />
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
          <FieldLabelWithHint label={label} idShort={node.idShort} filled={filled} typeLabel="MLP" cdHint={cdHint} node={node} />
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

  /* ── Range ── */
  if (node.modelType === "Range") {
    const minKey = `${valuePath}.min`;
    const maxKey = `${valuePath}.max`;
    const minVal = minKey in state ? state[minKey] : (node.min ?? "");
    const maxVal = maxKey in state ? state[maxKey] : (node.max ?? "");
    const filled = minVal !== "" || maxVal !== "";

    return (
      <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
        <FieldLabelWithHint label={label} idShort={node.idShort} filled={filled} typeLabel="Range" cdHint={cdHint} node={node} />
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

  /* ── ReferenceElement / RelationshipElement — 구조화된 참조값, 드로어로 상세 입력 ── */
  if (
    node.modelType === "ReferenceElement" ||
    node.modelType === "RelationshipElement" ||
    node.modelType === "AnnotatedRelationshipElement"
  ) {
    return (
      <ReferenceLikeRow node={node} state={state} editMode={editMode} depth={depth} cdHint={cdHint} />
    );
  }

  /* ── 그 외 단순 값 입력 (fallback) ── */
  const fallbackKey = `${valuePath}.originalValue`;
  const fallbackVal = fallbackKey in state ? state[fallbackKey] : (node.originalValue ?? "");
  const fallbackFilled = fallbackVal !== "" && fallbackVal !== null;

  return (
    <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
      <FieldLabelWithHint label={label} idShort={node.idShort} filled={fallbackFilled} typeLabel={node.modelType} cdHint={cdHint} node={node} />
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
   ReferenceLikeRow — ReferenceElement / RelationshipElement 의 인라인 행
   · 보기 모드  : 읽기 쉬운 참조 요약
   · 편집 모드  : ReferencePicker 로 타입/참조값을 바로 선택·수정 (MLP 처럼 인라인)
                 부가 정보(추가 키 등) 상세 수정은 "상세 입력" 버튼으로 드로어 열기
───────────────────────────────────────────────────────────────────────────*/
function ReferenceLikeRow({
  node, state, editMode, depth, cdHint,
}: {
  node: any; state: Record<string, any>; editMode: boolean; depth: number;
  cdHint?: { idShort: string; description: string } | null;
}) {
  const openDetail = React.useContext(OpenDetailContext);
  const inlineRef = React.useContext(InlineRefContext);
  const label = getDisplayLabel(node.idShort);
  const isRelationship = node.modelType !== "ReferenceElement";

  const read = (key: string, fallback: any) => (key in state ? state[key] : fallback);

  // 현재 값 읽기
  const valueRef = read(`${node.valuePath}.value`, node.originalValue) ?? { type: "ModelReference", keys: [] };
  const first = read(`${node.valuePath}.first`, node.first ?? node.Submodel?.first) ?? { type: "ModelReference", keys: [] };
  const second = read(`${node.valuePath}.second`, node.second ?? node.Submodel?.second) ?? { type: "ModelReference", keys: [] };

  const filled = isRelationship
    ? summarizeReference(first).filled && summarizeReference(second).filled
    : summarizeReference(valueRef).filled;

  // ── 편집 모드: 인라인 한 줄 피커 ──
  if (editMode && inlineRef) {
    return (
      <div className={cn("grid grid-cols-[240px_1fr] items-start gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
        <FieldLabelWithHint label={label} idShort={node.idShort} filled={filled} typeLabel={node.modelType} cdHint={cdHint} node={node} />
        <div className="space-y-2 min-w-0">
          {isRelationship ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 w-12 shrink-0">First</span>
                <InlineReferencePicker value={first} treeData={inlineRef.treeData} onChange={(ref) => inlineRef.onValueChange(`${node.valuePath}.first`, ref)} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 w-12 shrink-0">Second</span>
                <InlineReferencePicker value={second} treeData={inlineRef.treeData} onChange={(ref) => inlineRef.onValueChange(`${node.valuePath}.second`, ref)} />
              </div>
            </>
          ) : (
            <InlineReferencePicker value={valueRef} treeData={inlineRef.treeData} onChange={(ref) => inlineRef.onValueChange(`${node.valuePath}.value`, ref)} />
          )}
          {openDetail && (
            <button
              type="button"
              onClick={() => openDetail(node)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-blue-600 transition-colors"
            >
              <Settings2 size={12} /> 상세 편집
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── 보기 모드: 요약 (서브모델이름 › 마지막 엘리먼트 idShort) ──
  const friendly = (ref: any): { text: string; filled: boolean } => {
    const base = summarizeReference(ref);
    if (!base.filled) return base;
    if (ref?.type === "ExternalReference") return base;
    const keys: any[] = Array.isArray(ref?.keys) ? ref.keys : [];
    const submodelId = keys[0]?.type === "Submodel" ? keys[0].value : "";
    const submodels: any[] = inlineRef?.treeData?.[0]?.children ?? [];
    const sm = submodels.find((s) => s.id === submodelId);
    const smLabel = sm ? getDisplayLabel(sm.idShort) : "";
    const lastIdShort = keys.length > 0 ? keys[keys.length - 1].value : "";
    return {
      text: smLabel ? `${smLabel} › ${lastIdShort}` : lastIdShort,
      filled: true,
    };
  };

  let summaryNode: React.ReactNode;
  if (isRelationship) {
    const f = friendly(first);
    const s = friendly(second);
    summaryNode = (
      <div className="flex items-center gap-1.5 min-w-0 text-xs">
        <span className={cn("truncate", f.filled ? "text-zinc-700" : "text-zinc-400 italic")}>{f.text}</span>
        <ArrowRight size={12} className="text-zinc-400 shrink-0" />
        <span className={cn("truncate", s.filled ? "text-zinc-700" : "text-zinc-400 italic")}>{s.text}</span>
      </div>
    );
  } else {
    const summary = friendly(valueRef);
    summaryNode = (
      <span className={cn("text-xs truncate", summary.filled ? "text-zinc-700" : "text-zinc-400 italic")}>
        {summary.text}
      </span>
    );
  }

  return (
    <div className={cn("grid grid-cols-[240px_1fr] items-center gap-4 py-3 px-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60", depth > 0 && "pl-6")}>
      <FieldLabelWithHint label={label} idShort={node.idShort} filled={filled} typeLabel={node.modelType} cdHint={cdHint} node={node} />
      <div className="min-w-0">{summaryNode}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   GroupSection — renders a collapsible SMC / SML section
──────────────��────────────────────────────────────────────────────────────*/
function GroupSection({
  node, state, editMode, onValueChange, depth = 0, defaultOpen = true, cdMap,
  onAddElement, onDeleteElement,
}: {
  node: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"];
  depth?: number; defaultOpen?: boolean; cdMap: CDMap;
  onAddElement?: AddElementHandler; onDeleteElement?: DeleteElementHandler;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const children: any[] = Array.isArray(node.children) ? node.children : [];
  const total = children.reduce((s, c) => s + countLeaves(c), 0);
  const filled = children.reduce((s, c) => s + countFilledLeaves(c, state), 0);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const label = getDisplayLabel(node.idShort);
  // SMC / SML / Entity 는 하위 요소를 가질 수 있음
  const canHaveChildren = GROUP_TYPES.has(node.modelType) || node.modelType === "Entity";

  return (
    <div className={cn("border-b border-zinc-100 last:border-b-0", depth > 0 && "border-l-2 border-l-zinc-100 ml-4")}>
      <div className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-50 transition-colors group">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          {open
            ? <ChevronDown size={13} className="text-zinc-400 shrink-0" />
            : <ChevronRight size={13} className="text-zinc-400 shrink-0" />
          }
          <span className="text-sm font-semibold text-zinc-800 truncate">
            {label}
          </span>
        </button>
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
          {editMode && canHaveChildren && onAddElement && (
            <AddElementDialog
              parentNode={node}
              parentLabel={label}
              onAdd={onAddElement}
              trigger={
                <button
                  type="button"
                  title="하위 엘리먼트 추가"
                  className="text-zinc-300 hover:text-blue-500 transition-colors p-1"
                >
                  <Plus size={14} />
                </button>
              }
            />
          )}
          {editMode && onDeleteElement && (
            <DeleteIconButton label={label} onDelete={() => onDeleteElement(node)} />
          )}
        </div>
      </div>
      {open && children.length > 0 && (
        <div className={cn(depth > 0 ? "bg-white" : "bg-zinc-50/30")}>
          {children.map((child, i) => (
            <NodeRenderer key={child.valuePath ?? i} node={child} state={state}
              editMode={editMode} onValueChange={onValueChange} depth={depth + 1} cdMap={cdMap}
              onAddElement={onAddElement} onDeleteElement={onDeleteElement} />
          ))}
        </div>
      )}
      {open && children.length === 0 && editMode && canHaveChildren && onAddElement && (
        <div className="px-4 py-2 pl-10">
          <AddElementDialog
            parentNode={node}
            parentLabel={label}
            onAdd={onAddElement}
            trigger={
              <button type="button" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={12} /> 하위 엘리먼트 추가
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────��─────
   NodeRenderer — dispatches to FieldInput or GroupSection
───────────────────────────────────────────────────────────────────────────*/
function NodeRenderer({
  node, state, editMode, onValueChange, depth = 0, cdMap,
  onAddElement, onDeleteElement,
}: {
  node: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; depth?: number; cdMap: CDMap;
  onAddElement?: AddElementHandler; onDeleteElement?: DeleteElementHandler;
}) {
  const semanticKey = getSemanticKey(node);
  const cdHint = semanticKey ? (cdMap.get(semanticKey) ?? null) : null;

  if (LEAF_TYPES.has(node.modelType)) {
    const field = node.modelType === "File"
      ? <FileFieldInput node={node} state={state} editMode={editMode} onValueChange={onValueChange} depth={depth} cdHint={cdHint} />
      : <FieldInput node={node} state={state} editMode={editMode} onValueChange={onValueChange} depth={depth} cdHint={cdHint} />;

    // 편집 모드에서는 각 leaf row 우측에 삭제 버튼을 겹쳐 표시한다.
    if (editMode && onDeleteElement) {
      return (
        <div className="relative group">
          {field}
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DeleteIconButton label={getDisplayLabel(node.idShort)} onDelete={() => onDeleteElement(node)} />
          </div>
        </div>
      );
    }
    return field;
  }
  if (GROUP_TYPES.has(node.modelType) || node.modelType === "Entity") {
    return <GroupSection node={node} state={state} editMode={editMode} onValueChange={onValueChange} depth={depth} defaultOpen={depth < 2} cdMap={cdMap} onAddElement={onAddElement} onDeleteElement={onDeleteElement} />;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   SubmodelPanel — right content area for one Submodel
───────────────────────────────────────────────────────────────────────────*/
function SubmodelPanel({
  submodel, state, editMode, onValueChange, onSave, cdMap,
  onAddElement, onDeleteElement, onDeleteSubmodel,
}: {
  submodel: any; state: Record<string, any>; editMode: boolean;
  onValueChange: SubmodelFormEditorProps["onValueChange"]; onSave: () => void; cdMap: CDMap;
  onAddElement?: AddElementHandler; onDeleteElement?: DeleteElementHandler;
  onDeleteSubmodel?: (submodel: any) => void;
}) {
  const children: any[] = Array.isArray(submodel.children) ? submodel.children : [];
  const total = children.reduce((s, c) => s + countLeaves(c), 0);
  const filled = children.reduce((s, c) => s + countFilledLeaves(c, state), 0);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const submodelLabel = getDisplayLabel(submodel.idShort);

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
              <div className="flex items-center gap-2">
                {onAddElement && (
                  <AddElementDialog
                    parentNode={submodel}
                    parentLabel={submodelLabel}
                    onAdd={onAddElement}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        <Plus size={14} className="mr-1" /> 엘리먼트 추가
                      </Button>
                    }
                  />
                )}
                {onDeleteSubmodel && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      if (window.confirm(`Submodel '${submodelLabel}' 을(를) 삭제하시겠습니까?`)) onDeleteSubmodel(submodel);
                    }}
                  >
                    <Trash2 size={14} className="mr-1" /> 삭제
                  </Button>
                )}
                <Button type="button" onClick={onSave}>
                  저장
                </Button>
              </div>
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
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm text-zinc-400">
            <span>No elements defined in this submodel.</span>
            {editMode && onAddElement && (
              <AddElementDialog
                parentNode={submodel}
                parentLabel={submodelLabel}
                onAdd={onAddElement}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Plus size={14} className="mr-1" /> 엘리먼트 추가
                  </Button>
                }
              />
            )}
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
                cdMap={cdMap}
                onAddElement={onAddElement}
                onDeleteElement={onDeleteElement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────��──────────────────────────────────────────────────────────────────
   SubmodelFormEditor — main export
──────────────────────────────���────────────────────────────────────────────*/
export default function SubmodelFormEditor({
  treeData,
  state,
  editMode,
  onValueChange,
  onSave,
  onToggleAdvanced,
  showAdvanced,
  conceptDescriptions,
  onAddSubmodel,
  onAddElement,
  onDeleteElement,
}: SubmodelFormEditorProps) {
  const root = treeData[0];

  /* semanticId → CD description 맵 */
  const cdMap = useMemo(() => buildCDMap(conceptDescriptions ?? []), [conceptDescriptions]);

  const submodels: any[] = useMemo(() => {
    if (!root) return [];
    if (root.modelType === "AssetAdministrationShell") {
      return Array.isArray(root.children) ? root.children : [];
    }
    return treeData.filter((n) => n.modelType === "Submodel");
  }, [treeData, root]);

  const [activeIdx, setActiveIdx] = useState(0);
  // 서브모델 추가/삭제로 목록 길이가 바뀌면 활성 인덱스를 안전 범위로 보정
  useEffect(() => {
    if (activeIdx > submodels.length - 1) setActiveIdx(Math.max(0, submodels.length - 1));
  }, [submodels.length, activeIdx]);
  const activeSubmodel = submodels[activeIdx];

  /* ── 상세 입력 드로어 상태 ── */
  // 드로어에 표시할 노드 (treeData에서 valuePath로 다시 찾아 최신값 사용)
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  // 새 엘리먼트 추가 후, treeData가 갱신되면 그 노드를 찾아 드로어를 연다
  const pendingAddRef = useRef<{ parentPath: string; idShort: string } | null>(null);

  const requestDrawerForNew = (parentNode: any, idShort: string) => {
    pendingAddRef.current = { parentPath: parentNode?.valuePath ?? "", idShort };
  };

  // 기존 엘리먼트를 선택하면 해당 노드 경로로 상세 드로어를 연다
  const openDetailForNode = (node: any) => {
    if (node?.valuePath) setDrawerPath(node.valuePath);
  };

  // treeData 변경 시: (1) 대기 중인 신규 노드를 찾아 드로어 오픈, (2) 현재 드로어 노드 경로 유효성 유지
  useEffect(() => {
    const pending = pendingAddRef.current;
    if (!pending) return;
    const parent = pending.parentPath
      ? findNodeByPath(treeData, pending.parentPath)
      : null;
    const siblings: any[] = parent
      ? (Array.isArray(parent.children) ? parent.children : [])
      : treeData;
    const target = siblings.find((n) => n?.idShort === pending.idShort);
    if (target?.valuePath) {
      setDrawerPath(target.valuePath);
      pendingAddRef.current = null;
    }
  }, [treeData]);

  const drawerNode = useMemo(
    () => (drawerPath ? findNodeByPath(treeData, drawerPath) : null),
    [treeData, drawerPath]
  );

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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-sm text-zinc-400">
        <span>No submodels found.</span>
        {editMode && onAddSubmodel && (
          <Button type="button" variant="outline" onClick={onAddSubmodel}>
            <Plus size={14} className="mr-1" /> Submodel 추가
          </Button>
        )}
      </div>
    );
  }

  return (
    <DrawerRequestContext.Provider value={editMode ? requestDrawerForNew : null}>
    <ConceptListContext.Provider value={conceptDescriptions ?? []}>
    <OpenDetailContext.Provider value={editMode ? openDetailForNode : null}>
    <InlineRefContext.Provider value={{ treeData, onValueChange }}>
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
          <div className="px-3 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Submodels</span>
            {editMode && onAddSubmodel && (
              <button
                type="button"
                onClick={onAddSubmodel}
                title="Submodel 추가"
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={12} /> 추가
              </button>
            )}
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
            cdMap={cdMap}
            onAddElement={onAddElement}
            onDeleteElement={onDeleteElement}
            onDeleteSubmodel={onDeleteElement}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-zinc-400">
            Select a submodel from the left.
          </div>
        )}
      </div>
    </div>

      {/* ── 엘리먼트 상세 입력 드로어 ── */}
      <ElementDetailDrawer
        node={drawerNode}
        state={state}
        treeData={treeData}
        open={!!drawerNode}
        onClose={() => setDrawerPath(null)}
        onValueChange={onValueChange}
      />
    </InlineRefContext.Provider>
    </OpenDetailContext.Provider>
    </ConceptListContext.Provider>
    </DrawerRequestContext.Provider>
  );
}
