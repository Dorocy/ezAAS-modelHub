"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyConceptSource, type ConceptSource } from "@/lib/aas";

/* 의미 정의 현황에서 다루는 element 1건 */
export interface SemanticElementRow {
  /** lodash 경로 (예: submodels[0].submodelElements[3]) — 주입 키로 사용 */
  valuePath: string;
  /** idShort 조상 체인 (예: Nameplate/TechnicalData/Temperature) — Custom semanticId 생성용 */
  treePath: string;
  idShort: string;
  modelType: string;
  /** 현재 연결된 semanticId 값 (override 반영). 없으면 null */
  semanticIdValue: string | null;
  /** override 로 방금 연결된 경우의 출처 라벨 (있으면 배지로 표시) */
  linkedSourceLabel?: string;
  /** Property 등의 valueType (dataType). 있으면 표시 */
  dataType?: string;
  /** 단위 (있으면 표시) */
  unit?: string;
}

/* Concept Dictionary/local concept list 의 개념 1건 (미사용 개념 판별용) */
export interface DictionaryConceptRow {
  id: string;
  idShort: string;
}

interface SemanticQualityPanelProps {
  elements: SemanticElementRow[];
  editMode: boolean;
  /** 누락 element 에 개념을 연결하려 할 때 호출 */
  onRequestLink: (row: SemanticElementRow) => void;
  /** Concept Dictionary 에 존재하는 전체 개념 목록 (미사용 개념 판별용) */
  dictionaryConcepts?: DictionaryConceptRow[];
}

/** 출처별 표시 순서 + 라벨 + 배지 색 */
const SOURCE_META: Array<{ key: ConceptSource; label: string; badge: string }> = [
  { key: "ECLASS", label: "ECLASS", badge: "border-sky-200 bg-sky-50 text-sky-700" },
  { key: "IEC_CDD", label: "IEC CDD", badge: "border-violet-200 bg-violet-50 text-violet-700" },
  { key: "IDTA", label: "IDTA", badge: "border-teal-200 bg-teal-50 text-teal-700" },
  { key: "CUSTOM", label: "Custom", badge: "border-amber-200 bg-amber-50 text-amber-700" },
  { key: "OTHER", label: "기타", badge: "border-zinc-200 bg-zinc-100 text-zinc-600" },
];

