-- 스키마 삭제: aasrepo;

CREATE SCHEMA aasrepo AUTHORIZATION postgres;

-- 시퀀스 삭제: aasrepo.aasinstance_attachments_id_seq;

CREATE SEQUENCE aasrepo.aasinstance_attachments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.aasinstance_attachments_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.aasinstance_attachments_id_seq TO postgres;

-- 시퀀스 삭제: aasrepo.aasinstance_instance_seq_seq;

CREATE SEQUENCE aasrepo.aasinstance_instance_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.aasinstance_instance_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.aasinstance_instance_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.aasmodel_attachments_attachment_seq_seq;

CREATE SEQUENCE aasrepo.aasmodel_attachments_attachment_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.aasmodel_attachments_attachment_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.aasmodel_attachments_attachment_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.aasmodels_aasmodel_seq_seq;

CREATE SEQUENCE aasrepo.aasmodels_aasmodel_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.aasmodels_aasmodel_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.aasmodels_aasmodel_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.categories_category_seq_seq;

CREATE SEQUENCE aasrepo.categories_category_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.categories_category_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.categories_category_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.groups_group_seq_seq;

CREATE SEQUENCE aasrepo.groups_group_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.groups_group_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.groups_group_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.socialaccounts_socialaccount_seq_seq;

CREATE SEQUENCE aasrepo.socialaccounts_socialaccount_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.socialaccounts_socialaccount_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.socialaccounts_socialaccount_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.socialproviders_socialprovider_seq_seq;

CREATE SEQUENCE aasrepo.socialproviders_socialprovider_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.socialproviders_socialprovider_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.socialproviders_socialprovider_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.submodels_submodel_seq_seq;

CREATE SEQUENCE aasrepo.submodels_submodel_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.submodels_submodel_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.submodels_submodel_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.users_user_seq_seq;

CREATE SEQUENCE aasrepo.users_user_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.users_user_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.users_user_seq_seq TO postgres;

-- 시퀀스 삭제: aasrepo.validations_validation_seq_seq;

CREATE SEQUENCE aasrepo.validations_validation_seq_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- 권한 설정

ALTER SEQUENCE aasrepo.validations_validation_seq_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE aasrepo.validations_validation_seq_seq TO postgres;
-- aasrepo.aas_codeinfo 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aas_codeinfo;

CREATE TABLE aasrepo.aas_codeinfo ( grpcode varchar(10) NULL, code varchar(20) NOT NULL, codename text NULL, codename2 text NULL, codename3 text NULL, codename4 text NULL, codename5 text NULL, refcode1 varchar(400) NULL, refcode2 varchar(400) NULL, refcode3 varchar(400) NULL, refcode4 varchar(400) NULL, refcode5 varchar(400) NULL, sortkey int4 NULL, description text NULL, status bpchar(1) DEFAULT 'Y'::bpchar NULL, create_user_seq int4 NULL, create_date timestamptz NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT aasrepocode_pk PRIMARY KEY (code));
COMMENT ON TABLE aasrepo.aas_codeinfo IS 'AAS코드관리';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aas_codeinfo.grpcode IS '그룹코드';
COMMENT ON COLUMN aasrepo.aas_codeinfo.code IS '코드';
COMMENT ON COLUMN aasrepo.aas_codeinfo.codename IS '코드명1';
COMMENT ON COLUMN aasrepo.aas_codeinfo.codename2 IS '코드명2';
COMMENT ON COLUMN aasrepo.aas_codeinfo.codename3 IS '코드명3';
COMMENT ON COLUMN aasrepo.aas_codeinfo.codename4 IS '코드명4';
COMMENT ON COLUMN aasrepo.aas_codeinfo.codename5 IS '코드명5';
COMMENT ON COLUMN aasrepo.aas_codeinfo.refcode1 IS '참조코드1';
COMMENT ON COLUMN aasrepo.aas_codeinfo.refcode2 IS '참조코드2';
COMMENT ON COLUMN aasrepo.aas_codeinfo.refcode3 IS '참조코드3';
COMMENT ON COLUMN aasrepo.aas_codeinfo.refcode4 IS '참조코드4';
COMMENT ON COLUMN aasrepo.aas_codeinfo.refcode5 IS '참조코드5';
COMMENT ON COLUMN aasrepo.aas_codeinfo.sortkey IS '정렬키';
COMMENT ON COLUMN aasrepo.aas_codeinfo.description IS '비고';
COMMENT ON COLUMN aasrepo.aas_codeinfo.status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo.aas_codeinfo.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.aas_codeinfo.create_date IS '최초생성일';
COMMENT ON COLUMN aasrepo.aas_codeinfo.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.aas_codeinfo.last_mod_date IS '마지막수정일';

-- 권한 설정

ALTER TABLE aasrepo.aas_codeinfo OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aas_codeinfo TO postgres;


-- aasrepo.aasinstance_attachments 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasinstance_attachments;

CREATE TABLE aasrepo.aasinstance_attachments ( id bigserial NOT NULL, instance_seq int8 NOT NULL, filename text NULL, realpath text NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL, user_seq int4 NULL, CONSTRAINT aasinstance_attachments_instance_seq_realpath_key UNIQUE (instance_seq, realpath), CONSTRAINT aasinstance_attachments_pkey PRIMARY KEY (id), CONSTRAINT aasinstance_attachments_unique UNIQUE (instance_seq, filename));
CREATE INDEX idx_aasinstance_attachments_instance_seq ON aasrepo.aasinstance_attachments USING btree (instance_seq);

-- 권한 설정

ALTER TABLE aasrepo.aasinstance_attachments OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aasinstance_attachments TO postgres;


-- aasrepo.aaslogs_2025 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aaslogs_2025;

CREATE TABLE aasrepo.aaslogs_2025 ( dt timestamp NULL, log_type varchar(50) NULL, msg text NULL, target varchar(50) NULL, state varchar(50) NULL, flag bpchar(1) NULL, user_seq int4 NULL);

-- 권한 설정

ALTER TABLE aasrepo.aaslogs_2025 OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aaslogs_2025 TO postgres;


-- aasrepo.aaslogs_2026 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aaslogs_2026;

CREATE TABLE aasrepo.aaslogs_2026 ( dt timestamp NULL, log_type varchar(50) NULL, msg text NULL, target varchar(50) NULL, state varchar(50) NULL, flag bpchar(1) NULL, user_seq int4 NULL);

-- 권한 설정

ALTER TABLE aasrepo.aaslogs_2026 OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aaslogs_2026 TO postgres;


-- aasrepo.aasmodel_attachments 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasmodel_attachments;

CREATE TABLE aasrepo.aasmodel_attachments ( attachment_seq bigserial NOT NULL, aasmodel_seq int8 NOT NULL, filename varchar NOT NULL, realpath varchar NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT aasmodel_attachments_aasmodel_seq_realpath_key UNIQUE (aasmodel_seq, realpath), CONSTRAINT aasmodel_attachments_pkey PRIMARY KEY (attachment_seq), CONSTRAINT unique_aasmodel_seq_filename UNIQUE (aasmodel_seq, filename));
COMMENT ON TABLE aasrepo.aasmodel_attachments IS 'AAS모델-첨부파일';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasmodel_attachments.attachment_seq IS '첨부파일SEQ';
COMMENT ON COLUMN aasrepo.aasmodel_attachments.aasmodel_seq IS 'AAS모델SEQ';
COMMENT ON COLUMN aasrepo.aasmodel_attachments.filename IS '파일명';
COMMENT ON COLUMN aasrepo.aasmodel_attachments.realpath IS '파일서버경로';
COMMENT ON COLUMN aasrepo.aasmodel_attachments.create_date IS '생성일';

-- 권한 설정

ALTER TABLE aasrepo.aasmodel_attachments OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aasmodel_attachments TO postgres;


-- aasrepo.aasmodel_image 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasmodel_image;

CREATE TABLE aasrepo.aasmodel_image ( aasmodel_seq int8 NOT NULL, aasmodel_img text NULL, filename varchar NULL, mime_type varchar NULL, CONSTRAINT aasmodels_image_unique UNIQUE (aasmodel_seq));
COMMENT ON TABLE aasrepo.aasmodel_image IS 'AAS모델-이미지';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasmodel_image.aasmodel_seq IS 'AAS모델SEQ';
COMMENT ON COLUMN aasrepo.aasmodel_image.aasmodel_img IS 'AAS모델_IMAGE';
COMMENT ON COLUMN aasrepo.aasmodel_image.filename IS 'AAS모델_MIMETYPE';
COMMENT ON COLUMN aasrepo.aasmodel_image.mime_type IS 'AAS모델_MIMETYPE';

-- 권한 설정

ALTER TABLE aasrepo.aasmodel_image OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aasmodel_image TO postgres;


-- aasrepo.categories 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.categories;

