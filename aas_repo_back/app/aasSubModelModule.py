import base64
from typing import Union,Optional
from fastapi import UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from processor.postgresProcess import *
from tools.stringTool import dollarSign, validate_json
from pydantic import BaseModel
import io
import os
from io import BytesIO
import requests
import shutil
from app.etcModule import *
from app.aasUtils import clean_aas_metadata
import config.langConfig as LANG
from config.config import get_config_value 


## Submodel 리스트
async def aasSubModelListEvent(userinfo, title, searchKey, category_seq, pageNumber = 1, pageSize = 10, pageMode = False):
    
    lang_code = userinfo.lang_code if userinfo is not None else "1"

    user_group_seq = userinfo.user_group_seq if userinfo is not None else 3
    
    ## title == '' 일경우만 searchkey , 타이틀은 메인에서 넘어오는것
    if title != '':
        searchKey = ''

    ##메타 서치
    metadata_info = validate_json(searchKey)
    metadataSearch = metadata_info[1]
    def_metastring = "{}"
    if metadata_info[0]:
        searchKey = ""
    
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000032", lang_code) , "data" : ""}

    sql = f"""
    with min_tbl as (
        select submodel_id, min(submodel_seq) as min_submodel_seq
        from aasrepo.submodels
        group by submodel_id
        order by min_submodel_seq desc
    ), last_submodel_tbl as (
        select a.submodel_id, a.status, max(a.submodel_seq) as max_submodel_seq, b.min_submodel_seq
        from aasrepo.submodels a
        left join min_tbl b on a.submodel_id = b.submodel_id
        group by a.submodel_id, a.status, b.min_submodel_seq
        order by 3 desc, 4 desc
    )

    select dense_rank() over ( order by aa.min_submodel_seq desc) as group_seq 
    	, row_number() over (partition by aa.submodel_id  order by a.submodel_seq desc) as in_seq  
        , a.submodel_seq, a.submodel_name, a.submodel_id, a.submodel_version, a.submodel_semantic_id, a.submodel_type
        , a.description, a.category_seq,  CASE {lang_code}
                WHEN 1  THEN b.category_name
                WHEN 2  THEN b.category_name2
                WHEN 3  THEN b.category_name3
                WHEN 4  THEN b.category_name4
                WHEN 5  THEN b.category_name5
                ELSE b.category_name END as category_name, a.status, aasrepo.fncodenm(a.status, {lang_code} ) as status_nm, a.create_date
        , c.submodel_img, c.mime_type, c.filename
    from aasrepo.submodels a
    left join last_submodel_tbl as aa on a.submodel_seq = aa.max_submodel_seq
    join  aasrepo.categories b on  a.category_seq = b.category_seq
    left join aasrepo.aas_codeinfo e1
        on b.refcode1 = e1.code
    left join aasrepo.aas_codeinfo e2
        on e1.refcode1 = e2.code	
    left join aasrepo.aas_codeinfo e3
        on e2.refcode1 = e3.code		
    left join aasrepo.submodel_image as c on a.submodel_seq = c.submodel_seq
    where ('{category_seq}' =  case left('{category_seq}', 6) 
				when 'GRP100' then e3.code 
                when 'GRP200' then e2.code 
                when 'GRP300' then e1.code
				else b.category_seq::varchar end or '{category_seq}' = '')
        and ( lower(a.submodel_name) like '%' || lower('{searchKey}') || '%' 
            or lower(a.description) like '%' || lower('{searchKey}') || '%' 
            or lower(a.submodel_id) like '%' || lower('{searchKey}') || '%' 
            or lower(a.submodel_semantic_id) like '%' || lower('{searchKey}') || '%' 
        )
        and lower(a.submodel_name) like '%' || lower('{title}') || '%' 
        and ( jsonb_build_object (
            'assetAdministrationShells', a.metadata_aaset_administration_shells 
            , 'submodels', a.metadata_submodels 
            , 'conceptDescriptions', a.metadata_concept_descriptions
        ) @> '{metadataSearch}' or '{metadataSearch}' = '{def_metastring}' )
        and ( ( 3={user_group_seq} and a.status in ('published')  ) 
            or {user_group_seq} in (1, 2)	
            ) --일반사용자 일경우 추가
        and  aa.max_submodel_seq is not null
    
"""

    try:
        rst = await async_postQueryPageData(sql, pageNumber, pageSize , "", "", None, True, False, pageMode)

        if rst["result"] != "ok" :
            return JSONResponse(status_code=400, content=rstData) 
        
        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    

