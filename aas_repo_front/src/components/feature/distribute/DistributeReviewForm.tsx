"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  getPublishedList,
  getPublishedModel,
  upsertPublishedModel,
} from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { confirmSave } from "@/utils/modal";
import { showToast } from "@/utils/toast";
import { formatDateToDotYMD } from "@/utils";
import { StatusBadge } from "@/components/feature/shared/ResourceListShell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Gauge,
  Inbox,
  Send,
  Info,
} from "lucide-react";

type ModelType = "aasmodel" | "submodel";

/* ────────────────────────────────────────────────────────────────────────────
 * Maturity level — 관리자가 publish 시 반드시 정확하게 부여해야 하는 값.
 * IEC 63278 / IDTA 성숙도 단계와 동일한 단계 정의를 사용한다.
 * ──────────────────────────────────────────────────────────────────────────── */
const MATURITY_LEVELS = [
  {
    value: "L0 Minimal",
    label: "L0 · Minimal",
    desc: "식별자만 존재하는 최소 형태. 운영 활용 불가.",
  },
  {
    value: "L1 Descriptive",
    label: "L1 · Descriptive",
    desc: "기본 메타데이터/설명 정보가 갖춰진 정적 모델.",
  },
  {
    value: "L2 Operational",
    label: "L2 · Operational",
    desc: "운영 데이터 연계가 가능한 표준 준수 모델.",
  },
  {
    value: "L3 Analytical",
    label: "L3 · Analytical",
    desc: "분석/시뮬레이션에 활용 가능한 데이터 품질 확보.",
  },
  {
    value: "L4 AI Applicable",
    label: "L4 · AI Applicable",
    desc: "AI 학습/추론에 바로 사용 가능한 최고 성숙도.",
  },
] as const;

interface DraftRow {
  ty: ModelType | string;
  target_seq: string;
  target_name: string;
  target_version: string | null;
  category_name: string;
  category_seq: number | string;
  tmp_seman_id?: string | null;
  status?: string;
  status_nm?: string;
  create_date?: string;
  last_mod_date?: string;
  draft_user_nm?: string;
  published_user_nm?: string;
  creator?: string;
  description?: string;
  aas_maturity_level?: string;
  guide_filename?: string | null;
  guide_realpath?: string | null;
}

interface DistributeReviewFormProps {
  mode: "create" | "edit";
  /** edit 모드에서 미리 로드된 모델 */
  initialModel?: DraftRow;
  modelType?: ModelType;
  targetSeq?: string;
}

function normalizeList(res: any): DraftRow[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.list)) return res.list;
  return [];
}

