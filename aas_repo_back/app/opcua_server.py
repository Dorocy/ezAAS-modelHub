#!/usr/bin/env python3
"""
Dynamic OPC UA Server Simulator for FA³ST AAS Testing
Dynamically generates OPC UA nodes based on model.json properties
"""

import asyncio
import logging
import random
import math
import os
import sys
from typing import Any, List, Dict, Optional
from datetime import datetime
from pathlib import Path

from asyncua import Server, ua
from asyncua.common.methods import uamethod

# Model parser import
sys.path.insert(0, str(Path(__file__).parent))
from model_parser import ModelParser, PropertyInfo, map_value_type_to_variant_type

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Namespace URI
NAMESPACE_URI = "http://example.com/factory/"


class DynamicSimulator:
    """동적으로 Property 값을 생성하는 시뮬레이터"""
    
    def __init__(self, property_info: PropertyInfo):
        self.property_info = property_info
        self.base_time = datetime.now()
        self.current_value = property_info.get_default_value()
        
    def generate_value(self) -> Any:
        """Property의 valueType에 따라 값을 생성"""
        value_type = self.property_info.value_type.lower()
        t = (datetime.now() - self.base_time).total_seconds()
        
        if "double" in value_type or "float" in value_type:
            # 숫자 값은 사인파 + 노이즈로 시뮬레이션
            base = float(self.current_value) if isinstance(self.current_value, (int, float)) else 0.0
            variation = 5.0 * math.sin(t * 0.1) + random.uniform(-1.0, 1.0)
            return round(base + variation, 2)
        
        elif "int" in value_type:
            # 정수 값은 범위 내에서 변동
            base = int(self.current_value) if isinstance(self.current_value, (int, float)) else 0
            variation = random.randint(-5, 5)
            return base + variation
        
        elif "bool" in value_type or "boolean" in value_type:
            # 불린 값은 주기적으로 토글
            cycle = int(t) % 10
            return cycle < 5
        
        elif "string" in value_type:
            # 문자열은 기본값 유지 또는 상태 문자열
            if self.current_value:
                return str(self.current_value)
            # idShort에 따라 상태 문자열 생성
            id_short_lower = self.property_info.id_short.lower()
            if "status" in id_short_lower:
                states = ["Idle", "Running", "Stopping", "Starting"]
                return states[int(t) % len(states)]
            elif "temperature" in id_short_lower:
                temp = 25.0 + 5.0 * math.sin(t * 0.1)
                return f"{temp:.1f}°C"
            else:
                return str(self.current_value) if self.current_value else ""
        
        return self.current_value
    
    def update(self):
        """값 업데이트"""
        self.current_value = self.generate_value()
        return self.current_value


async def create_opcua_node(server, parent_node, property_info: PropertyInfo, namespace_idx: int):
    """OPC UA 노드 생성"""
    node_id = property_info.get_opcua_node_id(NAMESPACE_URI, namespace_idx)
    
    # NodeId 파싱
    if node_id.startswith("nsu="):
        # nsu=http://example.com/factory/;s=Line1/MachineA/Temperature 형식
        parts = node_id.split(";s=")
        if len(parts) == 2:
            identifier = parts[1]
        else:
            identifier = property_info.id_short
    else:
        identifier = property_info.id_short
    
    # VariantType 결정
    variant_type = map_value_type_to_variant_type(property_info.value_type)
    
    # 기본값 결정
    default_value = property_info.get_default_value()
    
    try:
        # 노드 생성
        node = await parent_node.add_variable(
            ua.NodeId(identifier, namespace_idx),
            property_info.id_short,
            default_value,
            variant_type
        )
        await node.set_writable()
        logger.info(f"Created OPC UA node: {identifier} ({property_info.id_short})")
        return node
    except Exception as e:
        logger.error(f"Failed to create node {identifier}: {e}")
        return None


