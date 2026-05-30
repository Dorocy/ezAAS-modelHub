// 클라이언트 사이드 메모리에 토큰을 저장하는 모듈 수준 싱글톤
// AuthContext에서 로그인 시 setClientToken()을 호출하고,
// apiRequest 클라이언트 사이드에서 getClientToken()으로 읽어 Authorization 헤더에 추가합니다.

let _token: string | null = null;

export function setClientToken(token: string | null) {
  _token = token;
}

export function getClientToken(): string | null {
  return _token;
}
