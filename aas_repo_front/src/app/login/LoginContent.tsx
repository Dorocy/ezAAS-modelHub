/**
 * 파일명: src/app/login/LoginContent.tsx
 * 설명: 모던 카드 기반 로그인 페이지 (shadcn/ui)
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { showToast } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SendResetLinkForm from "@/components/feature/login/SendResetLinkForm";
import { LayoutTemplate } from "lucide-react";

interface LoginContentProps {
  redirectUrl: string;
}

export default function LoginContent({ redirectUrl }: LoginContentProps) {
  const { login, loginWithSocial } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const onClickLogin = () => {
    if (!email) return showToast.error("Please enter email");
    if (!password) return showToast.error("Please enter password");
    login(email, password, redirectUrl);
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* ── Center card ───────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Link href={ROUTES.HOME} className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <LayoutTemplate className="size-5 text-white" />
              </div>
              <span className="text-base font-semibold text-foreground tracking-tight">
                ezAAS Model Hub
              </span>
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {/* Social login */}
            <Button
              variant="outline"
              className="w-full h-9"
              onClick={() => loginWithSocial("google")}
            >
              <img
                src="assets/media/svg/brand-logos/google-icon.svg"
                alt="Google"
                className="size-4 shrink-0"
                data-icon="inline-start"
              />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-5">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-foreground">
                  ID
                </label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your ID"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onClickLogin()}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onClickLogin()}
                />
              </div>

              <Button className="w-full mt-1 h-9" onClick={onClickLogin}>
                Sign in
              </Button>
            </div>
          </div>

          {/* Sign up */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {"Don't have an account? "}
            <Link
              href={ROUTES.SIGNUP}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>

          {/* Back to home */}
          <p className="mt-2 text-center">
            <Link
              href={ROUTES.HOME}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right brand panel (desktop) ──────────────────────────── */}
      <div
        className="hidden lg:flex w-[520px] shrink-0 flex-col items-center justify-center bg-primary px-14 py-16"
        style={{
          backgroundImage: "url(/assets/media/aas/auth-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Logo white */}
          <Link href={ROUTES.HOME}>
            <img
              src="assets/media/logos/keti_logo_w.png"
              alt="KETI"
              className="h-14"
            />
          </Link>

          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              KETI ezAAS<br />Model Hub
            </h2>
            <p className="mt-3 text-sm text-white/75 leading-relaxed max-w-xs">
              Central repository for Asset Administration Shell and Submodel Templates —
              the foundation of Industrial Digital Twins.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="mt-2 flex flex-col gap-2">
            {[
              "AAS Standard compliant templates",
              "No-code instance creation",
              "Full REST API access",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                <span className="flex size-1.5 rounded-full bg-white/60 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          <SendResetLinkForm onClose={() => setResetOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