## AAS SubModel 중복 체크 (중복아닐경우 False, 나머지 True)
async def duplicateSubModelIdCheckEvent(submodel_id, submodel_seq : Union [int, str] = '', user_seq:int=0):
    sql = f"""
    select submodel_id
    FROM aasrepo.submodels a
    where submodel_id = {dollarSign(submodel_id)}
    and ( submodel_seq::varchar = '{submodel_seq}' or '{submodel_seq}' = '')
    """

    try:
        rst = await async_postQueryDataOne(sql, user_seq=user_seq)

        if rst["result"] == "ok" and rst["data"] == "":
            return False

        return True
        
    except Exception as e:
        return True


async def aasSubModelSaveCheckEvent(submodel_id):
    sql = f"""
    select submodel_seq
    FROM aasrepo.submodels a
    where submodel_id = {dollarSign(submodel_id)}
        and status in ( 'temporary', 'draft' )
    """

    try:
        rst = await async_postQueryDataOne(sql)

        if rst["data"] != "":
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000033").format(rst["data"]) , "data" : rst["data"]})
            
        return JSONResponse(status_code=200, content=rst) 

    except Exception as e:
        return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000034") , "data" : ""}) 
    
## AAS 모델 히스토리 리스트
async def aasSubModeHistoryListEvent(userinfo, aasmodel_seq):

    user_group_seq = userinfo.user_group_seq if userinfo is not None else 3
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"
        
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000035", lang_code) , "data" : ""}

    sql = f"""
    with submodel_list as (
	
        select a.submodel_seq as id, case when  a.status != 'published' then a.status else coalesce(a.submodel_version, '') end as text
        from aasrepo.submodels a
        join aasrepo.submodels aa on a.submodel_id = aa.submodel_id and aa.submodel_seq = {aasmodel_seq}
        where ( 'submodel' = 'submodel' or 'submodel' = '' )
            and ( (3={user_group_seq} and a.status in ('published')) or {user_group_seq} in (1, 2)  )
        order by a.submodel_seq	desc	 

    )    

    select *
    from submodel_list 
    """

    try:
        rst = await async_postQueryDataSet(sql)

        if rst["result"] != "ok" and len(rst["data"]) == 0:
            return JSONResponse(status_code=400, content=rst) 

        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 


## AAS SubModel ID 체크
async def aasSubModelIdCheckEvent(submodel_id, submodel_seq : Union [int, str] = ''):
    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000041") , "data" : False}

    try:
        
        if not await duplicateSubModelIdCheckEvent(submodel_id, submodel_seq):
            return JSONResponse(status_code=200, content={ "result" : "ok", "msg" : LANG.Message("LANG10000036") , "data" : False}) 
        else:
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000041") , "data" : True}) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    


## AAS 모델 상세 
async def aasSubModelDetailEvent(userinfo, submodel_seq):
    lang_code = "1" if userinfo is None else userinfo.lang_code

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000036", lang_code) , "data" : ""}

    sql = f"""
select a.submodel_seq, a.submodel_name, a.submodel_version, a.submodel_id, a.submodel_semantic_id, a.submodel_type, a.category_seq, a.creator
    , aasrepo.fncodenm(a.category_seq::varchar, {lang_code}, 'category') as category_name, a.description, a.status
    , a.guide_filename, a.guide_realpath  -- [신규] 가이드 파일 정보 추가(2025.11.18)
    -- [수정] 저장된 경로 앞에 '/'가 있든 없든 무조건 하나만 붙여서 절대 경로로 만듦
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
    , c.submodel_img, c.mime_type, c.filename, a.submodel_template_id
from aasrepo.submodels a
left join aasrepo.submodel_image c on a.submodel_seq = c.submodel_seq
where a.submodel_seq = {submodel_seq}
    """

    try:
        rst = await async_postQueryDataSet(sql)

        if rst["result"] != "ok" and len(rst["data"]) == 0:
            return JSONResponse(status_code=400, content={ "result" : "ok", "msg" : LANG.Message("LANG10000038", lang_code) , "data" : ""}) 

        return JSONResponse(status_code=200, content=rst) 
        
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 