CREATE TABLE aasrepo.categories ( category_seq serial4 NOT NULL, category_name varchar NOT NULL, category_name2 varchar NULL, category_name3 varchar NULL, category_name4 varchar NULL, category_name5 varchar NULL, description text NULL, status bpchar(1) DEFAULT 'Y'::bpchar NOT NULL, refcode1 varchar NULL, refcode2 varchar NULL, refcode3 varchar NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT categories_pk PRIMARY KEY (category_seq));
COMMENT ON TABLE aasrepo.categories IS '모델카테고리(산업분류)';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.categories.category_seq IS '모델카테고리시퀀스';
COMMENT ON COLUMN aasrepo.categories.category_name IS '모델카테고리명(영어)';
COMMENT ON COLUMN aasrepo.categories.category_name2 IS '모델카테고리명(한국)';
COMMENT ON COLUMN aasrepo.categories.category_name3 IS '모델카테고리명()';
COMMENT ON COLUMN aasrepo.categories.category_name4 IS '모델카테고리명()';
COMMENT ON COLUMN aasrepo.categories.category_name5 IS '모델카테고리명()';
COMMENT ON COLUMN aasrepo.categories.description IS '비고';
COMMENT ON COLUMN aasrepo.categories.status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo.categories.refcode1 IS '카테고리-대분류';
COMMENT ON COLUMN aasrepo.categories.refcode2 IS '카테고리-중분류';
COMMENT ON COLUMN aasrepo.categories.refcode3 IS '카테고리-소분류';
COMMENT ON COLUMN aasrepo.categories.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.categories.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.categories.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.categories.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.categories OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.categories TO postgres;


-- aasrepo."groups" 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo."groups";

CREATE TABLE aasrepo."groups" ( group_seq serial4 NOT NULL, group_name varchar NOT NULL, group_name2 varchar NULL, group_name3 varchar NULL, group_name4 varchar NULL, group_name5 varchar NULL, description text NULL, status bpchar(1) DEFAULT 'Y'::bpchar NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT group_pk PRIMARY KEY (group_seq));
COMMENT ON TABLE aasrepo."groups" IS '그룹';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo."groups".group_seq IS '그룹시퀀스';
COMMENT ON COLUMN aasrepo."groups".group_name IS '그룹명(영어)';
COMMENT ON COLUMN aasrepo."groups".group_name2 IS '그룹명(한국)';
COMMENT ON COLUMN aasrepo."groups".group_name3 IS '그룹명()';
COMMENT ON COLUMN aasrepo."groups".group_name4 IS '그룹명()';
COMMENT ON COLUMN aasrepo."groups".group_name5 IS '그룹명()';
COMMENT ON COLUMN aasrepo."groups".description IS '비고';
COMMENT ON COLUMN aasrepo."groups".status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo."groups".create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo."groups".create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo."groups".last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo."groups".last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo."groups" OWNER TO postgres;
GRANT ALL ON TABLE aasrepo."groups" TO postgres;


-- aasrepo.socialproviders 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.socialproviders;

CREATE TABLE aasrepo.socialproviders ( socialprovider_seq bigserial NOT NULL, socialprovider_name varchar NOT NULL, description text NULL, status bpchar(1) DEFAULT 'Y'::bpchar NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT socialproviders_pk PRIMARY KEY (socialprovider_seq));
COMMENT ON TABLE aasrepo.socialproviders IS '소셜프로바이더(소셜로그인)';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.socialproviders.socialprovider_seq IS '소셜시퀀스';
COMMENT ON COLUMN aasrepo.socialproviders.socialprovider_name IS '소셜프로바이더명';
COMMENT ON COLUMN aasrepo.socialproviders.description IS '비고';
COMMENT ON COLUMN aasrepo.socialproviders.status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo.socialproviders.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.socialproviders.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.socialproviders.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.socialproviders.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.socialproviders OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.socialproviders TO postgres;


-- aasrepo.submodel_image 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.submodel_image;

CREATE TABLE aasrepo.submodel_image ( submodel_seq int8 NOT NULL, submodel_img text NULL, filename varchar NULL, mime_type varchar NULL, CONSTRAINT submodel_image_unique UNIQUE (submodel_seq));
COMMENT ON TABLE aasrepo.submodel_image IS 'AAS모델-이미지';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.submodel_image.submodel_seq IS 'AAS서브모델SEQ';
COMMENT ON COLUMN aasrepo.submodel_image.submodel_img IS 'AAS서브모델_IMAGE';
COMMENT ON COLUMN aasrepo.submodel_image.filename IS 'AAS모델_MIMETYPE';
COMMENT ON COLUMN aasrepo.submodel_image.mime_type IS 'AAS모델_MIMETYPE';

-- 권한 설정

ALTER TABLE aasrepo.submodel_image OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.submodel_image TO postgres;


-- aasrepo.users 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.users;

CREATE TABLE aasrepo.users ( user_seq bigserial NOT NULL, user_id varchar NOT NULL, pw_hash varchar NULL, user_name varchar NOT NULL, user_phonenumber varchar NULL, status bpchar(1) DEFAULT 'Y'::bpchar NOT NULL, start_timestamp timestamptz DEFAULT CURRENT_TIMESTAMP NULL, close_timestamp timestamptz NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT users_pk PRIMARY KEY (user_seq));
COMMENT ON TABLE aasrepo.users IS '사용자,로그인';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.users.user_seq IS '사용자시퀀스';
COMMENT ON COLUMN aasrepo.users.user_id IS '사용자아이디';
COMMENT ON COLUMN aasrepo.users.pw_hash IS '해쉬암호';
COMMENT ON COLUMN aasrepo.users.user_name IS '사용자명';
COMMENT ON COLUMN aasrepo.users.user_phonenumber IS '사용자폰번호';
COMMENT ON COLUMN aasrepo.users.status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo.users.start_timestamp IS '가입일시';
COMMENT ON COLUMN aasrepo.users.close_timestamp IS '탈퇴일시';
COMMENT ON COLUMN aasrepo.users.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.users.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.users.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.users.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.users OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.users TO postgres;


-- aasrepo.validations 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.validations;

CREATE TABLE aasrepo.validations ( validation_seq bigserial NOT NULL, target_type varchar(50) NOT NULL, target_seq int4 NULL, target_id varchar NOT NULL, validation_result jsonb NULL, description text NULL, status varchar NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT validations_pk PRIMARY KEY (validation_seq));
COMMENT ON TABLE aasrepo.validations IS '검증결과';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.validations.validation_seq IS '검증시퀀스';
COMMENT ON COLUMN aasrepo.validations.target_type IS '타겟타입(AAS,서브모델,인스턴스)';
COMMENT ON COLUMN aasrepo.validations.target_seq IS '타겟시퀀스(참조)';
COMMENT ON COLUMN aasrepo.validations.target_id IS '타겟ID(참조)';
COMMENT ON COLUMN aasrepo.validations.validation_result IS '비고(결과내용)';
COMMENT ON COLUMN aasrepo.validations.status IS 'sucess=활성,fail=비활성';
COMMENT ON COLUMN aasrepo.validations.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.validations.create_date IS '최초등록일시';

-- 권한 설정

ALTER TABLE aasrepo.validations OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.validations TO postgres;


-- aasrepo.aasinstance 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasinstance;

CREATE TABLE aasrepo.aasinstance ( instance_seq bigserial NOT NULL, instance_name varchar NOT NULL, description text NULL, verification varchar(20) NULL, user_seq int4 NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, is_del bpchar DEFAULT 'N'::bpchar NOT NULL, CONSTRAINT aas_instance_pk PRIMARY KEY (instance_seq), CONSTRAINT aasinstance_users_fk FOREIGN KEY (user_seq) REFERENCES aasrepo.users(user_seq));
COMMENT ON TABLE aasrepo.aasinstance IS 'AAS인스턴스';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasinstance.instance_seq IS 'AAS인스턴스SEQ';
COMMENT ON COLUMN aasrepo.aasinstance.instance_name IS 'AAS인스턴스명';
COMMENT ON COLUMN aasrepo.aasinstance.description IS '비고';
COMMENT ON COLUMN aasrepo.aasinstance.verification IS 'AAS인스턴스검증상태,success/fail';
COMMENT ON COLUMN aasrepo.aasinstance.user_seq IS '인스턴스사용자';
COMMENT ON COLUMN aasrepo.aasinstance.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.aasinstance.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.aasinstance.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.aasinstance.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.aasinstance OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aasinstance TO postgres;


-- aasrepo.aasinstance_aasmodel_submodels 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasinstance_aasmodel_submodels;

CREATE TABLE aasrepo.aasinstance_aasmodel_submodels ( instance_seq int8 NOT NULL, aasmodel_seq int8 NOT NULL, submodel_seq int8 NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, metadata_aaset_administration_shells jsonb NULL, metadata_submodels jsonb NULL, metadata_concept_descriptions jsonb NULL, CONSTRAINT instance_aasmodel_submodels_unique UNIQUE (instance_seq, aasmodel_seq, submodel_seq), CONSTRAINT aasinstance_aasmodel_submodels_aasinstance_fk FOREIGN KEY (instance_seq) REFERENCES aasrepo.aasinstance(instance_seq));
COMMENT ON TABLE aasrepo.aasinstance_aasmodel_submodels IS 'AAS인스턴스-AAS모델-SUB모델';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.instance_seq IS 'AAS인스턴스SEQ';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.aasmodel_seq IS 'AAS모델SEQ';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.submodel_seq IS 'SUB모델SEQ';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.last_mod_date IS '마지막수정일시';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.metadata_aaset_administration_shells IS 'metadata_assetAdministrationShells';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.metadata_submodels IS 'metadata_submodels';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodel_submodels.metadata_concept_descriptions IS 'metadata_conceptDescriptions';

