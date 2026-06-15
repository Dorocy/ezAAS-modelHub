// @ts-nocheck
import { TreeNodeData } from "@mantine/core";

export async function parseJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(new Error("유효하지 않은 JSON 형식입니다."));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 도중 오류가 발생했습니다."));
    };

    reader.readAsText(file);
  });
}

export function formatDateToDotYMD(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  } catch (error) {
    console.error(error.message);
  }
}

export function convertToSelectData(item) {
  return {
    value: String(item.id),
    label: String(item.text),
  };
}

export function base64ToFile(imageBase64, filename, mimeType) {
  if (!imageBase64) {
    return;
  }
  try {
    const binaryString = window.atob(imageBase64.replace(/\s/g, ""));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const file = new File([bytes], filename, { type: mimeType });
    return file;
  } catch (error) {
    console.error(error.message);
  }
}

export function getCodeTree(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  const treeMap = new Map();

  data.forEach((item) => {
    item.label = item.title;
    item.value = item.c_id;
    treeMap.set(item.c_id, { ...item });
  });

  const tree: TreeNodeData[] = [];

  treeMap.entries().forEach(([key, node]) => {
    const parent = treeMap.get(node.p_id);
    if (parent) {
      if (parent.children == null) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
}

/**
 * 모델(템플릿) 객체에서 썸네일 이미지 소스를 추출한다.
 * - 백엔드 필드명이 환경마다 다를 수 있어 여러 후보를 순서대로 확인한다.
 * - base64 문자열이면 data URL 로 변환하고, 이미 data:/http// URL 이면 그대로 사용한다.
 * - 적절한 값이 없으면 undefined 를 반환한다(호출부에서 아이콘 등으로 폴백).
 * 목록 API 에 썸네일 필드가 추가되면 별도 수정 없이 자동으로 동작한다.
 */
export function resolveThumbnailSrc(model): string | undefined {
  if (!model) return undefined;
  const raw =
    model.aasmodel_img ??
    model.submodel_img ??
    model.thumbnail ??
    model.thumbnail_img ??
    model.image ??
    model.img;
  if (!raw || typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  const mime = model.mime_type || model.mimeType || "image/png";
  return `data:${mime};base64,${trimmed}`;
}