export default function SemanticQualityPanel({
  elements,
  editMode,
  onRequestLink,
  dictionaryConcepts = [],
}: SemanticQualityPanelProps) {
  // 출처 그룹별 펼침 상태 (기본 접힘)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showUnused, setShowUnused] = useState(false);
  const [showMapping, setShowMapping] = useState(false);

  // 표시용 이름. SubmodelElementList(SML) 의 자식은 AAS 표준상 idShort 가 없어(위치 기반)
  // 비어 있을 수 있다. 이 경우 부모 경로 + 인덱스로 사람이 읽을 수 있는 이름을 만든다.
  const displayName = (row: SemanticElementRow): string => {
    if (row.idShort) return row.idShort;
    const parent = row.treePath.split("/").filter(Boolean).pop();
    const idxMatch = row.valuePath.match(/\[(\d+)\]\s*$/);
    const idx = idxMatch ? `[${idxMatch[1]}]` : "";
    if (parent) return `${decodeURIComponent(parent)}${idx} (목록 항목)`;
    return idx ? `목록 항목 ${idx}` : "(이름 없음)";
  };

  const { missing, completed, rate, sourceGroups, unusedConcepts, mappingCheck } =
    useMemo(() => {
      const missing = elements.filter((e) => !e.semanticIdValue);
      const completed = elements.filter((e) => !!e.semanticIdValue);
      const total = elements.length;
      const rate = total === 0 ? 100 : Math.round((completed.length / total) * 100);

      // 연결된 항목을 출처별로 분류
      const sourceGroups: Record<ConceptSource, SemanticElementRow[]> = {
        ECLASS: [],
        IEC_CDD: [],
        IDTA: [],
        CUSTOM: [],
        OTHER: [],
      };
      completed.forEach((row) => {
        sourceGroups[classifyConceptSource(row.semanticIdValue)].push(row);
      });

      // 미사용 개념: Concept Dictionary 에는 있으나 현재 어떤 element 의 semanticId 로도 쓰이지 않음
      const usedIds = new Set(
        completed.map((e) => (e.semanticIdValue ?? "").trim()).filter(Boolean),
      );
      const unusedConcepts = dictionaryConcepts.filter(
        (c) => c.id && !usedIds.has(c.id.trim()),
      );

      // 매핑 확인 필요(기본 판별): semanticId 는 있으나 출처를 알 수 없는(OTHER) 항목.
      // (정의/dataType/unit 정밀 검증은 추후 보강 — 지금은 출처 미상 기준)
      const mappingCheck = sourceGroups.OTHER;

      return { missing, completed, rate, sourceGroups, unusedConcepts, mappingCheck };
    }, [elements, dictionaryConcepts]);

  const rateTone =
    rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-500";
  const barTone =
    rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-red-400";

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* 완료율 + 출처별 요약 */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-800">의미 정의 완료율</h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              각 항목이 표준 개념(semanticId)에 연결되어 있는지 보여줍니다.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className={cn("text-2xl font-bold tabular-nums", rateTone)}>{rate}%</span>
            <p className="text-xs text-zinc-400">
              {completed.length} / {elements.length} 연결됨
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn("h-full rounded-full transition-all", barTone)}
            style={{ width: `${rate}%` }}
          />
        </div>

        {/* 출처별 + 미정의 현황 요약 */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SOURCE_META.map(({ key, label, badge }) => (
            <div
              key={key}
              className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-center"
            >
              <span
                className={cn(
                  "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  badge,
                )}
              >
                {label}
              </span>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-zinc-800">
                {sourceGroups[key].length}
              </p>
            </div>
          ))}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-center">
            <span className="inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              미정의
            </span>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-amber-700">
              {missing.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── 섹션 1: 의미 정의 필요 (AAS element 에 있으나 semanticId 없음) ── */}
      <section className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="size-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-zinc-700">의미 정의가 필요한 항목</h4>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {missing.length}
          </span>
        </div>

        {missing.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            모든 항목이 표준 개념에 연결되었습니다.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {missing.map((row) => (
              <li
                key={row.valuePath}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-zinc-800">
                      {displayName(row)}
                    </span>
                    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      {row.modelType}
                    </span>
                  </div>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-400">
                    {row.valuePath}
                  </span>
                </div>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => onRequestLink(row)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Sparkles className="size-3.5" />
                    개념 검색/연결
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── 섹션 2: 연결된 항목 — 출처별 접이식 그룹 + compact table ── */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <h4 className="text-sm font-semibold text-zinc-700">연결된 항목 (출처별)</h4>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {completed.length}
          </span>
        </div>

        {completed.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-400">
            아직 연결된 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {SOURCE_META.filter(({ key }) => sourceGroups[key].length > 0).map(
              ({ key, label, badge }) => {
                const rows = sourceGroups[key];
                const open = openGroups[key] ?? false;
                return (
                  <div
                    key={key}
                    className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(key)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                    >
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          badge,
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-zinc-400">{rows.length}개</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 text-zinc-400 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>

                    {open && (
                      <div className="overflow-x-auto border-t border-zinc-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 text-zinc-400">
                            <tr>
                              <th className="px-3 py-1.5 font-medium">이름</th>
                              <th className="px-3 py-1.5 font-medium">semanticId</th>
                              <th className="px-3 py-1.5 font-medium">타입</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr
                                key={row.valuePath}
                                className="border-t border-zinc-100 align-top"
                              >
                                <td className="max-w-[180px] truncate px-3 py-1.5 font-medium text-zinc-700">
                                  {displayName(row)}
                                </td>
                                <td className="max-w-[260px] truncate px-3 py-1.5 font-mono text-[11px] text-zinc-400">
                                  {row.semanticIdValue}
                                </td>
                                <td className="whitespace-nowrap px-3 py-1.5 text-zinc-500">
                                  {row.dataType || row.modelType}
                                  {row.unit ? ` · ${row.unit}` : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* ── 섹션 3: 미사용 개념 (Dictionary 에는 있으나 element 와 미연결) ── */}
      <section className="mt-6">
        <button
          type="button"
          onClick={() => setShowUnused((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <PackageOpen className="size-4 text-zinc-400" />
          <h4 className="text-sm font-semibold text-zinc-700">미사용 개념</h4>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
            {unusedConcepts.length}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-zinc-400 transition-transform",
              showUnused && "rotate-180",
            )}
          />
        </button>
        <p className="mt-1 text-xs text-zinc-400">
          Concept Dictionary 에 존재하지만 현재 AAS element 와 연결되지 않은 개념입니다.
        </p>

        {showUnused &&
          (unusedConcepts.length === 0 ? (
            <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-400">
              미사용 개념이 없습니다.
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {unusedConcepts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-800">
                      {c.idShort || "(이름 없음)"}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-400">
                      {c.id}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </section>

      {/* ── 섹션 4: 매핑 확인 필요 (semanticId 는 있으나 출처/정의 불명) ── */}
      <section className="mt-6 pb-2">
        <button
          type="button"
          onClick={() => setShowMapping((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <HelpCircle className="size-4 text-orange-400" />
          <h4 className="text-sm font-semibold text-zinc-700">매핑 확인 필요</h4>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            {mappingCheck.length}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-zinc-400 transition-transform",
              showMapping && "rotate-180",
            )}
          />
        </button>
        <p className="mt-1 text-xs text-zinc-400">
          semanticId 는 연결되어 있으나 출처(사전)를 식별할 수 없는 항목입니다. 잘못 연결되었거나
          비표준 개념일 수 있어 확인이 필요합니다.
        </p>

        {showMapping &&
          (mappingCheck.length === 0 ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              확인이 필요한 매핑이 없습니다.
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {mappingCheck.map((row) => (
                <li
                  key={row.valuePath}
                  className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2"
                >
                  <AlertTriangle className="size-3.5 shrink-0 text-orange-400" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-800">
                      {displayName(row)}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-400">
                      {row.semanticIdValue}
                    </span>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => onRequestLink(row)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <Sparkles className="size-3.5" />
                      다시 연결
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  );
}
