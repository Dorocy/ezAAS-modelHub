"use client";

import VideoEmbed from "@/components/feature/app/VideoEmbed";
import { ROUTES } from "@/constants/routes";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import {
  LayoutTemplate,
  Puzzle,
  Layers,
  ArrowRight,
  FileStack,
  Activity,
  Cpu,
  Box,
  Boxes,
} from "lucide-react";

export default function HomeContent({
  aasCount,
  smCount,
}: {
  aasCount: number;
  smCount: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="min-h-full bg-background">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-14">
            {/* 왼쪽: 제목 + 설명 + stat + CTA */}
            <div className="flex flex-col gap-6 lg:w-[44%] shrink-0">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 tracking-wide">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                {t("IEC 63278 · AAS Part 1&2 compliant")}
              </span>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.12]">
                  Asset Administration
                  <br />
                  <span className="text-blue-600">Shell</span> Model Hub
                </h1>
                <p className="mt-4 text-base text-zinc-500 leading-relaxed">
                  {t(
                    "Centrally manage AAS templates and submodels, and create digital twin instances with no code.",
                  )}
                </p>
              </div>

              {/* stat 숫자 */}
              <div className="flex gap-px rounded-xl overflow-hidden border border-zinc-200 w-fit">
                {[
                  { label: t("AAS Templates"), value: aasCount, href: "/aas" },
                  { label: t("Submodel Templates"), value: smCount, href: "/submodel" },
                ].map((s, i) => (
                  <Link
                    key={i}
                    href={s.href}
                    className="group flex flex-col items-center gap-0.5 px-5 py-3.5 bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-2xl font-bold tabular-nums text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {s.value.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                      {s.label}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/aas"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  {t("Browse templates")} <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={ROUTES.INSTANCE.CREATE}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {t("Create an instance")}
                </Link>
              </div>
            </div>

            {/* 오른쪽: 소개 영상 */}
            <div className="flex-1 min-w-0">
              <VideoEmbed src="https://www.youtube.com/embed/n4IDBR2C1CY" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── AAS가 처음이신가요? 개념 설명 ──────────────────────── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-12 lg:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
              {t("New to AAS?")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900">
              {t("Just three concepts to know")}
            </h2>
            <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
              {t(
                "An Asset Administration Shell (AAS) is an international standard for digitally representing real assets like machines and products. Follow the steps below.",
              )}
            </p>
          </div>

          {/* 3단계 흐름: 설계도 → 부품 → 실제 제품 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            {/* STEP 1 - 템플릿 */}
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <LayoutTemplate className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    {t("Step 1 · Template")}
                  </p>
                  <p className="text-sm font-bold text-zinc-900">
                    {t("AAS Template = Blueprint")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t(
                  "A blank form (blueprint) that predefines what information an asset will hold. e.g. a \"Motor\" template has fields for manufacturer and rated power.",
                )}
              </p>
            </div>

            {/* 화살표 */}
            <div className="hidden items-center justify-center md:flex">
              <ArrowRight className="size-5 text-zinc-300" />
            </div>

            {/* STEP 2 - 서브모델 */}
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Puzzle className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    {t("Step 2 · Submodel")}
                  </p>
                  <p className="text-sm font-bold text-zinc-900">
                    {t("Submodel = Building block")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t(
                  "Reusable parts that make up the blueprint. e.g. combine blocks like \"Technical Data\" and \"Identification\".",
                )}
              </p>
            </div>

            {/* 화살표 */}
            <div className="hidden items-center justify-center md:flex">
              <ArrowRight className="size-5 text-zinc-300" />
            </div>

            {/* STEP 3 - 인스턴스 */}
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Box className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    {t("Step 3 · Instance")}
                  </p>
                  <p className="text-sm font-bold text-zinc-900">
                    {t("Instance = Real product")}
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t(
                  "A real product's digital twin, created by filling the blueprint (template) with actual values. No code — just fill in the fields.",
                )}
              </p>
            </div>
          </div>

          {/* 비유 한 줄 요약 */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
            <Boxes className="mt-0.5 size-5 shrink-0 text-zinc-400" />
            <p className="text-sm text-zinc-600 leading-relaxed">
              {t(
                "In short — a template is a cookie \"mold\", a submodel is the \"pieces\" that make up the mold, and an instance is the \"actual cookie\" stamped out by the mold. Browse templates first, then pick one and create an instance.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 섹션 네비게이션 ─────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-xl px-6 lg:px-10 py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            {t("Get started")}
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900">
            {t("What would you like to do?")}
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
          {[
            {
              num: "01",
              href: "/aas",
              icon: LayoutTemplate,
              title: t("Browse AAS Templates"),
              desc: t(
                "Define the full structure of an Asset Administration Shell. Browse standard-based templates with submodels and concept dictionaries.",
              ),
              count: aasCount,
              countLabel: t(" templates"),
              cta: t("Browse"),
              accent: "group-hover:text-blue-600",
              bg: "group-hover:bg-blue-50/40",
              dot: "bg-blue-500",
            },
            {
              num: "02",
              href: "/submodel",
              icon: Puzzle,
              title: t("Browse Submodels"),
              desc: t(
                "Browse reusable submodel blocks and combine them into AAS templates to build your own structure.",
              ),
              count: smCount,
              countLabel: t(" submodels"),
              cta: t("Browse"),
              accent: "group-hover:text-indigo-600",
              bg: "group-hover:bg-indigo-50/40",
              dot: "bg-indigo-500",
            },
            {
              num: "03",
              href: ROUTES.INSTANCE.CREATE,
              icon: Layers,
              title: t("Create an instance"),
              desc: t(
                "Pick a template and just fill in the fields. Build a digital twin of a real asset with no code.",
              ),
              cta: t("Create"),
              accent: "group-hover:text-emerald-600",
              bg: "group-hover:bg-emerald-50/40",
              dot: "bg-emerald-500",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.num}
                href={item.href}
                className={`group flex flex-col gap-6 p-8 transition-colors ${item.bg}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-300">{item.num}</span>
                  <Icon className={`size-5 text-zinc-300 transition-colors ${item.accent}`} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className={`text-lg font-bold text-zinc-900 transition-colors ${item.accent}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-end justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    {item.count != null ? (
                      <>
                        <span className={`size-1.5 rounded-full ${item.dot}`} />
                        {item.count.toLocaleString()}
                        {item.countLabel}
                      </>
                    ) : null}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold text-zinc-400 transition-all ${item.accent} group-hover:gap-2`}
                  >
                    {item.cta} <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── 짙은 배경 특징 섹션 ────────────────────────────────── */}
      <section className="bg-zinc-900">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                {t("Platform features")}
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">
                {t("Make digital twin building easier")}
              </h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              {t(
                "A platform designed so anyone can handle the complex AAS standard structure with ease.",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-700/50 rounded-2xl overflow-hidden">
            {[
              {
                icon: FileStack,
                title: t("Standard-based templates"),
                body: t(
                  "Templates that comply with the IEC 63278 AAS standard. Classified by asset type so you can quickly find the structure you need.",
                ),
                tag: "IEC 63278",
              },
              {
                icon: Activity,
                title: t("No-code instance creation"),
                body: t(
                  "Select a template and fill in the fields to produce a complete AAS instance. Understand each field instantly with the concept dictionary.",
                ),
                tag: "No-Code",
              },
              {
                icon: Cpu,
                title: t("REST API integration"),
                body: t(
                  "Created instances integrate freely with external systems via REST API, exchanging data in a standard format.",
                ),
                tag: "REST API",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex flex-col gap-6 bg-zinc-800/60 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-700">
                      <Icon className="size-4 text-zinc-300" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
                      {f.tag}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-white">{f.title}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
