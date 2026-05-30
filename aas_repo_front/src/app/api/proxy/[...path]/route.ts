import { NextRequest, NextResponse } from "next/server";

// 백엔드 URL 후보들. ngrok 무료 터널은 재시작마다 주소가 바뀌어
// 일부 환경변수만 갱신되는 경우가 있으므로 여러 후보를 순서대로 확인하고,
// 값에 들어간 따옴표/공백/끝 슬래시를 제거한 뒤 http(s) 로 시작하는 첫 유효값을 사용한다.
// 환경변수 값이 따옴표/공백/메모(예: " -> http://localhost:8000") 로 오염될 수 있으므로
// 문자열에서 첫 번째 유효한 http(s) origin 만 추출한다.
const sanitizeUrl = (v?: string) => {
  if (!v) return "";
  const match = v.match(/https?:\/\/[^\s'"]+/);
  if (!match) return "";
  return match[0].replace(/\/+$/, "");
};

// 여러 환경변수가 서로 다른(때로는 죽은) 터널 주소를 가질 수 있으므로
// 모든 후보를 모아 중복 제거한 뒤, 실제로 살아있는 백엔드를 골라 사용한다.
const BACKEND_CANDIDATES = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER,
      process.env.NEXT_PUBLIC_AAS_API_BASE,
      process.env.AAS_API_BASE,
    ]
      .map(sanitizeUrl)
      .filter(Boolean)
  )
);

// 한 번 정상 확인된 백엔드는 메모리에 캐시해 매 요청마다 헬스체크하지 않는다.
let healthyBackend: string | null = null;

// 후보 중 JSON 으로 응답하는(=ngrok 경고 HTML 이 아닌) 살아있는 백엔드를 찾는다.
async function resolveBackend(): Promise<string> {
  if (healthyBackend) return healthyBackend;
  if (BACKEND_CANDIDATES.length === 0) return "";
  if (BACKEND_CANDIDATES.length === 1) {
    healthyBackend = BACKEND_CANDIDATES[0];
    return healthyBackend;
  }
  for (const candidate of BACKEND_CANDIDATES) {
    try {
      // 존재하는 GET 엔드포인트를 호출. 살아있는 백엔드는 JSON 을 반환하고
      // 죽은 ngrok 터널은 404 HTML 안내 페이지를 반환한다.
      const res = await fetch(`${candidate}/openapi.json`, {
        method: "GET",
        headers: { "ngrok-skip-browser-warning": "true" },
        signal: AbortSignal.timeout(4000),
      });
      const ct = res.headers.get("content-type") || "";
      if (res.ok && !ct.includes("text/html")) {
        healthyBackend = candidate;
        return candidate;
      }
    } catch {
      // 응답 없음 → 다음 후보로
    }
  }
  // 살아있는 후보를 못 찾으면 첫 후보로 시도 (호출부에서 에러 처리)
  return BACKEND_CANDIDATES[0];
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const BACKEND = await resolveBackend();
  if (!BACKEND) {
    return NextResponse.json(
      { result: "error", msg: "NEXT_PUBLIC_AAS_API_BASE 환경변수가 설정되지 않았습니다. 백엔드 서버 URL을 설정해 주세요." },
      { status: 503 }
    );
  }

  const { path } = await params;
  const pathStr = path.join("/");

  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND}/${pathStr}${search}`;

  // 클라이언트가 apiRequest에서 넣어준 Authorization 헤더를 그대로 전달
  const forwardHeaders: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    forwardHeaders["Authorization"] = authHeader;
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

    // 백엔드가 HTML을 반환하면 에러로 처리 (ngrok 경고/죽은 터널 페이지 방어)
    if (contentType.includes("text/html")) {
      // 캐시된 백엔드가 죽었을 수 있으니 무효화 → 다음 요청에서 다른 후보 재탐색
      healthyBackend = null;
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
