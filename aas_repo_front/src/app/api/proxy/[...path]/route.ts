import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const BACKEND = (
    process.env.AAS_API_BASE ||
    process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER ||
    process.env.NEXT_PUBLIC_AAS_API_BASE ||
    ""
  ).trim();

  console.log("[v0] proxy BACKEND =", BACKEND);

  if (!BACKEND) {
    return NextResponse.json(
      { result: "error", msg: "AAS_API_BASE 환경변수가 설정되지 않았습니다. .env.local을 확인해 주세요." },
      { status: 503 }
    );
  }

  const { path } = await params;
  const pathStr = path.join("/");

  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND}/${pathStr}${search}`;

  const forwardHeaders: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    forwardHeaders["Authorization"] = authHeader;
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  console.log("[v0] proxy →", req.method, targetUrl);
  console.log("[v0] proxy body =", body?.slice(0, 200));

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const contentType = backendRes.headers.get("content-type") || "";
    console.log("[v0] proxy ← status", backendRes.status, "content-type:", contentType);

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
