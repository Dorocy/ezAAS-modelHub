export type ModelType = "aasmodel" | "submodel" | "instance";
export type StatusType = "temporary" | "draft" | "published" | "deprecated";

/**
 * Export 의 클라이언트 내부 canonical type.
 * - "environment": AAS Environment(shells/submodels 컨테이너). aasmodel·instance 가 여기에 해당.
 * - "submodel": 단일 Submodel.
 * SDK 직렬화 분기(Environment vs Submodel)는 이 canonical type 기준으로만 결정한다.
 */
export type ExportModelType = "environment" | "submodel";

export interface GetModelListParams {
  modelType: ModelType;
  pageNumber: number;
  pageSize: number;
  searchParams?: Record<string, string>;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetModelParams {
  modelType: ModelType;
  modelSeq: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface VerifyModelParams {
  modelType: ModelType;
  modelId: string;
  errorThrow?: boolean;
  withToast?: boolean;
}

export interface ImportModelParams {
  modelType: ModelType;
  file: File;
  modelId?: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface UpsertModelParams {
  modelType: ModelType;
  status: "temporary" | "draft";
  formData: FormData;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface ExportModelParams {
  /** 클라이언트 내부 canonical type. SDK 직렬화 분기를 결정한다. */
  modelType: ExportModelType;
  /**
   * 백엔드 download 경로(`basyx/{apiModelType}/download`)와 payload 에 쓰는 API 문자열.
   * 같은 canonical type 이라도 호출부에 따라 백엔드 라우트가 다를 수 있어
   * (예: AAS 템플릿은 "aasmodel", 인스턴스는 "instance") 명시적으로 지정한다.
   */
  apiModelType: ModelType;
  format?: "json" | "xml" | "aasx";
  modelSeq: string;
  filename?: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface DeleteModelParams {
  modelType: string;
  modelSeq: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetCodeListParams {
  type: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetPublishedModelParams {
  target_seq: string;
  modelType: "all" | ModelType;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetPublishedListParams {
  status: StatusType;
  type: "all" | ModelType;
  pageNumber: number;
  pageSize: number;
  searchParams?: Record<string, string>;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface UpsertPublishedModelParams {
  method: "POST" | "PUT";
  body: object;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetInstanceTargetListParams {
  category_seq: string;
  modelType: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetInstanceListParams {
  category_seq: string;
  pageNumber: number;
  pageSize: number;
  searchParams?: Record<string, string>;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface GetInstanceParams {
  instance_seq: string;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface VerifyInstanceParams {
  instance_seq: string;
  aasmodel: object;
  submodels: object[];
}

export interface UpsertInstanceParams {
  formData: FormData;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface InstanceSavePayload {
  instance_seq: string;
  instance_name: string;
  description: string;
  verification: "success" | "fail" | undefined;
  verification_log?: { total: number; success: number; fail: number };
  aasmodel_seq: string;
  aasmodel_metadata: string;
  status: string;
  submodels: Array<{ submodel_seq: string | null; submodel_metadata: string }>;
}

export interface AASInstance {
  instance_seq: string;
  instance_name: string;
  description: string;
  verification: string;
  status: string;
  submodels: any[];
  aasmodel_seq: string;
  aasmodel_name: string;
  aasmodel_id: string;
  aasmodel_template_id: string;
  aasmodel_version: string;
  aasmodel_description: string;
  aasmodel_metadata: Record<string, any>;
  category_name: string;
  create_date: string;
  create_user_seq: string;
  last_mod_date: string;
  last_mod_user_seq: string;
}

export interface GetUserListParams {
  pageNumber: number;
  pageSize: number;
  searchParams?: Record<string, string>;
  withToast?: boolean;
  errorThrow?: boolean;
}

export interface UpsertUserParams {
  body: Record<string, any>;
  withToast?: boolean;
  errorThrow?: boolean;
}
