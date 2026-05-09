/**
 * 파일명: src/app/login/page.tsx
 * 작성자: 김태훈
 * 작성일: 2024-03-15
 * 최종수정일: 2026-03-17
 *
 * 저작권: (c) 2025 IMPIX. 모든 권리 보유.
 *
 * 설명: KETI ezAAS Model Hub 로그인 페이지 (서버 컴포넌트)
 *
 * [2026-03-17 Portal 연동 수정]
 * - "use client" 제거 → 서버 컴포넌트로 전환하여 searchParams 접근 가능
 * - 기존 클라이언트 로직은 LoginContent.tsx로 분리
 * - Portal에서 ?redirect_url=... 파라미터로 복귀 URL을 전달받아 LoginContent에 prop으로 전달
 *   예) https://ezmodel-hub.re.kr/login?redirect_url=https://portal.ezmodel-hub.re.kr/instances/123
 */

import LoginContent from "./LoginContent";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url ?? "";

  return <LoginContent redirectUrl={redirectUrl} />;
}
