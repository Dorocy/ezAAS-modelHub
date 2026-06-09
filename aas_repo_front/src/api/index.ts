import { apiRequest } from "@/app/apiRequest";
import type {
  GetModelListParams,
  GetModelParams,
  ImportModelParams,
  UpsertModelParams,
  ExportModelParams,
  GetPublishedListParams,
  GetPublishedModelParams,
  UpsertPublishedModelParams,
  GetInstanceListParams,
  GetInstanceParams,
  UpsertInstanceParams,
  GetInstanceTargetListParams,
  DeleteModelParams,
  VerifyModelParams,
  GetUserListParams,
  UpsertUserParams,
  VerifyInstanceParams,
} from "@/types/api";
import type { AuthTokenData } from "@/types/auth";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(id: string, pw: string) {
  return apiRequest({
    url: "register",
    options: {
      method: "POST",
      body: JSON.stringify({ id, pw }),
      headers: { "Content-Type": "application/json" },
    },
    withToast: true,
    messages: { loading: "Signing up..." },
  });
}

export async function loginWithCredentials(
  id: string,
  pw: string
): Promise<AuthTokenData> {
  return apiRequest({
    url: "login",
    options: {
      method: "POST",
      body: JSON.stringify({ id, pw }),
      headers: { "Content-Type": "application/json" },
    },
  });
}

