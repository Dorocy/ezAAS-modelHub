// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import CustomCombobox from "@/components/CustomCombobox";
import { useQuery } from "@tanstack/react-query";
import {
  apiVerifyInstance,
  deleteModel,
  exportModel,
  getCodeList,
  getInstanceTargetList,
  getModel,
  upsertInstance,
} from "@/api";
import { addValuePaths, parsingAAS } from "@/utils/aas";
import AASTree, { RenderObject } from "@/components/feature/model/AASTree";
import TemplateBlueprint from "@/components/feature/instance/TemplateBlueprint";
import SubmodelFormEditor from "@/components/feature/instance/SubmodelFormEditor";
import ConceptDescriptionPanel from "@/components/feature/instance/ConceptDescriptionPanel";
import { InstanceSavePayload } from "@/types/api";
import { confirmSave } from "@/utils/modal";
import type { AASInstance, VerifyInstanceParams } from "@/types/api";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
import CancelButton from "@/components/CancelButton";
import _ from "lodash";
import AASTreeModal from "@/components/AASTreeModal";
import { showToast } from "@/utils/toast";
import VerifyDetailView from "@/components/VerifyDetailView";

import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

import CarbonFootprintView from "./CarbonFootprintView";
import TechnicalDataView from "./TechnicalDataView";
import HandoverDocumentationView from "./HandoverDocumentationView";

// shadcn/ui
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, List, FilePlus, Plus, Trash2, ShieldCheck, Save, Pencil, CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────── types ─────────────────────────── */
type PaginationState = { pageIndex: number; pageSize: number };

type AASInstanceInsProps = {
  mode: "create" | "edit" | "view";
  instance?: AASInstance;
  combinedAAS?: {
    verification_log?: { total: number; success: number; fail: number };
    assetAdministrationShells: object[];
    submodels?: object[];
    conceptDescriptions?: object[];
    attatchments?: any;
  };
};

/* ─────────────────────────────── helpers ────────────────────────── */
const normalizeMetadataPaths = (obj: any) => {
  if (!obj || typeof obj !== "object") return;
  Object.keys(obj).forEach((key) => {
    if (
      (key === "value" || key === "originalValue") &&
      typeof obj[key] === "string"
    ) {
      const val = obj[key];
      if (
        val.includes("/aas_files/aas/") &&
        !val.includes("/aas_files/aas/instance/")
      ) {
        obj[key] = val.replace("/aas_files/aas/", "/aas_files/aas/instance/");
      }
    }
    if (typeof obj[key] === "object") normalizeMetadataPaths(obj[key]);
  });
};

const initialState = { aasmodel: { aasmodel: "", aasmodel_metadata: {} } };

/* ─────────────────────── Stepper component ─────────────────────── */
const STEPS = [
  {
    label: "기본 정보",
    desc: "인스턴스 이름과 설명을 입력합니다.",
    hint: "AAS 인스턴스를 구분할 이름과 간단한 설명을 입력하세요. 이름은 필수 항목입니다.",
  },
  {
    label: "데이터 입력",
    desc: "템플릿을 선택하고 값을 입력합니다.",
    hint: "AAS 템플릿을 선택한 뒤 각 서브모델의 프로퍼티 값을 입력하세요. 서브모델별로 폼이 구성됩니다.",
  },
  {
    label: "미리보기",
    desc: "입력한 데이터를 확인합니다.",
    hint: "지금까지 입력한 데이터를 서브모델별로 확인하세요. 미입력 항목이 표시되며, 이전 단계로 돌아가 수정할 수 있습니다.",
  },
  {
    label: "검증",
    desc: "AAS 구조와 데이터를 검증합니다.",
    hint: "검증 실행 버튼을 눌러 AAS 데이터의 유효성을 확인하세요. 검증에 실패해도 저장은 가능합니다.",
  },
  {
    label: "저장",
    desc: "인스턴스를 저장하고 완료합니다.",
    hint: "모든 설정이 완료됐습니다. 아래 저장 버튼을 눌러 AAS 인스턴스를 생성하세요.",
  },
];

