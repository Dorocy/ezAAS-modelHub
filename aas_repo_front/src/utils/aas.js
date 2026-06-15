// import { readFile } from 'fs/promises'

// const filePath = new URL('./data.json', import.meta.url)
// const rawData = await readFile(filePath, 'utf-8')
// const json = JSON.parse(rawData)

export const addValuePaths = (obj, basePath = "") => {
  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      addValuePaths(item, `${basePath}[${index}]`)
    );
  } else if (typeof obj === "object" && obj !== null) {
    let newObj = {};
    for (let key in obj) {
      let newBasePath = basePath != "" ? `${basePath}.${key}` : key;
      newObj[key] = addValuePaths(obj[key], newBasePath);
    }
    newObj.valuePath = basePath;

    return newObj;
  }

  return obj;
};

export const parsingSub = (obj) => {
  if (!obj) return null; // ✅ null 체크 추가

  const { modelType, idShort } = obj;
  let id = "";
  if ("id" in obj) {
    id = obj.id;
  } else if (obj.semanticId && Array.isArray(obj.semanticId.keys) && obj.semanticId.keys.length > 0) {
    id = obj.semanticId.keys[0]?.value || "";
  }

  const label = `[${modelType}] ${idShort} ${id}`;

  let tempNode = { ...obj };

  let arr;
  switch (obj.modelType) {
    case "Submodel":
      arr = obj.submodelElements;
      delete tempNode.submodelElements;
      break;
    case "SubmodelElementCollection":
    case "SubmodelElementList":
      arr = obj.value;
      delete tempNode.value;
      break;
    case "Entity":
      arr = obj.statements;
      delete tempNode.statements;
      break;
    default:
      break;
  }

  //sub 노드값 정의 (th.kim)
  const treeNode = {
    label,
    value: obj.valuePath, // Tree 컴포넌트에서 사용할 고유 ID
    originalValue: obj.value, // 기존 value 값을 originalValue에 보관
    valuePath: obj.valuePath,
    id,
    idShort,
    modelType,
    description: obj.description,
    min: obj.min,
    max: obj.max,
    contentType: obj.contentType,
    semanticId: obj.semanticId,
    valueType: obj.valueType,
  };

  treeNode["Submodel"] = tempNode;

  if (Array.isArray(arr)) {
    treeNode.children = arr.map(parsingSub).filter(Boolean); // ✅ 빈 값 제거
  }

  return treeNode;
};

export function parsingAAS(json) {
  const { assetAdministrationShells, submodels, conceptDescriptions } = json;

  // ConceptDescription 을 id 로 빠르게 찾기 위한 조회 맵.
  // 실제 IDTA/ECLASS 템플릿은 semanticId 를 GlobalReference/ExternalReference 로
  // 참조하므로 key.type 에 의존하지 말고 value(=CD.id)로 매칭한다.
  const cdMap = new Map();
  if (Array.isArray(conceptDescriptions)) {
    for (const cd of conceptDescriptions) {
      if (cd?.id != null) cdMap.set(String(cd.id), cd);
    }
  }

  const parsingSub = (obj) => {
    if (!obj) return null; // ✅ null 체크 추가

    const { modelType, idShort } = obj;
    let id = "";
    if ("id" in obj) {
      id = obj.id;
    } else if (obj.semanticId && Array.isArray(obj.semanticId.keys) && obj.semanticId.keys.length > 0) {
      id = obj.semanticId.keys[0]?.value || id;
    }

    const label = `[${modelType}] ${idShort} ${id}`;

    let tempNode = { ...obj };

    let arr;
    switch (obj.modelType) {
      case "Submodel":
        arr = obj.submodelElements;
        delete tempNode.submodelElements;
        break;
      case "SubmodelElementCollection":
      case "SubmodelElementList":
        arr = obj.value;
        delete tempNode.value;
        break;
      case "Entity":
        arr = obj.statements;
        delete tempNode.statements;
        break;
      default:
        break;
    }

    //AAS 노드값 정의 (th.kim)
    const treeNode = {
      label,
      value: obj.valuePath,
      originalValue: obj.value,
      valuePath: obj.valuePath,
      id,
      idShort,
      modelType,
      description: obj.description,
      min: obj.min,
      max: obj.max,
      contentType: obj.contentType,
      semanticId: obj.semanticId,
      valueType: obj.valueType,
    };

    treeNode["Submodel"] = tempNode;

    // semanticId 의 어떤 key 값이든 CD.id 와 일치하면 개념 설명을 연결한다.
    if (Array.isArray(obj.semanticId?.keys)) {
      for (const key of obj.semanticId.keys) {
        const found = key?.value != null ? cdMap.get(String(key.value)) : null;
        if (found != null) {
          treeNode["ConceptDescription"] = found;
          break;
        }
      }
    }

    if (Array.isArray(arr)) {
      treeNode.children = arr.map(parsingSub).filter(Boolean); // ✅ 빈 값 제거
    }

    return treeNode;
  };

  const parsingSubmodel = (submodel, submodels) => {
    const { type, value } = submodel.keys[0];
    const foundSubmodel = submodels.find(
      (s) => s.modelType === type && s.id === value
    );

    if (!foundSubmodel) return [];

    return parsingSub(foundSubmodel);
  };

  const treeNodeList = assetAdministrationShells.map((aas) => {
    const { modelType, idShort, id } = aas;
    const label = `[${modelType}] ${idShort} ${id}`;
    const value = aas.valuePath;

    

    const treeNode = {
      label,
      value,
      modelType,
      idShort,
      id,
      description: aas.description,
      contentType: aas.contentType,
    };
    let tempTreeNode = { ...aas };
    delete tempTreeNode["submodels"];
    treeNode["AssetAdministrationShell"] = tempTreeNode;
    const treeData = aas.submodels
      .map((submodel) => parsingSubmodel(submodel, submodels))
      .flat(); // ✅ 빈 배열 방지 + 중첩 배열 해제
    treeNode.children = treeData;
    return treeNode;
  });
  return treeNodeList;
}
