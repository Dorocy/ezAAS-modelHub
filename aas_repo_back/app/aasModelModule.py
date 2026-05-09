import requests
import urllib3
import json
import re
import asyncio
import psycopg
import base64
import os
from typing import Union, Optional, Any 
from fastapi import UploadFile, File, Form
from fastapi.responses import JSONResponse
from processor.postgresProcess import *
from tools.stringTool import dollarSign, validate_json
from config.config import get_config_value
from zipfile import ZipFile
from io import BytesIO
import shutil
from app.etcModule import *
from app.aasUtils import clean_aas_metadata, clean_empty_structures
import app.basyxAasenvironmentModule as app_basyx
import config.langConfig as LANG
 


## AAS 모델 리스트
async def aasModelListEvent(userinfo, title, searchKey, category_seq, pageNumber = 1, pageSize = 10, pageMode = False, create_user_seq: Optional[int] = None):

    lang_code = userinfo.lang_code if  userinfo is not None  else "1"
    
    user_group_seq = userinfo.user_group_seq if userinfo is not None else 3

    ## title == '' 일경우만 searchkey , 타이틀은 메인에서 넘어오는것
    if title != '':
        searchKey = ''
        
            
    ##메타 서치
    meta_flag, meta_string = validate_json(searchKey)

    ##메타스트링에 key가 없으면, False
    if meta_flag:
        if not "key" in meta_string or not "value" in meta_string :
            meta_flag = False
    
    if meta_flag:
        searchKey = ""

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000032", lang_code) , "data" : ""}

    sql = f"""
    with min_tbl as (
        select aasmodel_id, min(aasmodel_seq) as min_aasmodel_seq
        from aasrepo.aasmodels
        group by aasmodel_id
        order by min_aasmodel_seq desc
    ),  last_aasmodel_tbl as (
        select a.aasmodel_id, a.status, max(a.aasmodel_seq) as max_aasmodel_seq, b.min_aasmodel_seq
        from aasrepo.aasmodels a
        left join min_tbl b on a.aasmodel_id = b.aasmodel_id
        group by a.aasmodel_id, a.status, b.min_aasmodel_seq
        order by 3 desc, 4 desc
    )

    select dense_rank() over ( order by aa.min_aasmodel_seq desc) as group_seq 
    	, row_number() over (partition by aa.aasmodel_id  order by a.aasmodel_seq desc) as in_seq 
        , a.aasmodel_seq, a.aasmodel_name,  a.aasmodel_id, a."version", a.aasmodel_template_id, a."type",  a.description, a.category_seq
        , a.creator
        , a.create_user_seq
        ,  CASE {lang_code}
                WHEN 1  THEN b.category_name
                WHEN 2  THEN b.category_name2
                WHEN 3  THEN b.category_name3
                WHEN 4  THEN b.category_name4
                WHEN 5  THEN b.category_name5
                ELSE b.category_name END as category_name, a.status, aasrepo.fncodenm(a.status, {lang_code} ) as status_nm, a.create_date
        , c.aasmodel_img, c.mime_type, c.filename
    from aasrepo.aasmodels a
    left join last_aasmodel_tbl aa on a.aasmodel_seq = aa.max_aasmodel_seq
    join  aasrepo.categories b on  a.category_seq = b.category_seq
    left join aasrepo.aas_codeinfo e1
        on b.refcode1 = e1.code
    left join aasrepo.aas_codeinfo e2
        on e1.refcode1 = e2.code	
    left join aasrepo.aas_codeinfo e3
        on e2.refcode1 = e3.code		  
    left join aasrepo.aasmodel_image c on a.aasmodel_seq = c.aasmodel_seq
    where ('{category_seq}' =  case left('{category_seq}', 6) 
				when 'GRP100' then e3.code 
                when 'GRP200' then e2.code 
                when 'GRP300' then e1.code
				else b.category_seq::varchar end or '{category_seq}' = '')
        and ( lower(a.aasmodel_name) like '%' || lower('{searchKey}') || '%' 
            or lower(a.description) like '%' || lower('{searchKey}') || '%' 
            or lower(a.aasmodel_id) like '%' || lower('{searchKey}') || '%' 
            or (a.aasmodel_template_id) like '%' || lower('{searchKey}') || '%' 
            )
        and lower(a.aasmodel_name) like '%' || lower('{title}') || '%' 
        { f"""and jsonb_path_exists(
        jsonb_build_object (
            'assetAdministrationShells', a.metadata_aaset_administration_shells 
            , 'submodels', a.metadata_submodels 
            , 'conceptDescriptions', a.metadata_concept_descriptions
        ) , '$.**."{meta_string["key"]}" ? (@ == "{meta_string["value"]}")')  """ if meta_flag else ''  }
        and ( (3={user_group_seq} and a.status in ('published')  )
             or {user_group_seq} in (1, 2)	) --일반사용자 일경우 배포된것만
        
        { f"and a.create_user_seq = {create_user_seq}" if create_user_seq is not None else "" }

        and  aa.max_aasmodel_seq is not null
    
"""

    try:
        
        rst = await async_postQueryPageData(sql, pageNumber, pageSize, "", "", None, True, False, pageMode)

        if rst["result"] != "ok" :
            return JSONResponse(status_code=400, content=rstData) 
        
        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    

