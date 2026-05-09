-- =============================================================================
-- ezAAS Portal 스키마 추가 사항
-- 기준본    : AAS-HUB-DDL.sql  (먼저 실행; 이 파일은 Hub DDL을 반복하지 않음)
-- 생성일    : 2026-03-20
-- 모든 구문은 멱등성을 가짐. 중간에 중단되었더라도 안전하게 다시 실행 가능.
-- =============================================================================


-- =============================================================================
-- [신규 테이블 및 오브젝트]
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM: aasrepo.deploy_status
-- 사용 위치: instance_routing.deploy_status
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'deploy_status' AND n.nspname = 'aasrepo'
    ) THEN
        CREATE TYPE aasrepo.deploy_status AS ENUM (
            'PENDING',
            'BUILDING',
            'RUNNING',
            'ERROR',
            'STOPPED'
        );
    END IF;
END $$;


-- -----------------------------------------------------------------------------
-- ENUM: aasrepo.deploy_job_status
-- 사용 위치: instance_deploy_jobs.status
-- 상태 흐름: PENDING -> BUILDING -> STARTING -> RUNNING | FAILED | STOPPED
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'deploy_job_status' AND n.nspname = 'aasrepo'
    ) THEN
        CREATE TYPE aasrepo.deploy_job_status AS ENUM (
            'PENDING',
            'BUILDING',
            'STARTING',
            'RUNNING',
            'FAILED',
            'STOPPED'
        );
    END IF;
END $$;


-- -----------------------------------------------------------------------------
-- TABLE: aasrepo.instance_ports
-- FAST 인스턴스마다 1개 행을 가짐. aas_port: 21000~9999 | opc_port: 5000~999
-- released_at IS NULL 이면 포트 사용 중
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aasrepo.instance_ports (
    instance_seq  INTEGER      NOT NULL,
    aas_port      INTEGER      NOT NULL,
    opc_port      INTEGER      NOT NULL,
    allocated_at  TIMESTAMPTZ  DEFAULT now(),
    released_at   TIMESTAMPTZ,
    is_deleted    BOOLEAN      NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    updated_at    TIMESTAMPTZ  DEFAULT now(),
    CONSTRAINT pk_instance_ports          PRIMARY KEY (instance_seq),
    CONSTRAINT uq_instance_ports_aas_port UNIQUE (aas_port),
    CONSTRAINT uq_instance_ports_opc_port UNIQUE (opc_port)
);

CREATE INDEX IF NOT EXISTS idx_instance_ports_active
    ON aasrepo.instance_ports (released_at) WHERE released_at IS NULL;

ALTER TABLE aasrepo.instance_ports OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.instance_ports TO postgres;


-- -----------------------------------------------------------------------------
-- TABLE: aasrepo.instance_deploy_jobs
-- 배포 시도당 1개 행을 가짐. 인스턴스별로 여러 개의 이력 행 허용.
-- 인스턴스당 진행 중 행은 최대 1개만 허용되며, uix_deploy_jobs_active로 강제됨.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aasrepo.instance_deploy_jobs (
    job_id         UUID                       NOT NULL DEFAULT gen_random_uuid(),
    instance_seq   INTEGER                    NOT NULL,
    status         aasrepo.deploy_job_status  NOT NULL DEFAULT 'PENDING',
    image_name     VARCHAR(200),
    container_name VARCHAR(200),
    aas_port       INTEGER,                   -- 배포 시점 스냅샷(레거시; instance_ports에서 관리)
    opc_port       INTEGER,                   -- 배포 시점 스냅샷(레거시; instance_ports에서 관리)
    error_detail   TEXT,
    build_dir      VARCHAR(500),
    version_tag    VARCHAR(50),
    health_status  VARCHAR(20),               -- NULL | OK | FAIL
    is_deleted     BOOLEAN                    NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ                DEFAULT now(),
    updated_at     TIMESTAMPTZ                DEFAULT now(),
    CONSTRAINT pk_instance_deploy_jobs PRIMARY KEY (job_id)
);

CREATE INDEX IF NOT EXISTS idx_deploy_jobs_instance_seq
    ON aasrepo.instance_deploy_jobs (instance_seq);

CREATE INDEX IF NOT EXISTS idx_deploy_jobs_status
    ON aasrepo.instance_deploy_jobs (status);

-- 동일 인스턴스에 대해 동시에 진행 중인 배포를 방지.
-- 이력 행(RUNNING / FAILED / STOPPED)은 제외됨.
CREATE UNIQUE INDEX IF NOT EXISTS uix_deploy_jobs_active
    ON aasrepo.instance_deploy_jobs (instance_seq)
    WHERE status IN (
        'PENDING'::aasrepo.deploy_job_status,
        'BUILDING'::aasrepo.deploy_job_status,
        'STARTING'::aasrepo.deploy_job_status
    );

ALTER TABLE aasrepo.instance_deploy_jobs OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.instance_deploy_jobs TO postgres;


