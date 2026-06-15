"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { t, changeLanguage } = useAuth().language;
  const { isAuthenticated, authToken, logout, user: profile } = useAuth();

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("data-layout-width") || "Normal") as "Normal" | "Wide";
    setWidthMode(saved);
    if (saved === "Wide") document.body.classList.add("layout-wide");

    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    { href: ROUTES.AASMODEL.LIST,  label: t("AAS Template"),      desc: t("AAS Template desc") },
    { href: ROUTES.SUBMODEL.LIST,  label: t("Submodel Template"), desc: t("Submodel Template desc") },
    ...(profile ? [{ href: ROUTES.INSTANCE.LIST, label: t("My AAS Instance"), desc: t("My AAS Instance desc") }] : []),
    { href: ROUTES.ABOUT,          label: t("About"),             desc: t("About desc") },
    ...(isManager ? [{ href: ROUTES.DISTRIBUTE.LIST, label: t("Publish"),   desc: t("Publish desc") }]   : []),
    ...(isAdmin   ? [{ href: ROUTES.USER.LIST,       label: t("Authority"), desc: t("Authority desc") }] : []),
  ];

  const isNavActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 transition-shadow duration-200",
        scrolled ? "border-border shadow-sm" : "border-border/60"
      )}
    >
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
                    <Link href={ROUTES.HOME} className="flex flex-col gap-2">
                      <img src="/assets/media/logos/ezaas_badge.png" alt="ezAAS" className="h-7 w-auto self-start" />
                      <img src="/assets/media/logos/keti_logo.png" alt="KETI — Korea Electronics Technology Institute" className="h-4 w-auto self-start opacity-65" />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-0.5 px-3 py-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isNavActive(link.href)
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <ChevronRight className={cn("mt-0.5 size-3.5 shrink-0", isNavActive(link.href) ? "text-primary" : "text-muted-foreground/50")} />
                      <span className="flex flex-col">
                        <span>{link.label}</span>
                        <span className="text-xs font-normal text-muted-foreground/70">{link.desc}</span>
                      </span>
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

            <Link href={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0" title="ezAAS — The All-in-one AAS Solution">
              <img
                src="/assets/media/logos/ezaas_badge.png"
                alt="ezAAS"
                className="h-7 w-auto"
              />
              <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
              <img
                src="/assets/media/logos/keti_logo.png"
                alt="KETI — Korea Electronics Technology Institute"
                className="hidden h-5 w-auto opacity-70 sm:block"
              />
            </Link>

            {/* Inline nav (desktop) */}
            <nav className="ml-2 hidden h-14 items-center gap-0.5 lg:flex">
              {navLinks.map((link) => {
                const active = isNavActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.desc}
                    className={cn(
                      "relative flex h-full items-center px-3 text-sm transition-colors",
                      active
                        ? "font-medium text-foreground"
                        : "font-normal text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
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
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">{profile?.user_group_name}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{profile?.user_id}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(profile?.user_seq ? ROUTES.USER.VIEW(String(profile.user_seq)) : ROUTES.USER.LIST)}>
                    {t("My Profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(ROUTES.INSTANCE.LIST)}>
                    {t("My AAS Instance")}
                  </DropdownMenuItem>
                  {isManager && (
                    <DropdownMenuItem onClick={() => router.push(ROUTES.DISTRIBUTE.LIST)}>
                      {t("Admin: Publish")}
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push(ROUTES.USER.LIST)}>
                      {t("Admin: Authority")}
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
    </header>
  );
}

export default Header;
