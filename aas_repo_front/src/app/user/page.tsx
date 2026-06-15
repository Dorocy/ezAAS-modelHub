"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { getUserList } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { rankByQuery } from "@/utils/search";
import { cn } from "@/lib/utils";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings2,
  ShieldAlert,
  UserCog,
  User as UserIcon,
} from "lucide-react";

const PAGE_SIZE = 20;

export interface User {
  AAS_Seq_No?: number;
  user_seq: number;
  user_id: string;
  pw_hash?: string;
  user_name: string;
  status: "Y" | "N";
  status_nm: string;
  user_phonenumber: string | null;
  start_timestamp: string;
  socialaccount_seq?: number | null;
  social_id?: string | null;
  social_in_id?: string | null;
  socialprovider_seq?: number | null;
  socialprovider_name: string | null;
  user_group_seq: number | string;
  user_group_name: string;
  user_photo_url: string;
}

// 권한(그룹) 정의 — 필터 칩 + 배지 색상에 함께 사용
const ROLES = [
  {
    id: "1",
    label: "System Manager",
    icon: ShieldAlert,
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  {
    id: "2",
    label: "Template Manager",
    icon: UserCog,
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    id: "3",
    label: "User",
    icon: UserIcon,
    badge: "border-zinc-200 bg-zinc-100 text-zinc-600",
    dot: "bg-zinc-400",
  },
] as const;

function roleMeta(groupSeq: number | string) {
  return ROLES.find((r) => r.id === String(groupSeq)) ?? ROLES[2];
}

export default function UserPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [page, setPage] = useState(1);

  const isAdmin = user?.user_group_seq === UserRole.Manager;

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (groupFilter !== "all") searchParams.user_group_seq = groupFilter;

  const { data: userData, isLoading, error } = useSWR(
    isAuthenticated ? ["user-list", page, searchKey, groupFilter] : null,
    () =>
      getUserList({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchParams,
      })
  );

  // user/list/{page}/{size} 응답: DataTables 형식 { recordsTotal, data: [...] } 또는 배열.
  const payload: any = userData?.data ?? userData;
  const rawUsers: User[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.list)
        ? payload.list
        : Array.isArray(userData?.list)
          ? userData.list
          : [];
  const totalCount: number =
    payload?.recordsTotal != null
      ? Number(payload.recordsTotal)
      : userData?.recordsTotal != null
        ? Number(userData.recordsTotal)
        : userData?.totalCount ?? rawUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 이름(user_name) 일치를 최우선으로, 그다음 아이디/전화번호 키워드 순으로 재정렬
  const users = rankByQuery(rawUsers, searchKey, {
    getName: (u) => u.user_name,
    getKeywords: (u) => [u.user_id, u.user_phonenumber],
  });

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleRole = (id: string) => {
    setGroupFilter(id);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">{t("User Management")}</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {t("Review members and assign access permissions")}
            </p>
          </div>
          {isAdmin && (
            <Link
              href={ROUTES.USER.CREATE}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Plus className="size-3.5" />
              {t("New User")}
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6 space-y-5">
        {/* ── Role filter chips + search ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleRole("all")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                groupFilter === "all"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {t("All Roles")}
            </button>
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = groupFilter === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRole(r.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100",
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(r.label)}
                </button>
              );
            })}
          </div>

          <div className="flex w-full max-w-xs items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                className="h-9 bg-white pl-8 text-sm"
                placeholder={t("Search name, ID, or phone")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button size="sm" className="h-9" onClick={handleSearch}>
              {t("Search")}
            </Button>
          </div>
        </div>

        <p className="text-sm text-zinc-500">
          {searchKey && (
            <span className="font-medium text-zinc-900">&quot;{searchKey}&quot; · </span>
          )}
          {isLoading ? t("Loading...") : `${totalCount} ${t("users")}`}
        </p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {t("Failed to load data. Please check your connection or try again.")}
          </div>
        )}

        {/* ── Table ── */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/60 hover:bg-zinc-50/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Member")}
                  </TableHead>
                  <TableHead className="w-28 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Social")}
                  </TableHead>
                  <TableHead className="w-32 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Joined")}
                  </TableHead>
                  <TableHead className="w-44 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Role")}
                  </TableHead>
                  <TableHead className="w-24 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Status")}
                  </TableHead>
                  <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {t("Permission")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const meta = roleMeta(u.user_group_seq);
                  return (
                    <TableRow key={u.user_seq} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-zinc-200">
                            <AvatarFallback className="bg-zinc-100 text-xs font-medium text-zinc-600">
                              {u.user_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <Link
                              href={ROUTES.USER.VIEW(String(u.user_seq))}
                              className="truncate text-sm font-medium text-zinc-900 hover:text-blue-600 hover:underline"
                            >
                              {u.user_name}
                            </Link>
                            <span className="truncate text-xs text-zinc-400">
                              {u.user_id}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {u.socialprovider_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {new Date(u.start_timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            meta.badge,
                          )}
                        >
                          <meta.icon className="size-3" />
                          {u.user_group_name || t(meta.label)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            u.status === "Y" ? "text-emerald-600" : "text-zinc-400",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              u.status === "Y" ? "bg-emerald-500" : "bg-zinc-300",
                            )}
                          />
                          {u.status_nm}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={ROUTES.USER.EDIT(String(u.user_seq))}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 gap-1.5",
                          )}
                        >
                          <Settings2 className="size-3.5" />
                          {t("Manage")}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-sm text-zinc-400"
                    >
                      {t("No users found.")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums text-zinc-500">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
