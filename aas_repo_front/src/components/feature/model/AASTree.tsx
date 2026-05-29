// @ts-nocheck
"use client";
import React, { useMemo, useState, memo, useEffect, useRef } from "react";
import {
  Accordion,
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  JsonInput,
  List,
  Text,
  TextInput,
  NumberInput,
  FileInput,
  ThemeIcon,
  Title,
  Tree,
  useTree,
  Highlight,
  HoverCard,
  getTreeExpandedState,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { confirmSave } from "@/utils/modal";
import treeNodeClass from "@/css/treeNode.module.css";
import { showToast } from "@/utils/toast";
import ElementAdd from "../instance/ElementAdd";
import FilePreviewModal from "../instance/FilePreviewModal";
import { useDisclosure } from "@mantine/hooks";
import { size } from "lodash";

const PREVIEW_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif"];

// RenderObject: 재귀적으로 객체 내부의 속성을 렌더링합니다.
// editMode가 true이면 TextInput으로 입력 가능, false이면 단순 Text로 보여줍니다.
export const RenderObject = memo(
  ({
    obj,
    indent = 0,
    state,
    onValueChange,
    editMode,
    isInstance,
    instanceSeq,
  }: {
    obj: any;
    indent?: number;
    state: any;
    editMode: boolean;
    onValueChange?: (key: string, value: any, file?: File | undefined) => void;
    isInstance?: boolean;
    instanceSeq?: string;
  }) => {

    // semanticId 필드의 접힘/펼침 상태를 관리 (기본값: false, 접힌 상태)
    const [isSemanticIdExpanded, setIsSemanticIdExpanded] = useState(false);

    // description 필드의 접힘/펼침 상태 추가
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; type: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const getCorrectedUrl = (url: string) => {
      if (!url) return url;
      if (isProduction && url.startsWith('/aas_files')) {
        return `/api${url}`;
      }
      return url;
    };


    const [innerState, setInnerState] = useState(state);

    // WORKAROUND: Handle flawed data structure from aas.js
    //const modelType = obj.modelType;
    const modelType = obj.modelType ?? (obj.assetInformation ? "AssetAdministrationShell" : undefined);
    const renderableObj =
      modelType && obj[modelType] ? { ...obj, ...obj[modelType] } : obj;

    useEffect(() => {
      setInnerState({ ...state });
    }, [obj, state]);

    const allowedKeysMap = {
      AssetAdministrationShell: [
        "idShort",
        "id",
        "description",
        "version",
        "assetInformation",
        "submodels",
      ],
      Submodel: ["idShort", "description", "kind", "semanticId"],
      // originalValue는 자식 노드 배열이므로 상세 뷰에서 제외하고,
      // SMC/SML 자체의 속성인 description, semanticId를 표시하도록 변경합니다.
      SubmodelElementCollection: ["idShort", "description", "semanticId"],
      SubmodelElementList: ["idShort", "description", "semanticId"],
      Property: ["idShort", "description", "semanticId", "valueType", "originalValue"],
      MultiLanguageProperty: ["idShort", "description", "semanticId", "valueType", "originalValue"],
      Range: ["idShort", "description", "semanticId", "valueType", "min", "max"],
      // File: ["idShort", "description", "semanticId", "contentType", "originalValue"],
      File: ["idShort", "description", "semanticId", "contentType", "originalValue"],
      ReferenceElement: ["idShort", "description", "semanticId", "originalValue"],

      Entity: ["idShort", "description", "entityType", "globalAssetId", "statements"],
      // Relationship (BoM)
      RelationshipElement: ["idShort", "description", "first", "second", "originalValue"],

      // ConceptDescription 상세 뷰에 표시할 키
      ConceptDescription: [
        "idShort",
        "id",
        "description",
        "isCaseOf",
        "embeddedDataSpecifications",
      ],
    };

    // Use the modelType from the original object for key lookup
    const keysToShow =
      modelType && allowedKeysMap[modelType] ? allowedKeysMap[modelType] : null;

    // Use the corrected renderableObj to get the entries
    let allEntries = Object.entries(renderableObj);

    const filteredEntries = keysToShow
      ? allEntries.filter(([k]) => keysToShow.includes(k))
      : allEntries;

    return (
      <div
        style={{
          paddingLeft: `calc(2rem * ${indent})`,
          whiteSpace: "pre-wrap",
        }}
      >
        {filteredEntries
          .filter(([k, v]) => {
            // valuePath는 항상 숨깁니다.
            if (k === "valuePath") return false;

            // 그 외 기본 필터링 조건
            return (
              k !== "children" &&
              k !== "label" &&
              k !== "modelType" &&
              k !== "AssetAdministrationShell" &&
              // Submodel의 value는 submodelElements를 가리키는 배열이므로, 상세 보기에서 혼동을 주지 않기 위해 제외합니다.
              !(obj.modelType === "Submodel" && k === "value") &&
              k !== "Submodel"
            );
          })
          // .sort() 라인을 대체합니다
          .sort((a, b) => {
            // 필드 순서를 직접 정의합니다.
            const fieldOrder = [
              "originalValue",
              "idShort",
              "valueType",
              "id",
              
              //"value",
              
              "min",
              "max",
              "contentType",
              "entityType",
              "globalAssetId",
              "kind",
              "semanticId",
              "description",
              // --- 기타 필드 (순서대로 추가) ---
              "isCaseOf",
              "embeddedDataSpecifications",
              "assetInformation",
              "statements",
              "first",
              "second",
              "submodels",
               
              "keys" 
            ];

            const keyA = a[0]; // a[0]는 'key'입니다.
            const keyB = b[0]; // b[0]는 'key'입니다.

            const indexA = fieldOrder.indexOf(keyA);
            const indexB = fieldOrder.indexOf(keyB);

            // 두 키 모두 fieldOrder에 있는 경우, 해당 순서대로 정렬
            if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
            }
            
            // 한쪽만 fieldOrder에 있는 경우, 있는 쪽이 먼저 오도록
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // 둘 다 fieldOrder에 없는 경우, 기존 순서(알파벳순) 유지
            return keyA.localeCompare(keyB);
          })
          .map(([key, value], index) => {
            const parentKey = obj.valuePath ?? obj.value ?? '';
            const stateKey = parentKey ? `${parentKey}.${key}` : key;
            // 'description' 필드를 항상 langStrings 배열로 렌더링하기 위해
            // 값이 문자열이나 null일 경우 렌더링용 배열로 정규화합니다.
            let renderValue = value;
            if (key === "description" && !Array.isArray(value)) {
              renderValue = [{ 
                language: 'en', 
                // 값이 문자열이면 해당 값을, 아니면 빈 문자열을 text로 사용합니다.
                text: typeof value === 'string' ? value : '' 
              }];
            }
            const isAasId = parentKey === "assetAdministrationShells[0]" && key === "id";
            const isSubmodelId = typeof parentKey === 'string' && parentKey.startsWith("submodels[") && key === "id";
            const isSemanticIdValue = stateKey.endsWith("semanticId.keys[0].value");
            const isFileElement = obj.modelType === "File";
            const isRangeMin = obj.modelType === "Range" && key === "min";
            const isRangeMax = obj.modelType === "Range" && key === "max";

            // semanticId 내부 필드인지 확인하는 변수 추가
            // stateKey (e.g., "...semanticId.keys[0].value")에 ".semanticId."가 포함되어 있는지 확인
            const isInsideSemanticId = stateKey.includes(".semanticId.");

            // description 필드 편집 가능 여부 결정
            const isDescriptionField = key === "description";
            const isSmcOrSml = obj.modelType === "SubmodelElementCollection" || obj.modelType === "SubmodelElementList";
            const canEditDescription = isDescriptionField && !isSmcOrSml;

            // Submodel ID는 수정 불가능하게 유지하고, semanticId.keys[0].value는 수정 가능하게 합니다.
            let tempEditMode = editMode ? (!isSubmodelId || isSemanticIdValue) : false;

            // input field 스타일링 로직 
            const inputStyle: React.CSSProperties = {};
            if (isInsideSemanticId) {
              inputStyle.color = "#b3bec7ff"; // 기존 read-only 필드
            } else if (key === "originalValue") {
              // originalValue 필드 하이라이트
              inputStyle.borderColor = "var(--mantine-color-blue-6)";
              inputStyle.borderWidth = "1.5px";
              inputStyle.boxShadow = "0 0 4px var(--mantine-color-blue-2)";
            }

            // UI 표시용 키 이름 설정 (originalValue -> value)
            let displayLabel = key;
            if (key === "originalValue") {
              displayLabel = "value";
            }

            // MultiLanguageProperty 전용 UI 로직
            if (
              obj.modelType === "MultiLanguageProperty" &&
              (key === "value" || key === "originalValue")
            ) {
              // 값이 배열이 아니면 빈 배열로 초기화 (안전장치)
              // innerState에 있는 값이 최신이므로 우선 사용
              const currentValue = innerState[stateKey] ?? value;
              const mlpValue = Array.isArray(currentValue) ? currentValue : [];

              return (
                <React.Fragment key={`${key}-${index}`}>
                   <Group w={"100%"} py="4" justify="space-between" wrap="nowrap" gap="xl">
                    <div style={{ width: "100%" }}>
                      {/* 라벨 및 추가 버튼 영역 */}
                      <Flex justify={"flex-start"} align={"center"} style={{ width: '100%', marginBottom: '8px' }}>
                        <div
                          style={{
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #efefef",
                            borderRadius: "5px",
                            padding: "2px 5px 2px 15px",
                            marginRight: "10px",
                          }}
                        >
                          <Text className="fs-8" miw={"110px"}>{displayLabel}</Text>
                        </div>
                        
                        {/* 편집 모드일 때만 추가 버튼 표시 */}
                        {(tempEditMode || editMode) && (
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            title="Add Language"
                            onClick={() => {
                              // 빈 항목({ language: "en", text: "" }) 추가
                              const newValue = [...mlpValue, { language: "en", text: "" }];
                              setInnerState((prev: any) => ({ ...prev, [stateKey]: newValue }));
                              if (onValueChange) onValueChange(stateKey, newValue);
                            }}
                          >
                            <IconPlus size={14} />
                          </ActionIcon>
                        )}
                      </Flex>

                      {/* 언어별 입력 리스트 영역 */}
                      <Flex direction="column" gap="xs" w="100%">
                        {mlpValue.map((item: any, idx: number) => (
                          <Group key={idx} gap="xs" wrap="nowrap">
                             {/* 1. 언어 코드 입력 (예: en, ko, de) */}
                            <TextInput
                              placeholder="Lang"
                              size="xs"
                              w={80}
                              value={item.language || ""}
                              readOnly={!editMode} // 편집 모드가 아니면 읽기 전용
                              onChange={(e) => {
                                const newValue = [...mlpValue];
                                // 해당 인덱스의 language 값 업데이트
                                newValue[idx] = { ...newValue[idx], language: e.target.value };
                                setInnerState((prev: any) => ({ ...prev, [stateKey]: newValue }));
                                if (onValueChange) onValueChange(stateKey, newValue);
                              }}
                            />
                            {/* 2. 텍스트 값 입력 */}
                            <TextInput
                              placeholder="Text value"
                              size="xs"
                              style={{ flexGrow: 1 }}
                              value={item.text || ""}
                              readOnly={!editMode}
                              onChange={(e) => {
                                const newValue = [...mlpValue];
                                // 해당 인덱스의 text 값 업데이트
                                newValue[idx] = { ...newValue[idx], text: e.target.value };
                                setInnerState((prev: any) => ({ ...prev, [stateKey]: newValue }));
                                if (onValueChange) onValueChange(stateKey, newValue);
                              }}
                            />
                             {/* 3. 삭제 버튼 (편집 모드일 때만) */}
                            {editMode && (
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                size="sm"
                                title="Remove"
                                onClick={() => {
                                  // 해당 인덱스 항목 삭제
                                  const newValue = mlpValue.filter((_: any, i: number) => i !== idx);
                                  setInnerState((prev: any) => ({ ...prev, [stateKey]: newValue }));
                                  if (onValueChange) onValueChange(stateKey, newValue);
                                }}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            )}
                          </Group>
                        ))}
                        {/* 데이터가 없을 때 안내 문구 */}
                        {mlpValue.length === 0 && !editMode && (
                           <Text c="dimmed" size="xs" fs="italic" pl={1}>No values defined.</Text>
                        )}
                      </Flex>
                    </div>
                  </Group>
                </React.Fragment>
              );
            }
            
            

            return (
              <React.Fragment key={`${key}-${index}`}>
                <Group
                  w={"100%"}
                  py="4"
                  justify="space-between"
                  wrap="nowrap"
                  gap="xl"
                >
                  <div style={{ width: "100%" }}>
                    {/* 'description' 키를 'semanticId'와 동일하게 최우선으로 처리 ▼▼▼ */}
                    {key === "description" ? (
                      <div key={`${key}-${index}`} style={{ paddingLeft: `calc(1rem * ${indent})` }}>
                        <Title
                          order={3}
                          mb={"4"}
                          style={{
                            backgroundColor: "#fefefe",
                            border: "1px solid #efefef",
                            borderRadius: "5px",
                            padding: "5px 15px",
                            color: "#333",
                            fontSize: '14px',
                            cursor: "pointer", // 클릭 가능하도록 커서 변경
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                          onClick={() => setIsDescriptionExpanded(prev => !prev)} // 클릭 시 상태 토글
                        >
                          <div>
                            <i
                              className="fa-regular fa-file-lines me-2"
                              style={{ color: "#ecdd78" }} // description 아이콘
                            ></i>{" "}
                            {key}
                          </div>
                          {/* 화살표 아이콘 */}
                          <i 
                            className={`fa-solid ${isDescriptionExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                            style={{ fontSize: '12px', color: '#666' }}
                          ></i>
                        </Title>
                        
                        {/* description 내용 조건부 렌더링 */}
                        {isDescriptionExpanded && (
                          <> 
                            {/* 'renderValue'는 상단의 정규화 로직으로 항상 배열임 */}
                            {renderValue.map((item, itemIndex) => (
                              <div key={`${key}-${itemIndex}`}>
                                {typeof item === "object" ? (
                                  <RenderObject
                                    obj={{ ...item, valuePath: `${stateKey}[${itemIndex}]` }} 
                                    state={state}
                                    indent={indent + 1}
                                    onValueChange={onValueChange}
                                    editMode={tempEditMode || canEditDescription}
                                    isInstance={isInstance}
                                    instanceSeq={instanceSeq}
                                  />
                                ) : (
                                  item
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    ) : key === "semanticId" ? (
                      <div key={`${key}-${index}`} style={{ paddingLeft: `calc(1rem * ${indent})` }}>
                        <Title
                          order={3}
                          mb={"4"}
                          style={{
                            backgroundColor: "#fefefe",
                            border: "1px solid #efefef",
                            borderRadius: "5px",
                            padding: "5px 15px",
                            color: "#333",
                            fontSize: '14px',
                            cursor: "pointer", 
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                          onClick={() => setIsSemanticIdExpanded(prev => !prev)} 
                        >
                          <div>
                            <i
                              className="fa-regular fa-file-lines me-2"
                              style={{ color: "#ecdd78" }}
                            ></i>{" "}
                            {key}
                          </div>
                          <i 
                            className={`fa-solid ${isSemanticIdExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                            style={{ fontSize: '12px', color: '#666' }}
                          ></i>
                        </Title>
                        {isSemanticIdExpanded && (
                          <RenderObject
                            obj={{ ...value, valuePath: stateKey }}
                            state={state}
                            indent={indent + 1}
                            onValueChange={onValueChange}
                            editMode={tempEditMode || canEditDescription}
                            isInstance={isInstance}
                            instanceSeq={instanceSeq}
                          />
                        )}
                      </div>

                      ) : Array.isArray(renderValue) ? (
                      // description이 아닌 다른 배열의 렌더링 로직
                      <div>
                        <Title
                          order={3}
                          mb={"4"}
                          style={{
                            backgroundColor: "#fefefe",
                            border: "1px solid #efefef",
                            borderRadius: "5px",
                            padding: "5px 15px",
                            color: "#333",
                            fontSize:'14px'
                          }}
                        >
                          <i
                            className="fa-regular fa-file-lines me-2"
                            style={{ color: "#ee8843" }} // other array 아이콘
                          ></i>{" "}
                          {displayLabel}
                        </Title>
                        {renderValue.map((item, itemIndex) => (
                          <div key={`${key}-${itemIndex}`}>
                            {typeof item === "object" ? (
                              <RenderObject
                                obj={{ ...item, valuePath: `${stateKey}[${itemIndex}]` }} 
                                state={state}
                                indent={indent + 1}
                                onValueChange={onValueChange}
                                editMode={tempEditMode || canEditDescription}
                                isInstance={isInstance}
                                instanceSeq={instanceSeq}
                              />
                            ) : (
                              item
                            )}
                          </div>
                        ))}
                      </div>

                    // 'value'를 'renderValue'로 변경
                    ) : typeof renderValue === "object" && renderValue !== null ? ( 
                      <div key={`${key}-${index}`} style={{ paddingLeft: `calc(1rem * ${indent})` }}> {/* key prop 추가 */}
                        <Title
                          order={3}
                          mb={"4"}
                          style={{
                            backgroundColor: "#fefefe",
                            border: "1px solid #efefef",
                            borderRadius: "5px",
                            padding: "5px 15px",
                            color: "#333",
                            fontSize:'14px'
                          }}
                        >
                          <i
                            className="fa-regular fa-file-lines me-2"
                            style={{ color: "#ecdd78" }}
                          ></i>{" "}
                          {displayLabel}
                        </Title>
                        <RenderObject
                          //'value'를 'renderValue'로 변경
                          obj={{ ...renderValue, valuePath: stateKey }} 
                          state={state}
                          indent={indent + 1}
                          onValueChange={onValueChange}
                          editMode={tempEditMode || canEditDescription}
                          isInstance={isInstance}
                          instanceSeq={instanceSeq}
                        />
                      </div>
                    ) : (
                  <Flex justify={"flex-start"} align={"center"} style={{width: '100%'}}>
                    <div
                      style={{
                        backgroundColor: "#f9f9f9",
                        border: "1px solid #efefef",
                        borderRadius: "5px",
                        padding: "2px 5px 2px 15px",
                        marginRight: "10px",
                      }}
                    >
                      {/* key 대신 displayLabel 사용 */}
                      <Text className="fs-8" miw={"110px"}>
                        {displayLabel}
                      </Text>
                    </div>

                    {tempEditMode || canEditDescription ? (
                      // --- 편집 모드 ---
                      <Flex style={{width: '100%'}} gap="xs">
                        <input
                          type={isRangeMin || isRangeMax ? "number" : "text"}
                          className="fs-8 form-control"
                          id={stateKey}
                          value={innerState[stateKey] ?? value ?? ''} // value prop 단순화
                          onChange={(e) => {
                            setInnerState((prev) => ({
                              ...prev,
                              [stateKey]: e.target.value,
                            }));
                            if (onValueChange) {
                              onValueChange(e.target.id, e.target.value);
                            }
                            state[e.target.id] = e.target.value;
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                          }}
                          // semanticId 내부 필드일 경우 readOnly 및 연한 글자색 적용
                          readOnly={isInsideSemanticId}
                          style={inputStyle}
                        />

                        {/* 'value' 필드일 때만 파일 컨트롤 표시 */}
                        {tempEditMode && isFileElement && key === "originalValue" && (
                          <>
                            <FilePreviewModal
                                opened={previewOpened}
                                onClose={closePreview}
                                fileUrl={previewFile?.url || ""}
                                fileType={previewFile?.type || ""}
                            />
                            {/* 파일 업로드 버튼 */}
                            <input
                              type="file"
                              className="fs-8 form-control"
                              style={{width: 'auto', flexGrow: 1}}
                              ref={fileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onValueChange) {
                                  setUploadedFile(file); // Store file in dedicated state

                                  const fileKey = `${parentKey}.fileObject`; // Key for parent state
                                  const contentTypeKey = `${parentKey}.contentType`;
                                  const valueKey = stateKey; // current key (e.g., ...value)

                                  // 1. Tell parent about the file object
                                  onValueChange(fileKey, file, file); 
                                  // 2. Update content type in parent
                                  onValueChange(contentTypeKey, file.type);
                                  // 3. Update value (filename) in parent
                                  onValueChange(valueKey, file.name); 

                                  // Update UI immediately for filename and content type
                                  setInnerState((prev) => ({
                                    ...prev,
                                    [contentTypeKey]: file.type,
                                    [valueKey]: file.name,
                                  }));
                                }
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            {/* 미리보기 버튼 */}
                            <Button
                              size="xs"
                              ml="xs"
                              style={{overflow:'inherit'}}
                              onClick={() => {
                                const fileValue = innerState[stateKey] ?? value;
                                const contentType = innerState[`${parentKey}.contentType`] ?? obj.contentType;
                                
                                if (uploadedFile instanceof File && PREVIEW_MIME_TYPES.includes(uploadedFile.type)) {
                                    setPreviewFile({ url: URL.createObjectURL(uploadedFile), type: uploadedFile.type });
                                    openPreview();
                                } else if (typeof fileValue === 'string' && contentType) {
                                    let finalUrl = fileValue;
                                    if (isInstance && instanceSeq) {
                                        if (finalUrl.includes('/aas_files/aas/') && !finalUrl.includes('/aas_files/aas/instance/')) {
                                            finalUrl = finalUrl.replace('/aas_files/aas/', '/aas_files/aas/instance/');
                                        } else if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:') && !finalUrl.startsWith('/')) {
                                            const fileName = finalUrl.split('/').pop();
                                            finalUrl = `/aas_files/aas/instance/${instanceSeq}/${fileName}`;
                                        }
                                    }

                                    finalUrl = getCorrectedUrl(finalUrl);

                                    if (PREVIEW_MIME_TYPES.includes(contentType)) {
                                        setPreviewFile({ url: finalUrl, type: contentType });
                                        openPreview();
                                    } else {
                                        showToast.warning("미리보기를 지원하지 않는 파일 형식입니다.");
                                    }
                                } else {
                                    showToast.warning("미리보기를 지원하지 않는 파일 형식이거나 파일이 없습니���.");
                                }
                              }}
                            >
                              미리보기
                            </Button>
                          </>
                        )}
                      </Flex>
                    ) : (
                      // --- 뷰 모드 ---
                      <Flex justify="space-between" align="center" style={{width: '100%'}}>
                        <Text
                          fw={600}
                          className="fs-8"
                          style={{ paddingLeft: "5px", wordBreak: "break-all" }}
                        >
                          {innerState[stateKey] ?? value ?? ""} {/* value prop 단순화 */}
                        </Text>

                        {/* 뷰 모드 미리보기 버튼 */}
                        {isFileElement && key === "originalValue" && (
                          <>
                            <FilePreviewModal
                              opened={previewOpened}
                              onClose={closePreview}
                              fileUrl={previewFile?.url || ""}
                              fileType={previewFile?.type || ""}
                            />
                            <Button
                              size="xs"
                              ml="md"
                              onClick={() => {
                                let fileUrl = innerState[stateKey] ?? value;
                                const contentType = innerState[`${parentKey}.contentType`] ?? obj.contentType;

                                if (fileUrl && typeof fileUrl === 'string' && contentType) {
                                    let finalUrl = fileUrl;
                                    if (isInstance && instanceSeq) {
                                        if (finalUrl.includes('/aas_files/aas/') && !finalUrl.includes('/aas_files/aas/instance/')) {
                                            finalUrl = finalUrl.replace('/aas_files/aas/', '/aas_files/aas/instance/');
                                        } else if (!finalUrl.startsWith('http') && !finalUrl.startsWith('blob:') && !finalUrl.startsWith('/')) {
                                            const fileName = finalUrl.split('/').pop();
                                            finalUrl = `/aas_files/aas/instance/${instanceSeq}/${fileName}`;
                                        }
                                    }

                                    finalUrl = getCorrectedUrl(finalUrl);

                                    if (PREVIEW_MIME_TYPES.includes(contentType)) {
                                      setPreviewFile({ url: finalUrl, type: contentType });
                                      openPreview();
                                    } else {
                                      showToast.warning("미리보기를 지원하지 않는 파일 형식입니다.");
                                    }
                                } else {
                                  showToast.warning("미리보기를 지원하지 않는 파일 형식이거나 URL이 없습니다.");
                                }
                              }}
                            >
                              미리보기
                            </Button>
                          </>
                        )}
                      </Flex>
                    )}
                  </Flex>
                )}
                  </div>
                </Group>
               
              </React.Fragment>
            );
          })}
      </div>
    );
  }
);



// RenderNodeDetails: 노드의 상세 정보를 카드로 표시 (내부에서 RenderObject에 editMode 전달)
  const RenderNodeDetails = memo(
  ({
    level,
    node,
    state,
    editMode,
    onValueChange,
    isInstance,
    instanceSeq,
  }: {
    level: number;
    node: any;
    state: any;
    editMode: boolean;
    onValueChange?: (key: string, value: any, file?: File) => void;
    isInstance?: boolean;
    instanceSeq?: string;
  }) => (
    <div
      key={`${node.value}-${level}`}
      style={{
        marginLeft: `calc(2rem * ${Math.max(0, level - 1)})`,
        marginTop: 6,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* mini header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="14" height="14" rx="3" fill="#334155"/>
          <path d="M4 6h8M4 9h6M4 12h4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {node.modelType}
        </span>
      </div>
      <div className="aas-details-panel" style={{ padding: "10px 12px" }}>
        <RenderObject
          obj={node}
          state={state}
          editMode={editMode}
          onValueChange={onValueChange}
          isInstance={isInstance}
          instanceSeq={instanceSeq}
        />
      </div>
    </div>
  )
);

// ─── 타입 메타데이터 ─────────────────────────────────────────────
const TYPE_META: Record<string, {
  label: string;
  abbr: string;
  accent: string;       // tailwind hex
  bgLight: string;
  textColor: string;
  icon: React.ReactNode;
  humanLabel: string;   // 비전문가용 설명
}> = {
  AssetAdministrationShell: {
    label: "AAS", abbr: "AAS",
    accent: "#2563eb", bgLight: "#eff6ff", textColor: "#1e40af",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3" fill="#2563eb"/>
        <path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "디지털 자산",
  },
  Submodel: {
    label: "Submodel", abbr: "SM",
    accent: "#059669", bgLight: "#ecfdf5", textColor: "#065f46",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3" fill="#059669"/>
        <path d="M4 6h8M4 8h6M4 10h4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "속성 그룹",
  },
  SubmodelElementCollection: {
    label: "Collection", abbr: "SMC",
    accent: "#7c3aed", bgLight: "#f5f3ff", textColor: "#5b21b6",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3" fill="#7c3aed"/>
        <path d="M4 5h8M4 8h8M4 11h5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "항목 묶음",
  },
  SubmodelElementList: {
    label: "List", abbr: "SML",
    accent: "#4f46e5", bgLight: "#eef2ff", textColor: "#3730a3",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3" fill="#4f46e5"/>
        <circle cx="4.5" cy="5.5" r="1" fill="white"/>
        <circle cx="4.5" cy="8" r="1" fill="white"/>
        <circle cx="4.5" cy="10.5" r="1" fill="white"/>
        <path d="M7 5.5h5M7 8h5M7 10.5h3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "순서 목록",
  },
  Property: {
    label: "Property", abbr: "Prop",
    accent: "#d97706", bgLight: "#fffbeb", textColor: "#92400e",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#d97706"/>
        <path d="M5.5 8h5M8 5.5v5" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.4"/>
        <circle cx="8" cy="8" r="2" fill="white"/>
      </svg>
    ),
    humanLabel: "속성값",
  },
  MultiLanguageProperty: {
    label: "Multilang", abbr: "MLP",
    accent: "#0891b2", bgLight: "#ecfeff", textColor: "#155e75",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#0891b2"/>
        <text x="4" y="11" fontSize="7" fill="white" fontWeight="bold">가A</text>
      </svg>
    ),
    humanLabel: "다국어 텍스트",
  },
  File: {
    label: "File", abbr: "File",
    accent: "#0284c7", bgLight: "#f0f9ff", textColor: "#0c4a6e",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="1" width="10" height="14" rx="2" fill="#0284c7"/>
        <path d="M6 5h4M6 8h4M6 11h2" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "파일",
  },
  Range: {
    label: "Range", abbr: "Range",
    accent: "#ea580c", bgLight: "#fff7ed", textColor: "#7c2d12",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#ea580c"/>
        <path d="M4 8h8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="4" cy="8" r="1.5" fill="white"/>
        <circle cx="12" cy="8" r="1.5" fill="white"/>
      </svg>
    ),
    humanLabel: "범위값",
  },
  ReferenceElement: {
    label: "Reference", abbr: "Ref",
    accent: "#db2777", bgLight: "#fdf2f8", textColor: "#831843",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#db2777"/>
        <path d="M6 8h4M9 6l2 2-2 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    humanLabel: "참조",
  },
  Entity: {
    label: "Entity", abbr: "Ent",
    accent: "#dc2626", bgLight: "#fef2f2", textColor: "#7f1d1d",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3" fill="#dc2626"/>
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    humanLabel: "개체",
  },
  ConceptDescription: {
    label: "ConceptDesc", abbr: "CD",
    accent: "#ca8a04", bgLight: "#fefce8", textColor: "#713f12",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#ca8a04"/>
        <path d="M8 5v1M8 8v3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "개념 정의",
  },
  RelationshipElement: {
    label: "Relation", abbr: "Rel",
    accent: "#64748b", bgLight: "#f8fafc", textColor: "#334155",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="#64748b"/>
        <circle cx="5" cy="8" r="1.5" fill="white"/>
        <circle cx="11" cy="8" r="1.5" fill="white"/>
        <path d="M6.5 8h3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    humanLabel: "관계",
  },
};

const getTypeMeta = (modelType: string) =>
  TYPE_META[modelType] ?? {
    label: modelType, abbr: modelType.slice(0, 4),
    accent: "#94a3b8", bgLight: "#f8fafc", textColor: "#475569",
    icon: null,
    humanLabel: modelType,
  };

// modelTypeToBadge — 하위 호환성 유지
const modelTypeToBadge = (modelType: string) => {
  const m = getTypeMeta(modelType);
  return { label: m.abbr, color: "gray" };
};

/* ─────────────────────────────────────────────────────────────────────────
   노드 개념 설명(ConceptDescription) 호버 정보
   - 트리 노드에는 aas.js 파싱 단계에서 idShort, description, semanticId,
     그리고 semanticId 와 매칭된 전체 ConceptDescription 객체가 이미 붙어 있다.
   - 라벨에 마우스오버하면 개념의 의미(선호 이름/정의/단위/데이터타입/식별자)를
     바로 볼 수 있도록 HoverCard 로 표시한다.
───────────────────────────────────────────────────────────────────────────*/
// 다국어(langString) 배열/문자열을 { language, text } 배열로 정규화
const normMultiLang = (v: any): Array<{ language: string; text: string }> => {
  if (!v) return [];
  if (typeof v === "string") return v.trim() ? [{ language: "", text: v }] : [];
  if (Array.isArray(v)) return v.filter((x: any) => x && (x.text ?? "").toString().trim());
  return [];
};

// ConceptDescription 의 dataSpecificationContent 추출
const getCdSpecContent = (cd: any) => {
  const specs = cd?.embeddedDataSpecifications;
  if (!Array.isArray(specs) || specs.length === 0) return null;
  return specs[0]?.dataSpecificationContent ?? null;
};

// 노드에서 표시할 개념 정보 추출
const extractNodeConceptInfo = (node: any) => {
  const cd = node?.ConceptDescription ?? null;
  const ds = getCdSpecContent(cd);
  const descEntries = normMultiLang(node?.description);
  const preferredName = ds ? normMultiLang(ds.preferredName) : [];
  const definition = ds ? normMultiLang(ds.definition) : [];
  const unit = ds?.unit ?? "";
  const dataType = ds?.dataType ?? node?.valueType ?? "";
  const semId = node?.semanticId?.keys?.[0]?.value ?? "";
  const hasInfo =
    descEntries.length > 0 ||
    preferredName.length > 0 ||
    definition.length > 0 ||
    !!unit ||
    !!cd ||
    !!semId;
  return { cd, ds, descEntries, preferredName, definition, unit, dataType, semId, hasInfo };
};

const HOVER_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 3,
};

const MlBlock = ({ entries }: { entries: Array<{ language: string; text: string }> }) => {
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          {e.language && (
            <span style={{ fontSize: 9, fontFamily: "monospace", background: "#f1f5f9", color: "#64748b", borderRadius: 3, padding: "1px 4px", flexShrink: 0, marginTop: 1 }}>
              {e.language}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{e.text}</span>
        </div>
      ))}
    </div>
  );
};

