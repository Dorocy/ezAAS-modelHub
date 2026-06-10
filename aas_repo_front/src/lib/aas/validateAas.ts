/**
 * Validation: SDK 의 verification 을 주 검증으로 사용한다(승인됨).
 *
 * 저장/Export 직전에 호출해 AAS 메타모델 제약 위반을 클라이언트에서 차단한다.
 * 백엔드 검증은 보조로 유지된다.
 */

import { aasVerification } from "./aasClient";
import type { ValidationIssue, ValidationResult } from "./types";

/** 검증 시 수집할 최대 이슈 개수(과도한 메모리/렌더 방지). */
const DEFAULT_MAX_ISSUES = 100;

/**
 * AAS 인스턴스(Environment / Submodel / SubmodelElement 등)를 검증한다.
 *
 * @param instance 검증 대상 (aasTypes.Class 인스턴스)
 * @param options.recurse 자식 요소까지 재귀 검증할지 여부. 기본 true.
 * @param options.maxIssues 수집할 최대 이슈 수. 기본 100.
 */
export function validate(
  instance: Parameters<typeof aasVerification.verify>[0],
  options: { recurse?: boolean; maxIssues?: number } = {}
): ValidationResult {
  const recurse = options.recurse ?? true;
  const maxIssues = options.maxIssues ?? DEFAULT_MAX_ISSUES;

  const issues: ValidationIssue[] = [];
  for (const error of aasVerification.verify(instance, recurse)) {
    issues.push({
      message: error.message,
      path: error.path.toString(),
    });
    if (issues.length >= maxIssues) break;
  }

  return { valid: issues.length === 0, issues };
}

/**
 * 저장/Export 가능 여부만 빠르게 확인한다(첫 이슈에서 즉시 중단).
 * 대규모 모델에서 "차단만" 하고 싶을 때 validate() 보다 가볍다.
 */
export function isValid(
  instance: Parameters<typeof aasVerification.verify>[0],
  recurse: boolean = true
): boolean {
  for (const _error of aasVerification.verify(instance, recurse)) {
    return false;
  }
  return true;
}
