import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Rocket,
  PlugZap,
  ArrowRight,
  ArrowUpRight,
  PlayCircle,
  FileText,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export const metadata = { title: "About · KETI ezAAS Model Hub" };

const CAPABILITIES = [
  {
    icon: BookOpen,
    title: "Unified template management",
    desc: "All domestically developed AAS templates live in one repository. A single source of truth for building standardized, reusable type templates.",
    tag: "Repository",
  },
  {
    icon: ShieldCheck,
    title: "Standard compliance, verified",
    desc: "Only versions adhering to the official specification are accepted. Conformance with AAS Metamodel v3.0 and IDTA templates is checked automatically.",
    tag: "AAS v3.0",
  },
  {
    icon: Rocket,
    title: "Instant instance deployment",
    desc: "Feed real asset data into a registered template and publish a live instance on the repository server in minutes — no integration overhead.",
    tag: "No-Code",
  },
  {
    icon: PlugZap,
    title: "Scalable RESTful API",
    desc: "Open, standardized REST endpoints let external manufacturing IT systems query templates and instances for broad ecosystem compatibility.",
    tag: "Open API",
  },
];

const META = [
  { value: "v3.0", label: "AAS Metamodel" },
  { value: "IDTA", label: "Verified" },
  { value: "REST", label: "Open API" },
  { value: "24/7", label: "On-Server" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header (shared shell) ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl">
          <h1 className="text-lg font-bold text-zinc-900">About</h1>
          <nav className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <Link href={ROUTES.HOME} className="hover:text-zinc-900">
              Home
            </Link>
            <span>/</span>
            <span>About</span>
          </nav>
        </div>
      </div>

      {/* ── Hero: full-width editorial statement ── */}
      <section className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-screen-xl px-6 py-16 lg:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Asset Administration Shell Repository
          </span>

          <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 text-balance lg:text-6xl">
            The home for standard-compliant{" "}
            <span className="text-blue-600">digital twins</span>.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 text-pretty">
            ezAAS Model Hub is a unified platform to author, validate, and deploy
            Asset Administration Shells. Turn manufacturing assets into
            interoperable digital twins — without the integration overhead.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              <FileText className="size-4" />
              Documentation
              <span className="ml-0.5 rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                Soon
              </span>
            </Link>
            <a
              href="https://www.youtube.com/watch?v=n4IDBR2C1CY"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <PlayCircle className="size-4" />
              Watch Intro
            </a>
          </div>

          {/* compact inline meta row (not a boxed grid) */}
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-zinc-100 pt-8">
            {META.map((m) => (
              <div key={m.label} className="flex flex-col">
                <dt className="text-2xl font-bold tracking-tight text-zinc-900">
                  {m.value}
                </dt>
                <dd className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  {m.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Overview: sticky label + prose (documentation feel) ── */}
      <section className="mx-auto max-w-screen-xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Overview
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 text-balance">
              Why a model hub?
            </h3>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-relaxed text-zinc-600">
            <p>
              Building digital twins for manufacturing means wrestling with a
              complex international standard. Teams repeatedly rebuild the same
              structures, drift out of spec, and struggle to share work.
            </p>
            <p>
              The hub consolidates every domestically developed AAS template into
              one verified repository. Pick a template, fill in your asset data,
              and a compliant{" "}
              <span className="font-semibold text-zinc-900">
                Asset Administration Shell
              </span>{" "}
              instance is published and ready to serve over a standard REST API.
            </p>
            <p>
              The result: less integration overhead, guaranteed conformance with
              the AAS Metamodel v3.0, and a shared foundation your whole ecosystem
              can build on.
            </p>
          </div>
        </div>
      </section>

      {/* ── Capabilities: numbered editorial rows ── */}
      <section className="bg-white border-y border-zinc-200">
        <div className="mx-auto max-w-screen-xl px-6 py-16 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Capabilities
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 text-balance lg:text-3xl">
              The full AAS lifecycle, in one place
            </h3>
          </div>

          <div className="divide-y divide-zinc-100 border-t border-zinc-100">
            {CAPABILITIES.map(({ icon: Icon, title, desc, tag }, i) => (
              <div
                key={title}
                className="group grid items-start gap-4 py-7 sm:grid-cols-[auto_auto_1fr_auto] sm:gap-6"
              >
                <span className="font-mono text-sm font-bold text-zinc-300">
                  0{i + 1}
                </span>
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-zinc-900">{title}</h4>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600">
                    {desc}
                  </p>
                </div>
                <span className="hidden shrink-0 self-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 sm:inline-flex">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intro video: framed standalone block with side caption ── */}
      <section className="mx-auto max-w-screen-xl px-6 py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Watch
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 text-balance">
              See the hub in action
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              A short walkthrough of browsing templates, generating an instance,
              and publishing it live — all without writing code.
            </p>
            <a
              href="https://www.youtube.com/watch?v=n4IDBR2C1CY"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:text-blue-600"
            >
              Open on YouTube
              <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/n4IDBR2C1CY?si=jvDaO89Su0huplNn"
                allowFullScreen
                title="ezAAS Model Hub Introduction"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing: light documentation teaser (not dark CTA) ── */}
      <section className="mx-auto max-w-screen-xl px-6 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-zinc-200 bg-white p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-xl">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 text-balance">
              Full documentation is on the way
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Detailed guides, API references, and tutorials for the ezAAS Model
              Hub will be published here soon. In the meantime, jump straight into
              the templates.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <FileText className="size-4" />
              Documentation
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                Soon
              </span>
            </Link>
            <Link
              href={ROUTES.AASMODEL.LIST}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Browse Templates
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
