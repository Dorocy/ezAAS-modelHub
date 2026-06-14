/**
 * lib/aas 공개 API 배럴.
 *
 * 컴포넌트/유틸은 개별 파일이 아니라 이 배럴에서 import 하는 것을 권장한다.
 *   import { environmentFromJson, validate, toJsonString } from "@/lib/aas";
 *
 * SDK(@aas-core-works/...) 직접 import 는 lib/aas 내부(aasClient.ts)로 한정한다.
 */

// SDK 네임스페이스 (필요 시 직접 접근용)
export { aasTypes, aasJsonization, aasVerification, aasStringification } from "./aasClient";

// 도메인 타입 + 보조 타입
export type {
  Environment,
  Submodel,
  AssetAdministrationShell,
  ConceptDescription,
  SubmodelElement,
  Property,
  SubmodelElementCollection,
  SubmodelElementList,
  MultiLanguageProperty,
  Reference,
  Referable,
  JsonValue,
  JsonObject,
  ValidationIssue,
  ValidationResult,
  ParseResult,
} from "./types";

// Import (JSON → SDK)
export { environmentFromJson, submodelFromJson } from "./importAas";

// Export (SDK → JSON)
export { toJsonObject, toJsonString } from "./exportAas";

// Validation
export { validate, isValid, validateModelMetadata } from "./validateAas";
export type {
  ValidationSeverity,
  ClassifiedIssue,
  ModelValidationReport,
  ModelMetadataKind,
} from "./validateAas";

// ID 발급 규칙 (Custom Concept / Element)
export {
  normalizeCompanyUrl,
  buildTreePath,
  buildAasElementId,
  buildCustomConceptSemanticId,
} from "./idRules";

// Edit (불변 지향)
export {
  cloneEnvironment,
  cloneSubmodel,
  getChildElements,
  findElementByIdShort,
  setPropertyValueByIdShort,
  withPropertyValue,
} from "./editAas";
