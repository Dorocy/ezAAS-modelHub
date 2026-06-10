/**
 * Export: SDK 객체를 JSON(직렬화)으로 변환한다.
 *
 * 결정사항(승인됨): 실제 파일 생성/다운로드(AASX/XML 등)는 백엔드 BaSyx 흐름을
 * 유지한다. 이 모듈은 SDK 객체를 표준 JSON 표현으로 바꿔주는 역할만 한다.
 */

import { aasJsonization } from "./aasClient";
import type { JsonObject } from "./types";

/**
 * 모든 AAS 클래스 인스턴스(Environment / Submodel / SubmodelElement 등)를
 * JSON 직렬화 가능한 객체로 변환한다.
 *
 * `aasTypes.Class` 를 상속하는 모든 인스턴스가 입력으로 허용된다.
 */
export function toJsonObject(
  instance: Parameters<typeof aasJsonization.toJsonable>[0]
): JsonObject {
  return aasJsonization.toJsonable(instance);
}

/**
 * AAS 인스턴스를 JSON 문자열로 직렬화한다.
 * @param space JSON.stringify 들여쓰기(가독성). 기본값 2.
 */
export function toJsonString(
  instance: Parameters<typeof aasJsonization.toJsonable>[0],
  space: number = 2
): string {
  return JSON.stringify(aasJsonization.toJsonable(instance), null, space);
}