async def create_folder_structure(server, objects_node, properties: List[PropertyInfo], namespace_idx: int):
    """Property 경로를 기반으로 폴더 구조 생성"""
    folders = {}  # path -> node mapping
    nodes = {}  # property_info -> node mapping
    
    for prop in properties:
        path = prop.path
        current_node = objects_node
        
        # 경로를 따라 폴더 생성
        for i, folder_name in enumerate(path[:-1]):  # 마지막은 Property 이름
            folder_path = "/".join(path[:i+1])
            
            if folder_path not in folders:
                try:
                    # 부모 폴더 찾기
                    if i > 0:
                        parent_path = "/".join(path[:i])
                        parent_node = folders.get(parent_path, objects_node)
                    else:
                        parent_node = objects_node
                    
                    folder_node = await parent_node.add_folder(namespace_idx, folder_name)
                    folders[folder_path] = folder_node
                    logger.debug(f"Created folder: {folder_path}")
                except Exception as e:
                    logger.warning(f"Folder {folder_name} might already exist: {e}")
                    # 폴더가 이미 있으면 기존 노드 사용
                    folders[folder_path] = current_node
            
            current_node = folders[folder_path]
        
        # Property 노드 생성
        prop_node = await create_opcua_node(server, current_node, prop, namespace_idx)
        if prop_node:
            nodes[prop] = prop_node
    
    return nodes


async def main():
    """Main entry point for Dynamic OPC UA Server"""
    
    # Model 파일 경로 결정
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    model_path = project_root / "models" / "model.json"
    
    if not model_path.exists():
        logger.error(f"Model file not found: {model_path}")
        logger.info("Falling back to default hardcoded simulation")
        # 기본 시뮬레이션으로 폴백
        return await fallback_simulation()
    
    # Model 파싱
    logger.info(f"Loading model from: {model_path}")
    parser = ModelParser(str(model_path))
    parser.load()
    properties = parser.extract_properties()
    
    if not properties:
        logger.warning("No properties found in model. Using fallback simulation.")
        return await fallback_simulation()
    
    # OPC UA Server 초기화
    server = Server()
    await server.init()
    
    server.set_endpoint("opc.tcp://0.0.0.0:4840/freeopcua/server/")
    server.set_server_name("Dynamic AAS OPC UA Simulator")
    
    # Namespace 등록
    idx = await server.register_namespace(NAMESPACE_URI)
    logger.info(f"Registered namespace: {NAMESPACE_URI} with index {idx}")
    
    # Objects 노드 가져오기
    objects = server.nodes.objects
    
    # 동적 폴더 구조 및 노드 생성
    logger.info(f"Creating OPC UA nodes for {len(properties)} properties...")
    property_nodes = await create_folder_structure(server, objects, properties, idx)
    
    # 시뮬레이터 생성
    simulators = {}
    for prop in properties:
        if prop in property_nodes:
            simulators[prop] = DynamicSimulator(prop)
    
    logger.info(f"Starting OPC UA Server on opc.tcp://0.0.0.0:4840")
    logger.info(f"Simulating {len(simulators)} properties")
    
    # 서버 시작 및 값 업데이트 루프
    async with server:
        while True:
            for prop, simulator in simulators.items():
                if prop in property_nodes:
                    node = property_nodes[prop]
                    new_value = simulator.update()
                    
                    try:
                        variant_type = map_value_type_to_variant_type(prop.value_type)
                        await node.write_value(ua.Variant(new_value, variant_type))
                    except Exception as e:
                        logger.error(f"Failed to update {prop.id_short}: {e}")
            
            await asyncio.sleep(1)  # 1초마다 업데이트


async def fallback_simulation():
    """기본 하드코딩된 시뮬레이션 (model.json이 없을 때)"""
    logger.info("Running fallback simulation with default nodes")
    
    server = Server()
    await server.init()
    
    server.set_endpoint("opc.tcp://0.0.0.0:4840/freeopcua/server/")
    server.set_server_name("Factory OPC UA Simulator (Fallback)")
    
    idx = await server.register_namespace(NAMESPACE_URI)
    logger.info(f"Registered namespace: {NAMESPACE_URI} with index {idx}")
    
    objects = server.nodes.objects
    line1 = await objects.add_folder(idx, "Line1")
    machine_a = await line1.add_folder(idx, "MachineA")
    
    temp_a = await machine_a.add_variable(
        ua.NodeId("Line1/MachineA/Temperature", idx),
        "Temperature",
        25.5,
        ua.VariantType.Double
    )
    await temp_a.set_writable()
    
    logger.info("Fallback simulation started")
    
    async with server:
        t = 0
        while True:
            temp = 25.0 + 5.0 * math.sin(t * 0.1)
            await temp_a.write_value(ua.Variant(temp, ua.VariantType.Double))
            t += 1
            await asyncio.sleep(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}", exc_info=True)
