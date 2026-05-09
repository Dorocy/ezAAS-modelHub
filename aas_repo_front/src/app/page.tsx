/*
 * 파일명: src/app/page.tsx
 * 설명: shadcn/ui 기반으로 재작성된 메인 홈 페이지.
 *       Bootstrap/Metronic 클래스 완전 제거.
 */
import { MOCK_PUBLISHED_COUNT } from "@/lib/mock-data";
import AASSearchBar from "@/components/feature/app/AASSearchBar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  File,
  Layers,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";

export const metadata = { title: "KETI ezAAS Model Hub" };

export default async function Home() {
  const publishedCount = MOCK_PUBLISHED_COUNT;

  const statCards = [
    {
      href: "/aas",
      icon: FileText,
      label: "AAS Templates",
      count: publishedCount.aasmodel.count,
      isNew: false,
    },
    {
      href: "/submodel",
      icon: File,
      label: "Submodel Templates",
      count: publishedCount.submodel.count,
      isNew: false,
    },
    {
      href: "/instance",
      icon: Layers,
      label: "AAS Instances",
      count: publishedCount.instance.count,
      isNew: true,
    },
  ];

  const features = [
    {
      icon: FileText,
      title: "Unified AAS and Submodel Template",
      description:
        "Store and manage all AAS and Submodel templates in a single central repository.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance with AAS Standard",
      description:
        "All templates strictly follow the Asset Administration Shell (AAS) meta-model specification.",
    },
    {
      icon: Zap,
      title: "Simplified AAS Generation",
      description:
        "Create AAS instances without knowing the meta-model — just fill in values from templates.",
    },
    {
      icon: BarChart3,
      title: "Scalability through API Support",
      description:
        "Full REST API support for seamless integration with your existing systems.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero / Search section */}
      <section className="border-b border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <AASSearchBar />

          {/* Stat cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="transition-shadow hover:shadow-md cursor-pointer">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <Icon className="size-4 shrink-0" />
                        {card.label}
                      </div>
                      <div className="flex items-center gap-2">
                        {card.isNew && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                        <span className="text-lg font-bold text-foreground">
                          {card.count}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Intro section */}
      <section className="py-14 border-b border-border">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center gap-10 py-12 px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-14">
              <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left lg:flex-1">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">
                    Industrial Digital Twin
                  </p>
                  <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
                    ezAAS Model Hub
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-md text-pretty">
                    Serves as a central hub that supports the efficient creation and
                    management of digital twins for industrial assets, based on the
                    Asset Administration Shell (AAS) standard.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/about">Learn more about ezAAS</Link>
                </Button>
              </div>
              <div className="shrink-0 lg:flex-none">
                <img
                  src="/assets/media/aas/aas_main_ob.png"
                  alt="AAS Model Hub illustration"
                  className="w-52 lg:w-72"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-14 border-b border-border">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.title} href="/aas">
                  <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                    <CardContent className="flex flex-col items-center gap-4 py-8 px-6 text-center">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="size-6 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug text-balance">
                        {feature.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / Video section */}
      <section className="py-14">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-foreground">About</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">ezAAS Model Hub</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              className="aspect-video w-full"
              src="https://www.youtube.com/embed/n4IDBR2C1CY?si=jvDaO89Su0huplNn"
              allowFullScreen
              title="ezAAS Model Hub introduction video"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