## AAS 모델 중복 체크 (중복아닐경우 False, 나머지 True)
async def duplicateAasmodelIdCheckEvent(aasmodel_id, aasmodel_seq : Union [int, str] = '', user_seq:int=0):
    sql = f"""
    select aasmodel_id
    FROM aasrepo.aasmodels a
    where aasmodel_id = {dollarSign(aasmodel_id)}
        and (aasmodel_seq::varchar <> '{aasmodel_seq}' or '{aasmodel_seq}' = '' )
    """

    try:
        rst = await async_postQueryDataOne(sql, user_seq=user_seq)

        if rst["result"] == "ok" and rst["data"] == "":
            return False

        return True
        
    except Exception as e:
        return True

## 임시저장 // 저장 시 등록된 시퀀스 체크 
async def aasmodelSaveCheckEvent(aasmodel_id):
    sql = f"""
    select aasmodel_seq
    FROM aasrepo.aasmodels a
    where aasmodel_id = {dollarSign(aasmodel_id)}
        and status in ( 'temporary', 'draft' )
    """

    try:
        rst = await async_postQueryDataOne(sql)

        if rst["data"] != "":
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000033").format(rst["data"]) , "data" : rst["data"]}) 
            
        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000034") , "data" : ""}) 


## AAS MODEL ID 체크
async def aasmodelIdCheckEvent(aasmodel_id, aasmodel_seq : Union [int, str] = ''):
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000023") , "data" : False}

    try:
        
        if not await duplicateAasmodelIdCheckEvent(aasmodel_id, aasmodel_seq):
            return JSONResponse(status_code=200, content={ "result" : "ok", "msg" : LANG.Message("LANG10000022") , "data" : False}) 
        else:
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000023"), "data" : True}) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    


## AAS 모델 상세 
async def aasmodelDetailEvent(userinfo, aasmodel_seq):
    lang_code = "1" if userinfo is None else userinfo.lang_code
        
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000024", lang_code), "data" : ""}

    sql = f"""
select a.aasmodel_seq, a.aasmodel_name, a."version", a.aasmodel_id, a.aasmodel_template_id, a."type", a.category_seq
    , a.creator, a.create_user_seq
    , a.asset_type, a.aas_maturity_level
    , aasrepo.fncodenm(a.category_seq::varchar, {lang_code}, 'category') as category_name, a.description, a.status, a.source_project
    , a.guide_filename, a.guide_realpath  -- [신규] 가이드 파일 정보 추가(2025.11.18)
    , CASE 
        WHEN a.guide_realpath IS NOT NULL AND a.guide_realpath != '' 
        THEN '/' || ltrim(a.guide_realpath, '/') 
        ELSE NULL 
      END as guide_link
	,  jsonb_build_object (
            'assetAdministrationShells', a.metadata_aaset_administration_shells 
            , 'submodels', a.metadata_submodels 
            , 'conceptDescriptions', a.metadata_concept_descriptions
        ) as metadata
	, c.aasmodel_img, c.mime_type, c.filename
from aasrepo.aasmodels a
left join aasrepo.aasmodel_image c on a.aasmodel_seq = c.aasmodel_seq
where a.aasmodel_seq = {aasmodel_seq}
    """

    try:
        rst = await async_postQueryDataSet(sql)

        if rst["result"] != "ok" and len(rst["data"]) == 0:
            return JSONResponse(status_code=400, content={ "result" : "ok", "msg" : LANG.Message("LANG10000022", lang_code) , "data" : ""}) 

        json_str = await fileListEvent('aasmodel', aasmodel_seq)
        
        if isinstance(rst["data"][0], dict):
            rst["data"][0].update(json_str)

        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 

