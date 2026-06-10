/**
 * Import: 백엔드(BaSyx)에서 받은 JSON 을 SDK 객체로 역직렬화한다.
 *
 * 결정사항(승인됨): 파일 파싱(AASX/XML 등)은 백엔드 BaSyx 흐름을 유지하고,
 * 프론트엔드는 백엔드가 돌려준 JSON 만 SDK 타입으로 변환해 내부에서 사용한다.
 */

import { aasJsonization } from "./aasClient";
import type { Environment, Submodel, JsonValue, ParseResult } from "./types";

/**
 * 임의의 JSON 값(문자열 또는 이미 파싱된 객체)을 안전하게 JSON 값으로 정규화한다.
 * 백엔드 응답이 문자열로 올 수도, 객체로 올 수도 있어 양쪽을 모두 처리한다.
 */
function normalizeJsonable(input: string | JsonValue): ParseResult<JsonValue> {
  if (typeof input !== "string") {
    return { ok: true, value: input, error: null };
  }
  try {
    return { ok: true, value: JSON.parse(input) as JsonValue, error: null };
  } catch (e) {
    return {
      ok: false,
      value: null,
      error: e instanceof Error ? e.message : "JSON 파싱에 실패했습니다.",
    };
  }
}

/**
 * JSON → AAS Environment.
 * Environment 는 shells / submodels / conceptDescriptions 를 담는 최상위 컨테이너다.
 */
export function environmentFromJson(
  input: string | JsonValue
): ParseResult<Environment> {
  const normalized = normalizeJsonable(input);
  if (!normalized.ok || normalized.value === null) {
    return { ok: false, value: null, error: normalized.error };
  }

  const either = aasJsonization.environmentFromJsonable(normalized.value);
  if (either.error !== null) {
    return {
      ok: false,
      value: null,
      error: `${either.error.message} (at: ${either.error.path.toString()})`,
    };
  }
  return { ok: true, value: either.value, error: null };
}

/**
 * JSON → AAS Submodel (단일 서브모델 역직렬화).
 */
export function submodelFromJson(
  input: string | JsonValue
): ParseResult<Submodel> {
  const normalized = normalizeJsonable(input);
  if (!normalized.ok || normalized.value === null) {
    return { ok: false, value: null, error: normalized.error };
  }

  const either = aasJsonization.submodelFromJsonable(normalized.value);
  if (either.error !== null) {
    return {
      ok: false,
      value: null,
      error: `${either.error.message} (at: ${either.error.path.toString()})`,
    };
  }
  return { ok: true, value: either.value, error: null };
}
