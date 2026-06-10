"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

import { importModel, upsertModel, verifyModel, apiVerifyInstance } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { base64ToFile } from "@/utils/index";
import { addValuePaths, parsingAAS } from "@/utils/aas";
import { environmentFromJson, validate } from "@/lib/aas";
import type { JsonValue } from "@/lib/aas";
import { useAuth } from "@/contexts/AuthContext";

import TemplateBlueprint from "@/components/feature/instance/TemplateBlueprint";
import CategoryCombobox from "@/components/CategoryCombobox";
import VerifyDetailView from "@/components/VerifyDetailView";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ASSET_TYPE_OPTIONS = [
  "Product",
  "Sensor/Device",
  "Equipment",
  "Line/System",
] as const;

const MATURITY_LEVEL_OPTIONS = [
  "L0 Minimal",
  "L1 Descriptive",
  "L2 Operational",
  "L3 Analytical",
  "L4 AI Applicable",
] as const;
import {
  ArrowLeft,
  FileStack,
  Layers,
  FileUp,
  RotateCcw,
  ImageIcon,
  FileText,
  X,
  Loader2,
  Save,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type ModelType = "aasmodel" | "submodel";

const META: Record<
  ModelType,
  { icon: React.ElementType; nameKey: string; listRoute: string; listLabel: string; title: string; code: "aas_category" | "sm_category" }
> = {
  aasmodel: {
    icon: FileStack,
    nameKey: "aasmodel_name",
    listRoute: ROUTES.AASMODEL.LIST,
    listLabel: "AAS Templates",
    title: "New AAS Template",
    code: "aas_category",
  },
  submodel: {
    icon: Layers,
    nameKey: "submodel_name",
    listRoute: ROUTES.SUBMODEL.LIST,
    listLabel: "Submodel Templates",
    title: "New Submodel Template",
    code: "sm_category",
  },
};

interface ModelCreateFormProps {
  modelType: ModelType;
}

export default function ModelCreateForm({ modelType }: ModelCreateFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const meta = META[modelType];
  const Icon = meta.icon;
  const routeKey = modelType.toUpperCase() as "AASMODEL" | "SUBMODEL";
  const nameKey = `${modelType}_name`;

  // ── Template info (goes to DB body) ──
  const [form, setForm] = useState({
    [nameKey]: "",
    description: "",
    model_id: "",
    category_seq: "",
    creator: (user?.user_name as string) ?? "",
    asset_type: "",
    aas_maturity_level: "",
  });

  // ── Imported model + extracted files ──
  const [metadata, setMetadata] = useState<any>(null);
  const [importedFiles, setImportedFiles] = useState<Record<string, File>>({});
  const [importing, setImporting] = useState(false);

  // ── Thumbnail + guide pdf ──
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [guidePdf, setGuidePdf] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // ── Verification (reuses Create AAS step 4 component + logic) ──
  const verificationRef = useRef<Record<
    string,
    { count: number; message: string[] }
  > | null>(null);
  const [verificationActive, setVerificationActive] = useState<string | null>(null);
  const [verification, setVerification] = useState<"success" | "fail" | undefined>(
    undefined
  );
  const [verifying, setVerifying] = useState(false);
  // Human-readable fallback message for non-structured verification failures.
  const [verificationError, setVerificationError] = useState<string | null>(null);
  // Summary line returned by the backend verification API (e.g. counts).
  const [verificationSummary, setVerificationSummary] = useState<string | null>(null);
  // Bumped to collapse all submodel tree nodes (e.g. before verification).
  const [collapseSignal, setCollapseSignal] = useState(0);

  const modelFileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const guideRef = useRef<HTMLInputElement>(null);

  const thumbnailUrl = useMemo(
    () => (thumbnail ? URL.createObjectURL(thumbnail) : null),
    [thumbnail]
  );

  const treeData = useMemo(() => {
    if (!metadata) return undefined;
    try {
      return parsingAAS(addValuePaths({ ...metadata }));
    } catch (e) {
      console.error("[v0] failed to parse imported metadata", e);
      return undefined;
    }
  }, [metadata]);

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Prefill editable fields from imported AAS metadata ──
  const prefillFromMetadata = (
    md: any,
    filesByName: Record<string, File>,
    filesByOriginalKey: Record<string, File>
  ) => {
    if (modelType !== "aasmodel") return;

    const shell = md?.assetAdministrationShells?.[0];
    if (!shell) return;

    // description.text can be an array of { language, text } or a plain string
    const extractText = (desc: any): string => {
      if (!desc) return "";
      if (typeof desc === "string") return desc;
      if (Array.isArray(desc)) {
        const first = desc.find((d) => d?.text) ?? desc[0];
        return first?.text ?? "";
      }
      if (typeof desc.text === "string") return desc.text;
      if (Array.isArray(desc.text)) {
        const first = desc.text.find((d: any) => d?.text) ?? desc.text[0];
        return typeof first === "string" ? first : first?.text ?? "";
      }
      return "";
    };

    setForm((prev) => ({
      ...prev,
      [nameKey]: shell.idShort ?? prev[nameKey],
      description: extractText(shell.description) || prev.description,
      model_id: shell.id ?? prev.model_id,
    }));

    // Resolve the thumbnail image from the imported attachments.
    const thumbPath: string | undefined =
      shell?.assetInformation?.defaultThumbnail?.path;
    if (thumbPath) {
      const cleanName = thumbPath.split("/").pop() || thumbPath;
      const matched =
        filesByOriginalKey[thumbPath] ||
        filesByOriginalKey[thumbPath.replace(/^\/+/, "")] ||
        filesByName[cleanName];
      // Only use a real image file; never display the path string itself.
      if (matched && matched.type.startsWith("image/")) {
        setThumbnail(matched);
      }
    }
  };

  // ── Import an AASX / XML / JSON file → metadata + attachments ──
  const handleImport = async (file: File | null) => {
    if (!file) return;
    try {
      setImporting(true);
      const result: any = await importModel({ modelType, file });
      if (!result) return;

      const parsed =
        typeof result.metadata === "string"
          ? JSON.parse(result.metadata)
          : result.metadata;
      setMetadata(parsed);

      // A freshly imported model must be re-verified before saving.
      resetVerification();

      // Decode base64 attachments returned by the backend into File objects.
      // Keep both the cleaned (basename) and the original key so a thumbnail
      // path from the metadata can be matched reliably.
      const files: Record<string, File> = {};
      const filesByOriginalKey: Record<string, File> = {};
      const attachments = result.attachments;
      if (attachments) {
        for (const filename in attachments) {
          const fileData = attachments[filename];
          const cleanName = filename.split("/").pop() || filename;
          const decoded = base64ToFile(fileData.content, cleanName, fileData.type);
          if (decoded) {
            files[cleanName] = decoded;
            filesByOriginalKey[filename] = decoded;
          }
        }
      }
      setImportedFiles(files);

      // Prefill editable fields from the imported AAS metadata.
      prefillFromMetadata(parsed, files, filesByOriginalKey);
    } catch (error: any) {
      console.error("[v0] import failed", error?.message);
    } finally {
      setImporting(false);
      if (modelFileRef.current) modelFileRef.current.value = "";
    }
  };

  const clearImport = () => {
    setMetadata(null);
    setImportedFiles({});
    setThumbnail(null);
    setForm((prev) => ({ ...prev, [nameKey]: "", description: "", model_id: "" }));
    resetVerification();
  };

  // ── Verification helpers (mirrors Create AAS step 4) ──
  const resetVerification = () => {
    verificationRef.current = null;
    setVerificationActive(null);
    setVerification(undefined);
    setVerificationError(null);
    setVerificationSummary(null);
  };

  // Parse an API error (from verify OR save) into the verification result card.
  // The backend returns the detailed report as a JSON string in cause.json.data.
  const applyVerificationFailure = (error: any) => {
    const json = error?.cause?.json;
    let parsed = false;
    if (json && json.data && typeof json.data === "string") {
      try {
        const verificationData = JSON.parse(json.data);
        if (verificationData && typeof verificationData === "object") {
          verificationRef.current = verificationData;
          setVerificationSummary(
            typeof verificationData.summary === "string" ? verificationData.summary : null,
          );
          // Activate the first failing item so its details are shown.
          const firstFail =
            Object.entries<any>(verificationData)
              .filter(([key]) => key !== "summary")
              .find(([, v]) => v?.count > 0)?.[0] ?? null;
          setVerificationActive(firstFail);
          parsed = true;
        }
      } catch {
        /* not structured JSON — fall through to message handling */
      }
    }
    if (!parsed) {
      verificationRef.current = null;
      setVerificationActive(null);
      // Surface the raw API error/warning detail in the result card.
      setVerificationError(
        json?.message ||
          (typeof json?.data === "string" ? json.data : undefined) ||
          error?.message ||
          "Verification failed. Please try again.",
      );
    } else {
      setVerificationError(null);
    }
    setVerification("fail");
  };

  // Verify the imported model against the AAS server. On success the
  // verificationRef is cleared; on failure the structured error payload is
  // parsed and stored so VerifyDetailView can render the same error details.
  const verifyTemplate = async (): Promise<"success" | "fail"> => {
    // Collapse all submodel tree nodes before running verification.
    setCollapseSignal((n) => n + 1);
    const modelId = form.model_id || getModelId(metadata);
    let result: "success" | "fail";
    try {
      setVerifying(true);

      // ── 1차 게이트: 클라이언트 SDK 검증(주 검증) ──
      // 백엔드 호출 전에 클라이언트에서 먼저 점검한다.
      // metadata 는 shells/submodels 를 담은 Environment 형태이므로 그대로 역직렬화한다.
      //
      // 차단 정책: "역직렬화 실패(= 구조적으로 깨진 AAS)"만 저장을 차단한다.
      // 메타모델 제약 위반(중복 언어 description 등)은 기존 정상 템플릿에도
      // 다수 존재하므로 차단하지 않고 콘솔 경고로만 남긴다(회귀 방지).
      const parsedEnv = environmentFromJson(metadata as JsonValue);
      if (!parsedEnv.ok || parsedEnv.value === null) {
        verificationRef.current = null;
        setVerificationActive(null);
        setVerificationSummary(null);
        setVerificationError(
          `AAS 구조를 해석할 수 없습니다: ${parsedEnv.error ?? "알 수 없는 오류"}`,
        );
        setVerification("fail");
        return "fail";
      }
      const sdkResult = validate(parsedEnv.value);
      if (!sdkResult.valid) {
        console.warn(
          `[v0] SDK 메타모델 경고 ${sdkResult.issues.length}건 (저장은 계속):`,
          sdkResult.issues.slice(0, 10),
        );
      }

      // ── 2차: 백엔드 검증(보조) ──
      let summary: string | undefined;
      if (modelType === "aasmodel") {
        // Real structure verification via the backend /instance/verification
        // endpoint — same API used by Create AAS step 4.
        const res: any = await apiVerifyInstance({
          instance_seq: "",
          aasmodel: metadata,
          submodels: [],
        });
        summary = res?.data?.summary;
      } else {
        // Standalone submodels only have an ID-uniqueness check.
        await verifyModel({ modelType, modelId, errorThrow: true, withToast: false });
      }
      result = "success";
      verificationRef.current = null;
      setVerificationActive(null);
      setVerificationError(null);
      setVerificationSummary(summary ?? null);
      setVerification("success");
    } catch (error: any) {
      result = "fail";
      applyVerificationFailure(error);
    } finally {
      setVerifying(false);
    }
    return result;
  };

  const getModelId = (md: any): string => {
    try {
      if (modelType === "aasmodel") return md?.assetAdministrationShells?.[0]?.id ?? "";
      return md?.submodels?.[0]?.id ?? "";
    } catch {
      return "";
    }
  };

  const handleSubmit = async (status: "draft" | "temporary") => {
    if (!form[nameKey]) return toast("Enter the template name", { icon: "⚠️" });
    if (!form.description) return toast("Enter a description", { icon: "⚠️" });
    if (!form.category_seq) return toast("Select a category", { icon: "⚠️" });
    if (modelType === "aasmodel") {
      if (!form.asset_type) return toast("Select an asset type", { icon: "⚠️" });
      if (!form.aas_maturity_level) return toast("Select a maturity level", { icon: "⚠️" });
    }
    if (!metadata) return toast(`Import a ${modelType === "aasmodel" ? "AAS" : "Submodel"} file`, { icon: "⚠️" });

    // Run verification before saving / registering — only proceed on success.
    const verifyResult = await verifyTemplate();
    if (verifyResult !== "success") {
      toast("Verification failed. Resolve the errors before saving.", { icon: "⚠️" });
      return;
    }

    const publishKey =
      modelType === "aasmodel" ? `${modelType}_template_id` : `${modelType}_semantic_id`;

    const body: Record<string, any> = {
      [`${modelType}_seq`]: "",
      [`${modelType}_id`]: form.model_id || getModelId(metadata),
      [publishKey]: "",
      [modelType === "aasmodel" ? "version" : `${modelType}_version`]: "",
      type: "",
      status: "",
      source_project: "",
      [nameKey]: form[nameKey],
      description: form.description,
      category_seq: form.category_seq,
      creator: form.creator,
      asset_type: form.asset_type,
      aas_maturity_level: form.aas_maturity_level,
      metadata: JSON.stringify(metadata),
    };

    if (modelType === "submodel") {
      body[publishKey] =
        metadata?.submodels?.[0]?.semanticId?.keys?.[0]?.value ?? "";
    }

    const formData = new FormData();
    formData.append("body", JSON.stringify(body));

    if (thumbnail) {
      try {
        const compressed = await imageCompression(thumbnail, {
          maxWidthOrHeight: 256,
          useWebWorker: true,
          maxSizeMB: 0.1,
        });
        formData.append(
          "image",
          new File([compressed], compressed.name, { type: compressed.type })
        );
      } catch (e) {
        console.error("[v0] thumbnail compression failed", e);
      }
    }

    Object.values(importedFiles).forEach((file) =>
      formData.append("attachments", file)
    );

    if (guidePdf) formData.append("guide_pdf", guidePdf);

    try {
      setSubmitting(true);
      const modelSeq = await upsertModel({
        modelType,
        status,
        formData,
        errorThrow: true,
        withToast: true,
      });
      router.push(ROUTES[routeKey].VIEW(String(modelSeq)));
    } catch (error: any) {
      // The save endpoint re-verifies the model. If it fails, surface the
      // detailed report in the bottom result card and stay on the edit page.
      applyVerificationFailure(error);
      if (typeof window !== "undefined") {
        requestAnimationFrame(() =>
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* hidden file inputs */}
      <input
        ref={modelFileRef}
        type="file"
        accept=".aasx,.xml,.json,application/xml,text/xml,application/json"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
      />
      <input
        ref={thumbnailRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
      />
      <input
        ref={guideRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => setGuidePdf(e.target.files?.[0] ?? null)}
      />

      {/* ── Header ── */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="mx-auto max-w-screen-xl">
          <Link
            href={meta.listRoute}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {meta.listLabel}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-zinc-900">{meta.title}</h1>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed max-w-2xl">
                  Import a model file and fill in the details to register a new
                  template.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={importing}
                onClick={() => modelFileRef.current?.click()}
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileUp className="w-3.5 h-3.5 mr-1.5" />
                )}
                Import file
              </Button>
              {metadata && (
                <Button type="button" size="sm" variant="ghost" onClick={clearImport}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {/* ── Template details ── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Template details
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor={nameKey}>
                    Template name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={nameKey}
                    placeholder="Enter template name"
                    value={form[nameKey]}
                    onChange={(e) => setField(nameKey, e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Describe this template"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                {modelType === "aasmodel" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="model_id">AAS ID</Label>
                    <Input
                      id="model_id"
                      placeholder="urn:..."
                      value={form.model_id}
                      onChange={(e) => setField("model_id", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <CategoryCombobox
                    code={meta.code}
                    value={form.category_seq}
                    setValue={(v) => setField("category_seq", v ?? "")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="creator">Creator</Label>
                  <Input
                    id="creator"
                    placeholder="Creator name"
                    value={form.creator}
                    onChange={(e) => setField("creator", e.target.value)}
                  />
                </div>

                {modelType === "aasmodel" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="asset_type">
                        Asset type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.asset_type}
                        onValueChange={(v) => setField("asset_type", v ?? "")}
                      >
                        <SelectTrigger id="asset_type" className="w-full">
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="aas_maturity_level">
                        Maturity level <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.aas_maturity_level}
                        onValueChange={(v) => setField("aas_maturity_level", v ?? "")}
                      >
                        <SelectTrigger id="aas_maturity_level" className="w-full">
                          <SelectValue placeholder="Select maturity level" />
                        </SelectTrigger>
                        <SelectContent>
                          {MATURITY_LEVEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Thumbnail
              </h2>
              {thumbnailUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl || "/placeholder.svg"}
                    alt="Template thumbnail preview"
                    className="w-full h-40 object-contain rounded-lg border border-zinc-200 bg-zinc-50"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800"
                    aria-label="Remove thumbnail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailRef.current?.click()}
                  className="w-full h-40 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-colors"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">Click to upload image</span>
                </button>
              )}
            </div>

            {/* Guide document */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Guide document
              </h2>
              {guidePdf ? (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-sm text-zinc-700 truncate flex-1">
                    {guidePdf.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuidePdf(null)}
                    className="text-zinc-400 hover:text-zinc-700"
                    aria-label="Remove guide document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => guideRef.current?.click()}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Attach PDF guide
                </Button>
              )}
            </div>
          </div>

          {/* ── Structure preview ── */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Structure
              </h2>
              {Object.keys(importedFiles).length > 0 && (
                <span className="text-xs text-zinc-400">
                  {Object.keys(importedFiles).length} attachment(s)
                </span>
              )}
            </div>

            {treeData ? (
                <TemplateBlueprint treeData={treeData} showValues collapseSignal={collapseSignal} />
            ) : (
              <button
                type="button"
                onClick={() => modelFileRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-zinc-300 bg-zinc-50 flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-colors py-20"
              >
                <FileUp className="w-8 h-8" />
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-500">
                    Import an AAS file to preview its structure
                  </p>
                  <p className="text-xs mt-1">Supports .aasx, .xml, and .json</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Verification results (same component as Create AAS step 4) ── */}
      {verification && (
        <div className="mx-auto max-w-screen-xl px-6 pb-6">
          {verification === "success" && !verificationRef.current ? (
            <div className="rounded-xl border border-green-200 bg-green-50 flex items-start gap-2 px-5 py-4">
              <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700">
                  All verifications passed.
                </p>
                {verificationSummary && (
                  <p className="text-xs text-green-600 mt-1 whitespace-pre-wrap break-words">
                    {verificationSummary}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="size-4 text-red-500" />
                <h2 className="text-sm font-semibold text-zinc-900">
                  Verification failed
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                {verificationSummary ?? "Resolve the issues below, then save or register again."}
              </p>
              {verificationRef.current ? (
                <VerifyDetailView
                  verificationRef={verificationRef}
                  verificationActive={verificationActive}
                  setVerificationActive={setVerificationActive}
                />
              ) : (
                <pre className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap break-words">
                  {verificationError ?? "Verification failed."}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="sticky bottom-0 border-t border-zinc-200 bg-white/80 backdrop-blur px-6 py-3">
        <div className="mx-auto max-w-screen-xl flex items-center justify-end gap-2">
          <Link
            href={meta.listRoute}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Cancel
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting || verifying}
            onClick={() => handleSubmit("temporary")}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save as draft
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={submitting || verifying}
            onClick={() => handleSubmit("draft")}
          >
            {submitting || verifying ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : verification === "success" ? (
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" />
            )}
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
