from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.aasSubModelModule import *
from typing import Annotated, Union, Optional
from middleware.authMiddleware import verify_token
from app.aasInstanceModule import *
import json

router = APIRouter(prefix="/instance")

## Submodel 추가(사용안함)
@router.post("/submodel/merge", tags=["AAS_SubModel"], summary="AAS SubModel merge", description="AAS Instance에 Submodel 추가")
async def aasSubModelMerge(header:Annotated[dict, Depends(verify_token)], body: SubmodelMergeRequest):
    return await aasSubModelMergeEvent(header, body)


@router.get("/server/{instance_seq}", tags=['INSTANCE'], summary='AAS Instance 서버 패키지 다운로드')
async def download_instance_server(
    header: Annotated[dict, Depends(verify_token)],
    instance_seq: Union[int, str],
    background_tasks: BackgroundTasks # FastAPI로부터 주입받음
):
    # 서비스 함수 호출 시 background_tasks를 인자로 전달
    return await downloadInstanceServerEvent(header, instance_seq, background_tasks)


# AAS Instance ALL List
@router.get("/list/{category}/{pageNumber}/{pageSize}", tags=['INSTANCE'], summary='INSTANCE', description="INSTANCE LIST")
async def instanceList(
    header: Annotated[dict, Depends(verify_token)], 
    category: str = "all", 
    searchKey: str = "", 
    pageNumber: int = 1, 
    pageSize: int = 10, 
    p: str = "",
    create_user_seq: Optional[int] = None
):

    if category == "all":
        category = ""

    pageMode = False
    if p == "p":
        pageMode = True

    # instanceListEvent에 create_user_seq 전달
    return await instanceListEvent(header, category, searchKey, pageNumber, pageSize, pageMode, create_user_seq)


# AAS Instance Detail
@router.get("/{instance_seq}", tags=['INSTANCE'], summary='INSTANCE', description="INSTANCE DETAIL")
async def instanceInfo(header:Annotated[dict, Depends(verify_token)], instance_seq: int = 0):
    return await instanceInfoEvent(header, instance_seq)


# AAS Instance Save
@router.post("/data", tags=['INSTANCE'], summary='INSTANCE', description="INSTANCE SAVE")
async def instanceSave(
    header: Annotated[dict, Depends(verify_token)],
    # body 를 파일 파트(UploadFile)로 받는다.
    # 폼 텍스트 필드(Form)는 Starlette 의 multipart 파트당 1024KB 제한에 걸려
    # metadata 가 큰 인스턴스를 저장할 때 "Part exceeded maximum size of 1024KB" 400 에러가 났다.
    # 파일 파트는 디스크로 스풀링되어 해당 제한을 받지 않으므로 큰 payload 도 저장할 수 있다.
    # (구버전 프론트엔드 호환을 위해 Form 텍스트 필드도 fallback 으로 허용한다.)
    body: Optional[UploadFile] = File(default=None),
    body_text: Optional[bytes] = Form(default=None),
    attachments: list[UploadFile] = File(default=None)
):
    if body is not None:
        raw = await body.read()
    elif body_text is not None:
        raw = body_text
    else:
        raise HTTPException(status_code=400, detail="body is required")
    body_dict = json.loads(raw.decode('utf-8'))
    return await instanceSaveEvent(header, body_dict, attachments)


# AAS Instance Delete
@router.delete("/data", tags=['INSTANCE'], summary='INSTANCE', description="INSTANCE DELETE")
async def instanceDelete(header:Annotated[dict, Depends(verify_token)], instance_seq: Union[int, str]): # [수정] 함수명 중복 방지 (instanceSave -> instanceDelete)
    return await instanceDelEvent(header, instance_seq)


# AAS Instance Target AASMODEL List
@router.get("/list/{ty}/{category_seq}", tags=['INSTANCE'], summary='INSTANCE', description="INSTANCE AAS/SUB MODEL LIST")
async def instanceModelList(header:Annotated[dict, Depends(verify_token)], ty: str = "INSTANCE", category_seq: Union [int, str] = "all"):

    if category_seq == "all":
        category_seq = ""

    return await instanceModelListEvent(header, ty, category_seq)


# AAS Instance 전체 json 조회
@router.get("/detail/{instance_seq}", tags=['INSTANCE'], summary='AAS Instance 상세조회')
async def aasInstanceDetail(header:Annotated[dict, Depends(verify_token)], instance_seq: Union [int, str] = ""):
    return await aasInstanceDetailEvent(header, instance_seq)


# AAS Instance 검증 (KETI API)
@router.post("/verification", tags=['INSTANCE'], summary='AAS Instance 검증')
async def aasInstanceVerification(header:Annotated[dict, Depends(verify_token)], body: dict):
    return await aasInstanceVerificationEvent(header, body)


# @router.get("/server/{instance_seq}", tags=['INSTANCE'], summary='AAS Instance 서버 패키지 다운로드')
# async def download_instance_server(
#     header: Annotated[dict, Depends(verify_token)],
#     instance_seq: Union[int, str]
# ):
#     return await downloadInstanceServerEvent(header, instance_seq)
