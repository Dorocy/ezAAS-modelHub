"use client";

import Link from "next/link";
import useSWR from "swr";
import { getPublishedModel } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateToDotYMD } from "@/utils";
import { StatusBadge } from "@/components/feature/shared/ResourceListShell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Gauge, FileDown } from "lucide-react";

type ModelType = "aasmodel" | "submodel";

const MATURITY_DESC: Record<string, string> = {
  "L0 Minimal": "식별자만 존재하는 최소 형태. 운영 활용 불가.",
  "L1 Descriptive": "기본 메타데이터/설명 정보가 갖춰진 정적 모델.",
  "L2 Operational": "운영 데이터 연계가 가능한 표준 준수 모델.",
  "L3 Analytical": "분석/시뮬레이션에 활용 가능한 데이터 품질 확보.",
  "L4 AI Applicable": "AI 학습/추론에 바로 사용 가능한 최고 성숙도.",
};

function normalizeOne(res: any) {
  if (Array.isArray(res)) return res[0];
  if (Array.isArray(res?.data)) return res.data[0];
  if (Array.isArray(res?.list)) return res.list[0];
  return res?.data ?? res;
}

export default function DistributeDetailView({
  modelType,
  targetSeq,
}: {
  modelType: ModelType;
  targetSeq: string;
}) {
  const { t } = useLanguage();
  const { data, isLoading } = useSWR(
    ["published-model", modelType, targetSeq],
    () => getPublishedModel({ modelType, target_seq: targetSeq })
  );

  const model = normalizeOne(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          배포 모델을 찾을 수 없습니다.
        </p>
        <Link
          href={ROUTES.DISTRIBUTE.LIST}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
        >
          목록으로
        </Link>
      </div>
    );
  }

  const maturity: string = model.aas_maturity_level ?? "";
  const fields: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: "Template Name", value: model.target_name ?? "—" },
    { label: "Category", value: model.category_name ?? "—" },
    { label: "Template ID", value: model.tmp_seman_id ?? "—", mono: true },
    {
      label: "Version",
      value: model.target_version ? `v${model.target_version}` : "—",
    },
    { label: "Creator", value: model.draft_user_nm ?? model.creator ?? "—" },
    { label: "Published By", value: model.published_user_nm ?? "—" },
    {
      label: "Published Date",
      value: model.last_mod_date
        ? formatDateToDotYMD(model.last_mod_date).replaceAll(".", "-")
        : "—",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <Link
            href={ROUTES.DISTRIBUTE.LIST}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="size-3.5" />
            Publish List
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {model.target_name}
              </h1>
              <Badge variant={modelType === "aasmodel" ? "default" : "secondary"}>
                {modelType === "aasmodel" ? "AAS" : "Submodel"}
              </Badge>
              <StatusBadge status={model.status} label={model.status_nm ?? model.status} />
            </div>
            <Link
              href={ROUTES.DISTRIBUTE.EDIT({ modelType, targetSeq })}
              className={buttonVariants({ size: "sm" })}
            >
              <Pencil data-icon="inline-start" />
              {t("Edit")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6 space-y-6">
        {/* Maturity highlight */}
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {t("Maturity Level")}
            </span>
          </div>
          {maturity ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="text-sm px-3 py-1">{maturity}</Badge>
              <span className="text-sm text-muted-foreground">
                {MATURITY_DESC[maturity] ? t(MATURITY_DESC[maturity]) : ""}
              </span>
            </div>
          ) : (
            <p className="text-sm text-amber-600">
              {t("No maturity level has been assigned yet.")}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="rounded-xl border border-border bg-background p-5">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-muted-foreground">
                  {f.label}
                </dt>
                <dd
                  className={cn(
                    "text-sm text-foreground break-all",
                    f.mono && "font-mono text-xs"
                  )}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          {model.guide_filename && (
            <a
              href={model.guide_realpath ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <FileDown className="size-3.5" />
              {model.guide_filename}
            </a>
          )}

          {model.description && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t("Description")}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {model.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href={ROUTES.DISTRIBUTE.LIST}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("Back to list")}
          </Link>
        </div>
      </div>
    </div>
  );
}
