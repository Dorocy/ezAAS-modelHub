import { NextRequest, NextResponse } from "next/server";
import type { AuthTokenData } from "@/types/auth";

/**
 * POST /api/auth/cookie
 * 클라이언트로부터 전달받은 token 정보를 쿠키로 설정
 *
 * [2026-03-17 Portal 연동 수정]
 * - httpOnly: false → Portal(portal.ezmodel-hub.re.kr) JS에서 쿠키를 읽을 수 있도록 변경
 * - domain: ".ezmodel-hub.re.kr" → Hub/Portal 서브도메인 간 쿠키 공유
 * - sameSite: "lax" 고정 → 같은 eTLD+1 내에서 안정적으로 동작
 * - secure: isProduction 기반 → NODE_ENV로 판단 (x-forwarded-proto 의존 제거)
 */
export async function POST(req: NextRequest) {
  const { token }: { token: AuthTokenData } = await req.json();

  const response = NextResponse.json({ success: true });

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    path: "/",
    httpOnly: false,  // Portal JS에서 쿠키 접근 허용 (서브도메인 간 토큰 공유 목적)
    secure: isProduction,  // 프로덕션(HTTPS) 환경에서만 secure 플래그 활성화
    sameSite: "lax" as const,  // 같은 eTLD+1(.ezmodel-hub.re.kr) 내 안정적 전송
    ...(isProduction && process.env.NEXT_PUBLIC_COOKIE_DOMAIN && { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }),  // 프로덕션: 서브도메인 간 쿠키 공유 (.env.production의 NEXT_PUBLIC_COOKIE_DOMAIN)
  };

  response.cookies.set("token_message", JSON.stringify(token), cookieOptions);

  return response;
}
