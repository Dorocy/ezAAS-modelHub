import requests
import urllib3
import json
import re
import asyncio
import psycopg
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import httpx

from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from processor.postgresProcess import *
from tools.cryptoTool import encrypt_data, decrypt_data, generate_custom_symmetric_key
from tools.stringTool import convert_tuple_to_json_list, is_numeric_string, dollarSign
from tools.cryptoTool import create_access_token, create_full_token, check_password, encrypt_password, create_reset_mail_token, decode_reset_mail_token
from config.config import get_config_value
from io import BytesIO
import config.langConfig as LANG


async def getCodeListEvent(userinfo, type, ref_code1:str = "", ref_code2: str = "", ref_code3: str = ""):
    lang_code = "1" if userinfo is None else userinfo.lang_code

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000120", lang_code), "data" : ""}

    sql = f"""
            select *
            from aasrepo.fncodelist('{type}', '{lang_code}', '{ref_code1}', '{ref_code2}', '{ref_code3}') 
                
            """

    try:
        rst = await async_postQueryDataOne(sql)

        if rst["result"] != "ok" :
            return JSONResponse(status_code=400, content=rst) 
        
        return JSONResponse(status_code=201, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    

async def verificationEvent(userinfo, metadata, target_type, target_seq, target_id):
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"
    
    metadata_bytes = json.dumps(metadata).encode("utf-8")
    files = {
        "file": ("metadata.json", BytesIO(metadata_bytes), "application/json")
    }
    
    keti_api_url = get_config_value('keti_api', 'url')

    api_endpoint = "verification/metamodel" if target_type == 'instance' else "verification/template"
    api_url = f"{keti_api_url}/{api_endpoint}"

    print(f"\n[KETI 검증 시작] target_type={target_type}, api_url={api_url}")
    
    if target_type == 'instance':
        api_endpoint = "verification/metamodel"
    else:
        api_endpoint = "verification/template"
    
    api_url = f"{keti_api_url}/{api_endpoint}"

    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(api_url, files=files)

        print(f"[KETI 응답코드] {response.status_code}")
        
        if response.status_code != 200:
            validation_status = "error"
            validation_result = json.dumps({"error": f"KETI API returned status {response.status_code}", "response": response.text[:200]}, ensure_ascii=False)
        else:
            try:
                validation_response = response.json()
            except Exception as e:
                print(f"[KETI 응답 JSON 파싱 실패] {str(e)}")
                raise

            if validation_response.get("status", "").lower() == 'false': 
                validation_status = "error"
                validation_result = json.dumps(validation_response.get("error"), ensure_ascii=False)
            else:
                verification_data = validation_response.get("verification") or validation_response.get("verificiation")
                
                if verification_data:
                    validation_status = verification_data.get("result")
                    validation_result = json.dumps(verification_data.get("message"), ensure_ascii=False)
                else:
                    validation_status = "error"
                    validation_result = json.dumps({"error": "Invalid KETI API response structure", "response": validation_response}, ensure_ascii=False)

        print(f"[검증결과 저장] status={validation_status}, result={validation_result[:100]}")

        sql = """
            INSERT INTO aasrepo.validations
                (target_type, target_seq, target_id, validation_result, description, status, create_user_seq, create_date)
            VALUES (%s, %s, %s, %s, '', %s, %s, localtimestamp)
            RETURNING validation_seq;
        """

        args = (
            target_type,
            target_seq if target_seq else None,
            target_id,
            validation_result,
            validation_status,
            userinfo.user_seq
        )

        sql_rst = await async_postQueryDataOne(sql, None, True, userinfo.user_seq, target_type, tuple(args))

        if sql_rst.get('result') != 'ok':       
            return {"result": "error", "msg": "DB 저장 실패", "data": sql_rst}

        print(f"[검증 완료] status={validation_status}")

        if response.status_code != 200:
            return {"result": "error", "msg": f"KETI API call failed with status {response.status_code}", "data": response.text[:200]}
        
        if validation_response.get("status", "").lower() == 'false':
            return {"result" : "error", "msg" : json.dumps(validation_response.get("error"), ensure_ascii=False), "data" : ""}
        
        if validation_status and validation_status.lower() == 'failed': 
            return { "result" : "fail", "msg" : LANG.Message("LANG10000122", lang_code).format(target_type), "data" : validation_result }
        
        if validation_status and validation_status.lower() in ['pass', 'passed', 'success']:
            return {"result" : "ok", "msg" : "", "data" : ""}
        
        return {"result" : "error", "msg" : LANG.Message("LANG10000121", lang_code).format(target_type) , "data" : validation_result }

    except httpx.TimeoutException as e:
        print(f"[KETI 검증 예외 발생] Timeout: {str(e)}")
        return {"result" : "error", "msg" : LANG.Message("LANG10000123", lang_code).format(f"KETI API Timeout: {str(e)}"), "data" : ""}
    except httpx.RequestError as e:
        print(f"[KETI 검증 예외 발생] RequestError: {str(e)}")
        return {"result" : "error", "msg" : LANG.Message("LANG10000123", lang_code).format(f"KETI API Request Error: {str(e)}"), "data" : ""}
    except json.JSONDecodeError as e:
        print(f"[KETI 검증 예외 발생] JSONDecodeError: {str(e)}")
        return {"result" : "error", "msg" : LANG.Message("LANG10000123", lang_code).format(f"KETI API non-JSON response: {str(e)}"), "data" : ""}
    except Exception as e:
        print(f"[KETI 검증 예외 발생] {str(e)}")
        return {"result": "error", "msg": f"KETI 검증 중 오류 발생: {str(e)}", "data": ""}


async def fileListEvent(target_type, target_seq):
    """
    metadata에서 File 노드를 추출하여
    CTE(WITH files AS ..)로 만든 후,
    aasmodel_attachments와 JOIN하여 결과를 반환합니다.
    """

    try:
        # 1. metadata 조회
        sql_meta = ""
        if target_type == 'aasmodel':
            sql_meta = f"""
                SELECT aas.aasmodel_seq as seq,
                       NULL as instance_seq, -- N/A for aasmodel
                       jsonb_build_object (
                            'assetAdministrationShells', aas.metadata_aaset_administration_shells 
                            , 'submodels', aas.metadata_submodels 
                            , 'conceptDescriptions', aas.metadata_concept_descriptions
                        ) as metadata,
                        NULL as submodel_seq_list_str
                  FROM aasrepo.aasmodels aas
                 WHERE aas.aasmodel_seq = {target_seq}
                   AND '{target_type}' = 'aasmodel'
            """
        elif target_type == 'instance':
            sql_meta = f"""
                SELECT ins_aas.aasmodel_seq as seq,
                       ins.instance_seq,
                       jsonb_build_object (
                            'base_data', aasrepo.fn_instance_merge(ins.instance_seq),
                            'inline_submodels', COALESCE(ins_aas.metadata_submodels, '[]'::jsonb), 
                            'linked_submodels_data', (
                                SELECT jsonb_agg(sm.metadata_submodels)
                                FROM aasrepo.aasinstance_aasmodel_submodels sm
                                WHERE sm.instance_seq = {target_seq}
                            )
                       ) as metadata,
                       (
                            SELECT string_agg(sm.submodel_seq::text, ',')
                            FROM aasrepo.aasinstance_aasmodel_submodels sm
                            WHERE sm.instance_seq = {target_seq}
                              AND sm.submodel_seq IS NOT NULL
                       ) as submodel_seq_list_str
                  FROM aasrepo.aasinstance ins 
                  JOIN aasrepo.aasinstance_aasmodels ins_aas ON ins_aas.instance_seq = ins.instance_seq
                 WHERE ins.instance_seq = {target_seq}
                   AND '{target_type}' = 'instance'
            """

        if not sql_meta:
             return { "files": [] }

        rst_meta = await async_postQueryDataSet(sql_meta)
        if rst_meta["result"] != "ok" or not rst_meta["data"]:
            print(f"[FILE DEBUG] Metadata fetch failed for {target_type} {target_seq}")
            return { "files": [] }

        metadata = rst_meta["data"][0]["metadata"]
        aasmodel_seq = rst_meta["data"][0]["seq"]
        instance_seq = rst_meta["data"][0].get("instance_seq")
        
        submodel_seq_list_str = rst_meta["data"][0].get("submodel_seq_list_str")
        submodel_seq_list = submodel_seq_list_str if submodel_seq_list_str else "NULL"

        # metadata → File (path, obj) 찾기
        def find_file_objects(obj, path="$"):
            out = []
            if isinstance(obj, dict):
                # modelType이 File인 경우 추출
                if obj.get("modelType") == "File":
                    out.append({"path": path, "obj": obj})
                
                # 재귀 탐색
                for k, v in obj.items():
                    if isinstance(v, (dict, list)):
                        out += find_file_objects(v, f"{path}.{k}")
                        
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, (dict, list)):
                        out += find_file_objects(item, f"{path}[{i}]")
            return out

        file_nodes = find_file_objects(metadata)

        if not file_nodes:
            print(f"[FILE DEBUG] No 'File' nodes found in metadata for {target_type} {target_seq}")
            return { "files": [] }

        # CTE
        rows = []
        for node in file_nodes:
            p = node["path"].replace("'", "''") 
            o = json.dumps(node["obj"], ensure_ascii=False).replace("'", "''")
            rows.append(f"  SELECT '{p}' AS node_level, '{o}'::jsonb AS obj")

        cte = "WITH files AS (\n" + "\n  UNION ALL\n".join(rows) + "\n)\n"

        base_url = get_config_value("file", "url")
        if not base_url:
            base_url = ""

        # 2. Attachment table JOIN logic
        sql_join = ""
        if target_type == 'aasmodel':
            sql_join = f"""
                FROM files
                JOIN aasrepo.aasmodel_attachments att
                  ON att.aasmodel_seq = {aasmodel_seq}
                 AND (
                    TRIM(att.realpath) = TRIM(files.obj ->> 'value') 
                    OR TRIM(att.filename) = TRIM(files.obj ->> 'value')
                    OR TRIM(att.filename) = TRIM(split_part(files.obj ->> 'value', '/', -1))
                 )
            """
        elif target_type == 'instance':
            sql_join = f"""
                FROM files
                LEFT JOIN (
                    -- 1. Instance attachments
                    SELECT instance_seq, NULL as aasmodel_seq, NULL as submodel_seq, filename, realpath
                    FROM aasrepo.aasinstance_attachments WHERE instance_seq = {instance_seq}

                    UNION

                    -- 2. Base AAS model attachments
                    SELECT NULL, aasmodel_seq, NULL, filename, realpath
                    FROM aasrepo.aasmodel_attachments WHERE aasmodel_seq = {aasmodel_seq}

                ) att ON (
                    TRIM(att.realpath) = TRIM(files.obj ->> 'value') 
                    OR TRIM(att.filename) = TRIM(files.obj ->> 'value')
                    OR TRIM(att.filename) = TRIM(split_part(files.obj ->> 'value', '/', -1))
                    OR TRIM(att.filename) = TRIM(split_part(files.obj ->> 'value', '\\', -1))
                )
            """

        # 3. Final SELECT
        # DB 경로와 실제 폴더 경로가 다를 경우(instance 누락) 보정하는 로직
        sql = cte + f"""
            SELECT DISTINCT ON (att.realpath)
                   att.realpath,
                   att.filename,
                   files.node_level,
                   files.obj,
                   CASE 
                       WHEN '{base_url}' = '' THEN 
                            CASE WHEN att.realpath LIKE '/%' THEN att.realpath ELSE '/' || att.realpath END
                       ELSE 
                            concat('http://', '{base_url}', 
                                CASE 
                                    -- 탐색기에 'instance' 폴더가 보이는데 DB 경로에는 없을 경우 강제 삽입
                                    WHEN att.realpath LIKE '/aas_files/aas/%' AND att.realpath NOT LIKE '%/instance/%' 
                                    THEN REPLACE(att.realpath, '/aas_files/aas/', '/aas_files/aas/instance/')
                                    ELSE att.realpath
                                END
                            )
                   END AS link
            {sql_join}
            WHERE att.realpath IS NOT NULL AND att.realpath != ''
            ORDER BY att.realpath
        """
        
        rst = await async_postQueryDataSet(sql)
        if rst["result"] != "ok":
            print(f"[FILE DEBUG] SQL execution failed: {rst.get('msg')}")
            return { "files": [] }

        return { "files": rst["data"] }

    except Exception as e:
        print(f"[FILE LIST ERROR] {str(e)}") 
        return { "files": [] }