-- 권한 설정

ALTER TABLE aasrepo.aasinstance_aasmodel_submodels OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.aasinstance_aasmodel_submodels TO postgres;


-- aasrepo.aasinstance_aasmodels 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasinstance_aasmodels;

CREATE TABLE aasrepo.aasinstance_aasmodels ( instance_seq int8 NOT NULL, aasmodel_seq int8 NOT NULL, metadata_aaset_administration_shells jsonb NULL, metadata_submodels jsonb NULL, metadata_concept_descriptions jsonb NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT instance_aasmodels_unique UNIQUE (instance_seq, aasmodel_seq), CONSTRAINT aasinstance_aasmodels_aasinstance_fk FOREIGN KEY (instance_seq) REFERENCES aasrepo.aasinstance(instance_seq));
COMMENT ON TABLE aasrepo.aasinstance_aasmodels IS 'AAS인스턴스-AAS모델';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.instance_seq IS 'AAS인스턴스SEQ';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.aasmodel_seq IS 'AAS모델SEQ';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.metadata_aaset_administration_shells IS 'metadata_assetAdministrationShells';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.metadata_submodels IS 'metadata_submodels';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.metadata_concept_descriptions IS 'metadata_conceptDescriptions';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.aasinstance_aasmodels.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.aasinstance_aasmodels OWNER TO postgres;
GRANT TRUNCATE, UPDATE, TRIGGER, INSERT, SELECT, DELETE, REFERENCES ON TABLE aasrepo.aasinstance_aasmodels TO postgres;


-- aasrepo.aasmodels 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.aasmodels;

CREATE TABLE aasrepo.aasmodels ( aasmodel_seq bigserial NOT NULL, aasmodel_name varchar NOT NULL, aasmodel_id varchar NOT NULL, aasmodel_template_id varchar NULL, "version" varchar(50) NULL, "type" varchar(50) NULL, category_seq int4 NULL, description text NULL, status varchar(20) DEFAULT 'temporary'::character varying NOT NULL, source_project varchar(100) NULL, metadata_aaset_administration_shells jsonb NULL, metadata_submodels jsonb NULL, metadata_concept_descriptions jsonb NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, creator text NULL, guide_filename text NULL, guide_mimetype text NULL, guide_realpath text NULL, asset_type varchar(255) NULL, aas_maturity_level varchar(255) NULL, CONSTRAINT aasmodels_pk PRIMARY KEY (aasmodel_seq), CONSTRAINT aasmodels_categories_fk FOREIGN KEY (category_seq) REFERENCES aasrepo.categories(category_seq));
COMMENT ON TABLE aasrepo.aasmodels IS 'AAS모델';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.aasmodels.aasmodel_seq IS 'AAS모델SEQ';
COMMENT ON COLUMN aasrepo.aasmodels.aasmodel_name IS 'AAS모델명';
COMMENT ON COLUMN aasrepo.aasmodels.aasmodel_id IS 'AAS모델ID';
COMMENT ON COLUMN aasrepo.aasmodels.aasmodel_template_id IS 'AAS모델템플릿ID';
COMMENT ON COLUMN aasrepo.aasmodels."version" IS 'AAS모델버전';
COMMENT ON COLUMN aasrepo.aasmodels."type" IS 'AAS모델타입 template/instance';
COMMENT ON COLUMN aasrepo.aasmodels.category_seq IS '산업분류카테고리 FK';
COMMENT ON COLUMN aasrepo.aasmodels.description IS '비고';
COMMENT ON COLUMN aasrepo.aasmodels.status IS 'temporary/draft/published/deprecated';
COMMENT ON COLUMN aasrepo.aasmodels.source_project IS 'e.g., "중기부참조모델", "자율제조"';
COMMENT ON COLUMN aasrepo.aasmodels.metadata_aaset_administration_shells IS 'metadata_assetAdministrationShells';
COMMENT ON COLUMN aasrepo.aasmodels.metadata_submodels IS 'metadata_submodels';
COMMENT ON COLUMN aasrepo.aasmodels.metadata_concept_descriptions IS 'metadata_conceptDescriptions';
COMMENT ON COLUMN aasrepo.aasmodels.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.aasmodels.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.aasmodels.last_mod_user_seq IS '마지막수정자';

-- 권한 설정

ALTER TABLE aasrepo.aasmodels OWNER TO postgres;
GRANT TRUNCATE, UPDATE, TRIGGER, INSERT, SELECT, DELETE, REFERENCES ON TABLE aasrepo.aasmodels TO postgres;


-- aasrepo.socialaccounts 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.socialaccounts;

CREATE TABLE aasrepo.socialaccounts ( socialaccount_seq serial4 NOT NULL, socialprovider_seq int4 NOT NULL, social_id varchar NOT NULL, social_in_id varchar NOT NULL, user_seq int4 NOT NULL, access_token varchar NOT NULL, refresh_token varchar NOT NULL, description text NULL, status bpchar(1) NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, CONSTRAINT socialaccounts_pk PRIMARY KEY (socialaccount_seq), CONSTRAINT socialaccounts_fk1 FOREIGN KEY (socialprovider_seq) REFERENCES aasrepo.socialproviders(socialprovider_seq), CONSTRAINT socialaccounts_users_fk FOREIGN KEY (user_seq) REFERENCES aasrepo.users(user_seq));
COMMENT ON TABLE aasrepo.socialaccounts IS '소셜어카운트';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.socialaccounts.socialaccount_seq IS '소셜어카운트시퀀스';
COMMENT ON COLUMN aasrepo.socialaccounts.social_id IS '소셜아이디(이메일)';
COMMENT ON COLUMN aasrepo.socialaccounts.social_in_id IS '소셜아이디(내부ID)';
COMMENT ON COLUMN aasrepo.socialaccounts.user_seq IS '사용자시퀀스(참조키)';
COMMENT ON COLUMN aasrepo.socialaccounts.access_token IS '소셜엑세스토큰';
COMMENT ON COLUMN aasrepo.socialaccounts.refresh_token IS '소셜갱신토큰';
COMMENT ON COLUMN aasrepo.socialaccounts.description IS '비고';
COMMENT ON COLUMN aasrepo.socialaccounts.status IS 'Y=활성,N=비활성';
COMMENT ON COLUMN aasrepo.socialaccounts.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.socialaccounts.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.socialaccounts.last_mod_user_seq IS '마지막수정자';
COMMENT ON COLUMN aasrepo.socialaccounts.last_mod_date IS '마지막수정일시';

-- 권한 설정

ALTER TABLE aasrepo.socialaccounts OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.socialaccounts TO postgres;


-- aasrepo.submodels 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.submodels;

CREATE TABLE aasrepo.submodels ( submodel_seq bigserial NOT NULL, submodel_name varchar NOT NULL, submodel_id varchar NULL, submodel_semantic_id varchar NULL, submodel_template_id varchar NULL, submodel_version varchar(50) NULL, submodel_type varchar(50) NULL, category_seq int4 NULL, metadata_aaset_administration_shells jsonb NULL, metadata_submodels jsonb NULL, metadata_concept_descriptions jsonb NULL, description text NULL, status varchar(20) DEFAULT 'temporary'::character varying NOT NULL, create_user_seq int4 DEFAULT 0 NOT NULL, create_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, last_mod_user_seq int4 NULL, last_mod_date timestamptz NULL, creator text NULL, guide_filename text NULL, guide_mimetype text NULL, guide_realpath text NULL, CONSTRAINT submodels_pk PRIMARY KEY (submodel_seq), CONSTRAINT submodels_categories_fk FOREIGN KEY (category_seq) REFERENCES aasrepo.categories(category_seq));
COMMENT ON TABLE aasrepo.submodels IS 'SUB모델';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.submodels.submodel_seq IS 'SUB모델SEQ';
COMMENT ON COLUMN aasrepo.submodels.submodel_name IS 'SUB모델명';
COMMENT ON COLUMN aasrepo.submodels.submodel_id IS 'SUB모델ID';
COMMENT ON COLUMN aasrepo.submodels.submodel_semantic_id IS 'SUB모델 SEMANTIC_ID';
COMMENT ON COLUMN aasrepo.submodels.submodel_template_id IS 'SUB모델 TEMPLATE_ID';
COMMENT ON COLUMN aasrepo.submodels.submodel_version IS 'SUB모델버전';
COMMENT ON COLUMN aasrepo.submodels.submodel_type IS 'SUB모델타입 json/xml/aml';
COMMENT ON COLUMN aasrepo.submodels.category_seq IS '산업분류카테고리 FK';
COMMENT ON COLUMN aasrepo.submodels.metadata_aaset_administration_shells IS 'metadata_assetAdministrationShells';
COMMENT ON COLUMN aasrepo.submodels.metadata_submodels IS 'metadata_submodels';
COMMENT ON COLUMN aasrepo.submodels.metadata_concept_descriptions IS 'metadata_conceptDescriptions';
COMMENT ON COLUMN aasrepo.submodels.description IS '비고';
COMMENT ON COLUMN aasrepo.submodels.status IS 'temporary/draft/published/deprecated';
COMMENT ON COLUMN aasrepo.submodels.create_user_seq IS '최초생성자';
COMMENT ON COLUMN aasrepo.submodels.create_date IS '최초등록일시';
COMMENT ON COLUMN aasrepo.submodels.last_mod_user_seq IS '마지막수정자';

