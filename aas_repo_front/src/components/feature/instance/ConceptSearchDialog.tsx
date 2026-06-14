"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* 개념 검색 결과 1건 (mock placeholder).
   실제 ECLASS/IEC CDD/IDTA API 연동은 하지 않으며, 이 구조만 미리 맞춰 둔다. */
export interface ConceptSearchResult {
  /** semanticId 로 주입될 전역 식별자 (IRDI 또는 IRI) */
  id: string;
  idShort: string;
  preferredName: string;
  definition: string;
  /** 개념 출처 — 검색 결과 신뢰도/배지에 사용 */
  source: "ECLASS" | "IEC_CDD" | "IDTA" | "CUSTOM";
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

/* mock 개념 사전 — 검색어로 필터링되는 더미 데이터.
   실제 백엔드/표준 사전 연동 전까지의 placeholder 다. */
const MOCK_CONCEPTS: ConceptSearchResult[] = [
  { id: "0173-1#02-AAO677#002", idShort: "ManufacturerName", preferredName: "Manufacturer name", definition: "legally valid designation of the natural or judicial body which is responsible for a product", source: "ECLASS" },
  { id: "0173-1#02-AAW338#001", idShort: "ManufacturerProductDesignation", preferredName: "Manufacturer product designation", definition: "Short description of the product (short text)", source: "ECLASS" },
  { id: "0173-1#02-AAO676#003", idShort: "SerialNumber", preferredName: "Serial number", definition: "unique combination of numbers and letters used to identify the device once it has been manufactured", source: "ECLASS" },
  { id: "0112/2///61987#ABN590#001", idShort: "RatedVoltage", preferredName: "Rated voltage", definition: "nominal voltage of the equipment as specified by the manufacturer", source: "IEC_CDD" },
  { id: "0112/2///61987#ABA565#007", idShort: "NominalCurrent", preferredName: "Nominal current", definition: "rated current value under specified operating conditions", source: "IEC_CDD" },
  { id: "https://admin-shell.io/zvei/nameplate/2/0/Nameplate", idShort: "Nameplate", preferredName: "Digital Nameplate", definition: "IDTA submodel template for the digital nameplate of a manufactured product", source: "IDTA" },
  { id: "https://admin-shell.io/idta/TechnicalData/1/2/TechnicalProperties", idShort: "TechnicalProperties", preferredName: "Technical properties", definition: "IDTA submodel template grouping technical properties of an asset", source: "IDTA" },
  { id: "https://example.com/ids/cd/custom_operating_hours", idShort: "OperatingHours", preferredName: "Operating hours", definition: "accumulated operating time of the asset (custom-defined concept)", source: "CUSTOM" },
];

interface ConceptSearchDialogProps {
  open: boolean;
  /** 연결 대상 element 의 idShort (헤더 안내용) */
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_CONCEPTS;
    return MOCK_CONCEPTS.filter(
      (c) =>
        c.idShort.toLowerCase().includes(q) ||
        c.preferredName.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden overflow-x-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">표준 사전에서 개념 찾기</DialogTitle>
          <DialogDescription className="text-xs">
            {targetIdShort
              ? `"${targetIdShort}" 에 연결할 표준 개념을 검색하세요.`
              : "연결할 표준 개념을 검색하세요."}{" "}
            결과는 데모용 예시입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 정의, ID 로 검색 (예: voltage, manufacturer)"
            className="h-9 pl-8 text-sm bg-white"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-zinc-400">
              검색 결과가 없습니다.
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
                  <span className="mt-1 block truncate font-mono text-[11px] text-zinc-400">
                    {c.id}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
