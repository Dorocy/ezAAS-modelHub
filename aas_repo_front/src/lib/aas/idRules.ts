/**
 * Custom Concept / Element ID 자동 발급 규칙.
 *
 * 두 종류의 ID 를 생성하며 절대 서로 같지 않다.
 *  A. Element id                : https://{companyUrl}/ezAAS/{elementTreePath}/{version}/{revision}
 *  B. Custom ConceptDescription : https://{companyUrl}/ezAAS/cd/{conceptTreePath}/{version}/{revision}
 *
 * `/ezAAS/cd/` 경로는 **Custom Concept 에만** 적용한다.
 * ECLASS / IEC CDD / IDTA 등 표준 개념의 semanticId 는 절대 재생성하지 않는다.
 */

/** 회사 URL 정규화: 스킴 보강(없으면 https://) + trailing slash 제거. */
export function normalizeCompanyUrl(companyUrl: string | null | undefined): string {
  let url = (companyUrl ?? "").trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  // 끝의 슬래시 제거 (중복 슬래시 방지)
  return url.replace(/\/+$/, "");
}

/**
 * idShort 세그먼트들을 URL-safe tree path 로 조합한다.
 * - 빈 세그먼트 제외
 * - 각 세그먼트 encodeURIComponent
 * 예: buildTreePath("Nameplate", "TechnicalData", "Temperature") → "Nameplate/TechnicalData/Temperature"
 */
export function buildTreePath(...segments: Array<string | null | undefined>): string {
  return segments
    .map((s) => (s ?? "").toString().trim())
    .filter((s) => s.length > 0)
    .map((s) => encodeURIComponent(s))
    .join("/");
}

export interface BuildAasElementIdParams {
  companyUrl: string;
  elementTreePath: string;
  version?: number | string;
  revision?: number | string;
}

/** AAS element 자체의 id 생성. companyUrl 이 없으면 빈 문자열 반환. */
export function buildAasElementId({
  companyUrl,
  elementTreePath,
  version = 1,
  revision = 0,
}: BuildAasElementIdParams): string {
  const base = normalizeCompanyUrl(companyUrl);
  if (!base || !elementTreePath) return "";
  return `${base}/ezAAS/${elementTreePath}/${version}/${revision}`;
}

export interface BuildCustomConceptSemanticIdParams {
  companyUrl: string;
  conceptTreePath: string;
  version?: number | string;
  revision?: number | string;
}

/** Custom ConceptDescription 의 semanticId 생성 (`/ezAAS/cd/`). companyUrl 이 없으면 빈 문자열 반환. */
export function buildCustomConceptSemanticId({
  companyUrl,
  conceptTreePath,
  version = 1,
  revision = 0,
}: BuildCustomConceptSemanticIdParams): string {
  const base = normalizeCompanyUrl(companyUrl);
  if (!base || !conceptTreePath) return "";
  return `${base}/ezAAS/cd/${conceptTreePath}/${version}/${revision}`;
}