-- 권한 설정

ALTER TABLE aasrepo.submodels OWNER TO postgres;
GRANT TRUNCATE, UPDATE, TRIGGER, INSERT, SELECT, DELETE, REFERENCES ON TABLE aasrepo.submodels TO postgres;


-- aasrepo.users_group 정의

-- 테이블 삭제

-- 테이블 삭제: aasrepo.users_group;

CREATE TABLE aasrepo.users_group ( user_seq int4 NOT NULL, group_seq int4 NOT NULL, CONSTRAINT users_group_unique UNIQUE (user_seq), CONSTRAINT users_group_groups_fk FOREIGN KEY (group_seq) REFERENCES aasrepo."groups"(group_seq), CONSTRAINT users_group_users_fk FOREIGN KEY (user_seq) REFERENCES aasrepo.users(user_seq));
COMMENT ON TABLE aasrepo.users_group IS '사용자-그룹';

-- 컬럼 주석

COMMENT ON COLUMN aasrepo.users_group.user_seq IS '사용자';
COMMENT ON COLUMN aasrepo.users_group.group_seq IS '그룹';

-- 권한 설정

ALTER TABLE aasrepo.users_group OWNER TO postgres;
GRANT ALL ON TABLE aasrepo.users_group TO postgres;



-- 함수 삭제: aasrepo.fn_instance_merge(int8);

