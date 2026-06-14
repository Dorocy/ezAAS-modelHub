"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ModelValidationReport, ClassifiedIssue } from "@/lib/aas";

/** Detail Panel 에 표시할 최대 이슈 수. */
const MAX_VISIBLE_ISSUES = 20;

interface ValidationSummaryProps {
  report: ModelValidationReport;
  className?: string;
}

/**
 * AAS 모델의 SDK 검증 결과를 읽기 전용으로 표시한다.
 *
 * - 상단: 한 줄 요약 배지 (✓ Valid / ⚠ Warnings: N / ✕ Errors: N)
 * - 하단(접이식): 상위 20개 이슈의 severity / message / path
 *
 * 이 컴포넌트는 어떤 편집 상태도 변경하지 않는다(정보 제공 전용).
 */
export default function ValidationSummary({ report, className }: ValidationSummaryProps) {
  const { t } = useLanguage();
  const { parsed, errorCount, warningCount, issues } = report;

  const tone: "valid" | "warning" | "error" = !parsed
    ? "error"
    : warningCount > 0
      ? "warning"
      : "valid";

  const visibleIssues = issues.slice(0, MAX_VISIBLE_ISSUES);
  const hiddenCount = Math.max(0, issues.length - visibleIssues.length);

  return (
    <div className={cn("rounded-xl border bg-white", toneBorder[tone], className)}>
      {/* ── Summary header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <SummaryIcon tone={tone} />
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", toneText[tone])}>
            {tone === "valid" && t("Valid")}
            {tone === "warning" && `${t("Warnings")}: ${warningCount}`}
            {tone === "error" && (errorCount > 0 ? `${t("Errors")}: ${errorCount}` : t("Invalid"))}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {tone === "valid" && t("Conforms to the AAS metamodel.")}
            {tone === "warning" &&
              t("Deserialized successfully. Metamodel constraints were not fully satisfied.")}
            {tone === "error" && t("The structure could not be parsed as a valid AAS.")}
          </p>
        </div>
      </div>

      {/* ── Detail panel (collapsible) ── */}
      {issues.length > 0 && (
        <div className="border-t border-zinc-100 px-2">
          <Accordion>
            <AccordionItem value="issues" className="border-b-0">
              <AccordionTrigger className="px-2 text-xs font-medium text-zinc-500 hover:no-underline">
                {t("View details")} ({Math.min(issues.length, MAX_VISIBLE_ISSUES)}
                {hiddenCount > 0 ? ` ${t("of")} ${issues.length}` : ""})
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <ul className="flex flex-col gap-1.5 pb-1">
                  {visibleIssues.map((issue, idx) => (
                    <IssueRow key={`${issue.path}-${idx}`} issue={issue} />
                  ))}
                </ul>
                {hiddenCount > 0 && (
                  <p className="text-xs text-zinc-400 px-2 pb-1">
                    {`+ ${hiddenCount} ${t("more not shown")}`}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: ClassifiedIssue }) {
  const isError = issue.severity === "error";
  return (
    <li className="flex items-start gap-2 rounded-lg bg-zinc-50 px-2.5 py-2">
      <span
        className={cn(
          "mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          isError
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        )}
      >
        {issue.severity}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-700 break-words leading-relaxed">{issue.message}</p>
        {issue.path && (
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400 break-all">{issue.path}</p>
        )}
      </div>
    </li>
  );
}

function SummaryIcon({ tone }: { tone: "valid" | "warning" | "error" }) {
  if (tone === "valid")
    return <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" aria-hidden />;
  if (tone === "warning")
    return <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" aria-hidden />;
  return <XCircle className="w-5 h-5 shrink-0 text-red-500" aria-hidden />;
}

const toneBorder: Record<"valid" | "warning" | "error", string> = {
  valid: "border-emerald-200",
  warning: "border-amber-200",
  error: "border-red-200",
};

const toneText: Record<"valid" | "warning" | "error", string> = {
  valid: "text-emerald-700",
  warning: "text-amber-700",
  error: "text-red-700",
};