## AAS 서브모델 임시 및 저장
# async def aasSubModelSaveEvent(userinfo, body: dict, image: Optional[UploadFile] = File(None) , is_temporary:bool = True, attachments: list[UploadFile] = File(default=None)):
async def aasSubModelSaveEvent(
    userinfo,
    body: str = Form(...), 
    image: Optional[UploadFile] = File(None),
    guide_pdf: Optional[UploadFile] = File(None),
    delete_guide: bool = Form(False),           
    is_temporary: bool = True,
    attachments: list[UploadFile] = File(default=None)
):
    # body가 bytes일 경우에만 파싱
    if isinstance(body, bytes):
        body = json.loads(body.decode('utf-8'))
    elif isinstance(body, str):
        body = json.loads(body)
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    # PDF 파일 크기 검사 (50MB)
    if guide_pdf and guide_pdf.size > 50 * 1024 * 1024:
        return JSONResponse(status_code=400, content={"result": "error", "msg": "Guide PDF file size exceeds 50MB limit.", "data": ""})

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000039", lang_code).format("Temporay" if is_temporary else "") , "data" : ""}

    status = ""
    submodel_semantic_id = ""
    submodel_template_id = ""
    submodel_id = ""
    submodel_seq = ""

    custom_args = []
    
    if "status" in body :
        status = body["status"]
    if "submodel_semantic_id" in body:
        submodel_semantic_id = body["submodel_semantic_id"]
    if "submodel_template_id" in body:
        submodel_template_id = body["submodel_template_id"]
    if "submodel_id" in body :
        submodel_id = body["submodel_id"]
    if "submodel_seq" in body :
        submodel_seq = body["submodel_seq"]

    if submodel_id  == "":
        return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000040", lang_code) , "data" : ""}) 

    # 검증 록직
    if not is_temporary:
        
        # ↓ 구조로 보내야됨
        # {
        #     "submodels": [submodel json내용]
        # }
        metadata = json.loads(body["metadata"])
        cleaned_metadata = clean_aas_metadata(metadata)

        rst = await verificationEvent(userinfo, cleaned_metadata, 'submodel', submodel_seq, submodel_id)

        if rst["result"] == "fail": 
            return JSONResponse(status_code=500, content={"result": "error", "msg": rst["msg"], "data": rst["data"]})
        # 성공 조건 확장 ('ok', 'success', 'PERFECT')
        elif rst["result"] in ["ok", "success"] or (rst.get("data") and "PERFECT" in str(rst.get("data"))):
            pass # 성공 시 다음 로직(저장)으로 진행
        else:
            return JSONResponse(status_code=400, content={"result": "error", "msg": rst["msg"], "data": ""})
        

    try:
        
        ## submodel_semantic_id = "" 최초 등록이니깐
        ## semantec_id 는 받아옴. 아이디가 버전마다 다르기 때문에 version 으로 변경
        if ((body["submodel_version"] == "" or body["submodel_version"] == "0.0" )  and submodel_seq == ""):
            ## 중복 submodel_id 체크
            if await duplicateSubModelIdCheckEvent(submodel_id, submodel_seq, user_seq=userinfo.user_seq):
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000041", lang_code) , "data" : ""}) 
        
        ## 현상태 비교
        ## 현재 시퀀스가 있을경우 해당 상태 체크
        ## 없을때는 시퀀스가 최근에 저장된게 있으면 리턴        
        if submodel_seq != "":
            sql  = f"""
                --내부적으로 배포가 되었으면
                select status
                from aasrepo.submodels
                where submodel_seq = {submodel_seq}
        """
            rst = await async_postQueryDataOne(sql, log_type = "SUBMODEL", user_seq=userinfo.user_seq)

            if (rst["result"] == "ok" and rst["data"] != status):
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000129", lang_code) , "data" : ""}) 
        
        ### 가장 최근 저장된거 있으면 해당된것 가져오기
        sql = f"""
        select submodel_seq
        FROM aasrepo.submodels a
        where submodel_id = {dollarSign(submodel_id)}
            and status in ( 'temporary', 'draft' )
        limit 1
        """

        rst = await async_postQueryDataOne(sql, log_type = "SUBMODEL", user_seq=userinfo.user_seq)

        if rst["data"] != "":
            submodel_seq  = rst["data"]
            
        ## 메타데이터 분할 넣기
        
        if body["metadata"] !="":
            try:
                # 1. metadata 문자열을 한 번만 파싱합니다.
                metadata_dict = json.loads(body["metadata"])
                
                # 2. metadata를 정리합니다.
                metadata_dict = clean_aas_metadata(metadata_dict)
                
                # 3. .get()을 사용하여 안전하게 키에 접근합니다. 키가 없으면 빈 리스트 '[]'를 사용합니다.
                custom_args.append(json.dumps(metadata_dict.get("assetAdministrationShells", []), ensure_ascii=False))
                custom_args.append(json.dumps(metadata_dict.get("submodels", []), ensure_ascii=False))
                custom_args.append(json.dumps(metadata_dict.get("conceptDescriptions", []), ensure_ascii=False))

            except json.JSONDecodeError as e:
                # metadata가 비어있지는 않지만, 유효한 JSON이 아닐 경우
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000051", lang_code).format(f"Invalid metadata JSON format: {e}"), "data" : ""})
            
        else:
            # metadata가 빈 문자열("")로 넘어온 경우
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000042", lang_code), "data" : ""})


        sql = f"""

    with inserted as (
        INSERT INTO aasrepo.submodels (submodel_seq, submodel_name, submodel_id
            , submodel_semantic_id, submodel_template_id, submodel_version, submodel_type
            , category_seq, description, status
            , metadata_aaset_administration_shells, metadata_submodels, metadata_concept_descriptions, creator, create_user_seq, create_date) 
        select { submodel_seq if submodel_seq != "" else "nextval('aasrepo.submodels_submodel_seq_seq'::regclass)"}, {dollarSign(body["submodel_name"])}
            , {dollarSign(submodel_id)}
            , {dollarSign(submodel_semantic_id) if submodel_semantic_id != "" else 'NULL'}
            , {dollarSign(submodel_template_id) if submodel_template_id != "" else 'NULL'}
            , {body["submodel_version"] if body["submodel_version"] != "" else 'NULL'}, NULL 
            , {body["category_seq"] if str(body["category_seq"]) != "" else 'NULL' }
            , {dollarSign(body["description"])}
            , '{ "temporary" if is_temporary else "draft" }'
            , %s, %s, %s
            , {dollarSign(body["creator"]) if "creator" in body and body["creator"] else 'NULL'}
            , {userinfo.user_seq}, localtimestamp
        ON CONFLICT (submodel_seq) 
        DO UPDATE SET
            submodel_name = EXCLUDED.submodel_name, submodel_type = EXCLUDED.submodel_type
            , category_seq = EXCLUDED.category_seq, description = EXCLUDED.description, status = EXCLUDED.status
            , submodel_template_id = EXCLUDED.submodel_template_id
            , metadata_aaset_administration_shells = EXCLUDED.metadata_aaset_administration_shells
            , metadata_submodels = EXCLUDED.metadata_submodels, metadata_concept_descriptions = EXCLUDED.metadata_concept_descriptions
            , creator = EXCLUDED.creator
            , create_user_seq = EXCLUDED.create_user_seq, create_date = EXCLUDED.create_date
        returning submodel_seq
    )
        """

        filename = None
        mime_type = None
        image_data = None

        if image and image.filename:
            filename = image.filename
            mime_type = image.content_type
            image_data = await image.read() 
            image_data = base64.b64encode(image_data).decode("utf-8")

            sql = sql + f"""
                , insert_img as (
                    insert into aasrepo.submodel_image ( submodel_seq, submodel_img, filename, mime_type)
                    select submodel_seq, %s, %s, %s
                    from inserted
                    ON CONFLICT (submodel_seq) 
                    DO UPDATE SET
                    submodel_img = EXCLUDED.submodel_img
                    , filename = EXCLUDED.filename
                    , mime_type = EXCLUDED.mime_type
                    returning submodel_seq, submodel_img
                )
            """

            custom_args.extend([image_data, filename, mime_type])
        else:
             sql = sql + f"""
                , del_img as (
                    delete from aasrepo.submodel_image a
                    using inserted b
                        where a.submodel_seq = b.submodel_seq
                )
        """

        ## 일반 저장일떄 혹시, 임시 저장 삭제
        if not is_temporary:
            sql = sql + f"""
                , deleted as (
	                delete from aasrepo.submodels
                    where status = 'temporary'
                        and submodel_id = {dollarSign(submodel_id)}
                    returning submodel_seq
                )
                
            """
        
        # 파일명 리스트만 추출
        extracted_files = {}
        attachments_list = []
        
        # multipart/form-data 로 넘어온 파일 처리
        if attachments and attachments[0]:
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
            sql += f"""
            , insert_attachments AS (
            INSERT INTO aasrepo.submodel_attachments (submodel_seq, filename, realpath)
            SELECT submodel_seq,
                    f.filename,
                    %s || '/submodel/' || submodel_seq::text || '/' || f.realpath
                FROM inserted,
                    json_to_recordset(%s) AS f(filename text, realpath text)
            ON CONFLICT (submodel_seq, filename) DO UPDATE
                SET realpath = EXCLUDED.realpath
            RETURNING submodel_seq
            )
            """ # noqa: E501
            custom_args.extend([url_prefix, json.dumps(attachments_list)])

        sql = sql + f"""
                select submodel_seq
                from inserted
        """ # noqa: E501
        rst = await async_postQueryDataOne(sql, None ,True, userinfo.user_seq, "SUBMODEL", custom_args)

        if rst["result"] != "ok" or rst["data"] == "":
            return JSONResponse(status_code=400, content=rst)
        
        submodel_seq_result = rst['data']

        # Guide PDF 파일 처리 로직
        try:
            # 1. 현재 저장된 가이드 파일 경로 조회
            current_guide_sql = f"SELECT guide_realpath FROM aasrepo.submodels WHERE submodel_seq = {submodel_seq_result}"
            rst_guide = await async_postQueryDataOne(current_guide_sql)
            current_guide_realpath_rel = rst_guide['data'] if rst_guide['result'] == 'ok' else None
            current_guide_realpath_abs = None
            
            upload_dir_base = get_config_value('file', 'fullpath') # (e.g., /app/files/aas_files/aas)

            if current_guide_realpath_rel:
                current_guide_realpath_abs = os.path.join(upload_dir_base, os.path.basename(current_guide_realpath_rel.lstrip('/')))


            # 2. 삭제 플래그가 True일 경우
            if delete_guide:
                update_sql = f"UPDATE aasrepo.submodels SET guide_filename = NULL, guide_mimetype = NULL, guide_realpath = NULL WHERE submodel_seq = {submodel_seq_result}"
                await async_postQueryDataOne(update_sql)
                if current_guide_realpath_abs and os.path.exists(current_guide_realpath_abs):
                    os.remove(current_guide_realpath_abs)
            
            # 3. 새 파일이 업로드된 경우
            elif guide_pdf:
                url_prefix_base = get_config_value('file', 'mainpath').lstrip('/') # (e.g., aas_files/aas)
                url_prefix = f"{url_prefix_base}/submodel" # submodel 경로

                # 파일 저장 경로 설정 (e.g., /app/files/aas_files/aas/submodel/123/guide)
                guide_dir_abs = os.path.join(upload_dir_base, 'submodel', str(submodel_seq_result), 'guide')
                os.makedirs(guide_dir_abs, exist_ok=True)
                
                guide_realpath_abs = os.path.join(guide_dir_abs, guide_pdf.filename)
                
                # DB에 저장될 상대 경로 (e.g., aas_files/aas/submodel/123/guide/my_guide.pdf)
                guide_realpath_rel = f"{url_prefix}/{submodel_seq_result}/guide/{guide_pdf.filename}"

                # 파일 저장
                with open(guide_realpath_abs, 'wb') as f:
                    f.write(await guide_pdf.read())
                
                # DB 업데이트
                update_sql = f"""
                    UPDATE aasrepo.submodels 
                    SET guide_filename = %s, guide_mimetype = %s, guide_realpath = %s 
                    WHERE submodel_seq = %s
                    RETURNING submodel_seq  -- [추가] 결과를 반환하도록 수정
                """
                params = [guide_pdf.filename, guide_pdf.content_type, guide_realpath_rel, submodel_seq_result]
                await async_postQueryDataOne(update_sql, 
                                             None,  # 2nd arg (conn)
                                             True,  # 3rd arg (commit)
                                             userinfo.user_seq, 
                                             "SUBMODEL",
                                             params) # 6th arg (custom_args)

                # 기존 파일이 있고, 새 파일과 이름이 다르면 기존 파일 삭제
                if current_guide_realpath_abs and current_guide_realpath_abs != guide_realpath_abs and os.path.exists(current_guide_realpath_abs):
                    os.remove(current_guide_realpath_abs)

        except Exception as e:
            dbLogger(f"Guide PDF processing failed for submodel_seq {submodel_seq_result}: {str(e)}", "File Error", "", user_seq=userinfo.user_seq)
        

        # 실제 파일 쓰기
        if attachments_list:
            upload_dir = get_config_value('file', 'fullpath')
            target_dir = os.path.join(upload_dir, 'submodel', str(submodel_seq_result)).replace('\\', '/')
            os.makedirs(target_dir, exist_ok=True)

            for file_path, content in extracted_files.items():
                save_path = os.path.join(target_dir, os.path.basename(file_path)).replace('\\', '/')
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, 'wb') as out_file:
                    out_file.write(content)
        
        rst["msg"] = LANG.Message("LANG10000043", lang_code).format('Temporary' if is_temporary else '') 
        return JSONResponse(status_code=200, content=rst) 

    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 



