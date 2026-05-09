# Nginx & Docker

이 디렉터리는 Nginx 리버스 프록시와 Docker Compose를 사용하여 전체 AAS Repository 시스템을 배포하고 관리하기 위한 설정 파일들을 포함합니다.

## 📁 주요 파일 및 디렉터리 구조

-   `docker-compose.yml`: 백엔드, 프론트엔드, Nginx 등 모든 서비스를 정의하고 연결하는 핵심 파일입니다.
-   `default.conf`: Nginx의 기본 리버스 프록시 설정 파일입니다. HTTP 요청을 적절한 서비스(프론트엔드 또는 백엔드)로 전달하는 역할을 합니다.
-   `conf.d/`: Nginx의 추가 설정 파일을 포함하는 디렉터리입니다.
-   `certbot/` & `ssl/`: SSL/TLS 인증서 관련 파일들을 저장하는 디렉터리입니다. HTTPS 통신을 위해 사용됩니다.

## 🚀 사용법

### 서비스 시작

아래 명령어를 실행하여 `docker-compose.yml`에 정의된 모든 서비스를 백그라운드에서 시작합니다.

```bash
docker-compose up -d
```

### 서비스 중지

실행 중인 모든 서비스를 중지하려면 다음 명령어를 사용합니다.

```bash
docker-compose down
```

### 서비스 상태 확인

현재 실행 중인 서비스의 상태를 확인합니다.

```bash
docker-compose ps
```

### 로그 확인

특정 서비스의 로그를 실시간으로 확인하려면 다음 명령어를 사용합니다. (예: `backend`)

```bash
docker-compose logs -f backend
```
