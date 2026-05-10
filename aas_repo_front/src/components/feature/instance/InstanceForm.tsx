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
import CategoryCombobox from "@/components/CategoryCombobox";
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
import BarChart from "@/components/BarChart";
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
import { ChevronDown, List, FilePlus, Plus, Trash2, ShieldCheck, Save, Pencil } from "lucide-react";
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
  { label: "기본정보 입력", desc: "Basic Information" },
  { label: "세부 설정", desc: "Detailed Settings" },
  { label: "미리보기", desc: "Preview" },
  { label: "검증", desc: "Validation" },
  { label: "완료", desc: "Complete" },
];

function StepIndicator({
  active,
  onStepClick,
}: {
  active: number;
  onStepClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <React.Fragment key={i}>
            <button
              onClick={() => onStepClick(i)}
              className={cn(
                "flex flex-col items-center min-w-[80px] px-2 py-1 rounded transition-colors",
                current && "text-primary",
                done && "text-muted-foreground",
                !current && !done && "text-muted-foreground/50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 mb-1",
                  current && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary bg-primary/10 text-primary",
                  !current && !done && "border-border bg-muted text-muted-foreground"
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {step.label}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                {step.desc}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 min-w-[16px]",
                  i < active ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
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
  const [modalOpen, setModalOpen] = useState(false);
  const [combinedModalOpen, setCombinedModalOpen] = useState(false);

  const treeDataRef = useRef<any>({});

  const [modelType, setModelType] = useState("");
  const [modelSeq, setModelSeq] = useState("");
  const [aasmodel, setAasmodel] = useState(initialState.aasmodel);
  const [treeData, setTreeData] = useState<any[] | undefined>(undefined);

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
    if (!(await confirmSave("Do you want to Save?"))) return;
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
      if (!(await confirmSave("Validation has failed. Would you like to continue anyway?"))) return;
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
                <div className="p-2">
                  <AASTree data={[cn]} editMode={false} mb="sm" />
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
  const originalForm = (
    <div key={mode === "view" ? instance?.instance_seq : "create-preview"}>
      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 sm:flex-nowrap">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted relative">
                <img src="/assets/media/aas/aas_blank.jpg" alt="Instance" className="object-cover w-full h-full" />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {mode === "view" ? instance?.instance_name : inputState.instance_name}
                  </h2>
                  {Array.isArray(treeData) && treeData.length > 0 && (
                    <p className="text-sm text-muted-foreground font-mono">{treeData[0].id}</p>
                  )}
                </div>
                {mode === "view" && user?.user_seq === instance?.create_user_seq && (
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
                        Export <ChevronDown className="size-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {["json", "xml", "aasx"].map((fmt) => (
                          <DropdownMenuItem key={fmt} onClick={() => instance && handleExport(fmt, instance)}>
                            {fmt}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href={ROUTES.INSTANCE.EDIT(instance?.instance_seq)}>
                      <Button size="sm"><Pencil className="size-3 mr-1" />Edit</Button>
                    </Link>
                  </div>
                )}
              </div>
              {/* Stats row */}
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { label: "Category", value: mode === "view" ? instance?.category_name : (aasmodel as any)?.category_name },
                  { label: "Verification", value: verificationBadge(mode === "view" ? instance?.verification : inputState.verification) },
                  { label: "Version", value: mode === "view" ? instance?.aasmodel_version : (aasmodel as any)?.version },
                  { label: "Instance seq", value: mode === "view" ? instance?.instance_seq : "(auto)" },
                  { label: "Create Date", value: mode === "view" && instance?.create_date ? new Intl.DateTimeFormat("ko-KR").format(new Date(instance.create_date)) : "N/A" },
                  { label: "Last Update", value: mode === "view" && instance?.last_mod_date ? new Intl.DateTimeFormat("ko-KR").format(new Date(instance.last_mod_date)) : "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-dashed rounded px-4 py-2 min-w-[120px]">
                    <div className="font-semibold text-sm">{value ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Nav Tabs */}
          <div className="flex gap-6 border-b mt-4 pt-2">
            {[
              { key: "templateInfo", label: "AAS Instance info" },
              { key: "submodel", label: "Submodel" },
              { key: "treeView", label: "Tree view" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab: Instance info */}
      {activeTab === "templateInfo" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Instance info</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><th className="text-left text-muted-foreground py-1.5 pr-4 font-medium">Asset Kind</th><td className="py-1.5 font-medium text-primary">{treeData?.[0]?.AssetAdministrationShell?.assetInformation?.assetKind}</td></tr>
                  <tr className="border-b"><th className="text-left text-muted-foreground py-1.5 pr-4 font-medium">Global Asset ID</th><td className="py-1.5 font-medium text-primary font-mono text-xs break-all">{treeData?.[0]?.id}</td></tr>
                  <tr><th className="text-left text-muted-foreground py-1.5 pr-4 font-medium align-top">Reference Submodel</th>
                    <td className="py-1.5">
                      <ul className="space-y-1">
                        {treeData?.[0]?.children?.filter((c: any) => c.modelType === "Submodel").map((sm: any, i: number) => (
                          <li key={i} className="text-primary font-medium">{sm.idShort || `Submodel ${i + 1}`}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {mode === "view" ? instance?.description : inputState.description}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Components</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(componentCounts).length > 0
                ? <BarChart data={chartData} />
                : <p className="text-sm text-muted-foreground">No components to display.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Submodel */}
      {activeTab === "submodel" && (() => {
        const aasNode = treeData?.[0];
        if (!aasNode?.children) return <Card><CardContent className="pt-6 text-center text-muted-foreground">AAS Template not loaded.</CardContent></Card>;
        const submodelTreeNodes = aasNode.children.filter((c: any) => c.modelType === "Submodel");
        return (
          <Card>
            <CardHeader><CardTitle>Submodels</CardTitle></CardHeader>
            <CardContent>
              {submodelTreeNodes.length > 0 ? (
                <Accordion type="multiple" className="space-y-2">
                  {submodelTreeNodes.map((smNode: any, i: number) => (
                    <AccordionItem key={`${smNode.idShort || "submodel"}-${i}`} value={smNode.idShort || `submodel-${i}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="font-medium">{smNode.idShort || "Submodel"}</AccordionTrigger>
                      <AccordionContent>{renderSubmodelPanel(smNode, i)}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No submodels found.</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Tab: Tree view */}
      {activeTab === "treeView" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>AAS Tree View</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(treeData) && <AASTree data={treeData} editMode={false} isInstance={!!instance} instanceSeq={instance?.instance_seq} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>ConceptDescription Tree View</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(conceptDescriptionTreeData) && <AASTree data={conceptDescriptionTreeData} editMode={false} />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  /* ─── View Combined Model dialog ─── */
  const combinedModelDialog = (
    <Dialog open={combinedModalOpen} onOpenChange={setCombinedModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Combined Model</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Model</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(combinedAASTreeData) && <AASTree mb="sm" data={combinedAASTreeData} editMode={false} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>ConceptDescription</CardTitle></CardHeader>
            <CardContent>
              {Array.isArray(combinedAASConceptDescriptionTreeData) && <AASTree mb="sm" data={combinedAASConceptDescriptionTreeData} editMode={false} />}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  /* ─── Template select dialog ─── */
  const templateSelectDialog = (
    <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) setModelSeq(""); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{modelType === "aasmodel" ? "AAS" : "Submodel"} Template 선택</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Template 목록</label>
            <div className="mb-3">
              <CategoryCombobox
                code={modelType === "aasmodel" ? "aas_category" : "sm_category"}
                value={searchState.category_seq}
                setValue={(value) => setSearchState((prev) => ({ ...prev, category_seq: value ?? "all" }))}
              />
            </div>
            <CustomCombobox
              className="form-control form-control-solid border-0 flex-grow-1"
              data={isFetchingModels ? [] : models?.map((item: any) => ({ ...item, value: String(item[`${modelType}_seq`]), label: item[`${modelType}_name`] }))}
              value={modelSeq}
              onChange={(value: string) => setModelSeq(value)}
              renderComboboxOptionItem={(item: any) => (
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{item.category_name}</Badge>
                  <Badge variant="outline">{item[`${modelType}_name`]}</Badge>
                  <Badge variant="outline">{item.version}</Badge>
                </div>
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); setModelSeq(""); }}>Cancel</Button>
            <Button onClick={async () => {
              if (!modelSeq) return showToast.error("Please select model");
              const data = await getModel({ modelSeq, modelType });
              const model = data[0];
              if (modelType === "aasmodel") {
                const renamedModel = renameKey(model, "metadata", "aasmodel_metadata");
                if (renamedModel.aasmodel_metadata) normalizeMetadataPaths(renamedModel.aasmodel_metadata);
                setAasmodel(renamedModel);
                treeDataRef.current[model.aasmodel_id] = {};
                setInputState((prev) => ({ ...prev, instance_name: prev.instance_name || model.aasmodel_name, description: prev.description || model.description }));
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
              setModalOpen(false);
            }}>Ok</Button>
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
        <div className="container-xxl mx-auto px-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              My AAS Instance — {mode === "create" ? "Create" : mode.toUpperCase()}
            </h1>
            <nav className="text-xs text-muted-foreground flex gap-1">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <span>My AAS Instance — {mode === "create" ? "Create" : mode.toUpperCase()}</span>
            </nav>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/instance">
              <Button variant="outline" size="sm"><List className="size-3.5 mr-1" />List</Button>
            </Link>
            {mode === "create" && activeStep === 1 && (
              <Button size="sm" onClick={() => { setModalOpen(true); setModelType("aasmodel"); }}>
                <FilePlus className="size-3.5 mr-1" />Select AAS Template
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container-xxl mx-auto px-4">
        {mode === "view" ? (
          <>
            {combinedModelDialog}
            {/* foot buttons for view mode */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => { if (combinedAASTreeData) setCombinedModalOpen(true); }}>
                View Combined Model
              </Button>
              {user?.user_seq === instance?.create_user_seq && (
                <>
                  <Link href={ROUTES.INSTANCE.EDIT(instance?.instance_seq)}>
                    <Button variant="outline" size="sm"><Pencil className="size-3 mr-1" />Edit</Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground">
                      Export <ChevronDown className="size-3" />
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
            <Card className="mb-6 p-4">
              <StepIndicator active={activeStep} onStepClick={setActiveStep} />
            </Card>

            {/* Step content */}
            <div className="space-y-4">
              {/* Step 0: Basic info */}
              {activeStep === 0 && (
                <Card>
                  <CardHeader><CardTitle>Instance info</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-semibold">Instance name <span className="text-destructive">*</span></label>
                      <Input value={inputState.instance_name ?? ""} placeholder="Please enter" onChange={(e) => setInputState((prev) => ({ ...prev, instance_name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                      <label className="text-sm font-semibold">Description</label>
                      <Input value={inputState.description ?? ""} placeholder="Please enter" onChange={(e) => setInputState((prev) => ({ ...prev, description: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 1: Detailed settings */}
              {activeStep === 1 && (
                <>
                  <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="text-primary">
                        {Array.isArray(treeData) ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <AASTreeModal
                              treeData={treeData}
                              treeDataRefCurrent={treeDataRef.current[treeData?.[0]?.id]}
                              metadata={(aasmodel as any).aasmodel_metadata}
                              setMetaData={(metadata) => setAasmodel((prev) => ({ ...prev, aasmodel_metadata: metadata }))}
                              mode={mode}
                            />
                            <Badge variant="secondary" className="font-mono text-xs">{treeData[0].id}</Badge>
                            <Separator orientation="vertical" className="h-4" />
                            <Badge variant="outline">{(aasmodel as any).aasmodel_seq}</Badge>
                            <Badge variant="outline">{mode === "create" ? (aasmodel as any).aasmodel_name : instance?.aasmodel_name}</Badge>
                            <Badge variant="outline">v{mode === "create" ? (aasmodel as any).version : instance?.aasmodel_version}</Badge>
                            <Badge variant="outline">{mode === "create" ? (aasmodel as any).status : instance?.status}</Badge>
                          </div>
                        ) : "AAS Template info"}
                      </CardTitle>
                      {!Array.isArray(treeData) ? (
                        <Button size="sm" onClick={() => { setModalOpen(true); setModelType("aasmodel"); }}>
                          <FilePlus className="size-3.5 mr-1" />Select AAS Template
                        </Button>
                      ) : mode === "create" && (
                        <Button variant="destructive" size="sm" onClick={removeAASModel}>
                          <Trash2 className="size-3.5 mr-1" />Remove
                        </Button>
                      )}
                    </CardHeader>
                  </Card>

                  {Array.isArray(treeData) && (
                    <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
                      <TabsList>
                        <TabsTrigger value="aasTree">AAS Tree</TabsTrigger>
                        <TabsTrigger value="cdTree">CD Tree</TabsTrigger>
                      </TabsList>

                      {/* AAS Tree tab */}
                      <TabsContent value="aasTree">
                        <div className="flex gap-4">
                          <div className="flex-1" style={{ flexBasis: "40%", minWidth: "40%" }}>
                            <Card>
                              <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-primary">AAS Tree</CardTitle>
                                <Button size="sm" onClick={() => { setModalOpen(true); setModelType("submodel"); }}>
                                  <Plus className="size-3.5 mr-1" />Add Submodel
                                </Button>
                              </CardHeader>
                              <CardContent>
                                <AASTree style={{ maxHeight: "80vh", overflow: "scroll" }} mb="sm" data={treeData}
                                  treeDataRefCurrent={treeDataRef.current[treeData[0].id]}
                                  editMode={mode !== "view"}
                                  onNodeClick={(node) => setSelectedNode({ node, rootId: treeData[0].id })}
                                  simpleView={true} onAdd={handleAddElement} onDelete={handleDeleteElement} />
                              </CardContent>
                            </Card>
                          </div>
                          <div className="flex-1" style={{ flexBasis: "60%" }}>
                            <Card className="h-full">
                              <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle>Details{selectedNode ? ` — ${selectedNode.node.idShort}` : ""}</CardTitle>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleDetailSave} disabled={!selectedNode}>Save</Button>
                                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={!selectedNode || selectedNode.node.modelType !== "Submodel"}>Delete</Button>
                                </div>
                              </CardHeader>
                              <CardContent style={{ minHeight: "80vh" }}>
                                {selectedNode ? (
                                  <RenderObject obj={selectedNode.node} state={treeDataRef.current[selectedNode.rootId] ?? {}}
                                    onValueChange={handleDetailChange} editMode={mode !== "view"} isInstance={!!instance} instanceSeq={instance?.instance_seq} />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <span className="text-muted-foreground text-sm">Select an item from the tree to see details.</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>

                      {/* CD Tree tab */}
                      <TabsContent value="cdTree">
                        <div className="flex gap-4">
                          <div className="flex-1" style={{ flexBasis: "40%", minWidth: "40%" }}>
                            <Card>
                              <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-primary">CD Tree</CardTitle>
                                {mode !== "view" && (
                                  <Button size="sm" onClick={() => handleAddConceptDescription(null, "ConceptDescription", "NewConceptDescription")}>
                                    <Plus className="size-3.5 mr-1" />Add CD
                                  </Button>
                                )}
                              </CardHeader>
                              <CardContent>
                                {Array.isArray(conceptDescriptionTreeData) && (
                                  <AASTree style={{ maxHeight: "80vh", overflow: "scroll" }} mb="sm" data={conceptDescriptionTreeData}
                                    editMode={mode !== "view"} simpleView={true}
                                    onNodeClick={(node) => { if (node.modelType !== "ConceptDescriptions") setSelectedCDNode(node); else setSelectedCDNode(null); }}
                                    onAdd={handleAddConceptDescription} onDelete={handleDeleteConceptDescription} />
                                )}
                              </CardContent>
                            </Card>
                          </div>
                          <div className="flex-1" style={{ flexBasis: "60%" }}>
                            <Card className="h-full">
                              <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle>Details{selectedCDNode ? ` — ${selectedCDNode.idShort}` : ""}</CardTitle>
                                <Button size="sm" onClick={handleCDDetailSave} disabled={!selectedCDNode}>Save</Button>
                              </CardHeader>
                              <CardContent style={{ minHeight: "80vh" }}>
                                {selectedCDNode ? (
                                  <RenderObject obj={{ idShort: selectedCDNode.idShort, id: selectedCDNode.id, description: selectedCDNode.description }}
                                    state={treeDataRef.current["conceptDescriptions"] ?? {}}
                                    onValueChange={(path, value) => {
                                      if (!treeDataRef.current["conceptDescriptions"]) treeDataRef.current["conceptDescriptions"] = {};
                                      const cdIndex = ((aasmodel as any).aasmodel_metadata?.conceptDescriptions || []).findIndex((cd: any) => cd.id === selectedCDNode.id);
                                      if (cdIndex === -1) return;
                                      treeDataRef.current["conceptDescriptions"][`[${cdIndex}].${path}`] = value;
                                      setSelectedCDNode((prev: any) => prev ? { ...prev } : null);
                                    }}
                                    editMode={mode !== "view"} />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <span className="text-muted-foreground text-sm">Select an item from the tree to see details.</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </>
              )}

              {/* Step 2: Preview */}
              {activeStep === 2 && originalForm}

              {/* Step 3: Verification */}
              {activeStep === 3 && (
                <Card>
                  <CardHeader><CardTitle>Verification</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <Button size="lg" disabled={loading} onClick={verifyInstance}>
                      <ShieldCheck className="size-4 mr-2" />Run Verification
                    </Button>
                    {inputState.verification && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Verification Status:</span>
                        {verificationBadge(inputState.verification)}
                      </div>
                    )}
                    <VerifyDetailView verificationRef={verificationRef} verificationActive={verificationActive} setVerificationActive={setVerificationActive} />
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Complete */}
              {activeStep === 4 && (
                <Card>
                  <CardHeader><CardTitle>Complete</CardTitle></CardHeader>
                  <CardContent className="text-center space-y-3">
                    <p className="text-base">You have completed all the steps.</p>
                    <p className="text-sm text-muted-foreground mb-4">Click the button below to finalize your instance.</p>
                    <div className="flex justify-center gap-2">
                      {((mode === "create" && (user?.user_group_seq === UserRole.User || user?.user_group_seq === UserRole.Manager)) ||
                        (mode === "edit" && (user?.user_group_seq === UserRole.Manager || user?.user_seq === instance?.create_user_seq))) && (
                        <Button disabled={loading} onClick={() => handleSubmit()}>
                          <Save className="size-3.5 mr-1" />{mode === "create" ? "Create" : "Save"}
                        </Button>
                      )}
                      {mode === "edit" && (
                        <Button variant="destructive" disabled={loading} onClick={async () => {
                          const isConfirm = await confirmSave("Are you sure you want to delete it?", { labels: { confirm: "Delete", cancel: "Cancel" }, confirmProps: { color: "red.8" } });
                          if (isConfirm) { await deleteModel({ modelType: "instance", modelSeq: instance?.instance_seq }); router.replace(ROUTES.INSTANCE.LIST); }
                        }}>
                          <Trash2 className="size-3.5 mr-1" />Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer nav */}
            <Card className="mt-6">
              <CardContent className="flex justify-end gap-2 py-4">
                <CancelButton />
                {activeStep > 0 && (
                  <Button variant="outline" onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
                )}
                {activeStep < 4 && (
                  <Button onClick={() => {
                    if (activeStep === 0 && !inputState.instance_name) return showToast.error("Please enter an instance name.");
                    if (activeStep === 1 && !Array.isArray(treeData)) return showToast.error("Please select an AAS Template.");
                    setActiveStep(activeStep + 1);
                  }}>Next</Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
