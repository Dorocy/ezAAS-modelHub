"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Link2, Sparkles } from "lucide-react";
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
}

interface SemanticQualityPanelProps {
  elements: SemanticElementRow[];
  editMode: boolean;
  /** 누락 element 에 개념을 연결하려 할 때 호출 */
  onRequestLink: (row: SemanticElementRow) => void;
}

export default function SemanticQualityPanel({
  elements,
  editMode,
  onRequestLink,
}: SemanticQualityPanelProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const { missing, completed, rate, sourceGroups } = useMemo(() => {
    const missing = elements.filter((e) => !e.semanticIdValue);
    const completed = elements.filter((e) => !!e.semanticIdValue);
    const total = elements.length;
    const rate = total === 0 ? 100 : Math.round((completed.length / total) * 100);

    // 연결된 항목을 출처(ECLASS / IEC CDD / Custom / 기타)별로 분류
    const sourceGroups: Record<ConceptSource, SemanticElementRow[]> = {
      ECLASS: [],
      IEC_CDD: [],
      CUSTOM: [],
      OTHER: [],
    };
    completed.forEach((row) => {
      sourceGroups[classifyConceptSource(row.semanticIdValue)].push(row);
    });
    return { missing, completed, rate, sourceGroups };
  }, [elements]);

  const rateTone =
    rate >= 80
      ? "text-emerald-600"
      : rate >= 50
        ? "text-amber-600"
        : "text-red-500";
  const barTone =
    rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-red-400";

  // 출처별 표시 순서 + 라벨 + 배지 색
  const SOURCE_META: Array<{
    key: ConceptSource;
    label: string;
    badge: string;
  }> = [
    { key: "ECLASS", label: "ECLASS", badge: "border-sky-200 bg-sky-50 text-sky-700" },
    { key: "IEC_CDD", label: "IEC CDD", badge: "border-violet-200 bg-violet-50 text-violet-700" },
    { key: "CUSTOM", label: "Custom", badge: "border-amber-200 bg-amber-50 text-amber-700" },
    { key: "OTHER", label: "기타", badge: "border-zinc-200 bg-zinc-100 text-zinc-600" },
  ];

  // 표시용 이름. SubmodelElementList(SML) 의 자식은 AAS 표준상 idShort 가 없어(위치 기반)
  // 비어 있을 수 있다. 이 경우 부모 경로 + 인덱스로 사람이 읽을 수 있는 이름을 만든다.
  const displayName = (row: SemanticElementRow): string => {
    if (row.idShort) return row.idShort;
    // treePath 의 마지막 의미 있는 세그먼트를 부모로 사용
    const parent = row.treePath.split("/").filter(Boolean).pop();
    // valuePath 끝의 [n] 인덱스 추출 (예: ...value[2] → 2)
    const idxMatch = row.valuePath.match(/\[(\d+)\]\s*$/);
    const idx = idxMatch ? `[${idxMatch[1]}]` : "";
    if (parent) return `${decodeURIComponent(parent)}${idx} (목록 항목)`;
    return idx ? `목록 항목 ${idx}` : "(이름 없음)";
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* 완료율 요약 */}
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

        {/* 출처별 현황 요약 */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        </div>
      </div>

      {/* 누락 목록 (우선 표시) */}
      <section className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="size-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-zinc-700">
            의미 정의가 필요한 항목
          </h4>
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
                  <div className="flex items-center gap-2 min-w-0">
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

      {/* 완료 목록 (접이식) */}
      <section className="mt-5">
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <CheckCircle2 className="size-4 text-emerald-500" />
          <h4 className="text-sm font-semibold text-zinc-700">연결된 항목</h4>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {completed.length}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-4 text-zinc-400 transition-transform",
              showCompleted && "rotate-180",
            )}
          />
        </button>

        {showCompleted &&
          (completed.length === 0 ? (
            <ul className="mt-2">
              <li className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-400">
                아직 연결된 항목이 없습니다.
              </li>
            </ul>
          ) : (
            <div className="mt-2 space-y-4">
              {SOURCE_META.filter(({ key }) => sourceGroups[key].length > 0).map(
                ({ key, label, badge }) => (
                  <div key={key}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          badge,
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {sourceGroups[key].length}개
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {sourceGroups[key].map((row) => (
                        <li
                          key={row.valuePath}
                          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2"
                        >
                          <Link2 className="size-3.5 shrink-0 text-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-zinc-800">
                              {displayName(row)}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-400">
                              {row.semanticIdValue}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          ))}
      </section>
    </div>
  );
}
