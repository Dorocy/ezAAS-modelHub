// app/api/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/logout
 * 인증 쿠키(token_message) 삭제
 *
 * [2026-03-17 Portal 연동 수정]
 * 쿠키 삭제 시 설정(cookie/route.ts)과 동일한 옵션을 사용해야 브라우저가 올바르게 쿠키를 삭제함.
 * domain, httpOnly, secure, sameSite 값이 설정 시와 다르면 쿠키가 삭제되지 않는 문제가 있었음.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });

  const isProduction = process.env.NODE_ENV === "production";

  // cookie/route.ts의 cookieOptions와 반드시 동일해야 함
  const cookieOptions = {
    path: "/",
    httpOnly: false,  // cookie/route.ts와 동일 (Portal JS 접근 허용)
    secure: isProduction,  // cookie/route.ts와 동일 (NODE_ENV 기반)
    sameSite: "lax" as const,  // cookie/route.ts와 동일
    ...(isProduction && process.env.NEXT_PUBLIC_COOKIE_DOMAIN && { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }),  // cookie/route.ts와 동일 (.env.production의 NEXT_PUBLIC_COOKIE_DOMAIN)
  };

  // 쿠키 삭제
  res.cookies.delete("token_message", cookieOptions);

  // 추가로 만료된 날짜를 설정하여 쿠키를 확실히 삭제
  res.cookies.set("token_message", "", {
    ...cookieOptions,
    expires: new Date(0),
  });

  return res;
}