## AAS 모델 히스토리 리스트
async def aasmodelHistoryListEvent(userinfo, aasmodel_seq):

    user_group_seq = userinfo.user_group_seq if userinfo is not None else 3
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"
        
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000035", lang_code) , "data" : ""}

    sql = f"""
    with aasmodel_list as (
        
        select a.aasmodel_seq as id, case when  a.status != 'published' then a.status else coalesce(a.version, '') end as text
        from aasrepo.aasmodels a
        join aasrepo.aasmodels aa on a.aasmodel_id = aa.aasmodel_id and aa.aasmodel_seq = {aasmodel_seq}
        where ( (3={user_group_seq} and a.status in ( 'published')) or {user_group_seq} in (1, 2)  )
        order by a.aasmodel_seq	desc	 

    )    

    select id, text
    from aasmodel_list 
    """

    try:
        rst = await async_postQueryDataSet(sql)

        if rst["result"] != "ok" and len(rst["data"]) == 0:
            return JSONResponse(status_code=400, content=rst)

        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 



## AAS모델 임시 및 저장
# async def aasmodelSaveEvent(userinfo, body, image: Optional[UploadFile] = File(None), is_temporary:bool = True, attachments: list[UploadFile] = File(default=None)):
async def aasmodelSaveEvent(
    userinfo,
    body: str = Form(...),
    image: Optional[UploadFile] = File(None),
    guide_pdf: Optional[UploadFile] = File(None),
    delete_guide: bool = Form(False),            
    is_temporary: bool = True,
    attachments: list[UploadFile] = File(default=None)
):    

    print(f"\n[DEBUG] aasmodelSaveEvent 진입. is_temporary={is_temporary}", flush=True)

    # [수정] body가 bytes일 경우와 str일 경우 모두 처리
    if isinstance(body, bytes):
        body = json.loads(body.decode('utf-8'))
    elif isinstance(body, str):
        body = json.loads(body)
        
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    # [신규] PDF 파일 크기 검사 (50MB)
    if guide_pdf and guide_pdf.size > 50 * 1024 * 1024:
        print("[DEBUG] 400 ERROR: Guide PDF file size exceeds 50MB", flush=True)
        return JSONResponse(status_code=400, content={"result": "error", "msg": "Guide PDF file size exceeds 50MB limit.", "data": ""})

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000026", lang_code).format('Temporary' if is_temporary else '') , "data" : ""}
    aasmodel_template_id = ""
    status = ""
    aasmodel_id = ""
    aasmodel_seq = ""
    custom_args = []

    if "status" in body :
        status = body["status"]
    if "aasmodel_template_id" in body:
        aasmodel_template_id = body["aasmodel_template_id"]
    if "aasmodel_id" in body :
        aasmodel_id = body["aasmodel_id"]
    if "aasmodel_seq" in body :
        aasmodel_seq = body["aasmodel_seq"]

    
    # KETI 검증 API
    if not is_temporary:
        print("[DEBUG] KETI 검증 로직 진입...", flush=True)
        metadata = json.loads(body["metadata"])
        # [수정] Instance와 동일하게 clean_aas_metadata 및 clean_empty_structures 적용
        cleaned_metadata = clean_aas_metadata(metadata)
        cleaned_metadata = clean_empty_structures(cleaned_metadata) # 빈 구조도 정리
        
        rst = await verificationEvent(userinfo, cleaned_metadata, 'aasmodel', aasmodel_seq, aasmodel_id)

        if rst["result"] == "fail": 
            print(f"[DEBUG] 500 ERROR: KETI verification failed -> {rst['msg']}", flush=True)
            return JSONResponse(status_code=500, content={"result": "error", "msg": rst["msg"], "data": rst["data"]})
        # 성공 조건 확장 ('ok', 'success', 'PERFECT')
        elif rst["result"] in ["ok", "success"] or (rst.get("data") and "PERFECT" in str(rst.get("data"))):
            pass # 성공 시 pass 하여 아래의 저장(DB Insert/Update) 로직으로 진입
        else:
            print(f"[DEBUG] 400 ERROR: KETI verification result not OK -> {rst.get('msg')}", flush=True)
            # 검증 모듈 자체가 400에러를 반환할 수 있으므로, 해당 응답을 그대로 전달
            return JSONResponse(status_code=400, content={"result": "error", "msg": rst["msg"], "data": rst.get("data", "")})
        

    # 저장
    try:

        if aasmodel_id  == "":
            print("[DEBUG] 400 ERROR: aasmodel_id is empty", flush=True)
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000030", lang_code)  , "data" : ""}) 

        ## aasmodel_template_id 없으면 최초 등록이니깐
        ## template 아이디가 버전마다 다르기 때문에 version 으로 변경
        
        if ((body["version"] == "" or body["version"] == "0.0" ) and aasmodel_seq == ""):
            ## 중복 aasmode_id 체크
            if await duplicateAasmodelIdCheckEvent(aasmodel_id, aasmodel_seq, user_seq=userinfo.user_seq):
                print(f"[DEBUG] 400 ERROR: Duplicate AAS ID detected! -> {aasmodel_id}", flush=True)
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000023", lang_code) , "data" : ""}) 
            
        
        ## 현상태 비교
        ## 현재 시퀀스가 있을경우 해당 상태 체크
        ## 없을때는 시퀀스가 최근에 저장된게 있으면 리턴
        if aasmodel_seq != "":
            sql  = f"""
                --내부적으로 배포가 되었으면
                select status
                from aasrepo.aasmodels
                where aasmodel_seq = {aasmodel_seq}
        """
            rst = await async_postQueryDataOne(sql, log_type = "AASMODEL", user_seq=userinfo.user_seq)

            if (rst["result"] == "ok" and rst["data"] != status):
                print(f"[DEBUG] 400 ERROR: Status mismatch (Expected {status}, Got {rst['data']})", flush=True)
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG100000129", lang_code) , "data" : ""}) 


        ### 가장 최근 저장된거 있으면 해당된것 가져오기
        sql = f"""
        select aasmodel_seq
        FROM aasrepo.aasmodels a
        where aasmodel_id = {dollarSign(aasmodel_id)}
            and status in ( 'temporary', 'draft' )
        limit 1
        """

        rst = await async_postQueryDataOne(sql, log_type = "AASMODEL", user_seq=userinfo.user_seq)

        if rst["data"] != "":
            aasmodel_seq = rst["data"]
        
        if body["metadata"] !="":
 
            # 1. 프론트엔드에서 받은 metadata를 로드합니다.
            metadata_dict = json.loads(body["metadata"])
 
            # 2. 임포트 시와 동일하게 데이터 구조를 정리합니다.
            #    (예: description의 text: "" -> text: " ")
            metadata_dict = clean_aas_metadata(metadata_dict)
            metadata_dict = clean_empty_structures(metadata_dict)
 
            # 3. 정리된 metadata_dict를 사용해 custom_args를 채웁니다.
            custom_args.append(json.dumps(metadata_dict.get("assetAdministrationShells", []), ensure_ascii=False))
            custom_args.append(json.dumps(metadata_dict.get("submodels", []), ensure_ascii=False))
            custom_args.append(json.dumps(metadata_dict.get("conceptDescriptions", []), ensure_ascii=False))
            
        else:
            print("[DEBUG] 400 ERROR: Metadata is empty", flush=True)
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000042", lang_code) , "data" : ""}) 

        ##-> 저장/임시저장 template_id, 초기화:배포시마다 새로 채번 될꺼기때문에 -> 재적용 (끝 번호만 바뀌는)
        ##, {dollarSign(aasmodel_template_id) if aasmodel_template_id != "" else 'NULL'}
        ##{dollarSign(json.dumps(json.loads(body["metadata"]), ensure_ascii=False))  if body["metadata"] !="" else 'NULL' }
        sql = f"""
    with inserted as (
        INSERT INTO aasrepo.aasmodels (aasmodel_seq, aasmodel_name, aasmodel_id
            , aasmodel_template_id, version, type
            , category_seq, description, status, metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions
            , creator
            , asset_type, aas_maturity_level
            , create_user_seq, create_date)
        select { aasmodel_seq if aasmodel_seq != "" else "nextval('aasrepo.aasmodels_aasmodel_seq_seq'::regclass)"}, { dollarSign(body["aasmodel_name"])}, {dollarSign(aasmodel_id)}
            , {dollarSign(aasmodel_template_id) if aasmodel_template_id != "" else 'NULL'}
            , {dollarSign(body["version"]) if body["version"] != "" else 'NULL'}, NULL
            , {body["category_seq"] if str(body["category_seq"]) != "" else 'NULL' }
            , {dollarSign(body["description"])}
            , '{ "temporary" if is_temporary else "draft" }'
            ,  %s, %s, %s
            , {dollarSign(body["creator"]) if "creator" in body and body["creator"] else 'NULL'}
            , {dollarSign(body["asset_type"]) if "asset_type" in body and body["asset_type"] else 'NULL'}
            , {dollarSign(body["aas_maturity_level"]) if "aas_maturity_level" in body and body["aas_maturity_level"] else 'NULL'}
            , {userinfo.user_seq}, localtimestamp
        ON CONFLICT (aasmodel_seq) 
        DO UPDATE SET
            aasmodel_name = EXCLUDED.aasmodel_name, type = EXCLUDED.type
            , category_seq = EXCLUDED.category_seq, description = EXCLUDED.description, status = EXCLUDED.status
            , metadata_aaset_administration_shells = EXCLUDED.metadata_aaset_administration_shells
            , metadata_submodels = EXCLUDED.metadata_submodels, metadata_concept_descriptions = EXCLUDED.metadata_concept_descriptions
            , creator = EXCLUDED.creator
            , asset_type = EXCLUDED.asset_type, aas_maturity_level = EXCLUDED.aas_maturity_level
            , create_user_seq = EXCLUDED.create_user_seq, create_date = EXCLUDED.create_date
        returning aasmodel_seq
    )
        """

        filename = None
        mime_type = None
        image_data = None
        

        ## TODO 이미지 저장시 오류 체크 필요
        if image and image.filename:
            filename = image.filename
            mime_type = image.content_type
            image_data = await image.read() 
            image_data = base64.b64encode(image_data).decode("utf-8")

            sql = sql + f"""
                , insert_img as (
                    insert into aasrepo.aasmodel_image ( aasmodel_seq, aasmodel_img, filename, mime_type)
                    select aasmodel_seq, %s, %s, %s 
                    from inserted
                    ON CONFLICT (aasmodel_seq) 
                    DO UPDATE SET
                    aasmodel_img = EXCLUDED.aasmodel_img
                    , filename = EXCLUDED.filename
                    , mime_type = EXCLUDED.mime_type
                    returning aasmodel_seq
                )
        """
            custom_args.extend([image_data, filename, mime_type])
        else:
             sql = sql + f"""
                , del_img as (
                    delete from aasrepo.aasmodel_image a
                    using inserted b
                        where a.aasmodel_seq = b.aasmodel_seq
                )
        """
    
            
        ## 일반 저장일떄 혹시 임시저장 있으면 삭제 (=동일안 aasmodel_id)
        if not is_temporary:
            
            sql = sql + f"""
                , deleted as (
	                delete from aasrepo.aasmodels
                    where status = 'temporary'
                        and aasmodel_id = {dollarSign(aasmodel_id)}
                    returning aasmodel_seq
                )

            """
            
        
        
        # 파일명 리스트만 추출
        extracted_files = {}
        attachments_list = []
        
        # multipart/form-data 로 넘어온 파일 처리
        if attachments:
            for attachment in attachments:
                if attachment.filename:
                    content = await attachment.read()
                    extracted_files[attachment.filename] = content
                    attachments_list.append({
                        'filename': attachment.filename,
                        'realpath': attachment.filename.replace('\\', '/')
                    })


        if attachments_list:
            url_prefix = get_config_value('file', 'mainpath')
            # url_prefix가 None일 경우 기본값 설정
            if not url_prefix:
                url_prefix = "aas_files/aas" # (또는 config.ini에 설정된 기본 경로)

            # DB에 저장되는 realpath가 '//'로 시작하지 않도록 맨 앞의 '/'를 제거합니다.
            # config.yaml의 '/aas_files/aas'를 'aas_files/aas'로 만듭니다.
            url_prefix = url_prefix.lstrip('/')

            sql += f"""
            , insert_attachments AS (
            INSERT INTO aasrepo.aasmodel_attachments (aasmodel_seq, filename, realpath)
            SELECT aasmodel_seq,
                    f.filename,
                    -- url_prefix는 'aas_files/aas'로 시작합니다.
                    %s || '/' || aasmodel_seq::text || '/' || f.realpath
                FROM inserted,
                    json_to_recordset(%s) AS f(filename text, realpath text)
            ON CONFLICT (aasmodel_seq, filename) DO UPDATE
                SET realpath = EXCLUDED.realpath
            RETURNING aasmodel_seq
            )
            """
            custom_args.extend([url_prefix, json.dumps(attachments_list)])
        elif not attachments and aasmodel_id != "":
            sql += f"""
            , insert_attachments AS (
                INSERT INTO aasrepo.aasmodel_attachments (aasmodel_seq, filename, realpath)
                SELECT
                    inserted.aasmodel_seq,
                    att.filename,
                    att.realpath
                FROM inserted
                INNER JOIN (
                                SELECT aasmodel_seq
                                    FROM aasrepo.aasmodels
                                    WHERE aasmodel_id = {dollarSign(aasmodel_id)}
                                    AND status = 'published'
                                ORDER BY aasmodel_seq DESC
                                    LIMIT 1
                            ) AS prev
                        ON 1=1
                INNER JOIN aasrepo.aasmodel_attachments AS att
                        ON att.aasmodel_seq = prev.aasmodel_seq
                ON CONFLICT (aasmodel_seq, filename) DO UPDATE
                    SET realpath = EXCLUDED.realpath
                RETURNING aasmodel_seq
                )
            """


        # 최종 SELECT
        sql += """
                    SELECT aasmodel_seq 
                      FROM inserted
        """

        rst = await async_postQueryDataOne(sql, None, True, userinfo.user_seq, "AASMODEL", tuple(custom_args) )
        if rst.get('result') != 'ok' or rst.get('data') == '':
            print(f"[DEBUG] 400 ERROR: DB Insert Failed -> {rst}", flush=True)
            return JSONResponse(status_code=400, content=rst)

        aasmodel_seq = rst['data']

        # Guide PDF 파일 처리 로직
        try:
            # 1. 현재 저장된 가이드 파일 경로 조회 (SELECT)
            current_guide_sql = f"SELECT guide_realpath FROM aasrepo.aasmodels WHERE aasmodel_seq = {aasmodel_seq}"
            
            # 인자 순서 맞춤 (sql, conn, commit, user_seq, log_type, custom_args)
            rst_guide = await async_postQueryDataOne(current_guide_sql, 
                                                     None, 
                                                     False, 
                                                     userinfo.user_seq, 
                                                     "AASMODEL", 
                                                     None)
            
            current_guide_realpath_rel = rst_guide['data'] if rst_guide['result'] == 'ok' else None
            current_guide_realpath_abs = None
            
            upload_dir_base = get_config_value('file', 'fullpath') # (e.g., D:/.../aas_files/aas)

            if current_guide_realpath_rel:
                current_guide_realpath_abs = os.path.join(upload_dir_base, os.path.basename(current_guide_realpath_rel.lstrip('/')))


            # 2. 삭제 플래그가 True일 경우 (UPDATE)
            if delete_guide:
                update_sql = f"UPDATE aasrepo.aasmodels SET guide_filename = NULL, guide_mimetype = NULL, guide_realpath = NULL WHERE aasmodel_seq = {aasmodel_seq}"
                
                # [수정] 인자 순서 맞춤 및 commit=True
                await async_postQueryDataOne(update_sql, 
                                             None, 
                                             True, 
                                             userinfo.user_seq, 
                                             "AASMODEL", 
                                             None)
                
                if current_guide_realpath_abs and os.path.exists(current_guide_realpath_abs):
                    os.remove(current_guide_realpath_abs)
            
            # 3. 새 파일이 업로드된 경우 (UPDATE)
            elif guide_pdf:
                url_prefix = get_config_value('file', 'mainpath') # (e.g., /aas_files/aas)
                if not url_prefix: url_prefix = "aas_files/aas"
                
                # DB 저장 경로용 prefix 정리
                url_prefix = url_prefix.lstrip('/')

                # 파일 저장 경로 설정 (e.g., .../aas_files/aas/123/guide)
                guide_dir_abs = os.path.join(upload_dir_base, str(aasmodel_seq), 'guide')
                os.makedirs(guide_dir_abs, exist_ok=True)
                
                guide_realpath_abs = os.path.join(guide_dir_abs, guide_pdf.filename)
                
                # DB에 저장될 상대 경로 (e.g., aas_files/aas/123/guide/my_guide.pdf)
                guide_realpath_rel = f"{url_prefix}/{aasmodel_seq}/guide/{guide_pdf.filename}"

                # 파일 저장
                with open(guide_realpath_abs, 'wb') as f:
                    f.write(await guide_pdf.read())
                
                # DB 업데이트
                update_sql = f"""
                    UPDATE aasrepo.aasmodels 
                    SET guide_filename = %s, guide_mimetype = %s, guide_realpath = %s 
                    WHERE aasmodel_seq = %s
                    RETURNING aasmodel_seq -- [수정] RETURNING 절 추가 (에러 방지)
                """
                
                # [수정] 파라미터를 6번째 인자(custom_args)로 전달
                params = [guide_pdf.filename, guide_pdf.content_type, guide_realpath_rel, aasmodel_seq]
                await async_postQueryDataOne(update_sql, 
                                             None, 
                                             True, 
                                             userinfo.user_seq, 
                                             "AASMODEL", 
                                             params)

                # 기존 파일이 있고, 새 파일과 이름이 다르면 기존 파일 삭제
                if current_guide_realpath_abs and current_guide_realpath_abs != guide_realpath_abs and os.path.exists(current_guide_realpath_abs):
                    os.remove(current_guide_realpath_abs)

        except Exception as e:
            dbLogger(f"Guide PDF processing failed for aasmodel_seq {aasmodel_seq}: {str(e)}", "File Error", "", user_seq=userinfo.user_seq)

        # 실제 파일 쓰기 
        if extracted_files:
            upload_dir = get_config_value('file', 'fullpath')
            target_dir = os.path.join(upload_dir, str(aasmodel_seq)).replace('\\', '/')
            os.makedirs(target_dir, exist_ok=True)
            for file_path, content in extracted_files.items():
                # file_path에 디렉토리 구조가 포함될 수 있으므로 os.path.basename 사용
                save_path = os.path.join(target_dir, os.path.basename(file_path)).replace('\\', '/')
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, 'wb') as out_file:
                    out_file.write(content)

        rst['msg'] = LANG.Message("LANG10000029", lang_code).format('Temporary' if is_temporary else '') 
        return JSONResponse(status_code=200, content=rst)

    except Exception as e:
        import traceback
        # print(f"\n====== [ERROR] Register Failed ======", flush=True)
        # print(f"Error Message: {str(e)}", flush=True)
        # print(traceback.format_exc(), flush=True)  # 상세 에러 위치 출력
        # print(f"=====================================\n", flush=True)
        
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData)
    


