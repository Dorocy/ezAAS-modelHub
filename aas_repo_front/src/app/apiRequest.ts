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
}

export async function apiRequest({
  url,
  options = {},
  messages = {},
  responseType = "json",
  errorThrow = true,
  withToast = false,
}: ApiRequestParams): Promise<any> {
  const isServer = typeof window === "undefined";

  let fullUrl: string;

  if (isServer) {
    // 서버사이드: ngrok으로 직접 요청 (CORS 없음)
    const base = process.env.NEXT_PUBLIC_AAS_API_PORT_SERVER
      ? `${process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER}:${process.env.NEXT_PUBLIC_AAS_API_PORT_SERVER}`
      : process.env.NEXT_PUBLIC_AAS_API_BASE_SERVER || process.env.NEXT_PUBLIC_AAS_API_BASE || "";
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

  try {
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      if (response.status === 401) {
        await fetch(
          `${isServer ? process.env.NEXT_PUBLIC_SITE_URL : ""}/api/logout`,
          { method: "POST" }
        );
        if (isServer) {
          redirect(ROUTES.LOGIN);
        } else {
          window.location.replace(ROUTES.LOGIN);
        }
      }

      const json = await response.json();
      if (!errorThrow) return json;

      throw new Error(json.msg || messages.error || "API Error", {
        cause: { status: response.status, json },
      });
    }

    const result =
      responseType === "blob" ? await response.blob() : await response.json();

    if ("result" in result && result.result !== "ok") {
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

    if (isServer && error.message === "NEXT_REDIRECT") {
      throw error;
    }
  }
}
