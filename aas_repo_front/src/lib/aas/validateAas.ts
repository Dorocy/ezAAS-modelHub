/**
 * Validation: SDK 의 verification 을 주 검증으로 사용한다(승인됨).
 *
 * 저장/Export 직전에 호출해 AAS 메타모델 제약 위반을 클라이언트에서 차단한다.
 * 백엔드 검증은 보조로 유지된다.
 */

import { aasVerification } from "./aasClient";
import { environmentFromJson, submodelFromJson } from "./importAas";
import type { ValidationIssue, ValidationResult, JsonValue } from "./types";

/** 검증 이슈 심각도. */
export type ValidationSeverity = "error" | "warning";

/** 심각도가 부여된 검증 이슈. */
export interface ClassifiedIssue extends ValidationIssue {
  severity: ValidationSeverity;
}

/**
 * 읽기 전용 모델 검증 결과.
 *
 * 정책(승인됨):
 * - 역직렬화 실패(구조적으로 깨진 AAS) → error 1건. (저장/Export 라면 차단 대상)
 * - 메타모델 제약 위반(verify) → warning. (차단하지 않고 정보만 제공)
 */
export interface ModelValidationReport {
  /** 역직렬화 성공 여부. false 면 구조가 깨진 것. */
  parsed: boolean;
  /** error 개수 (역직렬화 실패 시 1, 그 외 0). */
  errorCount: number;
  /** warning 개수 (메타모델 위반 수). */
  warningCount: number;
  /** 심각도가 부여된 이슈 목록 (error 가 앞에 오도록 정렬). */
  issues: ClassifiedIssue[];
}

/** ModelDetailView 등에서 쓰는 모델 종류. */
export type ModelMetadataKind = "environment" | "submodel";

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

/**
 * raw JSON metadata 를 역직렬화 + 검증하여 읽기 전용 리포트를 만든다.
 *
 * UI(읽기 전용 표시) 전용 진입점이다. SDK 객체를 상태로 보관하지 않고,
 * 호출 시점에 metadata 로부터 임시로 역직렬화하여 검증만 수행한 뒤 버린다.
 *
 * @param metadata 백엔드가 내려준 raw JSON (문자열/객체 모두 허용)
 * @param kind     "environment"(aasmodel/instance) | "submodel"
 * @param options.maxIssues 수집할 최대 warning 수. 기본 100.
 */
export function validateModelMetadata(
  metadata: string | JsonValue | null | undefined,
  kind: ModelMetadataKind,
  options: { maxIssues?: number } = {}
): ModelValidationReport {
  if (metadata === null || metadata === undefined) {
    return { parsed: false, errorCount: 1, warningCount: 0, issues: [
      { severity: "error", message: "검증할 metadata 가 없습니다.", path: "" },
    ] };
  }

  const parsed =
    kind === "submodel"
      ? submodelFromJson(metadata)
      : environmentFromJson(metadata);

  if (!parsed.ok || parsed.value === null) {
    return {
      parsed: false,
      errorCount: 1,
      warningCount: 0,
      issues: [
        {
          severity: "error",
          message: `AAS 구조를 해석할 수 없습니다: ${parsed.error ?? "알 수 없는 오류"}`,
          path: "",
        },
      ],
    };
  }

  const result: ValidationResult = validate(parsed.value, {
    maxIssues: options.maxIssues ?? DEFAULT_MAX_ISSUES,
  });

  const issues: ClassifiedIssue[] = result.issues.map((i) => ({
    ...i,
    severity: "warning" as const,
  }));

  return {
    parsed: true,
    errorCount: 0,
    warningCount: issues.length,
    issues,
  };
}
