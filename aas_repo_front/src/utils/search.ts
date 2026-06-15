/**
 * 검색 결과 정렬 유틸.
 *
 * 우선순위:
 *  1) 이름(name) 정확히 일치
 *  2) 이름이 검색어로 시작
 *  3) 이름에 검색어 포함
 *  4) 그 외 키워드(설명/ID/카테고리 등) 포함
 *  5) 매칭 없음
 *
 * 동일 점수일 경우 원래(서버) 순서를 유지한다.
 */

export interface RankOptions<T> {
  /** 이름으로 취급할 필드 값 추출 (가장 높은 우선순위) */
  getName: (item: T) => string | null | undefined;
  /** 이름 외 검색 대상 키워드 텍스트들 (설명, ID, 카테고리 등) */
  getKeywords?: (item: T) => Array<string | null | undefined>;
}

function norm(v: string | null | undefined): string {
  return (v ?? "").toString().trim().toLowerCase();
}

/** 단일 아이템의 검색 점수 (높을수록 우선). 0 이면 매칭 없음. */
export function scoreItem<T>(item: T, query: string, opts: RankOptions<T>): number {
  const q = norm(query);
  if (!q) return 1; // 검색어 없으면 모두 동일 취급

  const name = norm(opts.getName(item));
  if (name) {
    if (name === q) return 100;
    if (name.startsWith(q)) return 80;
    if (name.includes(q)) return 60;
  }

  const keywords = opts.getKeywords?.(item) ?? [];
  for (const kw of keywords) {
    if (norm(kw).includes(q)) return 30;
  }

  return 0;
}

/**
 * 검색어 기준으로 정렬된 새 배열을 반환한다.
 * 이름 매칭을 최우선으로 보여주고, 그다음 키워드 매칭을 보여준다.
 *
 * @param dropNonMatching true 면 전혀 매칭되지 않는 항목을 제거한다 (기본 false).
 */
export function rankByQuery<T>(
  items: T[],
  query: string,
  opts: RankOptions<T>,
  dropNonMatching = false,
): T[] {
  const q = norm(query);
  if (!q) return items;

  const scored = items.map((item, index) => ({
    item,
    index,
    score: scoreItem(item, query, opts),
  }));

  const filtered = dropNonMatching ? scored.filter((s) => s.score > 0) : scored;

  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index; // 안정 정렬: 원래 순서 유지
  });

  return filtered.map((s) => s.item);
}