async def submodelDeleteEvent(userinfo, submodel_seq = ""):
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    rstData = { "result" : "error", "msg" : LANG.Message("LANG10000046", lang_code) , "data" : ""}

    try:


        ## 현상태 비교
        ## 현재 시퀀스가 있을경우 해당 상태 체크
        ## 없을때는 시퀀스가 최근에 저장된게 있으면 리턴
        if submodel_seq != "":
            sql  = f"""
                --내부적으로 배포가 되었으면
                select status
                from aasrepo.submodels
                where submodel_seq = {submodel_seq}
                    and status in ( 'temporary', 'draft' )
        """
            rst = await async_postQueryDataOne(sql, log_type = "SUBMODEL", user_seq=userinfo.user_seq)

            if (rst["result"] == "ok" and rst["data"] == "" ):
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000045", lang_code) , "data" : ""}) 

        else:
            return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000044", lang_code) , "data" : ""}) 


        sql =  f"""
                with base_data as (
                    select submodel_seq
                    from aasrepo.submodels
                    where submodel_seq = {submodel_seq}
                ), del_models as (

                    delete from aasrepo.submodels a
                    using base_data b 
                    where a.submodel_seq = b.submodel_seq

                ), del_img as (
                    delete from aasrepo.submodel_image a
                    using base_data b
                        where a.submodel_seq = b.submodel_seq
                )

                select submodel_seq 
                from base_data
                
"""
        
        rst = await async_postQueryDataOne(sql, None, True, userinfo.user_seq, "SUBMODEL" )

        if rst["result"] != 'ok' or rst["data"] == "":
            rst["msg"] = LANG.Message("LANG10000046", lang_code)
            return JSONResponse(status_code=400, content=rst)

        rst['msg'] = LANG.Message("LANG10000047", lang_code).format(rst['data'])
        return JSONResponse(status_code=200, content=rst)
    
    except Exception as e:
        rstData["msg"] = str(e)
        return JSONResponse(status_code=400, content=rstData) 
    

