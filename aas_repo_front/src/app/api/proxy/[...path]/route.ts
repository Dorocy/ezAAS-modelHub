import { NextRequest, NextResponse } from "next/server";

// 환경변수에 지저분한 값(예: "https://xxx.ngrok-free.app -> http://localhost:8000",
// 앞뒤 공백, 따옴표 등)이 들어와도 첫 번째 유효한 http(s) URL만 안전하게 추출한다.
// ngrok 터미널 출력을 그대로 붙여넣는 경우 등을 방어한다.
function sanitizeBackendUrl(raw: string | undefined): string {
  if (!raw) return "";
  const match = raw.match(/https?:\/\/[^\s'"]+/);
  return (match ? match[0] : raw).replace(/\/+$/, "").trim();
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const BACKEND =
    sanitizeBackendUrl(process.env.AAS_API_BASE) ||
    sanitizeBackendUrl(process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER) ||
    sanitizeBackendUrl(process.env.NEXT_PUBLIC_AAS_API_BASE) ||
    "";

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

  // body는 ArrayBuffer로 읽어 바이너리(파일 첨부 등 multipart/form-data)를 보존한다.
  // req.text()로 읽으면 파일 바이너리가 UTF-8로 디코딩되며 손상되어
  // 인스턴스 생성처럼 첨부파일이 있는 요청이 백엔드에서 깨진다.
  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
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
