/**
 * Edit: SDK AAS 객체를 수정하기 위한 헬퍼.
 *
 * SDK 의 타입들은 가변(mutable) 클래스이지만, 이 모듈은 "불변 지향"으로 동작한다.
 * 즉 원본을 직접 바꾸지 않고, 먼저 깊은 복제본을 만든 뒤 복제본을 수정해 반환한다.
 * (복제는 jsonization round-trip 으로 수행 — SDK 가 제공하는 안전한 방식)
 *
 * idShort 트리 탐색은 SDK 의 descend() 순회와 is* 타입 가드만 사용한다.
 */

import { aasTypes, aasJsonization } from "./aasClient";
import type {
  Environment,
  Submodel,
  SubmodelElement,
  Property,
} from "./types";

/* ── 복제 ──────────────────────────────────────────────────────────── */

/** Environment 깊은 복제 (jsonization round-trip). */
export function cloneEnvironment(env: Environment): Environment {
  const jsonable = aasJsonization.toJsonable(env);
  return aasJsonization.environmentFromJsonable(jsonable).mustValue();
}

/** Submodel 깊은 복제 (jsonization round-trip). */
export function cloneSubmodel(submodel: Submodel): Submodel {
  const jsonable = aasJsonization.toJsonable(submodel);
  return aasJsonization.submodelFromJsonable(jsonable).mustValue();
}

/* ── 탐색 ──────────────────────────────────────────────────────────── */

/**
 * 컨테이너(Submodel / Collection / List 등) 직속 자식 SubmodelElement 들을 반환한다.
 * 컨테이너 종류에 따라 자식 필드명이 다르므로(submodelElements / value) 여기서 흡수한다.
 */
export function getChildElements(node: aasTypes.Class): SubmodelElement[] {
  if (aasTypes.isSubmodel(node)) {
    return node.submodelElements ?? [];
  }
  if (aasTypes.isSubmodelElementCollection(node)) {
    return node.value ?? [];
  }
  if (aasTypes.isSubmodelElementList(node)) {
    return node.value ?? [];
  }
  return [];
}

/**
 * Submodel 전체(재귀)에서 idShort 가 일치하는 첫 SubmodelElement 를 찾는다.
 * descend() 는 모든 후손 Class 를 순회하므로 깊이 제한 없이 탐색된다.
 */
export function findElementByIdShort(
  submodel: Submodel,
  idShort: string
): SubmodelElement | null {
  for (const node of submodel.descend()) {
    if (
      isSubmodelElement(node) &&
      node.idShort === idShort
    ) {
      return node;
    }
  }
  return null;
}

/** Class 인스턴스가 SubmodelElement 계열인지 좁히는 가드. */
function isSubmodelElement(node: aasTypes.Class): node is SubmodelElement {
  return (
    aasTypes.isProperty(node) ||
    aasTypes.isMultiLanguageProperty(node) ||
    aasTypes.isSubmodelElementCollection(node) ||
    aasTypes.isSubmodelElementList(node) ||
    // 그 외 SubmodelElement 타입들도 idShort 를 가지므로 IReferable 로 취급
    "idShort" in node
  );
}

/* ── 수정 (불변 지향: 복제본을 수정해 반환) ─────────────────────────── */

/**
 * Submodel 내에서 idShort 로 Property 를 찾아 value 를 갱신한 새 Submodel 을 반환한다.
 * 대상이 없거나 Property 가 아니면 변경 없이 원본의 복제본을 반환한다.
 *
 * @returns { submodel, changed } 변경 성공 여부 포함
 */
export function setPropertyValueByIdShort(
  submodel: Submodel,
  idShort: string,
  value: string | null
): { submodel: Submodel; changed: boolean } {
  const clone = cloneSubmodel(submodel);
  const target = findElementByIdShort(clone, idShort);
  if (target !== null && aasTypes.isProperty(target)) {
    target.value = value;
    return { submodel: clone, changed: true };
  }
  return { submodel: clone, changed: false };
}

/**
 * Property 인스턴스의 value 를 갱신한 복제본을 반환한다(원본 불변).
 * Property 는 Submodel 컨텍스트 없이도 단독으로 다룰 수 있어 별도 제공한다.
 */
export function withPropertyValue(
  property: Property,
  value: string | null
): Property {
  const jsonable = aasJsonization.toJsonable(property);
  const clone = aasJsonization
    .propertyFromJsonable(jsonable)
    .mustValue();
  clone.value = value;
  return clone;
}
