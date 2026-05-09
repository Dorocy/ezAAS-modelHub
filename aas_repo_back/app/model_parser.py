#!/usr/bin/env python3
"""
AAS Model Parser for Dynamic OPC UA Node Generation
Parses model.json and extracts Property information for OPC UA simulation
"""

import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class PropertyInfo:
    """Property 정보를 담는 클래스"""
    
    def __init__(self, id_short: str, value_type: str, path: List[str], 
                 submodel_id: str, default_value: Any = None, qualifiers: List[Dict] = None):
        self.id_short = id_short
        self.value_type = value_type
        self.path = path  # Property의 전체 경로 (Submodel -> Collection -> Property)
        self.submodel_id = submodel_id
        self.default_value = default_value
        self.qualifiers = qualifiers or []
        self.opcua_node_id = self._extract_opcua_node_id()
    
    def _extract_opcua_node_id(self) -> Optional[str]:
        """Qualifiers에서 opcuaNodeId 추출"""
        for qualifier in self.qualifiers:
            if qualifier.get("type") == "opcuaNodeId":
                return qualifier.get("value")
        return None
    
    def get_opcua_node_id(self, namespace_uri: str, namespace_idx: int) -> str:
        """OPC UA NodeId 생성"""
        if self.opcua_node_id:
            return self.opcua_node_id
        
        # 기본값이 없으면 경로 기반으로 생성
        path_str = "/".join(self.path)
        return f"nsu={namespace_uri};s={path_str}"
    
    def get_default_value(self) -> Any:
        """valueType에 따른 기본값 반환"""
        if self.default_value is not None:
            return self.default_value
        
        value_type = self.value_type.lower()
        if "double" in value_type or "float" in value_type:
            return 0.0
        elif "int" in value_type:
            return 0
        elif "bool" in value_type or "boolean" in value_type:
            return False
        elif "string" in value_type:
            return ""
        else:
            return None


class ModelParser:
    """AAS Model JSON 파서"""
    
    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        self.model_data = None
        self.properties: List[PropertyInfo] = []
        self.submodels: Dict[str, Dict] = {}
        
    def load(self):
        """모델 파일 로드"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        
        with open(self.model_path, 'r', encoding='utf-8') as f:
            self.model_data = json.load(f)
        
        # Submodel 딕셔너리 생성
        if "submodels" in self.model_data:
            for submodel in self.model_data["submodels"]:
                submodel_id = submodel.get("id", "")
                self.submodels[submodel_id] = submodel
        
        logger.info(f"Loaded model with {len(self.submodels)} submodels")
    
    def extract_properties(self) -> List[PropertyInfo]:
        """모든 Property 추출"""
        if not self.model_data:
            self.load()
        
        self.properties = []
        
        # 각 Submodel에서 Property 추출
        for submodel_id, submodel in self.submodels.items():
            submodel_id_short = submodel.get("idShort", "")
            if "submodelElements" in submodel:
                self._extract_properties_recursive(
                    submodel["submodelElements"],
                    [submodel_id_short],
                    submodel_id
                )
        
        logger.info(f"Extracted {len(self.properties)} properties")
        return self.properties
    
    def _extract_properties_recursive(self, elements: List[Dict], path: List[str], submodel_id: str):
        """재귀적으로 Property 추출"""
        for element in elements:
            model_type = element.get("modelType", "")
            id_short = element.get("idShort", "")
            current_path = path + [id_short] if id_short else path
            
            if model_type == "Property":
                value_type = element.get("valueType", "xs:string")
                default_value = element.get("value")
                qualifiers = element.get("qualifiers", [])
                
                property_info = PropertyInfo(
                    id_short=id_short,
                    value_type=value_type,
                    path=current_path,
                    submodel_id=submodel_id,
                    default_value=default_value,
                    qualifiers=qualifiers
                )
                self.properties.append(property_info)
                
            elif model_type == "SubmodelElementCollection":
                # Collection 내부의 요소들도 재귀적으로 탐색
                if "value" in element and isinstance(element["value"], list):
                    self._extract_properties_recursive(
                        element["value"],
                        current_path,
                        submodel_id
                    )
    
    def get_properties_by_submodel(self, submodel_id: str) -> List[PropertyInfo]:
        """특정 Submodel의 Property 목록 반환"""
        return [p for p in self.properties if p.submodel_id == submodel_id]
    
    def get_all_properties(self) -> List[PropertyInfo]:
        """모든 Property 반환"""
        if not self.properties:
            self.extract_properties()
        return self.properties


def map_value_type_to_variant_type(value_type: str):
    """AAS valueType을 OPC UA VariantType으로 매핑"""
    from asyncua import ua
    
    value_type = value_type.lower()
    
    if "double" in value_type or "float" in value_type:
        return ua.VariantType.Double
    elif "int32" in value_type or "int" in value_type:
        return ua.VariantType.Int32
    elif "int64" in value_type:
        return ua.VariantType.Int64
    elif "bool" in value_type or "boolean" in value_type:
        return ua.VariantType.Boolean
    elif "string" in value_type:
        return ua.VariantType.String
    else:
        return ua.VariantType.String  # 기본값

