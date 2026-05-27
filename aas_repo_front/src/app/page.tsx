import { getPublishedCount } from "@/api";
import AASSearchBar from "@/components/feature/app/AASSearchBar";
import Link from "next/link";
import {
  LayoutTemplate,
  Puzzle,
  Layers,
  ArrowRight,
  Cpu,
  FileStack,
  Activity,
} from "lucide-react";

export const metadata = { title: "KETI ezAAS Model Hub" };
export const dynamic = "force-dynamic";

export default async function Home() {
  let aasCount = 0;
  let smCount  = 0;
  let insCount = 0;

  try {
    const raw = await getPublishedCount();
    const list: Array<{ ty: string; cnt: number }> = Array.isArray(raw) ? raw : [];
    aasCount = list.find((r) => r.ty === "aasmodel")?.cnt ?? 0;
    smCount  = list.find((r) => r.ty === "submodel")?.cnt ?? 0;
    insCount = list.find((r) => r.ty === "instance")?.cnt ?? 0;
  } catch {
    // backend unreachable
  }

  return (
    <div className="min-h-full bg-background">

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">

            {/* 왼쪽: 제목 + 설명 + CTA */}
            <div className="flex flex-col gap-6 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 tracking-wide">
                  <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                  IEC 63278 · AAS Part 1&amp;2 준수
                </span>
              </div>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.12]">
                  Asset Administration
                  <br />
                  <span className="text-blue-600">Shell</span> Model Hub
                </h1>
                <p className="mt-4 text-base text-zinc-500 leading-relaxed">
                  AAS 템플릿과 서브모델을 중앙에서 관리하고,<br className="hidden lg:block" />
                  노코드 방식으로 디지털 트윈 인스턴스를 생성합니다.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/aas"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  템플릿 탐색 <ArrowRight className="size-4" />
                </Link>
                <a
                  href="https://www.youtube.com/embed/n4IDBR2C1CY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  소개 영상 <Cpu className="size-4" />
                </a>
              </div>
            </div>

            {/* 오른쪽: stat 숫자 3개 */}
            <div className="flex gap-px rounded-2xl overflow-hidden border border-zinc-200 shrink-0 self-start lg:self-auto">
              {[
                { label: "AAS 템플릿",     value: aasCount,  href: "/aas" },
                { label: "서브모델 템플릿", value: smCount,   href: "/submodel" },
                { label: "AAS 인스턴스",   value: insCount,  href: "/instance" },
              ].map((s, i) => (
                <Link
                  key={i}
                  href={s.href}
                  className="group flex flex-col items-center gap-1 px-8 py-6 bg-white hover:bg-zinc-50 transition-colors min-w-[100px] lg:min-w-[120px]"
                >
                  <span className="text-3xl lg:text-4xl font-bold tabular-nums text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {s.value.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 whitespace-nowrap">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 검색 ────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-zinc-50/60">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-5">
          <AASSearchBar />
        </div>
      </section>

      {/* ─── 3개 섹션 카드 ───────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-xl px-6 lg:px-10 py-10 lg:py-14">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* AAS 템플릿 */}
          <Link
            href="/aas"
            className="group relative flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100">
                <LayoutTemplate className="size-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold tabular-nums text-zinc-400">{aasCount.toLocaleString()}개</span>
            </div>
            <div className="relative flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-zinc-900">AAS 템플릿</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Asset Administration Shell 구조를 정의하는 표준 템플릿입니다. 서브모델과 개념 설명이 포함됩니다.
              </p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
              탐색하기 <ArrowRight className="size-3.5" />
            </div>
          </Link>

          {/* 서브모델 템플릿 */}
          <Link
            href="/submodel"
            className="group relative flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-purple-100">
                <Puzzle className="size-5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold tabular-nums text-zinc-400">{smCount.toLocaleString()}개</span>
            </div>
            <div className="relative flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-zinc-900">서브모델 템플릿</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                재사용 가능한 서브모델 구조를 탐색하고 AAS 템플릿에 조합해 활용합니다.
              </p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:gap-2 transition-all">
              탐색하기 <ArrowRight className="size-3.5" />
            </div>
          </Link>

          {/* AAS 인스턴스 */}
          <Link
            href="/instance"
            className="group relative flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100">
                <Layers className="size-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold tabular-nums text-zinc-400">{insCount.toLocaleString()}개</span>
            </div>
            <div className="relative flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-zinc-900">AAS 인스턴스</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                실제 자산에 대한 AAS 인스턴스를 생성하고 값을 입력해 디지털 트윈을 완성합니다.
              </p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
              관리하기 <ArrowRight className="size-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 플랫폼 특징 ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-zinc-50/60">
        <div className="mx-auto max-w-screen-xl px-6 lg:px-10 py-10 lg:py-14">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {[
              {
                icon: FileStack,
                color: "text-blue-500 bg-blue-50",
                title: "표준 기반 템플릿",
                body: "IEC 63278 AAS 표준을 준수하는 템플릿을 제공합니다. 자산 유형별로 분류되어 빠르게 원하는 구조를 찾을 수 있습니다.",
              },
              {
                icon: Activity,
                color: "text-emerald-500 bg-emerald-50",
                title: "노코드 인스턴스 생성",
                body: "템플릿을 선택하고 필드를 채우기만 하면 완성된 AAS 인스턴스가 만들어집니다. 코드 없이 디지털 트윈을 구성하세요.",
              },
              {
                icon: Cpu,
                color: "text-purple-500 bg-purple-50",
                title: "REST API 연동",
                body: "생성된 인스턴스는 REST API로 외부 시스템과 자유롭게 연동할 수 있습니다. 표준 포맷으로 데이터를 주고받습니다.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex gap-4 rounded-2xl bg-white border border-zinc-200 p-6">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${f.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-zinc-900">{f.title}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed">{f.body}</p>
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