CREATE OR REPLACE FUNCTION aasrepo.fn_instance_merge(instance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    rtn_json jsonb;
    aasmodel_asset jsonb;
    aasmodel_submodels jsonb;
    aasmodel_concept jsonb;
    submodel_json jsonb;
    submodel_record RECORD;
    submodel_id text;
    aas jsonb;
    submodel_conceptdesc_json jsonb;
    conceptdesc_id text;

BEGIN
    ----------------------------------------------
    -- instance_id에 해당하는 AAS 메타데이터 조회
    -- 신버전: 서브모델이 AAS구조와 동일하고 서브모델이 1개만 있는 케이스
    ----------------------------------------------
    -- 인스턴스 메타데이터 조회
    SELECT jsonb_build_object(
               'assetAdministrationShells', metadata_aaset_administration_shells,
               'submodels',                   metadata_submodels,
               'conceptDescriptions',         metadata_concept_descriptions
           ) AS metadata,
           metadata_aaset_administration_shells,
           metadata_submodels,
           metadata_concept_descriptions
      INTO rtn_json, aasmodel_asset, aasmodel_submodels, aasmodel_concept
      FROM aasrepo.aasinstance_aasmodels
     WHERE instance_seq = instance_id;

    -- 메타데이터가 없으면 예외처리
    IF rtn_json IS NULL THEN
        RETURN NULL;
--      RAISE EXCEPTION 'metadata not found instance_seq %', instance_id;
    END IF;

    ----------------------------------------------
    -- AAS 전체에서 'submodels' 배열이 없으면 빈 배열로 초기화
    ----------------------------------------------
    IF jsonb_typeof(aasmodel_submodels) IS DISTINCT FROM 'array' THEN
        rtn_json := jsonb_set(rtn_json, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- AAS 내부에 assetAdministrationShells 존재 여부 확인
    ----------------------------------------------
    IF jsonb_typeof(aasmodel_asset) IS DISTINCT FROM 'array' THEN
        RETURN NULL;
--      RAISE EXCEPTION 'assetAdministrationShells not found';
    END IF;

    -- ✅ 배열 첫 번째 요소는 -> 0 으로 접근 ([] 대신)
    aas := aasmodel_asset -> 0;

    ----------------------------------------------
    -- AAS 내부 submodels 없으면 초기화
    ----------------------------------------------
    IF jsonb_typeof(aas->'submodels') IS DISTINCT FROM 'array' THEN
        aas := jsonb_set(aas, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- AAS 내부 conceptDescriptions 존재 여부 확인
    ----------------------------------------------
    IF jsonb_typeof(aasmodel_concept) IS DISTINCT FROM 'array' THEN
        rtn_json := jsonb_set(rtn_json, '{conceptDescriptions}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- 인스턴스의 모든 서브모델 병합
    ----------------------------------------------
    FOR submodel_record IN
        SELECT jsonb_build_object(
                   'assetAdministrationShells', metadata_aaset_administration_shells,
                   'submodels',                   metadata_submodels,
                   'conceptDescriptions',         metadata_concept_descriptions
               ) AS metadata,
               metadata_aaset_administration_shells,
               metadata_submodels,
               metadata_concept_descriptions
          FROM aasrepo.aasinstance_aasmodel_submodels
         WHERE instance_seq = instance_id
    LOOP
        -- 메타데이터가 없으면 예외처리
        IF submodel_record.metadata IS NULL THEN
            RETURN NULL;
--          RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
        END IF;

        ----------------------------------------------
        -- 서브모델 AAS 객체에서 'submodels' 배열 확인
        ----------------------------------------------
        IF jsonb_typeof(submodel_record.metadata_submodels) IS DISTINCT FROM 'array' THEN
            RETURN NULL;
--          RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
        END IF;

        -- ✅ 배열 첫 번째 요소는 -> 0 으로 접근
        submodel_json := submodel_record.metadata_submodels -> 0;
        submodel_id   := submodel_json->>'id'; -- 서브모델 id 추출

        ----------------------------------------------
        -- AAS 전체 submodels 배열에 추가 (중복 체크)
        ----------------------------------------------
        IF NOT EXISTS (
            SELECT 1
              FROM jsonb_array_elements(rtn_json->'submodels') AS sm
             WHERE sm->>'id' = submodel_id
        ) THEN
            rtn_json := jsonb_set(
                rtn_json,
                '{submodels}',
                (rtn_json->'submodels') || submodel_json
            );
        END IF;

        -- AAS 참조에 서브모델 추가
        IF NOT EXISTS (
            SELECT 1
              FROM jsonb_array_elements(aas->'submodels') AS ref
             WHERE ref->'keys'->0->>'value' = submodel_id
        ) THEN
            aas := jsonb_set(
                aas,
                '{submodels}',
                (aas->'submodels') || jsonb_build_object(
                    'type', 'ModelReference',
                    'keys', jsonb_build_array(
                        jsonb_build_object(
                            'type',  'Submodel',
                            'value', submodel_id
                        )
                    )
                )
            );
        END IF;

        --------------------------------------------
        -- AAS 전체 conceptDescriptions에 서브모델 항목 추가 (중복 체크)
        --------------------------------------------
        FOR submodel_conceptdesc_json IN
            SELECT jsonb_array_elements(submodel_record.metadata_concept_descriptions)
        LOOP
            conceptdesc_id := submodel_conceptdesc_json ->> 'id';

            IF NOT EXISTS (
                SELECT 1
                  FROM jsonb_array_elements(rtn_json->'conceptDescriptions') AS cd
                 WHERE cd->>'id' = conceptdesc_id
            ) THEN
                rtn_json := jsonb_set(
                    rtn_json,
                    '{conceptDescriptions}',
                    (rtn_json->'conceptDescriptions') || submodel_conceptdesc_json
                );
            END IF;
        END LOOP;

    END LOOP;

    -- 최종 반환값: AAS 배열을 단일 요소(aas)로 교체
    rtn_json := jsonb_set(
        rtn_json,
        '{assetAdministrationShells}',
        jsonb_build_array(aas)
    );

    RETURN rtn_json;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.fn_instance_merge(int8) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fn_instance_merge(int8) TO postgres;

-- 함수 삭제: aasrepo.fn_instance_merge_ahn(int8);

CREATE OR REPLACE FUNCTION aasrepo.fn_instance_merge_ahn(instance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    rtn_json jsonb;
	aasmodel_asset jsonb;
	aasmodel_submodels jsonb;
	aasmodel_concept jsonb;
    submodel_json jsonb;
    submodel_record RECORD;
    submodel_id text;
    aas jsonb;
	submodel_conceptdesc_json jsonb;
	conceptdesc_id text;

BEGIN
    
    ----------------------------------------------
    -- instance_id에 해당하는 AAS 메타데이터 조회
	-- 신버전: 서브모델이 AAS구조와 동일하고 서브모델이 1개만 있는 케이스
    ----------------------------------------------
    -- 인스턴스 메타데이터 조회
    SELECT jsonb_build_object (
            'assetAdministrationShells', metadata_aaset_administration_shells 
            , 'submodels', metadata_submodels 
            , 'conceptDescriptions', metadata_concept_descriptions
        ) as metadata 
		, metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions
    INTO rtn_json, aasmodel_asset, aasmodel_submodels, aasmodel_concept
    FROM aasrepo.aasinstance_aasmodels
    WHERE instance_seq = instance_id;
	
    -- 메타데이터가 없으면 예외처리
    IF rtn_json IS NULL THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'metadata not found instance_seq %', instance_id;
    END IF;

    ----------------------------------------------
    -- AAS 전체에서 'submodels' 배열이 없으면 빈 배열로 초기화
    ----------------------------------------------
    -- submodels 배열 초기화
    IF jsonb_typeof(aasmodel_submodels) IS DISTINCT FROM 'array' THEN
        rtn_json := jsonb_set(rtn_json, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- AAS 내부에 assetAdministrationShells 존재 여부 확인
    ----------------------------------------------
    -- assetAdministrationShells 없으면 예외 처리
    IF jsonb_typeof(aasmodel_asset) IS DISTINCT FROM 'array' THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'assetAdministrationShells not found';
    END IF;

    aas := aasmodel_asset[0]; -- 배열의 첫 번째 요소만 사용 (단일 요소를 가정)

    ----------------------------------------------
    -- AAS 내부 submodels 없으면 초기화
    ----------------------------------------------
    IF jsonb_typeof(aas->'submodels') IS DISTINCT FROM 'array' THEN
        aas := jsonb_set(aas, '{submodels}', '[]'::jsonb);
    END IF;

  	----------------------------------------------
    -- AAS 내부 conceptDescriptions 존재 여부 확인
    ----------------------------------------------
    -- conceptDescriptions 없으면 초기화
    IF jsonb_typeof(aasmodel_concept) IS DISTINCT FROM 'array' THEN
    	rtn_json := jsonb_set(rtn_json, '{conceptDescriptions}', '[]'::jsonb);
    END IF;

  
    ----------------------------------------------
    -- 인스턴스의 모든 서브모델 병합
	-- aasmodel 컬럼이 존재하는 이유: 향후 1:n 관계를 대비한 설계
    -- 추후 필요시 aasmodel에서도 반복 처리하여 aasmodel_seq를 받아와야 함 (현재는 단일 인스턴스만 키로 활용)
    ----------------------------------------------
    FOR submodel_record IN
        SELECT jsonb_build_object (
	            'assetAdministrationShells', metadata_aaset_administration_shells 
	            , 'submodels', metadata_submodels 
	            , 'conceptDescriptions', metadata_concept_descriptions
	        ) as metadata 
	        , metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions
        FROM aasrepo.aasinstance_aasmodel_submodels
        WHERE instance_seq = instance_id
    LOOP


	-- 메타데이터가 없으면 예외처리
	    IF submodel_record.metadata IS NULL THEN
	    	RETURN NULL;
--	        RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
	    END IF;
	
	    ----------------------------------------------
	    -- 서브모델 AAS 객체에서 'submodels' 배열이 없으면 반환
	    ----------------------------------------------
	    -- submodels 
	    IF jsonb_typeof(submodel_record.metadata_submodels) IS DISTINCT FROM 'array' THEN
	        RETURN NULL;
--			RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
	    END IF;
 	    
	    submodel_json := submodel_record.metadata_submodels[0]; -- 배열의 첫 번째 요소만 사용 (단일 요소를 가정)
        submodel_id := submodel_json->>'id'; -- 서브모델 id 추출 (문자열로 변환)
        
	    ----------------------------------------------
	        -- AAS 전체 submodels 배열에 추가 (중복 체크)
	    ----------------------------------------------
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(rtn_json->'submodels') AS sm
            WHERE sm->>'id' = submodel_id
        ) THEN
            rtn_json := jsonb_set(
                rtn_json,
                '{submodels}',
                (rtn_json->'submodels') || submodel_json
            );
        END IF;

        -- AAS 참조에 서브모델 추가
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(aas->'submodels') AS ref
            WHERE ref->'keys'->0->>'value' = submodel_id
        ) THEN
            aas := jsonb_set(
                aas,
                '{submodels}',
                (aas->'submodels') || jsonb_build_object(
                    'type', 'ModelReference',
                    'keys', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'Submodel',
                            'value', submodel_id
                        )
                    )
                )
            );
        END IF;

		--------------------------------------------
        -- AAS 전체 개념 설명(conceptDescriptions) 추가 로직
	    --------------------------------------------
		FOR submodel_conceptdesc_json IN SELECT jsonb_array_elements(submodel_record.metadata_concept_descriptions)
	    LOOP
	        -- 각 요소(객체)에서 'id' 키 값을 텍스트로 추출
	        conceptdesc_id := submodel_conceptdesc_json ->> 'id';

			IF NOT EXISTS (
	            SELECT 1 
	            FROM jsonb_array_elements(rtn_json->'conceptDescriptions') AS cd
	            WHERE cd->>'id' = conceptdesc_id
	        ) THEN
	            rtn_json := jsonb_set(
	                rtn_json,
	                '{conceptDescriptions}',
	                (rtn_json->'conceptDescriptions') || submodel_conceptdesc_json
	            );
	        END IF;

	    END LOOP;
 
    END LOOP;

    -- 최종 반환값
    rtn_json := jsonb_set(
        rtn_json,
        '{assetAdministrationShells}',
        jsonb_build_array(aas)
    );

 	
    RETURN rtn_json;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.fn_instance_merge_ahn(int8) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fn_instance_merge_ahn(int8) TO postgres;

-- 함수 삭제: aasrepo.fn_instance_merge_new(int8);

CREATE OR REPLACE FUNCTION aasrepo.fn_instance_merge_new(instance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    rtn_json jsonb;
	aasmodel_asset jsonb;
	aasmodel_submodels jsonb;
	aasmodel_concept jsonb;
    submodel_json jsonb;
    submodel_record RECORD;
    submodel_id text;
    aas jsonb;
	submodel_conceptdesc_json jsonb;
	conceptdesc_id text;

BEGIN
    
    ----------------------------------------------
    -- instance_id에 해당하는 AAS 메타데이터 조회
	-- 신버전: 서브모델이 AAS구조와 동일하고 서브모델이 1개만 있는 케이스
    ----------------------------------------------
    -- 인스턴스 메타데이터 조회
    SELECT jsonb_build_object (
            'assetAdministrationShells', metadata_aaset_administration_shells 
            , 'submodels', metadata_submodels 
            , 'conceptDescriptions', metadata_concept_descriptions
        ) as metadata 
		, metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions
    INTO rtn_json, aasmodel_asset, aasmodel_submodels, aasmodel_concept
    FROM aasrepo.aasinstance_aasmodels
    WHERE instance_seq = instance_id;
	
    -- 메타데이터가 없으면 예외처리
    IF rtn_json IS NULL THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'metadata not found instance_seq %', instance_id;
    END IF;

    ----------------------------------------------
    -- AAS 전체에서 'submodels' 배열이 없으면 빈 배열로 초기화
    ----------------------------------------------
    -- submodels 배열 초기화
    IF jsonb_typeof(aasmodel_submodels) IS DISTINCT FROM 'array' THEN
        rtn_json := jsonb_set(rtn_json, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- AAS 내부에 assetAdministrationShells 존재 여부 확인
    ----------------------------------------------
    -- assetAdministrationShells 없으면 예외 처리
    IF jsonb_typeof(aasmodel_asset) IS DISTINCT FROM 'array' THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'assetAdministrationShells not found';
    END IF;

    aas := aasmodel_asset[0]; -- 배열의 첫 번째 요소만 사용 (단일 요소를 가정)

    ----------------------------------------------
    -- AAS 내부 submodels 없으면 초기화
    ----------------------------------------------
    IF jsonb_typeof(aas->'submodels') IS DISTINCT FROM 'array' THEN
        aas := jsonb_set(aas, '{submodels}', '[]'::jsonb);
    END IF;

  	----------------------------------------------
    -- AAS 내부 conceptDescriptions 존재 여부 확인
    ----------------------------------------------
    -- conceptDescriptions 없으면 초기화
    IF jsonb_typeof(aasmodel_concept) IS DISTINCT FROM 'array' THEN
    	rtn_json := jsonb_set(rtn_json, '{conceptDescriptions}', '[]'::jsonb);
    END IF;

  
    ----------------------------------------------
    -- 인스턴스의 모든 서브모델 병합
	-- aasmodel 컬럼이 존재하는 이유: 향후 1:n 관계를 대비한 설계
    -- 추후 필요시 aasmodel에서도 반복 처리하여 aasmodel_seq를 받아와야 함 (현재는 단일 인스턴스만 키로 활용)
    ----------------------------------------------
    FOR submodel_record IN
        SELECT jsonb_build_object (
	            'assetAdministrationShells', metadata_aaset_administration_shells 
	            , 'submodels', metadata_submodels 
	            , 'conceptDescriptions', metadata_concept_descriptions
	        ) as metadata 
	        , metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions
        FROM aasrepo.aasinstance_aasmodel_submodels
        WHERE instance_seq = instance_id
    LOOP


	-- 메타데이터가 없으면 예외처리
	    IF submodel_record.metadata IS NULL THEN
	    	RETURN NULL;
--	        RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
	    END IF;
	
	    ----------------------------------------------
	    -- 서브모델 AAS 객체에서 'submodels' 배열이 없으면 반환
	    ----------------------------------------------
	    -- submodels 
	    IF jsonb_typeof(submodel_record.metadata_submodels) IS DISTINCT FROM 'array' THEN
	        RETURN NULL;
--			RAISE EXCEPTION 'metadata not found submodel instance_seq %', instance_id;
	    END IF;
 	    
	    submodel_json := submodel_record.metadata_submodels[0]; -- 배열의 첫 번째 요소만 사용 (단일 요소를 가정)
        submodel_id := submodel_json->>'id'; -- 서브모델 id 추출 (문자열로 변환)
        
	    ----------------------------------------------
	        -- AAS 전체 submodels 배열에 추가 (중복 체크)
	    ----------------------------------------------
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(rtn_json->'submodels') AS sm
            WHERE sm->>'id' = submodel_id
        ) THEN
            rtn_json := jsonb_set(
                rtn_json,
                '{submodels}',
                (rtn_json->'submodels') || submodel_json
            );
        END IF;

        -- AAS 참조에 서브모델 추가
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(aas->'submodels') AS ref
            WHERE ref->'keys'->0->>'value' = submodel_id
        ) THEN
            aas := jsonb_set(
                aas,
                '{submodels}',
                (aas->'submodels') || jsonb_build_object(
                    'type', 'ModelReference',
                    'keys', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'Submodel',
                            'value', submodel_id
                        )
                    )
                )
            );
        END IF;

		--------------------------------------------
        -- AAS 전체 개념 설명(conceptDescriptions) 추가 로직
	    --------------------------------------------
		FOR submodel_conceptdesc_json IN SELECT jsonb_array_elements(submodel_record.metadata_concept_descriptions)
	    LOOP
	        -- 각 요소(객체)에서 'id' 키 값을 텍스트로 추출
	        conceptdesc_id := submodel_conceptdesc_json ->> 'id';

			IF NOT EXISTS (
	            SELECT 1 
	            FROM jsonb_array_elements(rtn_json->'conceptDescriptions') AS cd
	            WHERE cd->>'id' = conceptdesc_id
	        ) THEN
	            rtn_json := jsonb_set(
	                rtn_json,
	                '{conceptDescriptions}',
	                (rtn_json->'conceptDescriptions') || submodel_conceptdesc_json
	            );
	        END IF;

	    END LOOP;
 
    END LOOP;

    -- 최종 반환값
    rtn_json := jsonb_set(
        rtn_json,
        '{assetAdministrationShells}',
        jsonb_build_array(aas)
    );

 	
    RETURN rtn_json;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.fn_instance_merge_new(int8) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fn_instance_merge_new(int8) TO postgres;

