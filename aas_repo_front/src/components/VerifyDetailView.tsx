"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


interface VerificationMessage {
  count: number;
  message: string[];
}

interface Props {
  verificationRef: React.RefObject<Record<string, VerificationMessage> | null>;
  verificationActive: string | null;
  setVerificationActive: (key: string) => void;
}

export default function VerifyDetailView({
  verificationRef,
  verificationActive,
  setVerificationActive,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!verificationRef.current) return null;

  const entries = Object.entries(verificationRef.current);
  const activeMessages = verificationActive
    ? (verificationRef.current[verificationActive]?.message ?? [])
    : [];

  // 전체 보기에서 사용할, 오류가 있는 모든 그룹 (summary 등 비-그룹 항목 제외)
  const failGroups = entries.filter(
    ([, v]) =>
      v &&
      typeof v === "object" &&
      Array.isArray(v.message) &&
      typeof v.count === "number" &&
      v.count > 0,
  );
  const totalFailCount = failGroups.reduce((sum, [, v]) => sum + v.count, 0);

  return (
    <div className="w-full flex flex-col gap-4 mt-2">
      {/* 검증 항목 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map(([key, { count }]) => {
          const hasFail = count > 0;
          const isActive = key === verificationActive;
          return (
            <button
              key={key}
              onClick={() => setVerificationActive(key)}
              className={[
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                hasFail
                  ? "border-red-200 bg-red-50 hover:border-red-400"
                  : "border-green-200 bg-green-50 hover:border-green-400",
                isActive
                  ? hasFail
                    ? "ring-2 ring-red-400"
                    : "ring-2 ring-green-400"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 min-w-0">
                {hasFail
                  ? <XCircle className="size-4 text-red-500 shrink-0" />
                  : <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                }
                <span className={`text-sm font-semibold truncate ${hasFail ? "text-red-700" : "text-green-700"}`}>
                  {key}
                </span>
              </div>
              {hasFail && (
                <span className="text-sm font-bold text-red-600 shrink-0 ml-2">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 항목 상세 메시지 */}
      {verificationActive && activeMessages.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">{verificationActive} — 오류 상세</span>
              <span className="text-xs text-red-400">({activeMessages.length}건)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-800"
              onClick={() => setModalOpen(true)}
            >
              <Maximize2 className="size-3.5 mr-1" />전체 보기 (모든 그룹)
            </Button>
          </div>
          <div className="h-48 overflow-y-auto px-4 py-3 space-y-1.5">
            {activeMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 min-w-0">
                <span className="text-[11px] text-red-300 font-mono shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-xs text-zinc-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">{msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 보기 Dialog — 모든 그룹의 오류를 한 번에 표시 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[96vw] w-[96vw] xl:max-w-7xl h-[88vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="size-4" />
              검증 오류 전체 목록
              <span className="text-xs font-normal text-red-400">
                (총 {totalFailCount}건 · {failGroups.length}개 그룹)
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {failGroups.length === 0 ? (
              <p className="text-sm text-zinc-500">표시할 오류가 없습니다.</p>
            ) : (
              failGroups.map(([key, { count, message }]) => (
                <section key={key}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1.5 border-b border-red-100">
                    <XCircle className="size-4 text-red-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-red-700 break-words">{key}</h3>
                    <span className="text-xs text-red-400 shrink-0">({count}건)</span>
                  </div>
                  <div className="space-y-1">
                    {message.map((msg, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-b-0"
                      >
                        <span className="text-xs text-zinc-400 font-mono shrink-0 pt-0.5 w-8 text-right">
                          {i + 1}
                        </span>
                        <p className="text-sm text-zinc-700 leading-relaxed break-words whitespace-pre-wrap min-w-0">
                          {msg}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
