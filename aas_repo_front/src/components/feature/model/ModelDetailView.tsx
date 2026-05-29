"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getModel } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { addValuePaths, parsingAAS } from "@/utils/aas";
import TemplateBlueprint from "@/components/feature/instance/TemplateBlueprint";
import { StatusBadge } from "@/components/feature/shared/ResourceListShell";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileStack, Layers, Lock, FilePlus, FileDown } from "lucide-react";

type ModelType = "aasmodel" | "submodel";

interface FieldDef {
  label: string;
  key: string;
  mono?: boolean;
}

const FIELD_CONFIG: Record<ModelType, FieldDef[]> = {
  aasmodel: [
    { label: "AAS ID", key: "aasmodel_id", mono: true },
    { label: "Template ID", key: "aasmodel_template_id", mono: true },
    { label: "Version", key: "version" },
    { label: "Category", key: "category_name" },
    { label: "Asset Type", key: "asset_type" },
    { label: "Maturity Level", key: "aas_maturity_level" },
    { label: "Creator", key: "creator" },
    { label: "Guide File", key: "guide_filename" },
  ],
  submodel: [
    { label: "Submodel ID", key: "submodel_id", mono: true },
    { label: "Semantic ID", key: "submodel_semantic_id", mono: true },
    { label: "Template ID", key: "submodel_template_id", mono: true },
    { label: "Version", key: "submodel_version" },
    { label: "Category", key: "category_name" },
    { label: "Type", key: "submodel_type" },
    { label: "Creator", key: "creator" },
    { label: "Guide File", key: "guide_filename" },
  ],
};

const META: Record<ModelType, { icon: React.ElementType; nameKey: string; listRoute: string; listLabel: string }> = {
  aasmodel: { icon: FileStack, nameKey: "aasmodel_name", listRoute: ROUTES.AASMODEL.LIST, listLabel: "AAS Templates" },
  submodel: { icon: Layers, nameKey: "submodel_name", listRoute: ROUTES.SUBMODEL.LIST, listLabel: "Submodel Templates" },
};

interface ModelDetailViewProps {
  modelType: ModelType;
  modelSeq: string;
}

export default function ModelDetailView({ modelType, modelSeq }: ModelDetailViewProps) {
  const meta = META[modelType];
  const Icon = meta.icon;

  const { data, isLoading, error } = useSWR(
    [`${modelType}-detail`, modelSeq],
    () => getModel({ modelType, modelSeq })
  );

  const model: any = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data;

  const treeData = useMemo(() => {
    const metadata = model?.metadata;
    if (!metadata) return undefined;
    try {
      return parsingAAS(addValuePaths({ ...metadata }));
    } catch (e) {
      console.error("[v0] failed to parse template metadata", e);
      return undefined;
    }
  }, [model]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl">
          <Link
            href={meta.listRoute}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {meta.listLabel}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-zinc-900 truncate">
                    {isLoading ? "Loading..." : model?.[meta.nameKey] || "Untitled"}
                  </h1>
                  {model?.status && <StatusBadge status={model.status} label={model.status} />}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-zinc-100 border-zinc-200 text-zinc-500">
                    <Lock className="w-3 h-3" />
                    Read-only template
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed line-clamp-2 max-w-2xl">
                  {model?.description || "No description provided."}
                </p>
              </div>
            </div>

            {modelType === "aasmodel" && model && (
              <Link
                href={`${ROUTES.INSTANCE.CREATE}?modelSeq=${modelSeq}`}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                <FilePlus className="w-3.5 h-3.5 mr-1.5" />
                Create instance
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            Failed to load this template. Please check your connection and try again.
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-1" />
            <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* ── Metadata panel ── */}
            <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Details
              </h2>
              <dl className="space-y-3">
                {FIELD_CONFIG[modelType].map((f) => {
                  const value = model?.[f.key];
                  if (value === undefined || value === null || value === "") return null;
                  return (
                    <div key={f.key} className="flex flex-col gap-0.5">
                      <dt className="text-[11px] font-medium text-zinc-400">{f.label}</dt>
                      <dd className={cn("text-sm text-zinc-800 break-all", f.mono && "font-mono text-xs")}>
                        {String(value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              {model?.guide_link && (
                <a
                  href={model.guide_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Open guide document
                </a>
              )}
            </div>

            {/* ── Structure panel ── */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Structure
              </h2>
              {treeData ? (
                <TemplateBlueprint treeData={treeData} showValues />
              ) : (
                <p className="text-sm text-zinc-400 py-8 text-center">
                  No structure data available for this template.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
