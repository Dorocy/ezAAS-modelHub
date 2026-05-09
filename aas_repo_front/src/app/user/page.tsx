"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_USERS } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Search, Pencil } from "lucide-react";

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

const GROUP_OPTIONS = [
  { id: "1", text: "System Manager" },
  { id: "2", text: "Template Manager" },
  { id: "3", text: "User" },
];

export default function UserPage() {
  const [searchKey, setSearchKey] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const filtered = useMemo(() => {
    return (MOCK_USERS as User[]).filter((u) => {
      const matchKey =
        !searchKey ||
        u.user_name.toLowerCase().includes(searchKey.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchKey.toLowerCase());
      const matchGroup =
        groupFilter === "all" || String(u.user_group_seq) === groupFilter;
      return matchKey && matchGroup;
    });
  }, [searchKey, groupFilter]);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Authority</h1>
              <nav className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href={ROUTES.HOME} className="hover:text-foreground">Home</Link>
                <span>/</span>
                <span>Authority</span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <div className="mx-auto max-w-screen-2xl flex flex-wrap items-center gap-3">
          <Select
            value={groupFilter}
            onValueChange={(val) => setGroupFilter(val ?? "all")}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="Group All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Group All</SelectItem>
              {GROUP_OPTIONS.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.text}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="Please enter a search term"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-screen-2xl w-full px-6 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} results found
        </p>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / ID</TableHead>
                <TableHead className="w-28">Social</TableHead>
                <TableHead className="w-32">Create Date</TableHead>
                <TableHead className="w-36">Role</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-16">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.user_seq}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {u.user_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link
                          href={ROUTES.USER.VIEW(String(u.user_seq))}
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {u.user_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">{u.user_id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.socialprovider_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.start_timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">{u.user_group_name}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Y" ? "default" : "destructive"}>
                      {u.status_nm}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.USER.EDIT(String(u.user_seq))}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 text-xs"
                      )}
                    >
                      <Pencil className="size-3" data-icon="inline-start" />
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