## Basyx AAS Import로 통합으로 미사용
async def aasSubModelFileImportEvent(userinfo, file, id):

    """
    AAS SubModel File Import
    """
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    if not file.filename.endswith(".json"): 
        return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000048", lang_code), "data": ""})

    try:
        contents = await file.read()

        return await aasSubModelImportEvent(userinfo, contents, id)

    except Exception as e:
        return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000051", lang_code).format(str(e)), "data": ""})


## Basyx AAS Import로 통합으로 미사용
async def aasSubModelMetadataImportEvent(userinfo, body, id):
    
    """
    AAS SubModel Json Import
    """
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    body["metadata"] = body["metadata"].replace("\\", "\\\\") if "metadata" in body else "{}"

    try:
        
        return await aasSubModelImportEvent(userinfo, body["metadata"], id)

    except Exception as e:
        return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000051", lang_code).format(str(e)), "data": ""})

## Basyx AAS Import로 통합으로 미사용
async def aasSubModelImportEvent(userinfo, contents, id):
    """
    AAS SubModel Import
    """
    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    try:


        json_data = json.loads(contents.decode("utf-8"))

        # BOM(Byte Order Mark) 문자 제거
        # json 에서 escape 처리된 문자 (\\uFEFF)로 존재하기 때문에 파싱 후 dict에서 제거해야 함

        json_data = remove_bom(json_data)

        if len(json_data.get("submodels")) == 0:
            return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000049", lang_code), "data": ""})

        submodel_id = json_data["submodels"][0]["id"]
        semantic_id = json_data["submodels"][0]["submodelElements"]["semanticId"]

        # id, semantic id 체크
        if not submodel_id and not semantic_id:
            return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000050", lang_code), "data": ""})
        elif not submodel_id:
            return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000095", lang_code), "data": ""})
        elif not semantic_id:
            return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000096", lang_code), "data": ""})

        semantic_id_value = None
        try:
            #keys = json_data["semanticId"]["keys"]
            keys = semantic_id["keys"]
            if isinstance(keys, list) and keys: # list, keys exist 체크
                semantic_id_value = keys[0].get("value", "")
        except Exception:
            semantic_id_value = None

        if not semantic_id_value:
            return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000138", lang_code), "data": ""})


        if not id:
            id_chk_rst = await duplicateSubModelIdCheckEvent(submodel_id, "")

            if id_chk_rst:
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000097", lang_code).format(submodel_id) , "data" : ""}) 
        else:
            if submodel_id != id:
                return JSONResponse(status_code=400, content={ "result" : "error", "msg" : LANG.Message("LANG10000098", lang_code).format(id, submodel_id), "data" : ""})
        
    except Exception as e:
        return JSONResponse(status_code=400, content={"result": "error", "msg": LANG.Message("LANG10000051", lang_code).format(str(e)) , "data": ""})

    return JSONResponse(status_code=200, content={"result": "ok", "msg": LANG.Message("LANG10000052", lang_code), "data": json_data})