export default function DistributeReviewForm({
  mode,
  initialModel,
}: DistributeReviewFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  /* ── 선택된 템플릿 (검토 대상) ────────────────────────────────────────── */
  const selectedRef = useRef<DraftRow | undefined>(initialModel);
  const [selected, setSelected] = useState<DraftRow | undefined>(initialModel);

  /* ── 관리자가 입력/검수하는 publish 정보 ─────────────────────────────── */
  const [maturity, setMaturity] = useState<string>(
    initialModel?.aas_maturity_level ?? ""
  );
  const [status, setStatus] = useState<string>(
    isEdit ? (initialModel?.status ?? "published") : "published"
  );
  const [description, setDescription] = useState<string>(
    initialModel?.description ?? ""
  );
  const [typeFilter, setTypeFilter] = useState<"all" | ModelType>("all");
  const [submitting, setSubmitting] = useState(false);

  /* ── 검토 대기(draft) 목록 — create 모드에서만 ───────────────────────── */
  const { data: draftRes, isLoading: draftsLoading } = useSWR(
    !isEdit ? ["review-drafts", typeFilter] : null,
    () =>
      getPublishedList({
        status: "draft",
        type: typeFilter,
        pageNumber: 1,
        pageSize: 50,
        searchParams: {},
      })
  );
  const drafts = useMemo(() => normalizeList(draftRes), [draftRes]);

  /* ── 선택된 템플릿의 상세(트리/메타) ─────────────────────────────────── */
  const handleSelectDraft = async (row: DraftRow) => {
    try {
      const res = await getPublishedModel({
        modelType: (row.ty as ModelType) ?? "aasmodel",
        target_seq: row.target_seq,
      });
      const detail: DraftRow = normalizeList(res)[0] ?? row;
      selectedRef.current = detail;
      setSelected(detail);
      setMaturity(detail.aas_maturity_level ?? "");
      setDescription(detail.description ?? "");
      setStatus("published");
    } catch {
      selectedRef.current = row;
      setSelected(row);
    }
  };

  const maturityMeta = MATURITY_LEVELS.find((m) => m.value === maturity);

  const canSubmit = !!selected && !!maturity && !submitting;

  const handlePublish = async () => {
    if (!selected) {
      return showToast.error("검토할 템플릿을 먼저 선택하세요.");
    }
    // Maturity level 은 publish 의 필수 항목 — 정확히 부여하도록 강제
    if (status === "published" && !maturity) {
      return showToast.warning("Maturity level 을 정확하게 부여해야 합니다.");
    }

    const confirmMsg =
      status === "published"
        ? `'${selected.target_name}' 템플릿을 [${maturityMeta?.label ?? maturity}] 성숙도로 Publish 하시겠습니까?`
        : `'${selected.target_name}' 템플릿 상태를 '${status}' 로 변경하시겠습니까?`;

    if (!(await confirmSave(confirmMsg))) return;

    const body: Record<string, unknown> = {
      ...selectedRef.current,
      ...selected,
      status,
      description,
      aas_maturity_level: maturity,
    };
    if (selected.target_version) body.version = selected.target_version;

    try {
      setSubmitting(true);
      await upsertPublishedModel({
        method: isEdit ? "PUT" : "POST",
        body,
        withToast: true,
      });
      showToast.success(
        status === "published" ? "Publish 되었습니다." : "상태가 변경되었습니다."
      );
      router.push(
        ROUTES.DISTRIBUTE.VIEW({
          modelType: (selected.ty as ModelType) ?? "aasmodel",
          targetSeq: selected.target_seq,
        })
      );
    } catch {
      showToast.error("처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
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
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Publish {isEdit ? "Review · Edit" : "Review"}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                사용자가 등록한 AAS / Submodel 템플릿을 검토하고 성숙도를 부여하여
                배포합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* ── 검토 대기 목록 (create 전용) ── */}
          {!isEdit && (
            <div className="lg:col-span-2 rounded-xl border border-border bg-background">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Pending Review
                  </h2>
                  <Badge variant="secondary" className="text-[11px]">
                    {drafts.length}
                  </Badge>
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter((v ?? "all") as any)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="aasmodel">AAS</SelectItem>
                    <SelectItem value="submodel">Submodel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[460px] overflow-auto">
                {draftsLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Type</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead className="w-16">Ver</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drafts.map((row) => {
                        const isActive =
                          selected?.target_seq === row.target_seq &&
                          selected?.ty === row.ty;
                        return (
                          <TableRow
                            key={`${row.ty}-${row.target_seq}`}
                            data-state={isActive ? "selected" : undefined}
                          >
                            <TableCell>
                              <Badge
                                variant={
                                  row.ty === "aasmodel" ? "default" : "secondary"
                                }
                                className="text-[11px]"
                              >
                                {row.ty === "aasmodel" ? "AAS" : "Submodel"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <span className="block truncate max-w-[160px]">
                                {row.target_name}
                              </span>
                              <span className="block text-[11px] text-muted-foreground truncate max-w-[160px]">
                                {row.category_name}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {row.target_version ? `v${row.target_version}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={isActive ? "default" : "outline"}
                                onClick={() => handleSelectDraft(row)}
                              >
                                {isActive ? "선택됨" : "검토"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {drafts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-28 text-center text-sm text-muted-foreground"
                          >
                            검토 대기 중인 템플릿이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* ── Publish 정보 입력 ── */}
          <div className={cn("rounded-xl border border-border bg-background", isEdit ? "lg:col-span-5" : "lg:col-span-3")}>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Publish Info
              </h2>
              {selected?.ty && (
                <Badge variant={selected.ty === "aasmodel" ? "default" : "secondary"}>
                  {String(selected.ty).toUpperCase()}
                </Badge>
              )}
            </div>

            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
                <Inbox className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  좌측 목록에서 검토할 템플릿을 선택하세요.
                </p>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* 읽기 전용 메타 정보 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadField label="Template Name" value={selected.target_name} />
                  <ReadField label="Category" value={selected.category_name} />
                  <ReadField
                    label="Template ID"
                    value={selected.tmp_seman_id ?? "—"}
                    mono
                  />
                  <ReadField
                    label="Version"
                    value={selected.target_version ? `v${selected.target_version}` : "—"}
                  />
                  <ReadField
                    label="Creator"
                    value={selected.creator ?? selected.draft_user_nm ?? "—"}
                  />
                  <ReadField
                    label="Submitted Date"
                    value={
                      selected.create_date
                        ? formatDateToDotYMD(selected.create_date).replaceAll(".", "-")
                        : "—"
                    }
                  />
                </div>

                {selected.guide_filename ? (
                  <a
                    href={selected.guide_realpath ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <FileDown className="size-3.5" />
                    {selected.guide_filename}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No guide file attached.</p>
                )}

                <div className="h-px bg-border" />

                {/* ── Maturity Level (필수, 정확히 부여) ── */}
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gauge className="size-4 text-primary" />
                    <Label htmlFor="maturity" className="text-sm font-semibold">
                      Maturity Level <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <Select value={maturity} onValueChange={(v) => setMaturity(v ?? "")}>
                    <SelectTrigger id="maturity" className="w-full">
                      <SelectValue placeholder="성숙도 단계를 정확하게 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATURITY_LEVELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {maturityMeta ? (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      {maturityMeta.desc}
                    </p>
                  ) : (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-600">
                      <Info className="mt-0.5 size-3.5 shrink-0" />
                      배포(Publish) 전 관리자가 성숙도 단계를 반드시 평가/부여해야 합니다.
                    </p>
                  )}
                </div>

                {/* ── Status ── */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Decision (Status)</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v ?? "published")}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published (배포)</SelectItem>
                        <SelectItem value="deprecated">Deprecated (보류/폐기)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>현재 상태:</span>
                      <StatusBadge status={selected.status} label={selected.status_nm ?? selected.status} />
                    </div>
                  </div>
                </div>

                {/* ── Description ── */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description / Review Note
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="검토 의견이나 배포 설명을 입력하세요."
                    className="mt-1.5 min-h-24"
                  />
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                  <Link
                    href={ROUTES.DISTRIBUTE.LIST}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Cancel
                  </Link>
                  <Button
                    size="sm"
                    onClick={handlePublish}
                    disabled={!canSubmit}
                  >
                    {status === "published" ? (
                      <>
                        <CheckCircle2 data-icon="inline-start" />
                        {isEdit ? "Save & Publish" : "Approve & Publish"}
                      </>
                    ) : (
                      <>
                        <Send data-icon="inline-start" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-foreground break-all", mono && "font-mono text-xs")}>
        {value || "—"}
      </span>
    </div>
  );
}