-- 함수 삭제: aasrepo.fn_instance_merge_old(int8);

CREATE OR REPLACE FUNCTION aasrepo.fn_instance_merge_old(instance_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    rtn_json jsonb;
    submodel_json jsonb;
    submodel_record RECORD;
    submodel_id text;
    aas_array jsonb;
    aas jsonb;
BEGIN
    ----------------------------------------------
    -- instance_id에 해당하는 AAS 메타데이터 조회
    ----------------------------------------------
    -- 인스턴스 메타데이터 조회
    SELECT metadata 
    INTO rtn_json
    FROM aasrepo.aasinstance_aasmodels
    WHERE instance_seq = instance_id;
	
    -- 메타데이터가 없으면 예외처리
    IF rtn_json IS NULL THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'metadata not found instance_seq %', instance_id;
    END IF;

    ----------------------------------------------
    -- AAS 전체에서 'submodels' 배열이 없으면 빈 배열로 초기화
    ----------------------------------------------
    -- submodels 배열 초기화
    IF jsonb_typeof(rtn_json->'submodels') IS DISTINCT FROM 'array' THEN
        rtn_json := jsonb_set(rtn_json, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- AAS 내부에 assetAdministrationShells 존재 여부 확인
    ----------------------------------------------
    -- assetAdministrationShells 없으면 예외 처리
    IF jsonb_typeof(rtn_json->'assetAdministrationShells') IS DISTINCT FROM 'array' THEN
    	RETURN NULL;
--        RAISE EXCEPTION 'assetAdministrationShells not found';
    END IF;

    aas_array := rtn_json->'assetAdministrationShells';
    aas := aas_array->0; -- 배열의 첫 번째 요소만 사용 (단일 요소를 가정)

    ----------------------------------------------
    -- AAS 내부 submodels 없으면 초기화
    ----------------------------------------------
    IF jsonb_typeof(aas->'submodels') IS DISTINCT FROM 'array' THEN
        aas := jsonb_set(aas, '{submodels}', '[]'::jsonb);
    END IF;

    ----------------------------------------------
    -- 인스턴스의 모든 서브모델 병합
    ----------------------------------------------
    FOR submodel_record IN
        SELECT metadata
        FROM aasrepo.aasinstance_aasmodel_submodels
        WHERE instance_seq = instance_id
    LOOP
        submodel_json := submodel_record.metadata; 
        submodel_id := submodel_json->>'id'; -- 서브모델 id 추출 (문자열로 변환)
        
    ----------------------------------------------
        -- AAS 전체 submodels 배열에 추가 (중복 체크)
    ----------------------------------------------
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(rtn_json->'submodels') AS sm
            WHERE sm->>'id' = submodel_id
        ) THEN
            rtn_json := jsonb_set(
                rtn_json,
                '{submodels}',
                (rtn_json->'submodels') || submodel_json
            );
        END IF;

        -- AAS 참조에 서브모델 추가
        IF NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(aas->'submodels') AS ref
            WHERE ref->'keys'->0->>'value' = submodel_id
        ) THEN
            aas := jsonb_set(
                aas,
                '{submodels}',
                (aas->'submodels') || jsonb_build_object(
                    'type', 'ModelReference',
                    'keys', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'Submodel',
                            'value', submodel_id
                        )
                    )
                )
            );
        END IF;
    END LOOP;

    -- 최종 반환값
    rtn_json := jsonb_set(
        rtn_json,
        '{assetAdministrationShells}',
        jsonb_build_array(aas)
    );

    RETURN rtn_json;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.fn_instance_merge_old(int8) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fn_instance_merge_old(int8) TO postgres;