function StepIndicator({
  active,
  onStepClick,
}: {
  active: number;
  onStepClick: (i: number) => void;
}) {
  const currentStep = STEPS[active];
  return (
    <div className="flex flex-col gap-3">
      {/* 스텝 목록 */}
      <div className="flex items-center overflow-x-auto">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <React.Fragment key={i}>
              <button
                onClick={() => onStepClick(i)}
                className="flex items-center gap-2.5 min-w-fit px-1 py-1 rounded transition-colors"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                    current && "bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2",
                    done && "bg-zinc-900 text-white",
                    !current && !done && "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  )}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i + 1}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={cn(
                    "text-xs font-semibold leading-none whitespace-nowrap",
                    current && "text-zinc-900",
                    done && "text-zinc-600",
                    !current && !done && "text-zinc-400"
                  )}>{step.label}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-2 min-w-[20px]",
                  i < active ? "bg-zinc-900" : "bg-zinc-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* 현재 스텝 안내 — 구분선 + 한 줄 */}
      {currentStep && (
        <div className="border-t border-zinc-100 pt-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Step {active + 1}</span>
          <span className="text-zinc-200">·</span>
          <span className="text-xs text-zinc-500">{currentStep.hint}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── InstanceForm ──────────────────────────── */
export default function InstanceForm({ mode, instance, combinedAAS }: AASInstanceInsProps) {
  const router = useRouter();

  ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

  const countModelTypes = (nodes: any[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    const queue = [...nodes];
    while (queue.length > 0) {
      const node = queue.shift();
      if (node) {
        counts[node.modelType] = (counts[node.modelType] || 0) + 1;
        if (node.children) queue.push(...node.children);
      }
    }
    return counts;
  };

  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState("templateInfo");
  const [activeDetailTab, setActiveDetailTab] = useState("aasTree");
  const [showAdvancedTree, setShowAdvancedTree] = useState(false);
  // SubmodelFormEditor용 reactive state — treeDataRef는 ref라 렌더 트리거가 안되므로 별도 관리
  const [formEditorState, setFormEditorState] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [combinedModalOpen, setCombinedModalOpen] = useState(false);

  const treeDataRef = useRef<any>({});

  const [modelType, setModelType] = useState("");
  const [modelSeq, setModelSeq] = useState("");
  const [aasmodel, setAasmodel] = useState(initialState.aasmodel);
  const [treeData, setTreeData] = useState<any[] | undefined>(undefined);
  const [previewModel, setPreviewModel] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const verificationRef = useRef<any>(null);
  const [verificationActive, setVerificationActive] = useState<any>();

  const [searchState, setSearchState] = useState({ category_seq: "all" });

  const [inputState, setInputState] = useState<{
    instance_name: string;
    description: string;
    verification: "fail" | "success" | undefined;
    verification_log?: { total: number; success: number; fail: number };
  }>({ instance_name: "", description: "", verification: undefined });

  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ node: any; rootId: string } | null>(null);
  const [selectedCDNode, setSelectedCDNode] = useState<any | null>(null);

  const { data: categorys } = useQuery({
    queryKey: ["common/code", "category"],
    queryFn: () => getCodeList("category"),
  });

  const { data: verifications } = useQuery({
    queryKey: ["common/code", "SYS300"],
    queryFn: () => getCodeList("SYS300"),
  });

  const { data: models, isFetching: isFetchingModels } = useQuery({
    queryKey: [modelType, searchState],
    queryFn: () =>
      getInstanceTargetList({ modelType, category_seq: searchState.category_seq, withToast: true }),
    enabled: modelType !== "" && searchState.category_seq !== "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qModelSeq = new URLSearchParams(window.location.search).get("modelSeq");
    if (instance || !qModelSeq) return;
    const fetchModel = async () => {
      const data = await getModel({ modelSeq: qModelSeq, modelType: "aasmodel" });
      const model = _.cloneDeep(data[0]);
      if (model.metadata?.assetAdministrationShells?.length > 0) {
        model.metadata.assetAdministrationShells[0].assetInformation.assetKind = "Instance";
      }
      setAasmodel(renameKey(model, "metadata", "aasmodel_metadata"));
      treeDataRef.current[model.aasmodel_id] = {};
      setInputState((prev) => ({
        ...prev,
        instance_name: prev.instance_name || model.aasmodel_name,
        description: prev.description || model.description,
      }));
    };
    fetchModel();
  }, []);

  useEffect(() => {
    if (!instance) return;
    setInputState({
      instance_name: instance.instance_name,
      description: instance.description,
      verification: instance.verification,
      verification_log: instance.verification_log,
    });
    const aasmodelMetadata = _.cloneDeep(instance.aasmodel_metadata);
    normalizeMetadataPaths(aasmodelMetadata);
    if (aasmodelMetadata) {
      if (!aasmodelMetadata.submodels) aasmodelMetadata.submodels = [];
      if (Array.isArray(instance.submodels)) {
        instance.submodels.forEach((sm_entry) => {
          if (
            sm_entry.submodel_metadata &&
            Array.isArray(sm_entry.submodel_metadata.submodels) &&
            sm_entry.submodel_metadata.submodels.length > 0
          ) {
            const submodelDefinition = sm_entry.submodel_metadata.submodels[0];
            submodelDefinition.submodel_seq = sm_entry.submodel_seq;
            aasmodelMetadata.submodels.push(submodelDefinition);
          }
        });
      }
      if (!aasmodelMetadata.conceptDescriptions) aasmodelMetadata.conceptDescriptions = [];
      const cdMap = new Map();
      (aasmodelMetadata.conceptDescriptions || []).forEach((cd: any) => {
        if (cd && cd.id) cdMap.set(cd.id, cd);
      });
      if (Array.isArray(instance.submodels)) {
        instance.submodels.forEach((sm_entry) => {
          if (sm_entry.submodel_metadata && Array.isArray(sm_entry.submodel_metadata.conceptDescriptions)) {
            sm_entry.submodel_metadata.conceptDescriptions.forEach((cd: any) => {
              if (cd && cd.id) cdMap.set(cd.id, cd);
            });
          }
        });
      }
      aasmodelMetadata.conceptDescriptions = Array.from(cdMap.values());
    }

    if (aasmodelMetadata?.assetAdministrationShells?.length > 0) {
      aasmodelMetadata.assetAdministrationShells[0].assetInformation.assetKind = "Instance";
    }
    setAasmodel({ aasmodel_seq: instance.aasmodel_seq, aasmodel_metadata: aasmodelMetadata });
    treeDataRef.current[instance.aasmodel_id] = {};
  }, [instance]);

  const removeAASModel = () => {
    setModelSeq("");
    setAasmodel(initialState.aasmodel);
    delete treeDataRef.current[(aasmodel as any).aasmodel_id];
  };

  const getModelId = (mt: "aasmodel" | "submodel", metadata: any) => {
    if (!metadata) return;
    if (mt === "aasmodel") return metadata?.assetAdministrationShells?.[0]?.id;
    if (metadata.submodels?.length > 0) return metadata.submodels[0].id;
    return null;
  };

  const convertToTreeData = (mt: "aasmodel" | "submodel", metadata: any) => {
    if (!metadata) return;
    const parsedMetadata = typeof metadata === "object" ? metadata : JSON.parse(metadata);
    const valuePaths = addValuePaths({ ...parsedMetadata });
    return parsingAAS(valuePaths);
  };

  const conceptDescriptionTreeData = useMemo(() => {
    const metadata = aasmodel.aasmodel_metadata;
    if (!metadata || !(metadata as any).conceptDescriptions) return;
    const uniqueCDs = new Map();
    ((metadata as any).conceptDescriptions || []).forEach((cd: any) => {
      if (cd && cd.id) uniqueCDs.set(cd.id, cd);
    });
    const children = Array.from(uniqueCDs.values()).map((cd: any, index: number) => ({
      label: cd.idShort,
      ...cd,
      value: cd.id,
      valuePath: `conceptDescriptions[${index}]`,
    }));
    return [
      {
        value: "ConceptDescriptions",
        modelType: "ConceptDescriptions",
        idShort: `ConceptDescriptions (${uniqueCDs.size})`,
        label: `${uniqueCDs.size.toLocaleString()} Count`,
        children,
      },
    ];
  }, [aasmodel.aasmodel_metadata]);

  useEffect(() => {
    if (!getModelId("aasmodel", aasmodel.aasmodel_metadata)) {
      setTreeData(undefined);
      return;
    }
    setTreeData(convertToTreeData("aasmodel", aasmodel.aasmodel_metadata));
  }, [aasmodel]);

  // treeData가 바뀌면 formEditorState를 트리의 현재 값으로 초기화
  useEffect(() => {
    if (!treeData) return;
    const flat: Record<string, any> = {};
    function extractValues(node: any) {
      if (!node.valuePath) return;
      if (node.modelType === "Range") {
        if (node.min !== undefined) flat[`${node.valuePath}.min`] = node.min;
        if (node.max !== undefined) flat[`${node.valuePath}.max`] = node.max;
      } else if (node.originalValue !== undefined && node.originalValue !== null) {
        flat[`${node.valuePath}.originalValue`] = node.originalValue;
      }
      if (Array.isArray(node.children)) node.children.forEach(extractValues);
    }
    treeData.forEach(extractValues);
    setFormEditorState(flat);
  }, [treeData]);

  const componentCounts = useMemo(() => (!treeData ? {} : countModelTypes(treeData)), [treeData]);

  const chartData: ChartData<"bar"> = useMemo(() => ({
    labels: Object.keys(componentCounts),
    datasets: [
      {
        label: "Component Count",
        data: Object.values(componentCounts),
        backgroundColor: [
          "rgba(255,99,132,0.8)", "rgba(75,192,192,0.8)", "rgba(54,162,235,0.8)",
          "rgba(255,206,86,0.8)", "rgba(153,102,255,0.8)", "rgba(255,159,64,0.8)",
        ],
        borderColor: "rgba(255,255,255,0)",
        borderWidth: 0,
      },
    ],
  }), [componentCounts]);

  function renameKey<T extends object>(obj: T, oldKey: keyof T, newKey: string): Record<string, any> {
    const { [oldKey]: oldValue, ...rest } = obj;
    return { [newKey]: oldValue, ...rest };
  }

  const applyMetadata = (mt: string, metadata: any) => {
    const payloadMetadata = Array.isArray(metadata) ? [...metadata] : { ...metadata };
    const refObj = treeDataRef.current[getModelId(mt as any, payloadMetadata)];
    for (const key in refObj) _.set(payloadMetadata, key, refObj[key]);
    return payloadMetadata;
  };

  const verifyInstance = async () => {
    let verification: "success" | "fail";
    const body: VerifyInstanceParams = {
      instance_seq: instance?.instance_seq ?? "",
      aasmodel: applyMetadata("aasmodel", aasmodel.aasmodel_metadata),
      submodels: [],
    };
    try {
      setLoading(true);
      const result = await apiVerifyInstance(body);
      verification = "success";
      verificationRef.current = null;
      setInputState((prev) => ({ ...prev, verification, verification_log: result.data?.summary }));
      setVerificationActive(null);
    } catch (error: any) {
      const json = error?.cause?.json;
      verification = "fail";
      if (json && json.data && typeof json.data === "string") {
        try {
          const verificationData = JSON.parse(json.data);
          if (verificationData) {
            setVerificationActive(0);
            verificationRef.current = verificationData;
            setInputState((prev) => ({ ...prev, verification: "fail", verification_log: verificationData?.summary }));
          } else {
            setInputState((prev) => ({ ...prev, verification: "fail", verification_log: undefined }));
            verificationRef.current = null;
            setVerificationActive(null);
          }
        } catch {
          setInputState((prev) => ({ ...prev, verification: "fail", verification_log: undefined }));
          verificationRef.current = null;
          setVerificationActive(null);
        }
      } else {
        setInputState((prev) => ({ ...prev, verification: "fail", verification_log: undefined }));
        verificationRef.current = null;
        setVerificationActive(null);
      }
    } finally {
      setLoading(false);
    }
    if (verification === "fail" && !verificationRef.current) {
      setInputState((prev) => ({ ...prev, verification }));
    }
    return verification;
  };

  const handleSubmit = async () => {
    if (!(await confirmSave("저장하시겠습니까?"))) return;
    for (const key in inputState) {
      if ((inputState as any)[key] === "") return showToast.error(`Please check ${key} field`);
    }
    let verification: "success" | "fail";
    if (inputState.verification === "success" || inputState.verification === "fail") {
      verification = inputState.verification;
    } else {
      verification = await verifyInstance();
    }
    if (verification === "fail") {
      showToast.error("검증이 실패했지만 저장을 진행합니다. 이후 검증을 다시 실행해주세요.");
    }
    const payloadAASmodel = {
      ...aasmodel,
      aasmodel_metadata: JSON.stringify(applyMetadata("aasmodel", aasmodel.aasmodel_metadata)),
    };
    const submodelsFromAAS = ((aasmodel.aasmodel_metadata as any)?.submodels as any[])?.map((sm) => {
      const referencedCDs = new Set<string>();
      function findSemanticIds(element: any) {
        if (typeof element !== "object" || element === null) return;
        if (element.semanticId?.keys) element.semanticId.keys.forEach((k: any) => k.value && referencedCDs.add(k.value));
        if (element.isCaseOf) element.isCaseOf.forEach((ref: any) => ref.keys?.forEach((k: any) => k.value && referencedCDs.add(k.value)));
        if (element.submodelElements) element.submodelElements.forEach(findSemanticIds);
        if (element.statements) element.statements.forEach(findSemanticIds);
        if (element.value && typeof element.value === "object") {
          if (Array.isArray(element.value)) element.value.forEach(findSemanticIds);
          else findSemanticIds(element.value);
        }
      }
      findSemanticIds(sm);
      const allCDs = (aasmodel.aasmodel_metadata as any)?.conceptDescriptions || [];
      return {
        submodel_seq: sm.submodel_seq || null,
        submodel_metadata: JSON.stringify({
          assetAdministrationShells: [],
          submodels: [sm],
          conceptDescriptions: allCDs.filter((cd: any) => cd.id && referencedCDs.has(cd.id)),
        }),
      };
    }) || [];
    const submodelsToSend = submodelsFromAAS.length > 0 ? submodelsFromAAS : [{ submodel_seq: null, submodel_metadata: "{}" }];

    let body: InstanceSavePayload;
    if (mode === "create") {
      body = { ...inputState, verification, instance_seq: "", aasmodel_seq: payloadAASmodel.aasmodel_seq, aasmodel_metadata: payloadAASmodel.aasmodel_metadata, status: "Y", submodels: submodelsToSend };
    } else {
      body = { ...inputState, verification, instance_seq: instance!.instance_seq, aasmodel_seq: payloadAASmodel.aasmodel_seq, aasmodel_metadata: payloadAASmodel.aasmodel_metadata, status: "Y", submodels: submodelsToSend };
    }
    const formData = new FormData();
    formData.append("body", JSON.stringify(body));
    const allFilesToUpload: File[] = [];
    Object.values(treeDataRef.current).forEach((rootChanges: any) => {
      Object.values(rootChanges).forEach((change: any) => { if (change instanceof File) allFilesToUpload.push(change); });
    });
    for (const file of allFilesToUpload) formData.append("attachments", file);
    try {
      setLoading(true);
      await upsertInstance({ formData, withToast: true });
      router.push(ROUTES.INSTANCE.LIST);
    } catch {}
    finally { setLoading(false); }
  };

  const handleExport = (format: string, inst: AASInstance) => {
    exportModel({ modelType: "instance", format, modelSeq: inst.instance_seq, filename: inst.instance_name, source: "db", withToast: true });
  };

  const combinedAASTreeData = useMemo(() => {
    if (!getModelId("aasmodel", combinedAAS)) return;
    return convertToTreeData("aasmodel", combinedAAS);
  }, [combinedAAS]);

  const combinedAASConceptDescriptionTreeData = useMemo(() => {
    if (!combinedAAS) return;
    return [
      {
        value: "ConceptDescriptions",
        modelType: "ConceptDescriptions",
        idShort: `ConceptDescriptions (${(combinedAAS as any).conceptDescriptions?.length ?? 0})`,
        children: ((combinedAAS as any).conceptDescriptions ?? []).map((cd: any) => ({
          ...cd,
          value: cd.id,
          ConceptDescription: cd,
        })),
      },
    ];
  }, [combinedAAS]);

  const handleDelete = async () => {
    if (!selectedNode || selectedNode.node.modelType !== "Submodel") return;
    const isConfirm = await confirmSave(`Are you sure you want to delete the submodel '${selectedNode.node.idShort}'?`, { labels: { confirm: "Delete", cancel: "Cancel" }, confirmProps: { color: "red.8" } });
    if (!isConfirm) return;
    const submodelIdToDelete = selectedNode.node.id;
    const submodelValuePath = selectedNode.node.valuePath;
    const rootId = selectedNode.rootId;
    if (treeDataRef.current[rootId] && submodelValuePath) {
      const newRefForRoot = { ...treeDataRef.current[rootId] };
      for (const key in newRefForRoot) { if (key.startsWith(submodelValuePath)) delete newRefForRoot[key]; }
      treeDataRef.current[rootId] = newRefForRoot;
    }
    setAasmodel((prev) => {
      const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
      if (newMetadata.submodels) newMetadata.submodels = newMetadata.submodels.filter((sm: any) => sm.id !== submodelIdToDelete);
      if (newMetadata.assetAdministrationShells?.[0]?.submodels) {
        newMetadata.assetAdministrationShells[0].submodels = newMetadata.assetAdministrationShells[0].submodels.filter((ref: any) => ref.keys?.[0]?.value !== submodelIdToDelete);
      }
      return { ...prev, aasmodel_metadata: newMetadata };
    });
    setSelectedNode(null);
    showToast.success("Submodel deleted successfully.");
  };

  const handleCDDetailSave = () => {
    if (!selectedCDNode) { showToast.error("No Concept Description selected."); return; }
    const changes = treeDataRef.current["conceptDescriptions"];
    if (!changes || Object.keys(changes).length === 0) { showToast.warning("No changes to save."); return; }
    const newMetadata = _.cloneDeep((aasmodel as any).aasmodel_metadata);
    for (const key in changes) _.set(newMetadata, `conceptDescriptions.${key}`, changes[key]);
    setAasmodel((prev) => ({ ...prev, aasmodel_metadata: newMetadata }));
    delete treeDataRef.current["conceptDescriptions"];
    showToast.success(`Changes for '${selectedCDNode.idShort}' have been saved.`);
  };

  const handleDetailChange = (path: string, value: any, file?: File) => {
    if (!selectedNode) return;
    const { rootId } = selectedNode;
    if (!treeDataRef.current[rootId]) treeDataRef.current[rootId] = {};
    if (file) {
      treeDataRef.current[rootId][path] = file;
      treeDataRef.current[rootId][`${path.substring(0, path.lastIndexOf("."))}.value`] = value;
    } else {
      treeDataRef.current[rootId][path] = value;
      const nodeType = selectedNode.node.modelType;
      if (path.endsWith(".originalValue") && (nodeType === "File" || nodeType === "Property")) {
        treeDataRef.current[rootId][path.replace(/\.originalValue$/, ".value")] = value;
      }
    }
    setSelectedNode((prev) => (prev ? { ...prev } : null));
  };

  const handleDetailSave = () => {
    if (!selectedNode) { showToast.error("No item selected."); return; }
    const { node, rootId } = selectedNode;
    const changes = treeDataRef.current[rootId];
    if (!changes || Object.keys(changes).length === 0) { showToast.warning("No changes to save."); return; }
    const newMetadata = _.cloneDeep((aasmodel as any).aasmodel_metadata);
    for (const key in changes) _.set(newMetadata, key, changes[key]);
    setAasmodel((prev) => ({ ...prev, aasmodel_metadata: newMetadata }));
    const newTreeData = convertToTreeData("aasmodel", newMetadata);
    setTreeData(newTreeData);
    showToast.success(`Changes for '${node.idShort}' have been saved and applied.`);
  };

  /* Form editor의 Save 버튼 — selectedNode 없이 rootId 기반으로 저장 */
  const handleFormEditorSave = () => {
    const rootId = treeData?.[0]?.id;
    if (!rootId) return;
    const changes = treeDataRef.current[rootId];
    if (!changes || Object.keys(changes).length === 0) { showToast.warning("No changes to save."); return; }
    const newMetadata = _.cloneDeep((aasmodel as any).aasmodel_metadata);
    for (const key in changes) _.set(newMetadata, key, changes[key]);
    setAasmodel((prev) => ({ ...prev, aasmodel_metadata: newMetadata }));
    const newTreeData = convertToTreeData("aasmodel", newMetadata);
    setTreeData(newTreeData);
    showToast.success("Changes saved.");
  };

  const handleAddElement = (parentNode: any, elementType: string, idShort: string) => {
    const newElement: any = { idShort, modelType: elementType, description: [{ language: "en", text: "" }], semanticId: { type: "ModelReference", keys: [{ type: "GlobalReference", value: "" }] } };
    switch (elementType) {
      case "Property": newElement.valueType = "xs:string"; newElement.value = ""; newElement.category = "PARAMETER"; newElement.semanticId = { keys: [] }; break;
      case "MultiLanguageProperty": newElement.valueType = "xs:string"; newElement.value = [{ language: "en-US", text: "" }]; break;
      case "Range": newElement.valueType = "xs:integer"; newElement.min = 0; newElement.max = 0; break;
      case "File": newElement.contentType = ""; newElement.value = ""; break;
      case "ReferenceElement": newElement.value = { type: "ModelReference", keys: [] }; break;
      case "SubmodelElementCollection": newElement.value = []; break;
      case "SubmodelElementList": newElement.value = []; newElement.allowDuplicates = false; newElement.typeValueListElement = "SubmodelElement"; newElement.orderRelevant = true; break;
      case "Entity": newElement.entityType = "SelfManagedEntity"; newElement.statements = []; newElement.globalAssetId = ""; newElement.specificAssetId = []; break;
      case "RelationshipElement": newElement.first = { type: "ModelReference", keys: [] }; newElement.second = { type: "ModelReference", keys: [] }; break;
    }
    setAasmodel((prev) => {
      const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
      const parentPath = parentNode.valuePath;
      let childrenPath: string | undefined;
      if (parentNode.modelType === "Submodel") childrenPath = `${parentPath}.submodelElements`;
      else if (["SubmodelElementCollection", "SubmodelElementList"].includes(parentNode.modelType)) childrenPath = `${parentPath}.value`;
      else if (parentNode.modelType === "Entity") childrenPath = `${parentPath}.statements`;
      if (childrenPath) {
        const children = _.get(newMetadata, childrenPath, []);
        if (Array.isArray(children) && !children.find((c: any) => c.idShort === idShort)) { children.push(newElement); _.set(newMetadata, childrenPath, children); }
        else if (!children) _.set(newMetadata, childrenPath, [newElement]);
      }
      return { ...prev, aasmodel_metadata: newMetadata };
    });
    showToast.success(`Element '${idShort}' added to '${parentNode.idShort}'.`);
  };

  const handleDeleteElement = (node: any) => {
    setAasmodel((prev) => {
      const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
      if (node.modelType === "Submodel") {
        const id = node.id;
        if (newMetadata.submodels) newMetadata.submodels = newMetadata.submodels.filter((sm: any) => sm.id !== id);
        if (newMetadata.assetAdministrationShells?.[0]?.submodels) {
          newMetadata.assetAdministrationShells[0].submodels = newMetadata.assetAdministrationShells[0].submodels.filter((ref: any) => ref.keys?.[0]?.value !== id);
        }
      } else {
        const pathParts = node.valuePath.match(/(.*)\[(\d+)\]$/);
        if (pathParts) {
          const parentPath = pathParts[1];
          const index = parseInt(pathParts[2], 10);
          const arr = _.get(newMetadata, parentPath);
          if (Array.isArray(arr)) _.pullAt(arr, index);
        } else {
          const parentPath = node.valuePath.substring(0, node.valuePath.lastIndexOf("."));
          const prop = node.valuePath.substring(node.valuePath.lastIndexOf(".") + 1);
          const parent = _.get(newMetadata, parentPath);
          if (parent && Array.isArray(parent.submodelElements)) parent.submodelElements = parent.submodelElements.filter((el: any) => el.idShort !== node.idShort);
        }
      }
      return { ...prev, aasmodel_metadata: newMetadata };
    });
    showToast.success(`Element '${node.idShort}' deleted.`);
  };

  const handleAddConceptDescription = (_parentNode: any, elementType: string, idShort: string) => {
    const newCD: any = { idShort, modelType: "ConceptDescription", id: uuidv4(), description: [{ language: "en", text: "" }] };
    setAasmodel((prev) => {
      const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
      if (!newMetadata.conceptDescriptions) newMetadata.conceptDescriptions = [];
      newMetadata.conceptDescriptions.push(newCD);
      return { ...prev, aasmodel_metadata: newMetadata };
    });
    showToast.success(`Concept Description '${idShort}' added.`);
  };

  const handleDeleteConceptDescription = (node: any) => {
    if (node.modelType !== "ConceptDescription") return;
    setAasmodel((prev) => {
      const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
      const pathParts = node.valuePath.match(/(.*)\[(\d+)\]$/);
      if (pathParts) {
        const parentPath = pathParts[1];
        const index = parseInt(pathParts[2], 10);
        const arr = _.get(newMetadata, parentPath);
        if (Array.isArray(arr)) _.pullAt(arr, index);
      }
      return { ...prev, aasmodel_metadata: newMetadata };
    });
    showToast.success(`Concept Description '${node.idShort}' deleted.`);
  };

  /* ─── Submodel accordion tab content (Nameplate / TechnicalData / HandoverDoc / generic) ─── */
  const renderSubmodelPanel = (submodelNode: any, index: number) => {
    const getAllProperties = (elements: any[]): any[] => {
      let properties: any[] = [];
      if (!Array.isArray(elements)) return properties;
      for (const element of elements) {
        if (["Property", "MultiLanguageProperty", "File"].includes(element.modelType)) properties.push(element);
        else if (["SubmodelElementCollection", "SubmodelElementList"].includes(element.modelType)) {
          const children = element.children || _.get((aasmodel as any).aasmodel_metadata, `${element.valuePath}.value`, []);
          properties = properties.concat(getAllProperties(children));
        }
      }
      return properties;
    };

    const semanticId = submodelNode.semanticId?.keys?.[0]?.value ?? "";

    if (submodelNode.idShort?.includes("CarbonFootprint")) {
      return <CarbonFootprintView submodelNode={submodelNode} aasmodelMetadata={(aasmodel as any).aasmodel_metadata} />;
    }
    if (submodelNode.idShort?.includes("TechnicalData") || semanticId.includes("TechnicalData")) {
      return <TechnicalDataView submodelNode={submodelNode} aasmodelMetadata={(aasmodel as any).aasmodel_metadata} />;
    }
    if (submodelNode.idShort?.includes("HandoverDocumentation")) {
      return <HandoverDocumentationView submodelNode={submodelNode} aasmodelMetadata={(aasmodel as any).aasmodel_metadata} />;
    }
    if (submodelNode.idShort?.includes("Nameplate")) {
      const allProperties = getAllProperties(submodelNode.children || []);
      const getPropValue = (id: string) => {
        const propNode = allProperties.find((p) => p.idShort === id);
        if (!propNode) return "N/A";
        const propData = _.get((aasmodel as any).aasmodel_metadata, propNode.valuePath);
        if (propData?.modelType === "MultiLanguageProperty" && Array.isArray(propData.value)) {
          const enValue = propData.value.find((v: any) => v.language === "en");
          return enValue?.text || propData.value[0]?.text || "N/A";
        }
        return String(propData?.value || "N/A");
      };
      const manufacturerName = getPropValue("ManufacturerName");
      const productDesignation = getPropValue("ManufacturerProductDesignation");
      const allChildren = submodelNode.children || [];
      const generalProperties = allChildren.filter((child: any) => ["Property", "MultiLanguageProperty", "File", "Range"].includes(child.modelType));
      const collectionNodes = allChildren.filter((child: any) => ["SubmodelElementCollection", "SubmodelElementList"].includes(child.modelType));
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{productDesignation}</p>
                  <p className="text-sm text-muted-foreground">{manufacturerName}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {instance?.create_date ? new Intl.DateTimeFormat("ko-KR").format(new Date(instance.create_date)) : ""}
                </Badge>
              </div>
            </div>
          </div>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              {collectionNodes.map((cn: any, i: number) => (
                <TabsTrigger key={i} value={`col-${i}`}>{cn.idShort}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="general">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {generalProperties.map((prop: any, pi: number) => {
                      const propData = _.get((aasmodel as any).aasmodel_metadata, prop.valuePath);
                      let displayValue = "";
                      if (propData?.modelType === "MultiLanguageProperty" && Array.isArray(propData.value)) {
                        const en = propData.value.find((v: any) => v.language === "en");
                        displayValue = en?.text || propData.value[0]?.text || "";
                      } else displayValue = String(propData?.value ?? "");
                      return (
                        <tr key={pi} className="border-b">
                          <th className="text-left text-muted-foreground py-1.5 pr-4 font-medium w-40">{prop.idShort}</th>
                          <td className="py-1.5 text-foreground font-medium">{displayValue || <span className="text-muted-foreground">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            {collectionNodes.map((cn: any, i: number) => (
              <TabsContent key={i} value={`col-${i}`}>
                <div className="p-3">
                  <TemplateBlueprint treeData={[cn]} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      );
    }
    // generic
    return (
      <AASTree data={[submodelNode]} editMode={mode !== "view"} mb="sm"
        onNodeClick={(node) => setSelectedNode({ node, rootId: treeData?.[0]?.id })}
        onAdd={handleAddElement} onDelete={handleDeleteElement} />
    );
  };

  /* ─── verification badge ─── */
  const verificationBadge = (v: string | undefined) => {
    if (!v) return null;
    return (
      <Badge variant={v === "success" ? "default" : "destructive"} className="text-sm">
        {v}
      </Badge>
    );
  };

  /* ─── main card content (view/create/edit preview) ─── */
  const originalForm = (() => {
    const submodels = treeData?.[0]?.children?.filter((c: any) => c.modelType === "Submodel") ?? [];

    // 서브모델 description 배열에서 텍스트 추출 (한국어 우선, 없으면 영어, 없으면 첫번째)
    const getSmDescription = (sm: any): string => {
      if (!Array.isArray(sm.description) || sm.description.length === 0) return "";
      return (
        sm.description.find((d: any) => d.language === "ko")?.text ||
        sm.description.find((d: any) => d.language === "en")?.text ||
        sm.description[0]?.text ||
        ""
      );
    };

    const collectProps = (nodes: any[]): any[] => {
      let result: any[] = [];
      for (const n of nodes ?? []) {
        if (["Property","MultiLanguageProperty","File","Range"].includes(n.modelType)) result.push(n);
        else if (n.children?.length) result = result.concat(collectProps(n.children));
      }
      return result;
    };

    const resolveValue = (node: any): string => {
      const data = _.get((aasmodel as any).aasmodel_metadata, node.valuePath);
      if (!data) return "";
      if (data.modelType === "MultiLanguageProperty" && Array.isArray(data.value)) {
        const en = data.value.find((v: any) => v.language === "en") ?? data.value[0];
        return en?.text ?? "";
      }
      return String(data?.value ?? "");
    };

    // File 노드에서 경로 추출 (originalValue 또는 value)
    const resolveFilePath = (node: any): string => {
      const data = _.get((aasmodel as any).aasmodel_metadata, node.valuePath);
      if (!data) return "";
      return String(data?.value ?? data?.originalValue ?? "");
    };

    const IMAGE_EXTS = [".jpg",".jpeg",".png",".gif",".webp",".bmp",".svg"];
    const isImagePath = (path: string) =>
      IMAGE_EXTS.some(ext => path.toLowerCase().endsWith(ext)) ||
      path.startsWith("data:image/");

    // 전체 서브모델에서 첫 번째 이미지 File 노드 찾기
    const allFileNodes = collectProps(submodels.flatMap((sm: any) => sm.children ?? []))
      .filter((n: any) => n.modelType === "File");
    const thumbnailPath = allFileNodes
      .map((n: any) => resolveFilePath(n))
      .find((p: string) => p && isImagePath(p)) ?? null;

    const allProps = collectProps(submodels.flatMap((sm: any) => sm.children ?? []));
    const totalFilled = allProps.filter(p => resolveValue(p)).length;
    const totalProps  = allProps.length;
    const overallRatio = totalProps > 0 ? Math.round((totalFilled / totalProps) * 100) : 0;

    const instanceName = mode === "view" ? instance?.instance_name  : inputState.instance_name;
    const description  = mode === "view" ? instance?.description    : inputState.description;
    const categoryName = mode === "view" ? instance?.category_name  : (aasmodel as any)?.category_name;
    const version      = mode === "view" ? instance?.aasmodel_version : (aasmodel as any)?.version;
    const assetKind    = treeData?.[0]?.AssetAdministrationShell?.assetInformation?.assetKind;
    const createDate   = mode === "view" && instance?.create_date
      ? new Intl.DateTimeFormat("ko-KR").format(new Date(instance.create_date)) : null;



    return (
      <div key={mode === "view" ? instance?.instance_seq : "create-preview"} className="flex flex-col gap-4">

        {/* ── 헤더 ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            {/* 썸네일 — 이미지 있으면 크게, 없으면 작은 placeholder */}
            {thumbnailPath ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
                <img
                  src={thumbnailPath}
                  alt={instanceName || "thumbnail"}
                  className="object-cover w-full h-full"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/assets/media/aas/aas_blank.jpg"; }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg overflow-hidden border bg-muted shrink-0 relative">
                <img src="/assets/media/aas/aas_blank.jpg" alt="Instance" className="object-cover w-full h-full" />
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-zinc-900">{instanceName || "—"}</h2>
                {categoryName && <span className="text-[11px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{categoryName}</span>}
                {version      && <span className="text-[11px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">v{version}</span>}
                {assetKind    && <span className="text-[11px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{assetKind}</span>}
                {verificationBadge(mode === "view" ? instance?.verification : inputState.verification)}
              </div>
              {description && <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">{description}</p>}
              {thumbnailPath && (
                <p className="text-[11px] text-zinc-300 mt-1 font-mono truncate max-w-xs">{thumbnailPath}</p>
              )}
            </div>
          </div>
          {mode === "view" && user?.user_seq === instance?.create_user_seq && (
            <div className="flex gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent">
                  Export <ChevronDown className="size-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {["json","xml","aasx"].map(fmt => (
                    <DropdownMenuItem key={fmt} onClick={() => instance && handleExport(fmt, instance)}>{fmt}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href={ROUTES.INSTANCE.EDIT(instance?.instance_seq)}>
                <Button size="sm"><Pencil className="size-3.5 mr-1.5" />수정</Button>
              </Link>
            </div>
          )}
        </div>

        {/* ── 서브모델 accordion ── */}
        <Accordion type="multiple" defaultValue={submodels.map((_: any, i: number) => `sm-${i}`)}>
          {submodels.map((sm: any, si: number) => {
            const smDesc     = getSmDescription(sm);
            const props      = collectProps(sm.children ?? []);
            const filled     = props.filter(p => resolveValue(p)).length;
            const missing    = props.length - filled;
            const isComplete = missing === 0;

            // 그룹(Collection) 단위 또는 flat props
            const groups: { label: string | null; items: any[] }[] = [];
            for (const child of sm.children ?? []) {
              const isCol = ["SubmodelElementCollection","SubmodelElementList"].includes(child.modelType);
              if (isCol) {
                groups.push({ label: child.idShort, items: collectProps([child]) });
              } else if (["Property","MultiLanguageProperty","File","Range"].includes(child.modelType)) {
                const last = groups[groups.length - 1];
                if (last?.label === null) last.items.push(child);
                else groups.push({ label: null, items: [child] });
              }
            }

            return (
              <AccordionItem key={si} value={`sm-${si}`} className="border border-zinc-200 rounded-lg overflow-hidden mb-2 last:mb-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-50 [&[data-state=open]]:bg-zinc-50">
                  <div className="flex items-center justify-between gap-3 w-full pr-2">
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-zinc-800 leading-none">{sm.idShort}</p>
                      {smDesc && <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-1">{smDesc}</p>}
                    </div>
                    {/* 입력 현황 */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{filled}/{props.length}</span>
                      {isComplete && props.length > 0 && (
                        <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                          완료
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-0">
                  {groups.map((group, gi) => (
                    <div key={gi}>
                      {/* 그룹 레이블 */}
                      {group.label && (
                        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100">
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{group.label}</span>
                        </div>
                      )}
                      {/* key-value 2열 그리드 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-zinc-100">
                        {group.items.map((prop: any, pi: number) => {
                          const isFile = prop.modelType === "File";
                          const val = isFile ? resolveFilePath(prop) : resolveValue(prop);
                          const isImg = isFile && val && isImagePath(val);
                          return (
                            <div
                              key={pi}
                              className="flex items-start gap-3 px-4 py-2.5 border-b border-r border-zinc-100 last:border-r-0"
                            >
                              <span className="text-[11px] text-zinc-400 w-28 shrink-0 pt-0.5 leading-tight truncate">{prop.idShort}</span>
                              {val ? (
                                isImg ? (
                                  <div className="flex-1 min-w-0">
                                    <img
                                      src={val}
                                      alt={prop.idShort}
                                      className="h-16 w-auto max-w-full rounded border border-zinc-200 object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                    <span className="text-[10px] text-zinc-300 font-mono mt-1 block truncate">{val}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-zinc-900 flex-1 min-w-0 leading-snug break-words">{val}</span>
                                )
                              ) : (
                                <span className="text-[11px] text-amber-400 italic flex-1 pt-0.5">미입력</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  })();

  /* ─── View Combined Model dialog ─── */
  const combinedModelDialog = (
    <Dialog open={combinedModalOpen} onOpenChange={setCombinedModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Combined Model</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Model</CardTitle></CardHeader>
            <CardContent className="p-0">
              {Array.isArray(combinedAASTreeData) && (
                <div className="px-4 py-4">
                  <TemplateBlueprint treeData={combinedAASTreeData} showValues />
                </div>
              )}
            </CardContent>
          </Card>
          {Array.isArray(combinedAASConceptDescriptionTreeData) && combinedAASConceptDescriptionTreeData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Concept Descriptions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="px-4 py-4">
                  <TemplateBlueprint treeData={combinedAASConceptDescriptionTreeData} showValues />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ─── Template select dialog ─── */
  /* 템플릿 목록에서 항목 선택 시 미리보기 */
  const handleTemplateItemSelect = async (seq: string) => {
    setModelSeq(seq);
    if (!seq) { setPreviewModel(null); return; }
    setIsPreviewLoading(true);
    try {
      const data = await getModel({ modelSeq: seq, modelType });
      setPreviewModel(data?.[0] ?? null);
    } catch {
      setPreviewModel(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /* OK 클릭 — 선택 확정 */
  const handleTemplateConfirm = async () => {
    if (!modelSeq) return showToast.error("Please select model");
    const model = previewModel ?? (await getModel({ modelSeq, modelType }))?.[0];
    if (!model) return showToast.error("Model not found");

    if (modelType === "aasmodel") {
      const renamedModel = renameKey(model, "metadata", "aasmodel_metadata");
      if (renamedModel.aasmodel_metadata) normalizeMetadataPaths(renamedModel.aasmodel_metadata);
      setAasmodel(renamedModel);
      treeDataRef.current[model.aasmodel_id] = {};
      setInputState((prev) => ({
        ...prev,
        instance_name: prev.instance_name || model.aasmodel_name,
        description: prev.description || model.description,
      }));
    } else {
      const fetchedMetadata = model.metadata;
      const templateSubmodelData = fetchedMetadata.submodels?.[0];
      if (!templateSubmodelData) return showToast.error("Selected submodel data is invalid.");
      const submodelData = _.cloneDeep(templateSubmodelData);
      const newInstanceId = uuidv4();
      submodelData.id = newInstanceId;
      if (submodelData.kind === "Template") submodelData.kind = "Instance";
      submodelData.submodel_seq = model.submodel_seq;
      submodelData.modelType = "Submodel";
      const submodelReference = { type: "ModelReference", keys: [{ type: "Submodel", value: newInstanceId }] };
      setAasmodel((prev) => {
        const newMetadata = _.cloneDeep((prev as any).aasmodel_metadata);
        if (!newMetadata.submodels) newMetadata.submodels = [];
        newMetadata.submodels.push(submodelData);
        newMetadata.assetAdministrationShells[0].submodels.push(submodelReference);
        if (fetchedMetadata.conceptDescriptions) {
          if (!newMetadata.conceptDescriptions) newMetadata.conceptDescriptions = [];
          newMetadata.conceptDescriptions.push(...fetchedMetadata.conceptDescriptions);
        }
        return { ...prev, aasmodel_metadata: newMetadata };
      });
    }
    setModelSeq("");
    setPreviewModel(null);
    setModalOpen(false);
  };

  /* 모델 목록 콤보박스용 데이터 */
  const templateListItems = isFetchingModels
    ? []
    : (models ?? []).map((item: any) => ({
        ...item,
        value: String(item[`${modelType}_seq`]),
        label: item[`${modelType}_name`],
      }));

  /* 선택된 모델의 미리보기 트리 */
  const previewTreeData = useMemo(() => {
    if (!previewModel) return undefined;
    const meta = previewModel.metadata ?? previewModel.aasmodel_metadata;
    if (!meta) return undefined;
    try {
      const valuePaths = addValuePaths({ ...meta });
      return parsingAAS(valuePaths);
    } catch {
      return undefined;
    }
  }, [previewModel]);

  /* 카테고리 ���록 (lv:1 만 표시) */
  const categoryItems = useMemo(() => {
    const list = Array.isArray(categorys) ? categorys : [];
    return list.filter((c: any) => c.lv === 1);
  }, [categorys]);

  const templateSelectDialog = (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) { setModelSeq(""); setPreviewModel(null); }
      }}
    >
      <DialogContent className="max-w-[96vw] sm:max-w-[96vw] w-[96vw] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            {modelType === "aasmodel" ? "AAS" : "Submodel"} Template 선택
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setModalOpen(false); setModelSeq(""); setPreviewModel(null); }}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={!modelSeq} onClick={handleTemplateConfirm}>
              선택 완료
            </Button>
          </div>
        </div>

        {/* ── Body: 왼쪽 패널 + 오른쪽 프리뷰 ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── 왼쪽: 카테고리 탭 + 템플릿 목록 ── */}
          <div className="w-80 shrink-0 border-r flex flex-col bg-muted/5">

            {/* 카테고리 버튼 목록 */}
            <div className="shrink-0 border-b">
              <div className="px-3 pt-3 pb-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Category
                </p>
              </div>
              <div className="px-2 pb-2 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                {/* 전체 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    setModelSeq("");
                    setPreviewModel(null);
                    setSearchState({ category_seq: "all" });
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded text-sm transition-colors",
                    searchState.category_seq === "all"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  전체
                </button>
                {categoryItems.map((cat: any) => (
                  <button
                    key={cat.seq}
                    type="button"
                    onClick={() => {
                      setModelSeq("");
                      setPreviewModel(null);
                      setSearchState({ category_seq: String(cat.seq) });
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded text-sm transition-colors",
                      searchState.category_seq === String(cat.seq)
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-accent text-foreground"
                    )}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* ���플릿 목록 */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="px-3 py-2 shrink-0 flex items-center justify-between border-b bg-muted/10">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Templates
                </p>
                {!isFetchingModels && (
                  <span className="text-[11px] text-muted-foreground">{templateListItems.length}개</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {isFetchingModels ? (
                  <div className="flex items-center justify-center h-24 gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>불러오는 중...</span>
                  </div>
                ) : templateListItems.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                    템플릿이 없습니다.
                  </div>
                ) : (
                  templateListItems.map((item: any) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleTemplateItemSelect(item.value)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b last:border-b-0 text-sm transition-colors",
                        modelSeq === item.value
                          ? "bg-primary/10 border-l-[3px] border-l-primary pl-[9px]"
                          : "hover:bg-accent border-l-[3px] border-l-transparent pl-[9px]"
                      )}
                    >
                      <div className="font-medium leading-snug line-clamp-2 text-[13px]">{item.label}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.category_name && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                            {item.category_name}
                          </Badge>
                        )}
                        {item.version && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                            v{item.version}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 미리보기 패널 ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* 패널 헤더 */}
            <div className="shrink-0 border-b bg-muted/5 px-5 py-2.5 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Structure Preview</span>
              {previewModel && (
                <>
                  <span className="text-muted-foreground/30 text-xs">—</span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {previewModel[`${modelType}_name`] ?? previewModel.aasmodel_name ?? previewModel.submodel_name}
                  </span>
                  {modelSeq && (
                    <span className="ml-auto shrink-0 flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="4.5" fill="#059669" opacity="0.15"/>
                        <path d="M2.5 5l1.8 1.8L7.5 3.5" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      선택됨
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">모델 불러오는 중...</span>
                </div>
              ) : !previewModel ? (
                /* ── empty state ── */
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground select-none px-8">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30">
                      <rect x="4" y="4" width="10" height="10" rx="2"/>
                      <rect x="18" y="4" width="10" height="10" rx="2"/>
                      <rect x="4" y="18" width="10" height="10" rx="2"/>
                      <rect x="18" y="18" width="10" height="10" rx="2"/>
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground/70">구조를 미리 확인하세요</p>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[260px]">
                      왼쪽 목록에서 템플릿을 클릭하면 Submodel 구조와 입력 항목이 여기에 표시됩니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-[11px] text-muted-foreground/40 mt-2">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 opacity-60" />Submodel</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 opacity-60" />Collection</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 opacity-60" />Property</span>
                  </div>
                </div>
              ) : (
                /* ── blueprint ── */
                <div className="p-5 space-y-4">
                  {/* meta info bar */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] leading-snug text-foreground truncate">
                        {previewModel[`${modelType}_name`] ?? previewModel.aasmodel_name ?? previewModel.submodel_name}
                      </h3>
                      {previewModel.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {previewModel.description}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {previewModel.category_name && (
                          <Badge variant="secondary" className="text-[11px] h-5 px-2">{previewModel.category_name}</Badge>
                        )}
                        {previewModel.version && (
                          <Badge variant="outline" className="text-[11px] h-5 px-2 font-mono">v{previewModel.version}</Badge>
                        )}
                        {previewModel.status_nm && (
                          <Badge variant="outline" className="text-[11px] h-5 px-2">{previewModel.status_nm}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blueprint */}
                  {previewTreeData ? (
                    <TemplateBlueprint treeData={previewTreeData} />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">구�� 데이터가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ─── main return ─── */
  return (
    <div>
      {/* Toolbar */}
      <div className="py-4 border-b mb-6">
        <div className="mx-auto max-w-screen-2xl px-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {mode === "create" ? "AAS 인스턴스 생성" : mode === "edit" ? "AAS 인스턴스 수정" : "AAS 인스턴스 상세"}
            </h1>
            <nav className="text-xs text-muted-foreground flex gap-1">
              <Link href="/" className="hover:text-foreground">홈</Link>
              <span>/</span>
              <Link href="/instance" className="hover:text-foreground">인스턴스 목록</Link>
              <span>/</span>
              <span>{mode === "create" ? "생성" : mode === "edit" ? "수정" : "상세"}</span>
            </nav>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/instance">
              <Button variant="outline" size="sm"><List className="size-3.5 mr-1" />목록</Button>
            </Link>
            {mode === "create" && activeStep === 1 && (
              <Button size="sm" onClick={() => { setModalOpen(true); setModelType("aasmodel"); }}>
                <FilePlus className="size-3.5 mr-1" />AAS 템플릿 선택
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-6 py-6">
        {mode === "view" ? (
          <>
            {combinedModelDialog}
            {/* foot buttons for view mode */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => { if (combinedAASTreeData) setCombinedModalOpen(true); }}>
                통합 모델 보기
              </Button>
              {user?.user_seq === instance?.create_user_seq && (
                <>
                  <Link href={ROUTES.INSTANCE.EDIT(instance?.instance_seq)}>
                    <Button variant="outline" size="sm"><Pencil className="size-3.5 mr-1.5" />수정</Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="size-3.5 mr-1.5" />내보내기 <ChevronDown className="size-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {["json", "xml", "aasx"].map((fmt) => (
                        <DropdownMenuItem key={fmt} onClick={() => instance && handleExport(fmt, instance)}>{fmt}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
            {originalForm}
          </>
        ) : (
          <>
            {templateSelectDialog}
            {/* Stepper */}
            <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-5 py-4">
              <StepIndicator active={activeStep} onStepClick={setActiveStep} />
            </div>

            {/* Step content */}
            <div className="space-y-4">
              {/* Step 0: Basic info */}
              {activeStep === 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6">
                  <div className="flex flex-col gap-5 max-w-xl">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-zinc-800">
                        인스턴스 이름 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={inputState.instance_name ?? ""}
                        placeholder="예: 로봇암_라인A_001"
                        onChange={(e) => setInputState((prev) => ({ ...prev, instance_name: e.target.value }))}
                      />
                      <p className="text-[11px] text-zinc-400">이 AAS 인스턴스를 구분할 고유한 이름을 입력하세요.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-zinc-800">설명</label>
                      <Input
                        value={inputState.description ?? ""}
                        placeholder="예: A라인 1번 로봇암 — 2024년 도입"
                        onChange={(e) => setInputState((prev) => ({ ...prev, description: e.target.value }))}
                      />
                      <p className="text-[11px] text-zinc-400">이 인스턴스가 어떤 자산을 나타내는지 간단히 설명하세요. (선택)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Detailed settings — template select + tree + details */}
              {activeStep === 1 && (
                <>
                  {/* ── 템플릿 미선택 상태: 큰 CTA 카드 ── */}
                  {!Array.isArray(treeData) ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-20 gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <FilePlus className="size-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-lg">AAS 템플릿을 선택하세요</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            템플릿을 선택하면 트리 구조가 표시되고 각 항목의 값을 입력할 수 있습니다.
                          </p>
                        </div>
                        <Button size="sm" onClick={() => { setModalOpen(true); setModelType("aasmodel"); }}>
                          <FilePlus className="size-3.5 mr-1.5" />AAS 템플릿 선택
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      {/* ── 상단 정보 바 ── */}
                      <Card>
                        <CardContent className="py-2 px-4 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                              <FilePlus className="size-4 shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {mode === "create" ? (aasmodel as any).aasmodel_name : instance?.aasmodel_name}
                              </span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <Badge variant="secondary" className="font-mono text-[10px]">{treeData[0].id}</Badge>
                            {(aasmodel as any).version && <Badge variant="outline">v{mode === "create" ? (aasmodel as any).version : instance?.aasmodel_version}</Badge>}
                            {(aasmodel as any).status && <Badge variant="outline">{mode === "create" ? (aasmodel as any).status : instance?.status}</Badge>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <AASTreeModal
                              treeData={treeData}
                              treeDataRefCurrent={treeDataRef.current[treeData?.[0]?.id]}
                              metadata={(aasmodel as any).aasmodel_metadata}
                              setMetaData={(metadata) => setAasmodel((prev) => ({ ...prev, aasmodel_metadata: metadata }))}
                              mode={mode}
                            />
                            {mode === "create" && (
                              <Button variant="destructive" size="sm" onClick={removeAASModel}>
                                <Trash2 className="size-3.5 mr-1.5" />템플릿 변경
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* ── 탭 + 콘텐츠 ── */}
                      <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="flex flex-col w-full">
                        <div className="border-b border-border">
                          <TabsList className="h-10 bg-transparent p-0 gap-0 rounded-none">
                            <TabsTrigger
                              value="aasTree"
                              className="h-10 rounded-none px-5 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                              데이터 입력
                            </TabsTrigger>
                            <TabsTrigger
                              value="cdTree"
                              className="h-10 rounded-none px-5 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                            >
                              개념 사전
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        {/* AAS Tree 탭 */}
                        <TabsContent value="aasTree" className="mt-0">
                          <div className="h-[calc(100vh-320px)] min-h-[600px]">
                            {showAdvancedTree ? (
                              /* ── Advanced: 기존 트리 + Details 2분할 ── */
                              <div className="flex gap-3 h-full">
                                <div className="w-[380px] shrink-0 flex flex-col">
                                  <Card className="flex flex-col flex-1 overflow-hidden">
                                    <CardHeader className="flex-row items-center justify-between pb-2 shrink-0 px-4 py-3 border-b">
                                      <CardTitle className="text-sm font-semibold text-primary">AAS Tree</CardTitle>
                                      <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => { setModalOpen(true); setModelType("submodel"); }}>
                                          <Plus className="size-3.5 mr-1" />Submodel 추가
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowAdvancedTree(false)} className="text-xs text-muted-foreground">
                                          Simple view
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto p-2">
                                      <AASTree
                                        mb="sm"
                                        data={treeData}
                                        treeDataRefCurrent={treeDataRef.current[treeData[0].id]}
                                        editMode={mode !== "view"}
                                        onNodeClick={(node) => setSelectedNode({ node, rootId: treeData[0].id })}
                                        simpleView={true}
                                        onAdd={handleAddElement}
                                        onDelete={handleDeleteElement}
                                      />
                                    </CardContent>
                                  </Card>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <Card className="flex flex-col flex-1 overflow-hidden">
                                    <CardHeader className="flex-row items-center justify-between shrink-0 px-4 py-3 border-b">
                                      <div className="min-w-0">
                                        <CardTitle className="text-sm font-semibold">
                                          {selectedNode ? (
                                            <span className="flex items-center gap-2">
                                              <span>Details</span>
                                              <Badge variant="secondary" className="font-mono text-xs font-normal truncate max-w-[260px]">
                                                {selectedNode.node.idShort}
                                              </Badge>
                                            </span>
                                          ) : "Details"}
                                        </CardTitle>
                                        {!selectedNode && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            왼쪽 트리에서 항목을 클릭하면 여기서 값을 입력할 수 있습니다.
                                          </p>
                                        )}
                                      </div>
                                      {selectedNode && (
                                        <div className="flex gap-2 shrink-0">
                                          <Button size="sm" onClick={handleDetailSave}>저장</Button>
                                          <Button size="sm" variant="destructive" onClick={handleDelete}
                                            disabled={selectedNode.node.modelType !== "Submodel"}>
                                            삭제
                                          </Button>
                                        </div>
                                      )}
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto p-4 aas-details-panel">
                                      {selectedNode ? (
                                        <RenderObject
                                          obj={selectedNode.node}
                                          state={treeDataRef.current[selectedNode.rootId] ?? {}}
                                          onValueChange={handleDetailChange}
                                          editMode={mode !== "view"}
                                          isInstance={!!instance}
                                          instanceSeq={instance?.instance_seq}
                                        />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                                          <p className="text-sm font-medium">항목을 선택하세요</p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            ) : (
                              /* ── Form-first: SubmodelFormEditor ── */
                              <SubmodelFormEditor
                                treeData={treeData}
                                state={formEditorState}
                                editMode={mode !== "view"}
                                conceptDescriptions={(aasmodel as any).aasmodel_metadata?.conceptDescriptions ?? []}
                                onValueChange={(path, value, file) => {
                                  const rootId = treeData[0]?.id;
                                  if (!treeDataRef.current[rootId]) treeDataRef.current[rootId] = {};
                                  if (file) {
                                    treeDataRef.current[rootId][path] = file;
                                    treeDataRef.current[rootId][`${path.substring(0, path.lastIndexOf("."))}.value`] = value;
                                  } else {
                                    treeDataRef.current[rootId][path] = value;
                                    if (path.endsWith(".originalValue")) {
                                      treeDataRef.current[rootId][path.replace(/\.originalValue$/, ".value")] = value;
                                    }
                                  }
                                  // reactive update so SubmodelFormEditor re-renders with new value
                                  setFormEditorState((prev) => ({ ...prev, [path]: value }));
                                }}
                                onSave={handleFormEditorSave}
                                onToggleAdvanced={() => setShowAdvancedTree(true)}
                                showAdvanced={showAdvancedTree}
                              />
                            )}
                          </div>
                        </TabsContent>

                        {/* CD Tree 탭 */}
                        <TabsContent value="cdTree" className="mt-0">
                          <div className="h-[calc(100vh-320px)] min-h-[600px] border border-zinc-200 rounded-xl overflow-hidden bg-white">
                            <ConceptDescriptionPanel
                              conceptDescriptionTreeData={conceptDescriptionTreeData}
                              editMode={mode !== "view"}
                              onAdd={() => handleAddConceptDescription(null, "ConceptDescription", "NewConceptDescription")}
                              onDelete={handleDeleteConceptDescription}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Preview */}
              {activeStep === 2 && originalForm}

              {/* Step 3: Verification */}
              {activeStep === 3 && (
                <div className="flex flex-col gap-4">
                  {/* 실행 패널 */}
                  <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-900">AAS 검증</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">AAS 구조와 데이터의 유효성을 검사합니다. 검증 후 결과를 항목별로 확인하세요.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {inputState.verification && verificationBadge(inputState.verification)}
                      <Button size="sm" disabled={loading} onClick={verifyInstance}>
                        <ShieldCheck className="size-4 mr-2" />검증 실행
                      </Button>
                    </div>
                  </div>

                  {/* 결과 없음 상태 */}
                  {!inputState.verification && !verificationRef.current && (
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center py-16 gap-2">
                      <ShieldCheck className="size-8 text-zinc-300" />
                      <p className="text-sm text-zinc-400">검증 실행 버튼을 눌러 검증을 시작하세요.</p>
                    </div>
                  )}

                  {/* 성공 상태 */}
                  {inputState.verification === "success" && !verificationRef.current && (
                    <div className="rounded-lg border border-green-200 bg-green-50 flex flex-col items-center justify-center py-12 gap-2">
                      <CheckCircle2 className="size-8 text-green-500" />
                      <p className="text-sm font-semibold text-green-700">모든 검증을 통과했습니다.</p>
                      {inputState.verification_log && (
                        <p className="text-xs text-green-500">
                          총 {inputState.verification_log.total}개 · 성공 {inputState.verification_log.success}개
                        </p>
                      )}
                    </div>
                  )}

                  {/* 상세 결과 (fail) */}
                  <VerifyDetailView
                    verificationRef={verificationRef}
                    verificationActive={verificationActive}
                    setVerificationActive={setVerificationActive}
                  />
                </div>
              )}

              {/* Step 4: Complete */}
              {activeStep === 4 && (
                <div className="flex flex-col gap-3">
                  {/* 검증 상태 안내 */}
                  {inputState.verification === "success" && (
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-700">검증을 통과했습니다.</p>
                        <p className="text-xs text-green-600 mt-0.5">AAS 구조와 데이터가 모두 유효합니다. 저장 후 배포할 수 있습니다.</p>
                      </div>
                    </div>
                  )}
                  {inputState.verification === "fail" && (
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <ShieldCheck className="size-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700">검증이 실패했습니다.</p>
                        <p className="text-xs text-amber-600 mt-0.5">검증 실패 상태로도 저장할 수 있습니다. 저장 후 3단계로 돌아가 검증을 다시 실행하거나, 2단계에서 데이터를 수정할 수 있습니다.</p>
                      </div>
                    </div>
                  )}
                  {!inputState.verification && (
                    <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <ShieldCheck className="size-5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-600">검증을 실행하지 않았습니다.</p>
                        <p className="text-xs text-zinc-400 mt-0.5">검증 없이도 저장할 수 있습니다. 3단계로 돌아가 검증을 먼저 실행하는 것을 권장합니다.</p>
                      </div>
                    </div>
                  )}

                  {/* 저장 패널 */}
                  <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {mode === "create" ? "인스턴스 생성" : "변경 사항 저장"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {mode === "create"
                          ? "저장하면 AAS 인스턴스가 생성되고 목록에 등록됩니다."
                          : "저장하면 변경 사항이 즉시 반영됩니다."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {mode === "edit" && (
                        <Button variant="destructive" size="sm" disabled={loading} onClick={async () => {
                          const isConfirm = await confirmSave("정말 삭제하시겠습니까?", { labels: { confirm: "삭제", cancel: "취소" }, confirmProps: { color: "red.8" } });
                          if (isConfirm) { await deleteModel({ modelType: "instance", modelSeq: instance?.instance_seq }); router.replace(ROUTES.INSTANCE.LIST); }
                        }}>
                          <Trash2 className="size-3.5 mr-1" />삭제
                        </Button>
                      )}
                      {((mode === "create" && (user?.user_group_seq === UserRole.User || user?.user_group_seq === UserRole.Manager)) ||
                        (mode === "edit" && (user?.user_group_seq === UserRole.Manager || user?.user_seq === instance?.create_user_seq))) && (
                        <Button disabled={loading} onClick={() => handleSubmit()}>
                          <Save className="size-3.5 mr-1" />{mode === "create" ? "저장하고 생성" : "저장"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="sticky bottom-0 z-10 mt-6 border-t border-zinc-200 bg-white/95 backdrop-blur-sm px-0 py-3">
              <div className="flex items-center justify-between gap-3">
                {/* 왼쪽: 단계 표시 */}
                <p className="text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-700">{activeStep + 1} / {STEPS.length}</span>
                  {" "}— {STEPS[activeStep]?.label}
                </p>
                {/* 오른쪽: 버튼 */}
                <div className="flex items-center gap-2">
                  <CancelButton />
                  {activeStep > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setActiveStep(activeStep - 1)}>
                      이전
                    </Button>
                  )}
                  {activeStep < STEPS.length - 1 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (activeStep === 0 && !inputState.instance_name) return showToast.error("인스턴스 이름을 입력해주세요.");
                        if (activeStep === 1 && !Array.isArray(treeData)) return showToast.error("AAS 템플릿을 선택해주세요.");
                        setActiveStep(activeStep + 1);
                      }}
                    >
                      다음 단계
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