async def aasmodelDeleteEvent(userinfo, aasmodel_seq = ""):
    
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000031", lang_code), "data" : ""}

    try:
        ## 현상태 비교
        ## 현재 시퀀스가 있을경우 해당 상태 체크
        ## 없을때는 시퀀스가 최근에 저장된게 있으면 리턴
        if aasmodel_seq != "":
            sql  = f"""
                --내부적으로 배포가 되었으면
                select status
                from aasrepo.aasmodels
                where aasmodel_seq = {aasmodel_seq}
                    and status in ( 'temporary', 'draft' )
        """
            rst = await async_postQueryDataOne(sql, log_type = "AASMODEL", user_seq=userinfo.user_seq)

            if (rst["result"] == "ok" and rst["data"] == "" ):
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000045", lang_code) , "data" : ""}) 

        else:
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000030", lang_code) , "data" : ""}) 


        sql =  f"""
                with base_data as (
                    select aasmodel_seq
                    from aasrepo.aasmodels
                    where aasmodel_seq = {aasmodel_seq}
                ), del_models as (

                    delete from aasrepo.aasmodels a
                    using base_data b 
                    where a.aasmodel_seq = b.aasmodel_seq

                ), del_img as (
                    delete from aasrepo.aasmodel_image a
                    using base_data b
                        where a.aasmodel_seq = b.aasmodel_seq
                ), del_attachments as (
                    delete from aasrepo.aasmodel_attachments a
                    using base_data b
                        where a.aasmodel_seq = b.aasmodel_seq
                )

                select aasmodel_seq 
                from base_data
                
"""
        
        rst = await async_postQueryDataOne(sql, None, True, userinfo.user_seq, "AASMODEL" )

        if rst["result"] != 'ok' or rst["data"] == "":
            rst["msg"] = LANG.Message("LANG10000031", lang_code)
            return JSONResponse(status_code=400, content=rst)
        
        # 파일 삭제
        try:
            upload_dir = get_config_value('file', 'fullpath')
            target_dir = f"{upload_dir}/{aasmodel_seq}"
            if aasmodel_seq and os.path.exists(target_dir):
                shutil.rmtree(target_dir) # 디렉토리 하위 전체 삭제
        except Exception as file_err:
            #dbLogger(f"File delete fail aasmodel_seq [{aasmodel_seq}]: {file_err}", 'File delete', "", user_seq=userinfo.user_seq)
            dbLogger(
                f"File delete fail aasmodel_seq [{aasmodel_seq}]: {file_err}",
                logName='File delete',
                target='',
                user_seq=userinfo.user_seq
            )

        rst['msg'] = LANG.Message("LANG10000047", lang_code).format(rst['data']) 
        return JSONResponse(status_code=200, content=rst)
    
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    



# file인 경우 contentType 필수입력. 첨부파일 있는 경우에만 검사
def find_invalid_file_nodes(data, path="", attached_files: Optional[set] = None):
    invalid_nodes = []

    if isinstance(data, dict):
        if data.get("modelType") == "File":
            value = data.get("value", "")
            content_type = data.get("contentType", "")

            # 첨부파일 있는 경우에만 검사
            if value and attached_files and value in attached_files:
                if not content_type or content_type.strip() == "":
                    invalid_nodes.append(path or "/")

        for key, val in data.items():
            new_path = f"{path}/{key}" if path else key
            invalid_nodes += find_invalid_file_nodes(val, new_path, attached_files)

    elif isinstance(data, list):
        for idx, item in enumerate(data):
            new_path = f"{path}[{idx}]"
            invalid_nodes += find_invalid_file_nodes(item, new_path, attached_files)

    return invalid_nodes