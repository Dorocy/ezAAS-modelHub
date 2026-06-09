import { ROUTES } from "@/constants/routes";
import { showToast } from "@/utils/toast";
import { redirect } from "next/navigation";

interface ApiRequestParams {
  url: string;
  options?: RequestInit;
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };
  responseType?: "json" | "blob";
  errorThrow?: boolean;
  withToast?: boolean;
  /**
   * 401(미인증) 응답을 받아도 자동 로그아웃/로그인 리다이렉트를 하지 않는다.
   * 비로그인 사용자에게도 공개되는 조회(예: 템플릿 목록)에 사용한다.
   */
  silent401?: boolean;
}

export async function apiRequest({
  url,
  options = {},
  messages = {},
  responseType = "json",
  errorThrow = true,
  withToast = false,
  silent401 = false,
}: ApiRequestParams): Promise<any> {
  const isServer = typeof window === "undefined";

  let fullUrl: string;

  if (isServer) {
    // 서버사이드: ngrok으로 직접 요청 (CORS 없음)
    // 환경변수에 지저분한 값(공백, "-> http://..." 등)이 섞여도 첫 http(s) URL만 추출한다.
    const sanitize = (raw?: string) => {
      if (!raw) return "";
      const m = raw.match(/https?:\/\/[^\s'"]+/);
      return (m ? m[0] : raw).replace(/\/+$/, "").trim();
    };
    // AAS_API_BASE를 최우선으로 읽는다. (운영 중 백엔드 주소가 바뀔 때
    //  이 변수만 갱신되는 경우가 많고, NEXT_PUBLIC_* 값은 빌드시 박혀 stale 해지기 쉽다.)
    const baseRaw =
      sanitize(process.env.AAS_API_BASE) ||
      sanitize(process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER) ||
      sanitize(process.env.NEXT_PUBLIC_AAS_API_BASE) ||
      "";
    const base = process.env.NEXT_PUBLIC_AAS_API_PORT_SERVER
      ? `${baseRaw}:${process.env.NEXT_PUBLIC_AAS_API_PORT_SERVER}`
      : baseRaw;
    fullUrl = `${base}/${url}`;
  } else {
    // 클라이언트사이드: Next.js 프록시를 경유 (CORS / ngrok 경고 페이지 우회)
    fullUrl = `/api/proxy/${url}`;
  }

  options.headers = {
    ...(options.headers || {}),
    "ngrok-skip-browser-warning": "true",
  };

  if (isServer) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const tokenRaw = cookieStore.get("token_message")?.value;
      if (tokenRaw) {
        // 백엔드가 Authorization: Bearer {full token_message JSON} 형식을 기대함
        (options.headers as Record<string, string>)["Authorization"] = `Bearer ${tokenRaw}`;
      }
    } catch (err) {
      console.warn("Unable to attach Authorization header on server", err);
    }
  } else {
    // 클라이언트: 메모리에서 토큰을 읽어 Authorization 헤더에 추가
    const { getClientToken } = await import("@/app/tokenStore");
    const clientToken = getClientToken();
    if (clientToken) {
      (options.headers as Record<string, string>)["Authorization"] = `Bearer ${clientToken}`;
    }
    options.credentials = "include";
  }

  const toastId =
    !isServer && withToast
      ? showToast.loading(messages.loading || "Loading...")
      : undefined;

  // 응답 본문을 JSON으로 안전하게 파싱한다.
  // 백엔드(ngrok 터널 등)가 다운되면 JSON 대신 HTML 에러 페이지를 반환하는데,
  // 그대로 response.json()을 호출하면 SyntaxError가 발생해 혼란스러운
  // unhandled promise rejection으로 이어진다. 이를 깔끔한 에러로 변환한다.
  const parseJsonSafe = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "백엔드 서버에 연결할 수 없습니다. 서버 또는 ngrok 터널 상태를 확인해주세요.",
        { cause: { status: response.status, body: text.slice(0, 200) } }
      );
    }
  };

  try {
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      if (response.status === 401 && !silent401) {
        if (isServer) {
          // 서버사이드: 자기 라우트를 fetch해도 Set-Cookie가 브라우저로 전달되지
          // 않아 무의미하고, 절대 URL이 없으면 "undefined/api/logout"으로 파싱
          // 에러가 발생한다. 따라서 그냥 로그인 페이지로 리다이렉트한다.
          // (브라우저로 다시 진입하면 클라이언트 측 logout()이 쿠키를 정리한다.)
          redirect(ROUTES.LOGIN);
        } else {
          await fetch("/api/logout", { method: "POST" });
          window.location.replace(ROUTES.LOGIN);
        }
      }

      // 비로그인 공개 조회(silent401)에서 401을 받으면 에러 토스트나 throw 없이
      // 조용히 빈 결과를 돌려준다. 로그인하면 정상적으로 데이터가 채워진다.
      if (response.status === 401 && silent401) {
        return responseType === "blob" ? null : [];
      }

      const json = await parseJsonSafe(response);
      if (!errorThrow) return json;

      throw new Error(json.msg || messages.error || "API Error", {
        cause: { status: response.status, json },
      });
    }

    const result =
      responseType === "blob" ? await response.blob() : await parseJsonSafe(response);

    if (result && typeof result === "object" && "result" in result && result.result !== "ok") {
      if (!errorThrow) return result;
      throw new Error(result.msg || messages.error || "API Error", {
        cause: { status: response.status, json: result },
      });
    }

    if (!isServer && withToast) {
      showToast.success(messages.success || (result.msg ?? "Success"), {
        id: toastId,
      });
    }

    return responseType === "blob" ? result : (result.data ?? result);
  } catch (error: any) {
    if (!isServer) {
      if (toastId) {
        showToast.error(error.message, { id: toastId });
      } else {
        showToast.error(error.message);
      }
      throw error;
    }

    // 서버사이드: redirect()가 던진 NEXT_REDIRECT는 그대로 전파해야 한다.
    if (isServer && error?.message === "NEXT_REDIRECT") {
      throw error;
    }

    // 그 외 서버사이드 에러는 조용히 undefined를 반환하지 않고,
    // 로그를 남긴 뒤 다시 던져 호출부/에러 바운더리가 처리하도록 한다.
    if (isServer) {
      console.error("[apiRequest] server-side request failed:", error?.message, "url:", fullUrl);
      if (errorThrow) throw error;
      return undefined;
    }
  }
}
