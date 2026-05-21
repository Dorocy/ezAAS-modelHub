"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Server,
  ArrowLeftRight,
  Minimize2,
  Globe,
  Menu,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Header() {
  const [widthMode, setWidthMode] = useState<"Normal" | "Wide">("Normal");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const { t, changeLanguage } = useAuth().language;
  const { isAuthenticated, authToken, logout, user: profile } = useAuth();

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("data-layout-width") || "Normal") as "Normal" | "Wide";
    setWidthMode(saved);
    if (saved === "Wide") document.body.classList.add("layout-wide");
  }, []);

  const toggleWidthMode = () => {
    const next = widthMode === "Normal" ? "Wide" : "Normal";
    setWidthMode(next);
    localStorage.setItem("data-layout-width", next);
    document.body.classList.toggle("layout-wide", next === "Wide");
  };

  const handlePortalClick = () => {
    if (authToken) {
      window.open(
        `${process.env.NEXT_PUBLIC_PORTAL_URL}?token=${authToken.payload.jwt_access_token}`,
        "_blank"
      );
    }
  };

  if (!mounted) return null;

  const isAdmin   = profile?.user_group_seq === 1;
  const isManager = profile?.user_group_seq === 1 || profile?.user_group_seq === 2;

  const navLinks = [
    { href: ROUTES.AASMODEL.LIST,  label: t("AAS Template") },
    { href: ROUTES.SUBMODEL.LIST,  label: t("Submodel Template") },
    ...(profile ? [{ href: ROUTES.INSTANCE.LIST, label: t("My AAS Instance") }] : []),
    { href: ROUTES.ABOUT,          label: t("About") },
    ...(isManager ? [{ href: ROUTES.DISTRIBUTE.LIST, label: t("Publish") }]   : []),
    ...(isAdmin   ? [{ href: ROUTES.USER.LIST,       label: t("Authority") }] : []),
  ];

  const isNavActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="lg:hidden size-8">
                  <Menu className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              } />
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border px-5 py-4">
                  <SheetTitle>
                    <Link href={ROUTES.HOME}>
                      <img src="/assets/media/logos/keti_logo.png" alt="KETI ezAAS" className="h-8" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 px-3 py-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isNavActive(link.href)
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <ChevronRight className={cn("size-3.5 shrink-0", isNavActive(link.href) ? "text-primary" : "text-muted-foreground/50")} />
                      {link.label}
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <Link
                      href={ROUTES.LOGIN}
                      className={cn(buttonVariants({ size: "sm" }), "mt-4 justify-center")}
                    >
                      {t("Login")}
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href={ROUTES.HOME} className="flex items-center shrink-0">
              <img src="/assets/media/logos/keti_logo.png" alt="KETI ezAAS" className="h-8 lg:h-8" />
            </Link>
          </div>

          {/* Right: actions + user */}
          <div className="flex items-center gap-0.5">
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="size-8" onClick={handlePortalClick} title="Portal">
                <Server className="size-4" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="size-8" onClick={toggleWidthMode} title="Toggle layout width">
              {widthMode === "Normal"
                ? <ArrowLeftRight className="size-4" />
                : <Minimize2 className="size-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="size-8" title="Language">
                  <Globe className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="min-w-[130px]">
                <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ko")}>한국어</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!isAuthenticated ? (
              <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ size: "sm" }), "ml-2 h-8 text-xs")}>
                {t("Login")}
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="ml-1 size-8 rounded-full">
                    <Avatar className="size-7">
                      <AvatarImage src={profile?.user_photo_url || "/assets/media/avatars/blank.png"} alt={profile?.user_name || "User"} />
                      <AvatarFallback className="text-xs">{profile?.user_name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-60">
                  <div className="flex items-center gap-2.5 px-2 py-2.5">
                    <Avatar className="size-9">
                      <AvatarImage src={profile?.user_photo_url || "/assets/media/avatars/blank.png"} alt={profile?.user_name || "User"} />
                      <AvatarFallback>{profile?.user_name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">{profile?.user_name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{profile?.user_group_name}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{profile?.user_id}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={profile?.user_seq ? ROUTES.USER.VIEW(String(profile.user_seq)) : ROUTES.USER.LIST}>
                      {t("My Profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.INSTANCE.LIST}>{t("My AAS Instance")}</Link>
                  </DropdownMenuItem>
                  {isManager && (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.DISTRIBUTE.LIST}>{t("Admin: Publish")}</Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.USER.LIST}>{t("Admin: Authority")}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()}>
                    <LogOut className="size-3.5" />
                    {t("Log Out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom nav (desktop) ─────────────────────────────────── */}
      <div className="hidden border-t border-border/60 bg-card lg:block">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
          <nav className="flex h-10 items-center gap-0">
            {navLinks.map((link) => {
              const active = isNavActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex h-full items-center px-3.5 text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "font-normal text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {/* Active underline indicator */}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
