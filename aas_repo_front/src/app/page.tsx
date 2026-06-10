import { getPublishedCount } from "@/api";
// 검색 섹션 숨김 처리 중. 되살리려면 아래 import 와 본문의 <AASSearchBar /> 섹션 주석을 함께 해제한다.
// import AASSearchBar from "@/components/feature/app/AASSearchBar";
import VideoEmbed from "@/components/feature/app/VideoEmbed";
import { ROUTES } from "@/constants/routes";
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

export const metadata = { title: "KETI ezAAS Model Hub" };
export const dynamic = "force-dynamic";

export default async function Home() {
  let aasCount = 0;
  let smCount  = 0;

  try {
    const raw = await getPublishedCount();
    const list: Array<{ ty: string; cnt: number }> = Array.isArray(raw) ? raw : [];
    aasCount = list.find((r) => r.ty === "aasmodel")?.cnt ?? 0;
    smCount  = list.find((r) => r.ty === "submodel")?.cnt ?? 0;
  } catch {
    // backend unreachable
  }

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
                IEC 63278 · AAS Part 1&amp;2 준수
              </span>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.12]">
                  Asset Administration
                  <br />
                  <span className="text-blue-600">Shell</span> Model Hub
                </h1>
                <p className="mt-4 text-base text-zinc-500 leading-relaxed">
                  AAS 템플릿과 서브모델을 중앙에서 관리하고,
                  노코드 방식으로 디지털 트윈 인스턴스를 생성합니다.
                </p>
              </div>

              {/* stat 숫자 */}
              <div className="flex gap-px rounded-xl overflow-hidden border border-zinc-200 w-fit">
                {[
                  { label: "AAS 템플릿",     value: aasCount,  href: "/aas" },
                  { label: "서브모델 템플릿", value: smCount,   href: "/submodel" },
                ].map((s, i) => (
                  <Link
                    key={i}
                    href={s.href}
                    className="group flex flex-col items-center gap-0.5 px-5 py-3.5 bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-2xl font-bold tabular-nums text-zinc-900 group-hover:text-blue-600 transition-colors">
                      {s.value.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">{s.label}</span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/aas"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  템플릿 탐색 <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={ROUTES.INSTANCE.CREATE}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  인스턴스 만들기
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

      {/* ─── 검색 (일단 숨김 처리. 다시 보이려면 아래 주석 해제) ──── */}
      {/*
      <section className="border-b border-border bg-zinc-50/60">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-5">
          <AASSearchBar />
        </div>
      </section>
      */}

      {/* ─── AAS가 처음이신가요? 개념 설명 ──────────────────────── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-12 lg:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
              AAS가 처음이신가요?
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900">
              3가지 개념만 알면 됩니다
            </h2>
            <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
              AAS(Asset Administration Shell)는 기계·제품 같은 실제 자산을 디지털로
              표현하는 국제 표준입니다. 아래 순서대로 따라오시면 됩니다.
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
                    Step 1 · 템플릿
                  </p>
                  <p className="text-sm font-bold text-zinc-900">AAS 템플릿 = 설계도</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                자산이 어떤 정보를 담을지 미리 정해 둔{" "}
                <span className="font-semibold text-zinc-900">빈 양식(설계도)</span>입니다.
                예: &ldquo;전동기&rdquo; 템플릿에는 제조사·정격출력 칸이 있습니다.
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
                    Step 2 · 서브모델
                  </p>
                  <p className="text-sm font-bold text-zinc-900">서브모델 = 부품 블록</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                설계도를 이루는{" "}
                <span className="font-semibold text-zinc-900">재사용 가능한 부품</span>입니다.
                예: &ldquo;기술 데이터&rdquo;, &ldquo;식별 정보&rdquo; 같은 블록을 조합합니다.
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
                    Step 3 · 인스턴스
                  </p>
                  <p className="text-sm font-bold text-zinc-900">인스턴스 = 실제 제품</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                설계도(템플릿)에 실제 값을 채워 만든{" "}
                <span className="font-semibold text-zinc-900">진짜 제품의 디지털 트윈</span>입니다.
                코드 없이 칸만 채우면 완성됩니다.
              </p>
            </div>
          </div>

          {/* 비유 한 줄 요약 */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
            <Boxes className="mt-0.5 size-5 shrink-0 text-zinc-400" />
            <p className="text-sm text-zinc-600 leading-relaxed">
              <span className="font-semibold text-zinc-900">쉽게 말하면</span> — 템플릿은
              과자 &ldquo;틀&rdquo;, 서브모델은 틀을 이루는 &ldquo;조각&rdquo;,
              인스턴스는 그 틀로 찍어낸 &ldquo;실제 과자&rdquo;입니다.
              먼저 템플릿을 둘러본 뒤, 마음에 드는 걸 골라 인스턴스를 만들어 보세요.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 섹션 네비게이션 ─────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-xl px-6 lg:px-10 py-12 lg:py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">시작하기</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900">무엇을 하고 싶으신가요?</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
          {[
            {
              num: "01",
              href: "/aas",
              icon: LayoutTemplate,
              title: "AAS 템플릿 탐색",
              desc: "Asset Administration Shell의 전체 구조를 정의합니다. 서브모델·개념 사전이 포함된 표준 기반 템플릿을 탐색하세요.",
              count: aasCount,
              countLabel: "개 템플릿",
              cta: "탐색하기",
              accent: "group-hover:text-blue-600",
              bg: "group-hover:bg-blue-50/40",
              dot: "bg-blue-500",
            },
            {
              num: "02",
              href: "/submodel",
              icon: Puzzle,
              title: "서브모델 탐색",
              desc: "재사용 가능한 서브모델 블록을 탐색하고 AAS 템플릿에 조합해 나만의 구조를 만드세요.",
              count: smCount,
              countLabel: "개 서브모델",
              cta: "탐색하기",
              accent: "group-hover:text-indigo-600",
              bg: "group-hover:bg-indigo-50/40",
              dot: "bg-indigo-500",
            },
            {
              num: "03",
              href: ROUTES.INSTANCE.CREATE,
              icon: Layers,
              title: "인스턴스 생성",
              desc: "템플릿을 골라 필드를 채우기만 하면 완성됩니다. 코드 없이 실제 자산의 디지털 트윈을 만드세요.",
              cta: "만들기",
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
                  <h3 className={`text-lg font-bold text-zinc-900 transition-colors ${item.accent}`}>{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-end justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    {item.count != null ? (
                      <>
                        <span className={`size-1.5 rounded-full ${item.dot}`} />
                        {item.count.toLocaleString()}{item.countLabel}
                      </>
                    ) : null}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold text-zinc-400 transition-all ${item.accent} group-hover:gap-2`}>
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
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">플랫폼 특징</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white">
                디지털 트윈 구축을<br />더 쉽게
              </h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              복잡한 AAS 표준 구조를 누구나 쉽게 다룰 수 있도록 설계된 플랫폼입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-700/50 rounded-2xl overflow-hidden">
            {[
              {
                icon: FileStack,
                title: "표준 기반 템플릿",
                body: "IEC 63278 AAS 표준을 준수하는 템플릿을 제공합니다. 자산 유형별로 분류되어 빠르게 원하는 구조를 찾을 수 있습니다.",
                tag: "IEC 63278",
              },
              {
                icon: Activity,
                title: "���코드 인스턴스 생성",
                body: "템플릿을 선���하고 필드를 채우기만 하면 완성��� AAS 인스턴스가 만들어집니다. 개념 사전으로 각 필드를 바로 이해하세요.",
                tag: "No-Code",
              },
              {
                icon: Cpu,
                title: "REST API 연동",
                body: "생성된 인스턴스는 REST API로 외부 시스템과 자유롭게 연동할 수 있습니다. 표준 포맷으로 데이터를 주고받습니다.",
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