## AASX 로 변경하면서 미사용
async def aasSubModelDownloadEvent(userinfo, id):

    lang_code = userinfo.lang_code if  userinfo is not None  else "1"

    metadata = await aasSubmodelMetadata(id)

    if not metadata:
        return JSONResponse(status_code=404, content={"result": "error", "msg": LANG.Message("LANG10000053", lang_code), "data": ""})

    try:
        json_data = metadata
    except json.JSONDecodeError as e:
        return JSONResponse(status_code=500, content={"result": "error", "msg": LANG.Message("LANG10000054", lang_code).format(str(e)) , "data": ""})

    # JSON 변환
    buffer = io.BytesIO()
    buffer.write(json.dumps(json_data, ensure_ascii=False, indent=4).encode("utf-8"))
    buffer.seek(0)

    return StreamingResponse(
        content=buffer,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=submodel_{id}.json"}
    )


# AAS Submodel Json 데이터 조회
async def aasSubmodelMetadata(model_key):

    sql = f"""
            SELECT 
                jsonb_build_object (
                    'assetAdministrationShells', a.metadata_aaset_administration_shells 
                    , 'submodels', a.metadata_submodels 
                    , 'conceptDescriptions', a.metadata_concept_descriptions
                )  as metadata
            FROM aasrepo.submodels a
            WHERE a.submodel_seq = {model_key};
            """
    rstData = await async_postQueryDataOne(sql)
    return rstData["data"]


# dict, list 안에 bom 문자 제거
def remove_bom(obj):
    if isinstance(obj, dict):
        return {k: remove_bom(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [remove_bom(v) for v in obj]
    elif isinstance(obj, str):
        return obj.replace('\ufeff', '')
    else:
        return obj