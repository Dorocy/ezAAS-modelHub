"use client";

import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Rocket,
  PlugZap,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Unified AAS Template Management",
    desc: "All domestically developed AAS templates are consolidated into a single repository. Create standardized instances and build compliant digital twins for manufacturing with ease.",
    points: ["Single source of truth", "Reusable type templates"],
  },
  {
    icon: ShieldCheck,
    title: "International Standard Compliance",
    desc: "Only versions adhering to the official AAS standard are supported. Compliance with the AAS Metamodel Specification v3.0 and IDTA templates is verified automatically.",
    points: ["AAS Metamodel v3.0", "IDTA verified"],
  },
  {
    icon: Rocket,
    title: "Instant Instance Deployment",
    desc: "Generate AAS instances by simply feeding real asset data into pre-registered templates, then deploy and run them on the repository server in real time.",
    points: ["One-click generation", "Live on-server runtime"],
  },
  {
    icon: PlugZap,
    title: "Scalable RESTful API",
    desc: "A standardized REST API lets external systems query templates and instances, enabling flexible integration with manufacturing IT systems and broad ecosystem compatibility.",
    points: ["Open REST endpoints", "Ecosystem ready"],
  },
];

const STATS = [
  { value: "v3.0", label: "AAS Metamodel" },
  { value: "IDTA", label: "Verified Templates" },
  { value: "REST", label: "Open API" },
  { value: "24/7", label: "On-Server Runtime" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
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

      <div className="mx-auto max-w-screen-xl px-6 py-10 space-y-16">
        {/* ── Hero ── */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Asset Administration Shell Repository
            </span>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 text-balance">
              ezAAS Model Hub
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 text-pretty">
              A unified platform to author, validate, and deploy standard-compliant
              Asset Administration Shells. Turn manufacturing assets into
              interoperable digital twins—without the integration overhead.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={ROUTES.AASMODEL.LIST}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                Browse Templates
                <ArrowRight className="size-3.5" />
              </Link>
              <a
                href="https://www.youtube.com/embed/n4IDBR2C1CY"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "gap-1.5",
                )}
              >
                <PlayCircle className="size-3.5" />
                Watch Intro
              </a>
            </div>
          </div>

          {/* Video */}
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
        </section>

        {/* ── Stats strip ── */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white px-6 py-5 text-center">
              <p className="text-2xl font-bold tracking-tight text-zinc-900">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-500">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Features ── */}
        <section className="space-y-8">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 text-balance">
              Everything you need to build compliant digital twins
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              From standardized templates to one-click deployment and open APIs—the
              hub covers the full AAS lifecycle.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc, points }, i) => (
              <div
                key={title}
                className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-zinc-300">
                    0{i + 1}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-zinc-900">{title}</h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
                  {desc}
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-100 pt-4">
                  {points.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="overflow-hidden rounded-2xl bg-zinc-900 px-8 py-10 text-center sm:px-12">
          <h3 className="text-2xl font-bold tracking-tight text-white text-balance">
            Ready to deploy your first AAS instance?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            Start from a standardized template, fill in your asset data, and publish
            a compliant digital twin in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.AASMODEL.LIST}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-white text-zinc-900 hover:bg-zinc-100 gap-1.5",
              )}
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href={ROUTES.SUBMODEL.LIST}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white",
              )}
            >
              Explore Submodels
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
