/**
 * Custom ConceptDescription semanticId 자동 발급 규칙.
 *
 *  Custom ConceptDescription : https://{companyUrl}/ezAAS/cd/{conceptTreePath}/{version}/{revision}
 *
 * `/ezAAS/cd/` 경로는 **Custom Concept 에만** 적용한다.
 * ECLASS / IEC CDD / IDTA 등 표준 개념의 semanticId 는 절대 재생성하지 않는다.
 *
 * 참고: AAS SubmodelElement 는 표준상 id 필드가 없으므로 element.id 는 발급하지 않는다.
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

/** semanticId 의 출처 분류 결과 */
export type ConceptSource = "ECLASS" | "IEC_CDD" | "CUSTOM";

/**
 * semanticId 문자열로부터 출처(사전)를 추론한다.
 * ECLASS / IEC CDD 표준 IRDI 가 아니면 모두 CUSTOM 으로 본다(미식별 분류 없음).
 *  - ECLASS : ECLASS IRDI 는 `0173` 으로 시작 (예: 0173-1#02-AAO677#002)
 *  - IEC_CDD: IEC CDD IRDI 는 `0112` 로 시작 (예: 0112/2///61360_4#AAA...)
 *  - CUSTOM : 그 외 전부 (/ezAAS/cd/, IDTA admin-shell.io, 임의 IRI 등)
 */
export function classifyConceptSource(
  semanticId: string | null | undefined,
): ConceptSource {
  const id = (semanticId ?? "").trim();
  // 선행 공백/슬래시를 무시하고 ICD(국제 코드 지정자) prefix 확인
  const icd = id.replace(/^[\s/]+/, "").slice(0, 4);
  if (icd === "0173") return "ECLASS";
  if (icd === "0112") return "IEC_CDD";
  return "CUSTOM";
}
