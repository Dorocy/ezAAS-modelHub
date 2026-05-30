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
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [allModalOpen, setAllModalOpen] = useState(false);

  if (!verificationRef.current) return null;

  const entries = Object.entries(verificationRef.current);
  const failEntries = entries.filter(([, { count }]) => count > 0);
  const totalErrors = failEntries.reduce((sum, [, { count }]) => sum + count, 0);

  const activeMessages = verificationActive
    ? (verificationRef.current[verificationActive]?.message ?? [])
    : [];

  return (
    <div className="w-full flex flex-col gap-4 mt-2">

      {/* 상단: 요약 + 전체 보기 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          총 <span className="font-semibold text-zinc-700">{entries.length}</span>개 항목 검사 ·{" "}
          {failEntries.length > 0 ? (
            <span className="text-red-600 font-semibold">{failEntries.length}개 실패 ({totalErrors}건)</span>
          ) : (
            <span className="text-green-600 font-semibold">모두 통과</span>
          )}
        </p>
        {failEntries.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setAllModalOpen(true)}
          >
            <Maximize2 className="size-3.5 mr-1.5" />전체 오류 보기
          </Button>
        )}
      </div>

      {/* 검증 항목 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map(([key, { count }]) => {
          const hasFail = count > 0;
          const isActive = key === verificationActive;
          return (
            <button
              key={key}
              onClick={() => setVerificationActive(key)}
              disabled={!hasFail}
              className={[
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                hasFail
                  ? "border-red-200 bg-red-50 hover:border-red-300 cursor-pointer"
                  : "border-green-200 bg-green-50 cursor-default",
                isActive && hasFail ? "ring-2 ring-red-300 ring-offset-1" : "",
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
                <span className="text-xs font-bold text-red-600 bg-red-100 rounded-full px-2 py-0.5 shrink-0 ml-2">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 항목 오류 상세 패널 */}
      {verificationActive && activeMessages.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">{verificationActive}</span>
              <span className="text-xs text-red-400">({activeMessages.length}건)</span>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-zinc-500 hover:text-zinc-800"
              onClick={() => setItemModalOpen(true)}
            >
              <Maximize2 className="size-3.5 mr-1" />상세 보기
            </Button>
          </div>
          <div className="h-44 overflow-y-auto px-4 py-3 space-y-1.5">
            {activeMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[11px] text-red-300 font-mono shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xs text-zinc-700 leading-relaxed break-words">{msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 항목별 상세 Dialog */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl w-[90vw] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="size-4" />
              {verificationActive} — 오류 목록
              <span className="text-sm font-normal text-red-400 ml-1">({activeMessages.length}건)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5">
            {activeMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-b-0">
                <span className="text-xs text-zinc-400 font-mono shrink-0 pt-0.5 w-6 text-right">{i + 1}</span>
                <p className="text-sm text-zinc-700 leading-relaxed break-words">{msg}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 전체 오류 Dialog — 모든 fail 항목을 섹션별로 */}
      <Dialog open={allModalOpen} onOpenChange={setAllModalOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl w-[90vw] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="size-4" />
              전체 오류 목록
              <span className="text-sm font-normal text-red-400 ml-1">
                — {failEntries.length}개 항목 · 총 {totalErrors}건
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {failEntries.map(([key, { count, message }]) => (
              <div key={key}>
                {/* 섹션 헤더 */}
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="size-4 text-red-500 shrink-0" />
                  <span className="text-sm font-semibold text-red-700">{key}</span>
                  <span className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                    {count}건
                  </span>
                </div>
                {/* 오류 목록 */}
                <div className="pl-6 space-y-1">
                  {message.map((msg, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-zinc-100 last:border-b-0">
                      <span className="text-xs text-zinc-400 font-mono shrink-0 pt-0.5 w-5 text-right">{i + 1}</span>
                      <p className="text-sm text-zinc-700 leading-relaxed break-words">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
