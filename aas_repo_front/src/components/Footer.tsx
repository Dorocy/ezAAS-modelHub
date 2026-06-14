/*
 * 파일명: src/components/Footer.tsx
 * 설명: shadcn/ui 기반 푸터 컴포넌트. 다국어(useLanguage) 지원.
 */
"use client";

import { useLanguage } from "@/contexts/LanguageContext";

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-5 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">2025</span>
            {" "}
            <a
              href="/"
              className="text-foreground transition-colors hover:text-primary"
            >
              ezAAS Model Hub
            </a>
            {" — "}
            {t("All rights reserved.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("KETI · Korea Electronics Technology Institute")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
