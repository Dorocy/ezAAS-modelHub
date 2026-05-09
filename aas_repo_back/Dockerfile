# 파이썬
FROM python:3.13-slim

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    default-jre \
    libpq-dev \
    gcc \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 라이브러리 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# 실행 명령어
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]