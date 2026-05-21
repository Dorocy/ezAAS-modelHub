"use server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER ||
  process.env.NEXT_PUBLIC_AAS_API_BASE ||
  "";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");

  // 쿼리스트링 그대로 전달
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND}/${pathStr}${search}`;

  // 클라이언트에서 보낸 Authorization 헤더 또는 쿠키에서 토큰 추출
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get("token_message")?.value;

  const forwardHeaders: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (tokenRaw) {
    forwardHeaders["Authorization"] = `Bearer ${tokenRaw}`;
  }

  // body 그대로 전달
  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const contentType = backendRes.headers.get("content-type") || "";

    // 백엔드가 HTML을 반환하면 에러로 처리 (ngrok 경고 페이지 방어)
    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { result: "error", msg: "Backend returned HTML instead of JSON. Check ngrok or server status." },
        { status: 502 }
      );
    }

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { "Content-Type": contentType || "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { result: "error", msg: err.message || "Proxy fetch failed" },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