-- -----------------------------------------------------------------------------
-- TABLE: aasrepo.instance_routing
-- 활성 FAST 런타임당 1개 활성 행(Traefik 라우팅 레코드).
-- 각 배포 시 ON CONFLICT (instance_seq)로 업서트됨.
-- released_at IS NULL 이면 라우트 활성 상태
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aasrepo.instance_routing (
    instance_seq   INTEGER                NOT NULL,
    subdomain      VARCHAR(100)           NOT NULL,
    subdomain_url  VARCHAR(255)           NOT NULL,
    router_name    VARCHAR(100)           NOT NULL,
    service_name   VARCHAR(100)           NOT NULL,
    network_name   VARCHAR(100)           NOT NULL DEFAULT 'traefik-net',
    deploy_status  aasrepo.deploy_status  NOT NULL DEFAULT 'PENDING',
    traefik_labels JSONB,                          -- file_provider 모드에서는 NULL
    opc_ua_status  VARCHAR(20)            NOT NULL DEFAULT 'UNKNOWN',
    provider_type  VARCHAR(20)            NOT NULL DEFAULT 'docker_label',
    job_id         UUID,
    is_deleted     BOOLEAN                NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ            DEFAULT now(),
    updated_at     TIMESTAMPTZ            DEFAULT now(),
    released_at    TIMESTAMPTZ,
    CONSTRAINT pk_instance_routing
        PRIMARY KEY (instance_seq),
    CONSTRAINT uq_instance_routing_subdomain
        UNIQUE (subdomain),
    CONSTRAINT uq_instance_routing_subdomain_url
        UNIQUE (subdomain_url),
    CONSTRAINT chk_instance_routing_opc_ua_status
        CHECK (opc_ua_status IN ('CONNECTED', 'DISCONNECTED', 'UNKNOWN')),
    CONSTRAINT fk_instance_routing_job_id
        FOREIGN KEY (job_id)
        REFERENCES aasrepo.instance_deploy_jobs (job_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_instance_routing_active
    ON aasrepo.instance_routing (released_at) WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_instance_routing_status
    ON aasrepo.instance_routing (deploy_status);

CREATE INDEX IF NOT EXISTS idx_instance_routing_job_id
    ON aasrepo.instance_routing (job_id) WHERE job_id IS NOT NULL;

-- 트리거: 상태 전이가 발생할 때마다 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION aasrepo.fn_routing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_routing_updated_at ON aasrepo.instance_routing;
CREATE TRIGGER trg_routing_updated_at
    BEFORE UPDATE ON aasrepo.instance_routing
    FOR EACH ROW EXECUTE FUNCTION aasrepo.fn_routing_updated_at();

ALTER TABLE aasrepo.instance_routing OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.instance_routing TO postgres;


-- -----------------------------------------------------------------------------
-- TABLE: aasrepo.instance_deploy_configs
-- 배포별 불변 설정 스냅샷. 한 번만 기록되며 이후 갱신하지 않음.
-- instance_deploy_jobs에서 삭제되면 연쇄 삭제됨.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aasrepo.instance_deploy_configs (
    job_id            UUID        NOT NULL,
    source_type       VARCHAR(20) NOT NULL DEFAULT 'static',  -- 'static' | 'live'
    runtime_tag       VARCHAR(100),
    opc_endpoint      TEXT,
    opc_username      TEXT,
    opc_password_enc  TEXT,                                    -- AES-256-GCM base64; 평문 로그 금지
    property_mappings JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pk_instance_deploy_configs PRIMARY KEY (job_id),
    CONSTRAINT fk_instance_deploy_configs_job
        FOREIGN KEY (job_id)
        REFERENCES aasrepo.instance_deploy_jobs (job_id) ON DELETE CASCADE
);

ALTER TABLE aasrepo.instance_deploy_configs OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.instance_deploy_configs TO postgres;


-- -----------------------------------------------------------------------------
-- VIEW: aasrepo.v_instance_deploy_jobs_latest
-- 운영 점검용으로 인스턴스별 최신 배포 작업을 조회하는 뷰.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW aasrepo.v_instance_deploy_jobs_latest AS
SELECT DISTINCT ON (j.instance_seq)
    j.instance_seq,
    j.job_id,
    j.status,
    j.health_status,
    j.image_name,
    j.container_name,
    j.build_dir,
    j.version_tag,
    j.error_detail,
    j.created_at,
    j.updated_at
FROM aasrepo.instance_deploy_jobs j
ORDER BY j.instance_seq, j.created_at DESC;


-- =============================================================================
-- [스키마 변경 사항]
-- 기존 Hub 테이블은 수정하지 않음.
-- Portal 추가분은 모두 aasrepo 스키마의 신규 오브젝트임.
-- =============================================================================
-- (의도적으로 비워 둠)


-- =============================================================================
-- 다음 쿼리로 검증:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'aasrepo'
--     AND table_name IN ('instance_ports','instance_deploy_jobs',
--                        'instance_routing','instance_deploy_configs');
--   -- 예상 결과: 4행
-- =============================================================================
