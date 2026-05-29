/*
 * 파일명: src/utils/modal.ts
 * 설명: 확인 다이얼로그 유틸.
 *   - 기존에는 @mantine/modals 의 openConfirmModal 을 사용했으나,
 *     ClientLayout 에서 ModalsProvider 가 제거되면서 모달이 렌더되지 않아
 *     onConfirm/onCancel 이 영원히 호출되지 않았다. 그 결과 `await confirmSave(...)`
 *     의 Promise 가 resolve 되지 않아 저장/삭제 등의 동작이 조용히 멈췄다.
 *   - Provider 의존성을 제거하기 위해 브라우저 네이티브 confirm 으로 대체한다.
 */

interface ConfirmOptions {
  labels?: { confirm?: string; cancel?: string };
  [key: string]: unknown;
}

export const confirmSave = (message: string, _options: ConfirmOptions = {}) =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const result = window.confirm(message || "저장하시겠습니까?");
    resolve(result);
  });
