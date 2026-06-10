/**
 * AAS 도메인 타입 re-export 및 lib/aas 전용 보조 타입.
 *
 * 컴포넌트/유틸은 SDK 의 types 모듈을 직접 import 하지 않고 이 파일에서 가져온다.
 */

import { aasTypes, aasJsonization } from "./aasClient";

/* ── SDK 핵심 타입 alias ───────────────────────────────────────────── */

export type Environment = aasTypes.Environment;
export type Submodel = aasTypes.Submodel;
export type AssetAdministrationShell = aasTypes.AssetAdministrationShell;
export type ConceptDescription = aasTypes.ConceptDescription;
export type SubmodelElement = aasTypes.ISubmodelElement;
export type Property = aasTypes.Property;
export type SubmodelElementCollection = aasTypes.SubmodelElementCollection;
export type SubmodelElementList = aasTypes.SubmodelElementList;
export type MultiLanguageProperty = aasTypes.MultiLanguageProperty;
export type Reference = aasTypes.Reference;
export type Referable = aasTypes.IReferable;

/* SDK 의 JSON 직렬화 입출력 타입 */
export type JsonValue = aasJsonization.JsonValue;
export type JsonObject = aasJsonization.JsonObject;

/* ── lib/aas 전용 보조 타입 ────────────────────────────────────────── */

/** 검증 이슈 1건 (SDK VerificationError 를 평탄화한 형태) */
export interface ValidationIssue {
  /** 사람이 읽을 수 있는 오류 메시지 */
  message: string;
  /** 오류가 발생한 요소의 상대 경로 (예: "submodels[0].idShort") */
  path: string;
}

/** 검증 결과 묶음 */
export interface ValidationResult {
  /** 이슈가 하나도 없으면 true */
  valid: boolean;
  /** 발견된 모든 검증 이슈 */
  issues: ValidationIssue[];
}

/** import(역직렬화) 결과 - 성공 시 value, 실패 시 error 메시지 */
export interface ParseResult<T> {
  ok: boolean;
  value: T | null;
  error: string | null;
}
