"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, ArrowLeft, Ruler, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* 개념 검색 결과 1건 (mock placeholder).
   실제 ECLASS/IEC CDD/IDTA API 연동은 하지 않으며, 이 구조만 미리 맞춰 둔다.
   id 외 필드는 optional 이라 InstanceForm 의 기존 연결 로직(id/source 만 사용)과 호환된다. */
export interface ConceptSearchResult {
  /** semanticId 로 주입될 전역 식별자 (IRDI 또는 IRI) */
  id: string;
  idShort: string;
  preferredName: string;
  definition: string;
  /** 개념 출처 — 검색 결과 신뢰도/배지에 사용 */
  source: "ECLASS" | "IEC_CDD" | "IDTA" | "CUSTOM";
  /** IEC61360 dataType (예: STRING, REAL_MEASURE) */
  dataType?: string;
  /** 단위 표시값 (예: V, mm) */
  unit?: string;
  /** 단위 식별자 (IRDI/IRI) */
  unitId?: string;
  /** 예시 값 */
  example?: string;
}

/* 출처별 배지 스타일 (디자인 토큰: 상태색 + 중립) */
const SOURCE_META: Record<
  ConceptSearchResult["source"],
  { label: string; className: string }
> = {
  ECLASS: { label: "ECLASS", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IEC_CDD: { label: "IEC CDD", className: "bg-blue-50 text-blue-700 border-blue-200" },
  IDTA: { label: "IDTA Template", className: "bg-amber-50 text-amber-700 border-amber-200" },
  CUSTOM: { label: "Custom", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};

/* IEC61360 DataType 표준 열거값 (핵심 세트) */
const DATA_TYPES = [
  "STRING",
  "STRING_TRANSLATABLE",
  "INTEGER_MEASURE",
  "INTEGER_COUNT",
  "REAL_MEASURE",
  "REAL_COUNT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "RATIONAL",
  "IRI",
] as const;

/* mock 개념 사전 — 검색어로 필터링되는 더미 데이터.
   실제 백엔드/표준 사전 연동 전까지의 placeholder 다. */
const MOCK_CONCEPTS: ConceptSearchResult[] = [
  { id: "0173-1#02-AAO677#002", idShort: "ManufacturerName", preferredName: "Manufacturer name", definition: "legally valid designation of the natural or judicial body which is responsible for a product", source: "ECLASS", dataType: "STRING", example: "Siemens AG" },
  { id: "0173-1#02-AAW338#001", idShort: "ManufacturerProductDesignation", preferredName: "Manufacturer product designation", definition: "Short description of the product (short text)", source: "ECLASS", dataType: "STRING_TRANSLATABLE", example: "SIMATIC S7-1500" },
  { id: "0173-1#02-AAO676#003", idShort: "SerialNumber", preferredName: "Serial number", definition: "unique combination of numbers and letters used to identify the device once it has been manufactured", source: "ECLASS", dataType: "STRING", example: "SN-2024-00123" },
  { id: "0112/2///61987#ABN590#001", idShort: "RatedVoltage", preferredName: "Rated voltage", definition: "nominal voltage of the equipment as specified by the manufacturer", source: "IEC_CDD", dataType: "REAL_MEASURE", unit: "V", unitId: "0173-1#05-AAA480#003", example: "230" },
  { id: "0112/2///61987#ABA565#007", idShort: "NominalCurrent", preferredName: "Nominal current", definition: "rated current value under specified operating conditions", source: "IEC_CDD", dataType: "REAL_MEASURE", unit: "A", unitId: "0173-1#05-AAA501#002", example: "16" },
  { id: "https://admin-shell.io/zvei/nameplate/2/0/Nameplate", idShort: "Nameplate", preferredName: "Digital Nameplate", definition: "IDTA submodel template for the digital nameplate of a manufactured product", source: "IDTA", dataType: "STRING" },
  { id: "https://admin-shell.io/idta/TechnicalData/1/2/TechnicalProperties", idShort: "TechnicalProperties", preferredName: "Technical properties", definition: "IDTA submodel template grouping technical properties of an asset", source: "IDTA", dataType: "STRING" },
  { id: "https://example.com/ids/cd/custom_operating_hours", idShort: "OperatingHours", preferredName: "Operating hours", definition: "accumulated operating time of the asset (custom-defined concept)", source: "CUSTOM", dataType: "REAL_COUNT", unit: "h", example: "12500" },
];

/* preferredName/customId 로부터 urn:custom:concept:<slug> 형태의 semanticId 자동 생성 */
function buildCustomId(seed: string): string {
  const slug = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `urn:custom:concept:${slug || "concept"}-${suffix}`;
}

interface ConceptSearchDialogProps {
  open: boolean;
  /** 연결 대상 element 의 idShort (헤더 안내 + 새 개념 기본 이름) */
  targetIdShort?: string;
  onClose: () => void;
  onSelect: (concept: ConceptSearchResult) => void;
}

export default function ConceptSearchDialog({
  open,
  targetIdShort,
  onClose,
  onSelect,
}: ConceptSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"search" | "define">("search");
  /** 이번 세션에서 사용자가 정의한 Custom 개념들 (재검색 가능하도록 누적) */
  const [sessionConcepts, setSessionConcepts] = useState<ConceptSearchResult[]>([]);

  // 새 개념 정의 폼 상태
  const [pName, setPName] = useState("");
  const [pDefinition, setPDefinition] = useState("");
  const [pDataType, setPDataType] = useState<string>("STRING");
  const [pUnit, setPUnit] = useState("");
  const [pUnitId, setPUnitId] = useState("");
  const [pCustomId, setPCustomId] = useState("");
  const [pExample, setPExample] = useState("");

  const allConcepts = useMemo(
    () => [...sessionConcepts, ...MOCK_CONCEPTS],
    [sessionConcepts],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allConcepts;
    return allConcepts.filter(
      (c) =>
        c.idShort.toLowerCase().includes(q) ||
        c.preferredName.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.dataType ?? "").toLowerCase().includes(q),
    );
  }, [query, allConcepts]);

  // 다이얼로그를 닫을 때 검색/폼 상태 초기화 (세션 Custom 개념은 유지)
  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setQuery("");
      setView("search");
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setPName("");
    setPDefinition("");
    setPDataType("STRING");
    setPUnit("");
    setPUnitId("");
    setPCustomId("");
    setPExample("");
  };

  // "새 개념 정의" 진입 시 검색어/대상 idShort 를 기본 이름으로 채움
  const openDefineView = () => {
    setPName(query.trim() || targetIdShort || "");
    setView("define");
  };

  const canCreate = pName.trim().length > 0 && pDefinition.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const id = pCustomId.trim() || buildCustomId(pName);
    const concept: ConceptSearchResult = {
      id,
      idShort: pName.trim().replace(/\s+/g, ""),
      preferredName: pName.trim(),
      definition: pDefinition.trim(),
      source: "CUSTOM",
      dataType: pDataType || undefined,
      unit: pUnit.trim() || undefined,
      unitId: pUnitId.trim() || undefined,
      example: pExample.trim() || undefined,
    };
    // 세션 사전에 누적 → 같은 세션에서 재검색 가능
    setSessionConcepts((prev) => [concept, ...prev]);
    // 기존 연결 경로 재사용 (element.semanticId 주입은 InstanceForm 에서)
    onSelect(concept);
    resetForm();
    setView("search");
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden overflow-x-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            {view === "search" ? "개념 찾기 / 정의" : "새 개념 정의"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {view === "search" ? (
              <>
                {targetIdShort
                  ? `"${targetIdShort}" 에 연결할 개념을 검색하세요.`
                  : "연결할 개념을 검색하세요."}{" "}
                기존 표준 개념 재사용이 권장됩니다. 검색 결과는 데모용 예시입니다.
              </>
            ) : (
              "표준 사전에 없는 개념을 직접 정의합니다. Custom 개념으로 추가되어 다시 검색·재사용할 수 있습니다."
            )}
          </DialogDescription>
        </DialogHeader>

        {view === "search" ? (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름, 정의, ID, dataType 으로 검색 (예: voltage, manufacturer)"
                className="h-9 pl-8 text-sm bg-white"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-zinc-200 divide-y divide-zinc-100">
              {results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
                  <p className="text-sm text-zinc-500">일치하는 개념이 없습니다.</p>
                  <p className="text-xs text-zinc-400">
                    찾는 개념이 사전에 없다면 새 개념으로 정의할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={openDefineView}
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Plus className="size-3.5" />
                    새 개념 정의
                  </button>
                </div>
              ) : (
                results.map((c) => {
                  const meta = SOURCE_META[c.source];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelect(c)}
                      className="block w-full min-w-0 max-w-full text-left px-3 py-2.5 transition-colors hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                          {c.preferredName}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{c.definition}</p>
                      {/* dataType / unit / example 칩 — 선택 판단 근거 */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {c.dataType && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            <Type className="size-3" />
                            {c.dataType}
                          </span>
                        )}
                        {c.unit && (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            <Ruler className="size-3" />
                            {c.unit}
                          </span>
                        )}
                        {c.example && (
                          <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            예: {c.example}
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block truncate font-mono text-[11px] text-zinc-400">
                        {c.id}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* 검색 결과가 있어도 항상 fallback 진입 제공 */}
            {results.length > 0 && (
              <button
                type="button"
                onClick={openDefineView}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <Plus className="size-3.5" />
                찾는 개념이 없나요? 새 개념 정의
              </button>
            )}
          </>
        ) : (
          /* ── 새 개념 정의 폼 ───────────────────────────────── */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-zinc-500">
                Preferred Name <span className="text-red-400">*</span>
              </Label>
              <Input
                autoFocus
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="개념 이름 (예: Operating temperature)"
                className="h-8 text-sm bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-zinc-500">
                Definition <span className="text-red-400">*</span>
              </Label>
              <Textarea
                value={pDefinition}
                onChange={(e) => setPDefinition(e.target.value)}
                placeholder="이 개념이 무엇을 의미하는지 설명하세요. (필수)"
                className="min-h-[56px] text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium text-zinc-500">Data Type</Label>
                <Select value={pDataType} onValueChange={(v) => setPDataType((v as string) ?? "STRING")}>
                  <SelectTrigger className="h-8 text-sm bg-white">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((dt) => (
                      <SelectItem key={dt} value={dt} className="text-sm">
                        {dt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium text-zinc-500">Unit</Label>
                <Input
                  value={pUnit}
                  onChange={(e) => setPUnit(e.target.value)}
                  placeholder="예: mm, V, kg"
                  className="h-8 text-sm bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-zinc-500">Unit ID (선택)</Label>
              <Input
                value={pUnitId}
                onChange={(e) => setPUnitId(e.target.value)}
                placeholder="단위 식별자 (IRDI/IRI)"
                className="h-8 text-xs font-mono bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-zinc-500">Example (선택)</Label>
              <Input
                value={pExample}
                onChange={(e) => setPExample(e.target.value)}
                placeholder="예시 값"
                className="h-8 text-sm bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-zinc-500">
                semanticId (선택 — 비우면 자동 생성)
              </Label>
              <Input
                value={pCustomId}
                onChange={(e) => setPCustomId(e.target.value)}
                placeholder={pName.trim() ? buildCustomId(pName) : "urn:custom:concept:..."}
                className="h-8 text-xs font-mono bg-white text-zinc-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView("search");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <ArrowLeft className="size-3.5" />
                검색으로
              </button>
              <button
                type="button"
                disabled={!canCreate}
                onClick={handleCreate}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white transition-colors",
                  canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-300 cursor-not-allowed",
                )}
              >
                <Plus className="size-3.5" />
                정의하고 연결
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