-- 함수 삭제: aasrepo.fncodelist(varchar, int4, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION aasrepo.fncodelist(grp_cd character varying, lang_index integer DEFAULT 1, ref_code1 character varying DEFAULT ''::character varying, ref_code2 character varying DEFAULT ''::character varying, ref_code3 character varying DEFAULT ''::character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    
    result JSON;
begin 

	if grp_cd = 'category3' then
		select json_agg(row_to_json(r)) as result
			into result
		from (

					
				WITH RECURSIVE base_tbl as (
				
					select refcode1 , category_seq::varchar as code
						, CASE 1 
						WHEN 1  THEN a.category_name
					    WHEN 2  THEN a.category_name2
					    WHEN 3  THEN a.category_name3
					    WHEN 4  THEN a.category_name4
					    WHEN 5  THEN a.category_name5
					    ELSE a.category_name   end as title
					from aasrepo.categories a
					where status = 'Y'
					union all 
					select refcode1, code
						, CASE 1
				        WHEN 1  THEN a.codename
				        WHEN 2  THEN a.codename2
				        WHEN 3  THEN a.codename3
				        WHEN 4  THEN a.codename4
				        WHEN 5  THEN a.codename5
				        ELSE a.codename  end as title
					from aasrepo.aas_codeinfo a
					where  grpcode in ('GRP200', 'GRP300')
						and a.status ='Y'
				), cte_category_tbl as (
				
					select 0 as lv,  null::varchar as p_id , code::varchar as c_id
						, CASE 1
						        WHEN 1  THEN a.codename
						        WHEN 2  THEN a.codename2
						        WHEN 3  THEN a.codename3
						        WHEN 4  THEN a.codename4
						        WHEN 5  THEN a.codename5
						        ELSE a.codename  end::varchar as title
						 , row_number() over ( order by code) as seq
						 , LPAD(0::varchar, 3, '0') || LPAD(code::varchar, 10, '0') node_id
					from aasrepo.aas_codeinfo a
					where  grpcode = 'GRP200'
						
					union all
					
					select b.lv + 1 as lv,  b.c_id as p_id , a.code as c_id
						, a.title
				        , row_number() over (partition by b.c_id order by code) as seq
				        , b.node_id || LPAD((b.lv+1)::varchar, 3, '0') || LPAD(a.code::varchar, 10, '0') node_id
					from base_tbl a
					join cte_category_tbl b on b.c_id = a.refcode1
				) 
				select lv, p_id, c_id, seq, title, node_id
				from cte_category_tbl
				order by node_id
 
		) r;
	elsif grp_cd = 'category2' then 
		select json_agg(row_to_json(r)) as result
		into result
		from (	

			WITH RECURSIVE base_tbl as (
				
				select refcode1 , category_seq::varchar as code
					, CASE 1 
					WHEN 1  THEN a.category_name
				    WHEN 2  THEN a.category_name2
				    WHEN 3  THEN a.category_name3
				    WHEN 4  THEN a.category_name4
				    WHEN 5  THEN a.category_name5
				    ELSE a.category_name   end as title
				from aasrepo.categories a
				where status = 'Y'
				 
			), cte_category_tbl as (
			
				select 0 as lv,  null::varchar as p_id , code::varchar as c_id
					, CASE 1
					        WHEN 1  THEN a.codename
					        WHEN 2  THEN a.codename2
					        WHEN 3  THEN a.codename3
					        WHEN 4  THEN a.codename4
					        WHEN 5  THEN a.codename5
					        ELSE a.codename  end::varchar as title
					 , row_number() over ( order by code) as seq
					 , LPAD(0::varchar, 3, '0') || LPAD(code::varchar, 10, '0') node_id
				from aasrepo.aas_codeinfo a
				where  grpcode = 'GRP100'
					
				union all
				
				select b.lv + 1 as lv,  b.c_id as p_id , a.code as c_id
					, a.title
			        , row_number() over (partition by b.c_id order by a.code) as seq
			        , b.node_id || LPAD((b.lv+1)::varchar, 3, '0') || LPAD(a.code::varchar, 10, '0') node_id
				from base_tbl a
				left join aasrepo.aas_codeinfo c 
					on a.refcode1 = c.code and c.grpcode = 'GRP300'
				left join aasrepo.aas_codeinfo d
					on c.refcode1 = d.code and d.grpcode = 'GRP200'						
				left join aasrepo.aas_codeinfo e
					on d.refcode1 = e.code and e.grpcode = 'GRP100'												
				join cte_category_tbl b on b.c_id = e.code
			) 
			select lv, p_id, c_id, seq, title, node_id
			from cte_category_tbl
			order by node_id
		) r;

	elsif grp_cd in ('aas_category', 'sm_category' ) then 
		select json_agg(row_to_json(r)) as result
		into result
		from (	
			WITH RECURSIVE base_tbl as (
				
				select refcode1 , category_seq::varchar as code
					, CASE 1 
					WHEN 1  THEN a.category_name
				    WHEN 2  THEN a.category_name2
				    WHEN 3  THEN a.category_name3
				    WHEN 4  THEN a.category_name4
				    WHEN 5  THEN a.category_name5
				    ELSE a.category_name   end as title
				from aasrepo.categories a
				where status = 'Y'
				 
			), cte_category_tbl as (
			
				select 0 as lv,  null::varchar as p_id , a.code::varchar as c_id
					, CASE 1
					        WHEN 1  THEN a.codename
					        WHEN 2  THEN a.codename2
					        WHEN 3  THEN a.codename3
					        WHEN 4  THEN a.codename4
					        WHEN 5  THEN a.codename5
					        ELSE a.codename  end::varchar as title
					 , row_number() over ( order by a.code) as seq
					 , LPAD(0::varchar, 3, '0') || LPAD(a.code::varchar, 10, '0') node_id
				from aasrepo.aas_codeinfo a
				join aasrepo.aas_codeinfo b on a.refcode1 = b.code
				where ( b.code = 'GRP1001000'  and 'aas_category' = grp_cd)
					or ( b.code = 'GRP1002000'  and 'sm_category' = grp_cd)
					
					
				union all
				
				select b.lv + 1 as lv,  b.c_id as p_id , a.code as c_id
					, a.title
			        , row_number() over (partition by b.c_id order by a.code) as seq
			        , b.node_id || LPAD((b.lv+1)::varchar, 3, '0') || LPAD(a.code::varchar, 10, '0') node_id
				from base_tbl a
				left join aasrepo.aas_codeinfo c 
					on a.refcode1 = c.code and c.grpcode = 'GRP300'
				left join aasrepo.aas_codeinfo d
					on c.refcode1 = d.code and d.grpcode = 'GRP200'						
				left join aasrepo.aas_codeinfo e
					on d.refcode1 = e.code and e.grpcode = 'GRP100'												
				join cte_category_tbl b on b.c_id = d.code
			) 
			select lv, p_id, c_id, seq, title, node_id
			from cte_category_tbl
			where ( 'aas_category' = grp_cd)
					or ( p_id is not  null and 'sm_category' = grp_cd)
			order by node_id
		) r;
	else 	
		
		select json_agg(row_to_json(r)) as result
			into result
		from (
			select "id", "text", "refcode1", "refcode2", "refcode3"
			from (
					SELECT code::varchar  AS "id",
			            CASE lang_index
			                WHEN 1  THEN codeName
			                WHEN 2  THEN codeName2
			                WHEN 3  THEN codeName3
			                WHEN 4  THEN codeName4
			                WHEN 5  THEN codeName5
			                ELSE codeName 
			            END::varchar AS text
						, refcode1 
						, refcode2
						, refcode3
						, coalesce(sortkey::varchar, code::varchar)::varchar as sortkey
			        FROM aasrepo.aas_codeinfo c
					where grpcode is not null
						and grpcode = fncodelist.grp_cd

         			union all 

			        -- 카테고리
			        SELECT a.category_seq::varchar AS id,
			            CASE lang_index
			                WHEN 1  THEN a.category_name
			                WHEN 2  THEN a.category_name2
			                WHEN 3  THEN a.category_name3
			                WHEN 4  THEN a.category_name4
			                WHEN 5  THEN a.category_name5
			                ELSE a.category_name 
			            END::varchar AS text
						, refcode1 
						, refcode2
						, refcode3
						, a.category_seq::varchar as sortkey
			        FROM aasrepo.categories a
					where fncodelist.grp_cd = 'category'
			
			        
			        UNION ALL
			        
			        -- 그룹
			        SELECT a.group_seq::varchar AS id,
			            CASE lang_index
			                WHEN 1  THEN a.group_name
			                WHEN 2  THEN a.group_name2
			                WHEN 3  THEN a.group_name3
			                WHEN 4  THEN a.group_name4
			                WHEN 5  THEN a.group_name5
			                ELSE a.group_name 
			            END::varchar AS text
						, '' as refcode1 
						, '' as refcode2
						, '' as refcode3
						, a.group_seq::varchar as sortkey
			        FROM aasrepo.groups a
					where fncodelist.grp_cd = 'group'
			
			        
			        UNION ALL
			        
			        -- 소셜
			        SELECT a.socialprovider_seq::varchar AS id,
			            a.socialprovider_name::varchar  AS text
						, '' as refcode1 
						, '' as refcode2
						, '' as refcode3
						, a.socialprovider_seq::varchar as sortkey
			        FROM aasrepo.socialproviders a
					where fncodelist.grp_cd = 'social'

			) 
			order by sortkey
			
			) r;
			
			


	end if;
	

	
    
    RETURN result;
END;
$function$
;

COMMENT ON FUNCTION aasrepo.fncodelist(varchar, int4, varchar, varchar, varchar) IS '코드리스트';

-- 권한 설정

ALTER FUNCTION aasrepo.fncodelist(varchar, int4, varchar, varchar, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fncodelist(varchar, int4, varchar, varchar, varchar) TO postgres;

-- 함수 삭제: aasrepo.fncodenm(varchar, int4, varchar);

CREATE OR REPLACE FUNCTION aasrepo.fncodenm(p_code character varying, lang_index integer DEFAULT 1, grp_cd character varying DEFAULT ''::character varying)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
    declare oCodeName varchar := '';

BEGIN


	select code_name into oCodeName
	from (
		select
			CASE fncodenm.lang_index
				WHEN 1  THEN codeName
				WHEN 2  THEN codeName2
				WHEN 3  THEN codeName3
				WHEN 4  THEN codeName4
				WHEN 5  THEN codeName5
				ELSE codeName END  as code_name
		from aasrepo.aas_codeinfo c
		where ( fncodenm.grp_cd = '' or fncodenm.grp_cd = 'code')
			and  code = p_code
		union all
		--카테고리
		select CASE fncodenm.lang_index
				WHEN 1  THEN a.category_name
				WHEN 2  THEN a.category_name2
				WHEN 3  THEN a.category_name3
				WHEN 4  THEN a.category_name4
				WHEN 5  THEN a.category_name5
				ELSE a.category_name END as code_name
		from aasrepo.categories a
		where ( fncodenm.grp_cd = '' or fncodenm.grp_cd = 'category')
			and  a.category_seq::varchar = p_code
		union all
		--Group
		select CASE fncodenm.lang_index
				WHEN 1  THEN a.group_name
				WHEN 2  THEN a.group_name2
				WHEN 3  THEN a.group_name3
				WHEN 4  THEN a.group_name4
				WHEN 5  THEN a.group_name5
				ELSE a.group_name END as code_name
		from aasrepo.groups a
		where ( fncodenm.grp_cd = '' or fncodenm.grp_cd = 'group')
			and  a.group_seq::varchar = p_code
		union all
		--social
		select a.socialprovider_name as code_name
		from aasrepo.socialproviders a
		where ( fncodenm.grp_cd = '' or fncodenm.grp_cd = 'social')
		and  a.socialprovider_seq::varchar = p_code

	) r
	limit 1;

    return oCodeName;

END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.fncodenm(varchar, int4, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.fncodenm(varchar, int4, varchar) TO postgres;

-- 함수 삭제: aasrepo.generator_code(varchar, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION aasrepo.generator_code(model_type character varying, ty_value character varying DEFAULT ''::character varying, ty_value2 character varying DEFAULT ''::character varying, ty_value3 character varying DEFAULT ''::character varying)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_code VARCHAR(30);
    code_prefix VARCHAR(20);
BEGIN
    new_code := '';

    -- type 값에 따른 조건 분기
    IF model_type in ( 'aasmodel' , 'submodel') THEN 
        -- ty_value 값 유효성 확인
        IF length(ty_value) > 0 THEN

            with header_info_tbl as (

				select a.category_seq
					, concat( coalesce(d.refcode2, case when model_type = 'aasmodel' then 'AAS' else 'SUB' end), '-', coalesce(c.refcode2, '1'), '-', coalesce(b.refcode2, 'B'), '-' ) as prefix_header
				from aasrepo.categories a
				left join aasrepo.aas_codeinfo b on a.refcode1 = b.code and b.grpcode = 'GRP300'
				left join aasrepo.aas_codeinfo c on b.refcode1 = c.code and c.grpcode = 'GRP200'
				left join aasrepo.aas_codeinfo d on c.refcode1 = d.code and d.grpcode = 'GRP100'
				where a.status = 'Y'
					and ty_value3 = ''
					and a.category_seq::varchar = ty_value
				
			)
			, max_model as (
			
				select left(aasmodel_template_id,8) as prefix_header, max(right(left(aasmodel_template_id,14),6)::int) max_seq
				from aasrepo.aasmodels a
				join header_info_tbl b on left(a.aasmodel_template_id,8) = b.prefix_header
				where aasmodel_template_id is not null
					and ty_value3 = ''
					and 'aasmodel' = model_type
				group by left(aasmodel_template_id,8)

				union all

				select left(submodel_template_id,8) as prefix_header, max(right(left(submodel_template_id,14),6)::int) max_seq
				from aasrepo.submodels a
				join header_info_tbl b on left(a.submodel_template_id,8) = b.prefix_header
				where submodel_template_id is not null
					and ty_value3 = ''
					and 'submodel' = model_type
				group by left(submodel_template_id,8)

				
			), new_seq_tbl as (
				select a.category_seq, a.prefix_header, lpad( (coalesce(b.max_seq,0) + 1)::varchar,6,'0') as next_seq
				from header_info_tbl a
				left join max_model b on a.prefix_header = b.prefix_header
				where ty_value3 = ''

				union all
				
				select a.category_seq,  left(aasmodel_template_id, 8) as prefix_header , substring(aasmodel_template_id, 9,6) as next_seq
				from aasrepo.aasmodels a
				where coalesce(aasmodel_template_id , '') <> ''
					and ty_value3 <> ''
					and 'aasmodel' = model_type
					and left(aasmodel_template_id, 14) = left(ty_value3, 14)
				
				union all
				
				select a.category_seq,  left(submodel_template_id, 8) as prefix_header , substring(submodel_template_id, 9,6) as next_seq
				from aasrepo.submodels a
				where coalesce(submodel_template_id , '') <> ''
					and ty_value3 <> ''
					and 'submodel' = model_type
					and left(submodel_template_id, 14) = left(ty_value3, 14)
				
			)
			select concat(prefix_header, lpad(next_seq::text, 6, '0') , '-', replace( case when ty_value2 = '' then '0.1' else ty_value2 end , '.', '-' )) 
			into new_code
			from new_seq_tbl
			limit 1;
		ELSE
            RAISE EXCEPTION 'Invalid value ty_value: %', ty_value;
        END IF;
   
    ELSE
        RAISE EXCEPTION 'Invalid type value: %', type;
    END IF;

    RETURN new_code;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.generator_code(varchar, varchar, varchar, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.generator_code(varchar, varchar, varchar, varchar) TO postgres;

-- 함수 삭제: aasrepo.generator_code_old(varchar, varchar, varchar, varchar);

CREATE OR REPLACE FUNCTION aasrepo.generator_code_old(type character varying, ty_value character varying DEFAULT ''::character varying, ty_value2 character varying DEFAULT ''::character varying, ty_value3 character varying DEFAULT ''::character varying)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_code VARCHAR(30);
    code_prefix VARCHAR(20);
BEGIN
    new_code := '';

    -- type 값에 따른 조건 분기
    IF type = 'aasmodel' THEN 
        -- ty_value 값 유효성 확인
        IF length(ty_value) > 0 THEN

            with header_info_tbl as (

				select a.category_seq
					, concat('AAS-', d.refcode2, '-', coalesce(c.refcode2, 'B'), '-' ) as prefix_header
				from aasrepo.categories a
				left join aasrepo.aas_codeinfo b on a.refcode1 = b.code and b.grpcode = 'GRP300'
				left join aasrepo.aas_codeinfo c on b.refcode1 = c.code and c.grpcode = 'GRP200'
				left join aasrepo.aas_codeinfo d on c.refcode1 = d.code and d.grpcode = 'GRP100'
				where a.status = 'Y'
					and ty_value3 = ''
					and a.category_seq::varchar = ty_value
				
			), max_model as (
			
				select left(aasmodel_template_id,8) as prefix_header, max(right(left(aasmodel_template_id,14),6)::int) max_seq
				from aasrepo.aasmodels a
				join header_info_tbl b on left(a.aasmodel_template_id,8) = b.prefix_header
				where aasmodel_template_id is not null
					and ty_value3 = ''
				group by left(aasmodel_template_id,8)
				
			), new_seq_tbl as (
				select a.category_seq, a.prefix_header, lpad( (coalesce(b.max_seq,0) + 1)::varchar,6,'0') as next_seq
				from header_info_tbl a
				left join max_model b on a.prefix_header = b.prefix_header
				where ty_value3 = ''

				union all
				
				select a.category_seq,  left(aasmodel_template_id, 8) as prefix_header , substring(aasmodel_template_id, 9,6) as next_seq
				from aasrepo.aasmodels a
				where coalesce(aasmodel_template_id , '') <> ''
					and ty_value3 <> ''
					and left(aasmodel_template_id, 14) = left(ty_value3, 14)
				
			)
			select concat(prefix_header, lpad(next_seq::text, 6, '0') , '-', replace( case when ty_value2 = '' then '0.1' else ty_value2 end , '.', '-' )) 
			into new_code
			from new_seq_tbl
			limit 1;
		ELSE
            RAISE EXCEPTION 'Invalid value ty_value: %', ty_value;
        END IF;


    ELSIF type = 'submodel' THEN 
		-- ty_value 값 유효성 확인
        IF length(ty_value) > 0 THEN

            with header_info_tbl as (

				select a.category_seq
					, concat('SUB-', d.refcode2, '-', coalesce(c.refcode2, 'B'), '-' ) as prefix_header
				from aasrepo.categories a
				left join aasrepo.aas_codeinfo b on a.refcode1 = b.code and b.grpcode = 'GRP300'
				left join aasrepo.aas_codeinfo c on b.refcode1 = c.code and c.grpcode = 'GRP200'
				left join aasrepo.aas_codeinfo d on c.refcode1 = d.code and d.grpcode = 'GRP100'
				where a.status = 'Y'
					and ty_value3 = ''
					and a.category_seq::varchar = ty_value
				
			), max_model as (
			
				select left(submodel_template_id,8) as prefix_header, max(right(left(submodel_template_id,14),6)::int) max_seq
				from aasrepo.submodels a
				join header_info_tbl b on left(a.submodel_template_id,8) = b.prefix_header
				where submodel_template_id is not null
					and ty_value3 = ''
				group by left(submodel_template_id,8)
				
			), new_seq_tbl as (
				select a.category_seq, a.prefix_header, lpad( (coalesce(b.max_seq,0) + 1)::varchar,6,'0') as next_seq
				from header_info_tbl a
				left join max_model b on a.prefix_header = b.prefix_header
				where ty_value3 = ''

				union all
				
				select a.category_seq,  left(submodel_template_id, 8) as prefix_header , substring(submodel_template_id, 9,6) as next_seq
				from aasrepo.submodels a
				where coalesce(submodel_template_id , '') <> ''
					and ty_value3 <> ''
					and left(submodel_template_id, 14) = left(ty_value3, 14)
				
			)
			
			select concat(prefix_header, lpad(next_seq::text, 6, '0') , '-', replace( case when ty_value2 = '' then '0.1' else ty_value2 end , '.', '-' )) 
			into new_code
			from new_seq_tbl
			limit 1;
	

		ELSE
            RAISE EXCEPTION 'Invalid ty_value: %', ty_value;
        END IF;
   
    ELSE
        RAISE EXCEPTION 'Invalid type value: %', type;
    END IF;

    RETURN new_code;
END;
$function$
;

-- 권한 설정

ALTER FUNCTION aasrepo.generator_code_old(varchar, varchar, varchar, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION aasrepo.generator_code_old(varchar, varchar, varchar, varchar) TO postgres;


-- 권한 설정

GRANT ALL ON SCHEMA aasrepo TO postgres;