"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCodeList, upsertUser } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { confirmSave } from "@/utils/modal";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/constants/roles";
import { User } from "@/app/user/page";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Pencil, Save, X } from "lucide-react";

export type Mode = "edit" | "view" | "create";

interface UserFormProps {
  mode: Mode;
  user?: User;
}

export default function UserForm({ mode, user }: UserFormProps) {
  const router = useRouter();
  const { user: loginUser } = useAuth();
  const isReadOnly = mode === "view";

  const { data: groups = [] } = useQuery({
    queryKey: ["common/code", "group"],
    queryFn: () => getCodeList("group"),
  });

  const { data: statusList = [] } = useQuery({
    queryKey: ["common/code", "SYS400"],
    queryFn: () => getCodeList("SYS400"),
  });

  const [userState, setUserState] = useState<Partial<User>>({
    user_name: user?.user_name ?? "",
    user_phonenumber: user?.user_phonenumber ?? "",
    user_group_seq: user?.user_group_seq ?? "",
    status: user?.status ?? "Y",
  });

  useEffect(() => {
    if (user) {
      setUserState({
        user_name: user.user_name,
        user_phonenumber: user.user_phonenumber,
        user_group_seq: user.user_group_seq,
        status: user.status,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof userState, value: string | null) => {
    if (value == null) return;
    setUserState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (await confirmSave("Do you want to save?")) {
      const userSeq = await upsertUser({
        body: { ...user, ...userState },
        withToast: true,
      });
      router.push(ROUTES.USER.VIEW(userSeq));
    }
  };

  const isManager =
    Number(loginUser?.user_group_seq) <= UserRole.Approvedor;

  const createdDate = user?.start_timestamp
    ? new Date(user.start_timestamp).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "-";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">
          My Profile
          {mode !== "create" && (
            <span className="ml-2 text-sm font-normal text-muted-foreground uppercase">
              — {mode}
            </span>
          )}
        </h1>
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href={ROUTES.HOME} className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3" />
          {isManager && (
            <>
              <Link href={ROUTES.USER.LIST} className="hover:text-foreground transition-colors">
                User List
              </Link>
              <ChevronRight className="size-3" />
            </>
          )}
          <span className="text-foreground font-medium">My Profile</span>
        </nav>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Profile Details
            </CardTitle>
            {user && (
              <Badge variant={user.status === "Y" ? "default" : "secondary"}>
                {user.status === "Y" ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 grid gap-5">
          {/* Row 1: ID */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground text-right">
              ID
            </Label>
            <Input
              name="user_id"
              defaultValue={user?.user_id ?? ""}
              readOnly
              className="bg-muted/40 text-foreground"
            />
          </div>

          {/* Row 2: Name + User Seq */}
          <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground text-right">
              Name
            </Label>
            <Input
              name="user_name"
              value={userState.user_name ?? ""}
              onChange={handleChange}
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/40" : ""}
            />
            <Label className="text-sm font-medium text-muted-foreground text-right">
              User Seq
            </Label>
            <Input
              name="user_seq"
              defaultValue={user?.user_seq ?? ""}
              readOnly
              className="bg-muted/40"
            />
          </div>

          {/* Row 3: Create Day + Subscription */}
          <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground text-right">
              Create Date
            </Label>
            <Input
              value={createdDate}
              readOnly
              className="bg-muted/40"
            />
            <Label className="text-sm font-medium text-muted-foreground text-right">
              Subscription
            </Label>
            <Input
              value={userState.socialprovider_name ?? "Local"}
              readOnly
              className="bg-muted/40"
            />
          </div>

          {/* Row 4: Phone */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground text-right">
              Phone
            </Label>
            <Input
              name="user_phonenumber"
              value={userState.user_phonenumber ?? ""}
              onChange={handleChange}
              readOnly={isReadOnly}
              placeholder="010-0000-0000"
              className={isReadOnly ? "bg-muted/40" : ""}
            />
          </div>

          {/* Row 5: Role + Activate */}
          <div className="grid grid-cols-[120px_1fr_120px_1fr] items-center gap-4">
            <Label className="text-sm font-medium text-muted-foreground text-right">
              Role
            </Label>
            {isReadOnly ? (
              <Input
                value={user?.user_group_name ?? ""}
                readOnly
                className="bg-muted/40"
              />
            ) : (
              <Select
                value={String(userState.user_group_seq ?? "")}
                onValueChange={(v) => handleSelectChange("user_group_seq", v)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(groups) &&
                    groups.map((g: { id: string | number; text: string }) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.text}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            <Label className="text-sm font-medium text-muted-foreground text-right">
              Activate
            </Label>
            {isReadOnly ? (
              <Input
                value={user?.status === "Y" ? "Active" : "Inactive"}
                readOnly
                className="bg-muted/40"
              />
            ) : (
              <Select
                value={String(userState.status ?? "")}
                onValueChange={(v) => handleSelectChange("status", v)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(statusList) &&
                    statusList.map(
                      (s: { id: string | number; text: string }) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.text}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex justify-end gap-2 pt-4">
          {/* Edit mode footer */}
          {mode === "edit" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                <X className="size-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                <Save className="size-3.5 mr-1" />
                Save
              </Button>
            </>
          )}

          {/* View mode footer — non-manager (일반 User)는 취소만 */}
          {mode === "view" && !isManager && (
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <X className="size-3.5 mr-1" />
              Back
            </Button>
          )}

          {/* View mode footer — manager 이상은 Edit 버튼 */}
          {mode === "view" && isManager && user && (
            <>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <X className="size-3.5 mr-1" />
                Back
              </Button>
              <Link
                href={ROUTES.USER.EDIT(String(user.user_seq))}
                className={buttonVariants({ size: "sm" })}
              >
                <Pencil className="size-3.5 mr-1" />
                Edit
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