// 개념 설명 호버 카드 내용
const ConceptInfoCard = ({ node, info }: { node: any; info: ReturnType<typeof extractNodeConceptInfo> }) => {
  const { descEntries, preferredName, definition, unit, dataType, semId } = info;
  const tm = getTypeMeta(node.modelType);
  return (
    <div style={{ width: 320 }}>
      {/* 헤더: 타입 + idShort */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#0070f3", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.03em", flexShrink: 0 }}>
          {tm.abbr}
        </span>
        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.idShort}
        </span>
      </div>

      <div style={{ padding: "11px 12px", display: "flex", flexDirection: "column", gap: 11 }}>
        {preferredName.length > 0 && (
          <div>
            <div style={HOVER_LABEL_STYLE}>선호 이름 (Preferred Name)</div>
            <MlBlock entries={preferredName} />
          </div>
        )}
        {definition.length > 0 && (
          <div>
            <div style={HOVER_LABEL_STYLE}>정의 (Definition)</div>
            <MlBlock entries={definition} />
          </div>
        )}
        {descEntries.length > 0 && (
          <div>
            <div style={HOVER_LABEL_STYLE}>설명 (Description)</div>
            <MlBlock entries={descEntries} />
          </div>
        )}
        {(unit || dataType) && (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {dataType && (
              <div>
                <div style={HOVER_LABEL_STYLE}>데이터 타입</div>
                <span style={{ fontSize: 11, fontFamily: "monospace", background: "#f1f5f9", color: "#475569", borderRadius: 4, padding: "2px 7px" }}>{dataType}</span>
              </div>
            )}
            {unit && (
              <div>
                <div style={HOVER_LABEL_STYLE}>단위</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0070f3" }}>{unit}</span>
              </div>
            )}
          </div>
        )}
        {semId && (
          <div>
            <div style={HOVER_LABEL_STYLE}>Semantic ID</div>
            <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "#64748b", wordBreak: "break-all", lineHeight: 1.45 }}>{semId}</div>
          </div>
        )}
        {preferredName.length === 0 && definition.length === 0 && descEntries.length === 0 && !unit && (
          <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
            연결된 개념 설명 정보가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

// 라벨 + 개념 설명 호버. 정보가 있을 때만 호버 카드로 감싼다.
const NodeInfoLabel = memo(({ node, text, style }: { node: any; text: any; style: React.CSSProperties }) => {
  const info = useMemo(() => extractNodeConceptInfo(node), [node]);

  const labelSpan = (
    <span
      style={{
        ...style,
        ...(info.hasInfo
          ? { textDecoration: "underline", textDecorationStyle: "dotted", textDecorationColor: "#cbd5e1", textUnderlineOffset: 3, cursor: "help" }
          : {}),
      }}
      title={info.hasInfo ? undefined : (typeof text === "string" ? text : undefined)}
    >
      {text}
    </span>
  );

  if (!info.hasInfo) return labelSpan;

  return (
    <HoverCard width={320} shadow="lg" openDelay={130} closeDelay={60} position="right-start" withArrow withinPortal>
      <HoverCard.Target>{labelSpan}</HoverCard.Target>
      <HoverCard.Dropdown p={0} style={{ overflow: "hidden", borderRadius: 10, border: "1px solid #e2e8f0" }} onClick={(e) => e.stopPropagation()}>
        <ConceptInfoCard node={node} info={info} />
      </HoverCard.Dropdown>
    </HoverCard>
  );
});
NodeInfoLabel.displayName = "NodeInfoLabel";

const RenderTreeNode = memo(
  ({
    level,
    node,
    expanded,
    elementProps,
    state,
    editMode,
    onValueChange,
    onNodeClick,
    simpleView,
    onAdd,
    onDelete,
    isInstance,
    instanceSeq,
  }: {
    level: number;
    node: any;
    expanded: boolean;
    elementProps: any;
    state: any;
    editMode: boolean;
    onValueChange?: (key: string, value: any, file?: File) => void;
    onNodeClick?: (node: any) => void;
    simpleView?: boolean;
    onAdd?: (node: any, elementType: string, idShort: string) => void;
    onDelete?: (node: any) => void;
    isInstance?: boolean;
    instanceSeq?: string;
  }) => {
    const canHaveChildren = [
      "Submodel",
      "SubmodelElementCollection",
      "SubmodelElementList",
      "Entity",
    ].includes(node.modelType);

    const isDeletable =
      node.valuePath && !node.valuePath.startsWith("assetAdministrationShells");

    //const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    // ConceptDescription은 'children' 배열이 없어도 상세 정보를 펼칠 수 있어야 합니다.
    //const hasPropertiesToExpand = node.modelType === "ConceptDescription";
    // 'children'이 없는 리프 노드 중에서도 상세 정보를 펼쳐볼 수 있는 타입들을 정의합니다.
    const detailExpandableTypes = [
      "ConceptDescription",
      "Property",
      "MultiLanguageProperty",
      "Range",
      "File",
      "ReferenceElement",
      "RelationshipElement",
    ];


    const hasPropertiesToExpand = detailExpandableTypes.includes(node.modelType);
    const hasActualChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpandable = hasActualChildren || hasPropertiesToExpand;


    const tm = getTypeMeta(node.modelType);

    // 레벨별 왼쪽 들여쓰기
    const indentPx = Math.max(0, level - 2) * 18;

    // Property 계열 인라인 값
    const inlineValue = (() => {
      if (node.modelType === "Property" || node.modelType === "RelationshipElement") {
        const v = String(state?.[`${node.valuePath}.originalValue`] ?? node.originalValue ?? "");
        return v;
      }
      if (node.modelType === "MultiLanguageProperty") {
        return Array.isArray(node.originalValue)
          ? node.originalValue.map((v: any) => `[${v.language}] ${v.text}`).join("  ·  ")
          : String(node.originalValue ?? "");
      }
      if (node.modelType === "File") {
        return typeof node.originalValue === "string" ? node.originalValue.split("/").pop() ?? "" : "";
      }
      return "";
    })();

    const childCount = Array.isArray(node.children) ? node.children.length : 0;

    /* ── shared style tokens ── */
    const BASE_ROW: React.CSSProperties = {
      display: "flex", alignItems: "center", gap: 7,
      cursor: "pointer", userSelect: "none",
      transition: "background 100ms",
    };
    const CHEVRON = (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transition: "transform 120ms", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
        <path d="M3 2l4 3-4 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

    // ── AAS 최상위 노드 ──────────────────────────────────────────
    if (node.modelType === "AssetAdministrationShell") {
      return (
        <Box mb={6}>
          <div
            style={{
              ...BASE_ROW,
              padding: "9px 12px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderLeft: "3px solid #0070f3",
              borderRadius: 8,
            }}
            {...elementProps}
            onClick={(e) => { if (isExpandable) elementProps.onClick(e); if (onNodeClick) onNodeClick(node); }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <rect x="1" y="1" width="14" height="14" rx="3" fill="#0070f3"/>
              <path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>
                Asset Administration Shell
              </div>
              <NodeInfoLabel
                node={node}
                text={node.idShort}
                style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              />
            </div>
            {isExpandable && CHEVRON}
          </div>
          {expanded && !simpleView && (
            <RenderNodeDetails key={`${node.valuePath}-details`} level={level} node={node} state={state} editMode={editMode} onValueChange={onValueChange} isInstance={isInstance} instanceSeq={instanceSeq} />
          )}
        </Box>
      );
    }

    // ── Submodel 노드 ─────────────────────────────────────────────
    if (node.modelType === "Submodel") {
      return (
        <Box mb={3} style={{ paddingLeft: indentPx }}>
          <div
            style={{
              ...BASE_ROW,
              padding: "7px 11px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderLeft: "3px solid #0070f3",
              borderRadius: 7,
            }}
            {...elementProps}
            onClick={(e) => { if (isExpandable) elementProps.onClick(e); if (onNodeClick) onNodeClick(node); }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <rect x="1" y="1" width="14" height="14" rx="3" fill="#334155"/>
              <path d="M4 6h8M4 8h6M4 10h4" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 1 }}>
                Submodel
              </div>
              <NodeInfoLabel
                node={node}
                text={node.idShort}
                style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {childCount > 0 && (
                <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 99, padding: "1px 6px", fontWeight: 600 }}>
                  {childCount}
                </span>
              )}
              {CHEVRON}
              {editMode && onDelete && isDeletable && (
                <ActionIcon variant="subtle" color="red" size="xs"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = await confirmSave(`'${node.idShort}' 을(를) 삭제하시겠습니까?`, { labels: { confirm: "삭제", cancel: "취소" }, confirmProps: { color: "red" } });
                    if (confirmed) onDelete(node);
                  }}>
                  <IconTrash size={11} />
                </ActionIcon>
              )}
              {editMode && onAdd && canHaveChildren && (
                <ElementAdd onAdd={(elementType, idShort) => onAdd(node, elementType, idShort)}
                  allowedTypes={["SubmodelElementCollection", "SubmodelElementList", "Property"]} />
              )}
            </div>
          </div>
          {expanded && !simpleView && (
            <RenderNodeDetails key={`${node.valuePath}-details`} level={level} node={node} state={state} editMode={editMode} onValueChange={onValueChange} isInstance={isInstance} instanceSeq={instanceSeq} />
          )}
        </Box>
      );
    }

    // ── Collection / List (컨테이너 노드) ─────────────────────────
    if (node.modelType === "SubmodelElementCollection" || node.modelType === "SubmodelElementList") {
      const isCollection = node.modelType === "SubmodelElementCollection";
      return (
        <Box mb={1} style={{ paddingLeft: indentPx }}>
          <div style={{ display: "flex", gap: 0 }}>
            {level > 3 && <div style={{ width: 1, background: "#e2e8f0", marginRight: 8, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  ...BASE_ROW,
                  padding: "5px 9px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderLeft: `2px solid ${isCollection ? "#334155" : "#64748b"}`,
                  borderRadius: 5,
                }}
                {...elementProps}
                onClick={(e) => { if (isExpandable) elementProps.onClick(e); if (onNodeClick) onNodeClick(node); }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  {isCollection
                    ? <><rect x="1" y="1" width="14" height="14" rx="3" fill="#334155"/><path d="M4 5h8M4 8h8M4 11h5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></>
                    : <><rect x="1" y="1" width="14" height="14" rx="3" fill="#64748b"/><circle cx="4.5" cy="5.5" r="1" fill="white"/><circle cx="4.5" cy="8" r="1" fill="white"/><circle cx="4.5" cy="10.5" r="1" fill="white"/><path d="M7 5.5h5M7 8h5M7 10.5h3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></>
                  }
                </svg>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
                    {isCollection ? "SMC" : "SML"}
                  </span>
                  <NodeInfoLabel
                    node={node}
                    text={node.idShort}
                    style={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  />
                </div>
                {childCount > 0 && (
                  <span style={{ fontSize: 9, color: "#94a3b8", background: "#f1f5f9", borderRadius: 99, padding: "0 5px", flexShrink: 0 }}>
                    {childCount}
                  </span>
                )}
                {CHEVRON}
                {editMode && onDelete && isDeletable && (
                  <ActionIcon variant="subtle" color="red" size="xs"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await confirmSave(`'${node.idShort}' 을(를) 삭제하시겠습니까?`, { labels: { confirm: "삭제", cancel: "취소" }, confirmProps: { color: "red" } });
                      if (confirmed) onDelete(node);
                    }}>
                    <IconTrash size={11} />
                  </ActionIcon>
                )}
                {editMode && onAdd && canHaveChildren && (
                  <ElementAdd onAdd={(elementType, idShort) => onAdd(node, elementType, idShort)} />
                )}
              </div>
              {expanded && !simpleView && (
                <RenderNodeDetails key={`${node.valuePath}-details`} level={level} node={node} state={state} editMode={editMode} onValueChange={onValueChange} isInstance={isInstance} instanceSeq={instanceSeq} />
              )}
            </div>
          </div>
        </Box>
      );
    }

    // ── Property / 리프 노드 ──────────────────────────────────────
    const isLeaf = ["Property", "MultiLanguageProperty", "File", "Range", "ReferenceElement", "RelationshipElement"].includes(node.modelType);
    if (isLeaf) {
      const hasValue = inlineValue && inlineValue.trim() !== "";
      return (
        <Box mb={0.5} style={{ paddingLeft: indentPx + 6 }}>
          <div
            style={{
              ...BASE_ROW,
              padding: "4px 9px",
              background: hasValue ? "#fafafa" : "#fafafa",
              border: "1px solid #f1f5f9",
              borderLeft: `2px solid ${hasValue ? "#0070f3" : "#cbd5e1"}`,
              borderRadius: 5,
            }}
            {...elementProps}
            onClick={(e) => { if (isExpandable) elementProps.onClick(e); if (onNodeClick) onNodeClick(node); }}
          >
            {/* 타입 뱃지 */}
            <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 3, padding: "0 4px", flexShrink: 0, letterSpacing: "0.03em" }}>
              {tm.abbr}
            </span>

            {/* 이름 */}
            <NodeInfoLabel
              node={node}
              text={node.idShort}
              style={{ fontSize: 12, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}
            />

            {/* 값 미리보기 */}
            {hasValue ? (
              <span style={{
                fontSize: 11, color: "#0070f3", background: "#eff6ff",
                border: "1px solid #bfdbfe", borderRadius: 4,
                padding: "1px 6px", fontFamily: "monospace",
                maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flexShrink: 0,
              }} title={inlineValue}>
                {inlineValue}
              </span>
            ) : (
              <span style={{ fontSize: 10, color: "#cbd5e1", flexShrink: 0 }}>
                —
              </span>
            )}

            {isExpandable && CHEVRON}

            {/* 삭제 */}
            {editMode && onDelete && isDeletable && (
              <ActionIcon variant="subtle" color="red" size="xs"
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await confirmSave(`'${node.idShort}' 을(를) 삭제하시겠습니까?`, { labels: { confirm: "삭제", cancel: "취소" }, confirmProps: { color: "red" } });
                  if (confirmed) onDelete(node);
                }}>
                <IconTrash size={11} />
              </ActionIcon>
            )}
          </div>
          {expanded && !simpleView && (
            <RenderNodeDetails key={`${node.valuePath}-details`} level={level} node={node} state={state} editMode={editMode} onValueChange={onValueChange} isInstance={isInstance} instanceSeq={instanceSeq} />
          )}
        </Box>
      );
    }

    // ── 기타 노드 (Entity, ConceptDescription 등) ─────────────────
    return (
      <Box mb={1} style={{ paddingLeft: indentPx }}>
        <div
          style={{
            ...BASE_ROW,
            padding: "5px 9px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderLeft: "2px solid #94a3b8",
            borderRadius: 5,
          }}
          {...elementProps}
          onClick={(e) => { if (isExpandable) elementProps.onClick(e); if (onNodeClick) onNodeClick(node); }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="1" width="14" height="14" rx="3" fill="#94a3b8"/>
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>{tm.abbr}</span>
            <NodeInfoLabel
              node={node}
              text={node.idShort}
              style={{ fontSize: 12.5, fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            />
          </div>
          {isExpandable && CHEVRON}
          {editMode && onDelete && isDeletable && (
            <ActionIcon variant="subtle" color="red" size="xs"
              onClick={async (e) => {
                e.stopPropagation();
                const confirmed = await confirmSave(`'${node.idShort}' 을(를) 삭제하시겠습니까?`, { labels: { confirm: "삭제", cancel: "취소" }, confirmProps: { color: "red" } });
                if (confirmed) onDelete(node);
              }}>
              <IconTrash size={11} />
            </ActionIcon>
          )}
          {editMode && onAdd && canHaveChildren && (
            <ElementAdd onAdd={(elementType, idShort) => onAdd(node, elementType, idShort)} />
          )}
        </div>
        {expanded && !simpleView && (
          <RenderNodeDetails key={`${node.valuePath}-details`} level={level} node={node} state={state} editMode={editMode} onValueChange={onValueChange} isInstance={isInstance} instanceSeq={instanceSeq} />
        )}
      </Box>
    );
  }
);

// AASTree: Tree 컴포넌트를 감싸고, renderNode에 editMode 전달
interface AASTreeProps {
  data: any;
  treeDataRefCurrent?: any;
  editMode: boolean;
  onValueChange?: (key: string, value: any, file?: File) => void;
  onNodeClick?: (node: any) => void;
  simpleView?: boolean;
  onAdd?: (node: any, elementType: string, idShort: string) => void;
  onDelete?: (node: any) => void;
  isInstance?: boolean;
  instanceSeq?: string;
  [key: string]: any;
}

function AASTree({
  data,
  treeDataRefCurrent,
  editMode,
  onValueChange,
  onNodeClick,
  simpleView,
  onAdd,
  onDelete,
  isInstance,
  instanceSeq,
  ...styleProps
}: AASTreeProps) {
  const tree = useTree({});

  useEffect(() => {
    if (data && data.length > 0 && data[0]?.value) {
      tree.expand(data[0].value);
    }

    // if (treeDataRefCurrent) {
    //   treeDataRefCurrent = {};
    // }
  }, [data, treeDataRefCurrent]);

  return (
    <Box {...styleProps}>
      <Tree
        mt="xs"
        data={data}
        tree={tree}
        renderNode={(props, index) => (
          <RenderTreeNode
            {...props}
            key={`${props.node.valuePath || index}`}
            state={treeDataRefCurrent ?? {}}
            editMode={editMode}
            onValueChange={onValueChange}
            onNodeClick={onNodeClick}
            simpleView={simpleView}
            onAdd={onAdd}
            onDelete={onDelete}
            isInstance={isInstance}
            instanceSeq={instanceSeq}
          />
        )}
      />
    </Box>
  );
}

export default memo(AASTree);
