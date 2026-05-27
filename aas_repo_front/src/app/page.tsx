import { getPublishedCount } from "@/api";
import AASSearchBar from "@/components/feature/app/AASSearchBar";
import Link from "next/link";
import {
  LayoutTemplate,
  Puzzle,
  Layers,
  ArrowRight,
  BookOpen,
  Cpu,
  ChevronRight,
} from "lucide-react";

export const metadata = { title: "KETI ezAAS Model Hub" };
export const dynamic = "force-dynamic";

export default async function Home() {
  let aasCount = 0;
  let smCount = 0;
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

  const stats = [
    { label: "AAS 템플릿",      value: aasCount,  href: "/aas",      icon: LayoutTemplate },
    { label: "서브모델 템플릿",  value: smCount,   href: "/submodel", icon: Puzzle },
    { label: "AAS 인스턴스",    value: insCount,  href: "/instance", icon: Layers },
    { label: "게시된 전체",     value: aasCount + smCount + insCount, href: "/aas", icon: BookOpen },
  ];

  const quickActions = [
    {
      href: "/aas",
      icon: LayoutTemplate,
      title: "AAS 템플릿 탐색",
      description: "산업 자산에 맞는 AAS 템플릿을 찾아 인스턴스를 생성하세요.",
      cta: "템플릿 보기",
      accent: "bg-blue-50 text-blue-600 border-blue-100",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      href: "/submodel",
      icon: Puzzle,
      title: "서브모델 템플릿",
      description: "표준화된 서브모델 구조를 탐색하고 재사용 가능한 컴포넌트를 활용하세요.",
      cta: "서브모델 보기",
      accent: "bg-violet-50 text-violet-600 border-violet-100",
      iconBg: "bg-violet-100 text-violet-600",
    },
    {
      href: "/instance",
      icon: Layers,
      title: "인스턴스 관리",
      description: "실제 자산에 대한 AAS 인스턴스를 생성하고 데이터를 입력하세요.",
      cta: "인스턴스 보기",
      accent: "bg-emerald-50 text-emerald-600 border-emerald-100",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-full bg-zinc-50/40">
      <div className="mx-auto max-w-screen-xl px-6 py-8 lg:px-10 lg:py-10 flex flex-col gap-10">

        {/* ── 환영 헤더 ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            ezAAS Model Hub
          </h1>
          <p className="text-sm text-zinc-500">
            산업용 디지털 트윈을 위한 AAS 템플릿 및 인스턴스 통합 관리 플랫폼입니다.
          </p>
        </div>

        {/* ── Stat 카드 ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href + s.label}
                href={s.href}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">{s.label}</span>
                  <Icon className="size-4 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
                </div>
                <span className="text-3xl font-bold text-zinc-900 tabular-nums">
                  {s.value.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── 검색 ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">검색</p>
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
            <AASSearchBar />
          </div>
        </div>

        {/* ── 빠른 시작 ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">빠른 시작</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  <div className={`flex size-10 items-center justify-center rounded-lg ${action.iconBg}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{action.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{action.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors">
                    {action.cta}
                    <ChevronRight className="size-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 플랫폼 소개 ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">플랫폼 소개</p>
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* 텍스트 */}
              <div className="flex flex-col gap-4 p-6 lg:p-8 lg:flex-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1.5">
                    Industrial Digital Twin
                  </p>
                  <h2 className="text-xl font-bold text-zinc-900 leading-snug">
                    Asset Administration Shell<br />기반의 디지털 트윈 허브
                  </h2>
                  <p className="mt-2.5 text-sm text-zinc-500 leading-relaxed max-w-sm">
                    AAS 표준을 준수하는 템플릿을 중앙에서 관리하고,
                    노코드 방식으로 실제 자산의 인스턴스를 생성할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/aas"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                  >
                    시작하기 <ArrowRight className="size-3.5" />
                  </Link>
                  <a
                    href="https://www.youtube.com/embed/n4IDBR2C1CY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    소개 영상 <Cpu className="size-3.5" />
                  </a>
                </div>
              </div>

              {/* 기능 목록 */}
              <div className="border-t border-zinc-100 lg:border-t-0 lg:border-l lg:w-72">
                {[
                  { icon: LayoutTemplate, title: "중앙 집중 템플릿 관리", desc: "모든 AAS·서브모델 템플릿을 한곳에서 버전 관리" },
                  { icon: Layers,         title: "노코드 인스턴스 생성",  desc: "템플릿을 선택하고 값만 입력하면 인스턴스 완성" },
                  { icon: Cpu,            title: "REST API 완전 지원",   desc: "기존 시스템과 API로 손쉽게 연동 가능" },
                ].map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-zinc-100 last:border-b-0">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100">
                        <Icon className="size-3.5 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{f.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