export async function sendPasswordResetEmail(email: string): Promise<AuthTokenData> {
  return apiRequest({
    url: `password-reset/request?email=${email}`,
    withToast: true,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<AuthTokenData> {
  return apiRequest({
    url: "password-reset",
    options: {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
      headers: { "Content-Type": "application/json" },
    },
    withToast: true,
  });
}

// ── Model ─────────────────────────────────────────────────────────────────────

export async function getModelList(params: GetModelListParams) {
  // API: instance/list/{modelType}/{category_seq|all}
  const categorySeq = (params.searchParams as any)?.category_seq || "all";
  const searchKey = (params.searchParams as any)?.searchKey;
  const query = searchKey ? `?search=${encodeURIComponent(searchKey)}` : "";
  const url = `instance/list/${params.modelType}/${categorySeq}${query}`;
  // 비로그인 사용자도 템플릿 목록을 조회할 수 있도록 401 시 강제 리다이렉트하지 않는다.
  return apiRequest({ url, withToast: params.withToast, silent401: true });
}

export async function getModel(params: GetModelParams) {
  return apiRequest({
    url: `${params.modelType}/${encodeURIComponent(params.modelSeq)}`,
    withToast: params.withToast,
  });
}

export async function getModelVersions(params: GetModelParams) {
  return apiRequest({
    url: `${params.modelType}/history/${encodeURIComponent(params.modelSeq)}`,
    withToast: params.withToast,
  });
}

export async function verifyModel(params: VerifyModelParams) {
  const path = params.modelType === "aasmodel" ? "aasmodel-id" : "submodel-id";
  const paramKey = params.modelType === "aasmodel" ? "aasmodel_id" : "submodel_id";
  return apiRequest({
    url: `${params.modelType}/verify/${path}?${paramKey}=${encodeURIComponent(params.modelId)}`,
    options: { method: "POST" },
    errorThrow: params.errorThrow,
    withToast: params.withToast,
  });
}

export async function importModel(params: ImportModelParams) {
  const formData = new FormData();
  formData.append("file", params.file);
  const url = `basyx/${params.modelType}/import?id=${params.modelId != null ? encodeURIComponent(params.modelId) : ""}`;
  return apiRequest({
    url,
    options: { method: "POST", body: formData },
    withToast: true,
    errorThrow: true,
  });
}

export async function upsertModel(params: UpsertModelParams) {
  return apiRequest({
    url: `${params.modelType}/${params.status}/data`,
    options: { method: "POST", body: params.formData },
    withToast: params.withToast,
    errorThrow: params.errorThrow,
  });
}

export async function deleteModel(params: DeleteModelParams) {
  return apiRequest({
    url: `${params.modelType}/data?${params.modelType}_seq=${params.modelSeq}`,
    options: { method: "DELETE" },
    withToast: true,
  });
}

export async function exportModel(params: ExportModelParams): Promise<void> {
  const format = params.format ?? "json";
  const filename = params.filename ?? params.modelType;
  const payload = {
    name: filename,
    source: "db",
    model_key: String(params.modelSeq),
    modelType: params.modelType,
  };
  const blob = await apiRequest({
    url: `basyx/${params.modelType}/download?format=${format}`,
    options: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    responseType: "blob",
    withToast: true,
  });
  const { saveAs } = await import("file-saver");
  saveAs(blob, `${filename}.${format}`);
}

// ── Code ──────────────────────────────────────────────────────────────────────

export async function getCodeList(type: string, withToast = false) {
  // 공개 리스트 페이지의 카테고리 사이드바에서도 쓰이므로 401 시 리다이렉트하지 않는다.
  return apiRequest({ url: `common/code/${type}`, withToast, silent401: true });
}

// ── Published ─────────────────────────────────────────────────────────────────

export async function getPublishedList(params: GetPublishedListParams) {
  // API: instance/list/publish/all
  const searchKey = (params.searchParams as any)?.searchKey;
  const query = searchKey ? `?search=${encodeURIComponent(searchKey)}` : "";
  const url = `instance/list/publish/all${query}`;
  return apiRequest({ url, withToast: params.withToast });
}

export async function getPublishedModel(params: GetPublishedModelParams) {
  return apiRequest({
    url: `published/${params.modelType}/${params.target_seq}`,
    withToast: params.withToast,
  });
}

export async function getPublishedHistoryModel(params: GetPublishedModelParams) {
  return apiRequest({
    url: `published/history/${params.modelType}/${params.target_seq}`,
    withToast: params.withToast,
  });
}

export async function upsertPublishedModel(params: UpsertPublishedModelParams) {
  return apiRequest({
    url: "published/data",
    options: {
      method: params.method,
      body: JSON.stringify(params.body),
      headers: { "Content-Type": "application/json" },
    },
    withToast: params.withToast,
  });
}

export async function getPublishedCount() {
  return apiRequest({ url: "published/count" });
}

// ── Instance ──────────────────────────────────────────────────────────────────

export async function getInstanceTargetList(params: GetInstanceTargetListParams) {
  return apiRequest({
    url: `instance/list/${params.modelType}/${params.category_seq}`,
    withToast: params.withToast,
  });
}

export async function getInstanceList(params: GetInstanceListParams) {
  // API: GET /instance/list/{category}/{pageNumber}/{pageSize}
  //   - category: "all" | category_seq
  //   - query: searchKey, user_seq("my" 필터)
  // 응답: { data: { recordsTotal, recordsFiltered, data: [...instances] } }
  const category = params.category_seq && params.category_seq !== "0" ? params.category_seq : "all";
  const qs = new URLSearchParams();
  const sp = params.searchParams || {};
  if (sp.searchKey) qs.set("searchKey", sp.searchKey);
  if (sp.user_seq) qs.set("user_seq", sp.user_seq);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const url = `instance/list/${category}/${params.pageNumber}/${params.pageSize}${query}`;
  return apiRequest({ url, withToast: params.withToast });
}

export async function getInstance(params: GetInstanceParams) {
  return apiRequest({
    url: `instance/${params.instance_seq}`,
    withToast: params.withToast,
  });
}

export async function apiVerifyInstance(params: VerifyInstanceParams) {
  return apiRequest({
    url: "instance/verification",
    options: {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    },
    withToast: true,
    errorThrow: true,
  });
}

export async function upsertInstance(params: UpsertInstanceParams) {
  return apiRequest({
    url: "instance/data",
    options: { method: "POST", body: params.formData },
    withToast: params.withToast,
    errorThrow: params.errorThrow,
  });
}

export async function getInstanceDetail(params: GetInstanceParams) {
  return apiRequest({
    url: `instance/detail/${params.instance_seq}`,
    withToast: params.withToast,
  });
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function getUserList(params: GetUserListParams) {
  // 백엔드 검증된 엔드포인트: user/list/{pageNumber}/{pageSize}?{searchParams}
  // (이전 운영 버전에서 사용하던 경로. user/info/list 는 빈 결과를 반환해 교체함)
  const qs = new URLSearchParams(
    params.searchParams as Record<string, string>
  ).toString();
  const url = `user/list/${params.pageNumber}/${params.pageSize}${qs ? `?${qs}` : ""}`;
  return apiRequest({ url, withToast: params.withToast });
}

export async function getUser({ userSeq }: { userSeq: string }) {
  return apiRequest({ url: `user/info/${userSeq}` });
}

export async function upsertUser(params: UpsertUserParams) {
  return apiRequest({
    url: "user/info",
    options: {
      method: "POST",
      body: JSON.stringify(params.body),
      headers: { "Content-Type": "application/json" },
    },
    withToast: params.withToast,
  });
}
