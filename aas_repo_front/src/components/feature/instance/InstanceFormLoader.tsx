"use client";

/**
 * 인스턴스를 "클라이언트"에서 가져와 InstanceForm을 렌더하는 로더.
 *
 * 기존 edit/view 페이지는 서버 컴포넌트에서 getInstance를 호출했는데,
 * 서버사이드 요청은 token_message 쿠키에 의존한다. 쿠키가 만료/오염(이전 백엔드
 * JWT 등)되면 401 → 로그인으로 redirect → 메모리 토큰이 남아있어 다시 홈으로 바운스되어
 * "Edit를 누르면 메인페이지로 돌아간다"는 증상이 발생했다.
 *
 * 앱의 나머지 데이터 조회는 모두 클라이언트 프록시(/api/proxy + 메모리 토큰)로
 * 안정적으로 동작하므로, 편집/상세 데이터도 동일하게 클라이언트에서 가져온다.
 */

import useSWR from "swr";
import { getInstance, getInstanceDetail } from "@/api/index";
import { useAuth } from "@/contexts/AuthContext";
import InstanceFormClient from "./InstanceFormClient";

interface Props {
  mode: "edit" | "view";
  instanceSeq: string;
}

export default function InstanceFormLoader({ mode, instanceSeq }: Props) {
  const { isAuthenticated } = useAuth();

  const { data: instance, isLoading, error } = useSWR(
    isAuthenticated && instanceSeq ? ["instance", instanceSeq] : null,
    () => getInstance({ instance_seq: instanceSeq }),
    { shouldRetryOnError: false }
  );

  console.log("[v0] InstanceFormLoader", {
    instanceSeq,
    isAuthenticated,
    isLoading,
    hasInstance: !!instance,
    instanceResult: (instance as any)?.result,
    errorMessage: (error as any)?.message,
    errorCause: (error as any)?.cause,
  });

  // view 모드에서는 결합된 AAS 메타데이터(검증 결과 등)도 함께 표시한다.
  const { data: instanceDetail } = useSWR(
    isAuthenticated && instanceSeq && mode === "view"
      ? ["instance-detail", instanceSeq]
      : null,
    () => getInstanceDetail({ instance_seq: instanceSeq })
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        인스턴스를 불러오는 중입니다...
      </div>
    );
  }

  // 백엔드가 400을 반환하면 apiRequest는 errorThrow 없이 에러 JSON
  // ({ result: "error", msg, data: "" })을 그대로 반환한다. 이 경우 instance는
  // truthy 이지만 편집/조회에 필요한 instance_seq·aasmodel_metadata가 없다.
  // (예: metadata 가 비어있는 손상된 인스턴스) → 폼을 띄우지 않고 에러 화면을 보여준다.
  const isErrorResponse =
    !!instance &&
    ((instance as any).result === "error" || !(instance as any).instance_seq);

  if (error || !instance || isErrorResponse) {
    // 실제 백엔드 메시지를 우선 노출한다. (throw된 에러의 cause.json.msg → instance.msg 순)
    const backendMsg =
      (error as any)?.cause?.json?.msg ||
      (error as any)?.message ||
      ((instance as any)?.msg as string | undefined);
    const status = (error as any)?.cause?.status;
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-sm font-medium text-zinc-900">
          인스턴스를 불러오지 못했습니다.
        </p>
        <p className="text-sm text-zinc-500 max-w-md">
          {backendMsg
            ? backendMsg
            : "잠시 후 다시 시도하거나 목록에서 다시 선택해주세요."}
        </p>
        {status ? (
          <p className="text-xs text-zinc-400">에러 코드: {status}</p>
        ) : null}
      </div>
    );
  }

  return (
    <InstanceFormClient
      mode={mode}
      instance={instance}
      combinedAAS={mode === "view" ? instanceDetail?.[0]?.metadata : undefined}
    />
  );
}
