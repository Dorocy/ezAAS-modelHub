import psycopg
import json
from tools.stringTool import convert_null_to_blank
from config.config import get_section_dict
from typing import Union

#import processor.postgresProcess as postgre
language_dataset = []

DB_INFO = get_section_dict('postgres')

def getDataSet( qry ):

    data = []
    try:
        with psycopg.connect(
            host=DB_INFO['host'],
            port=DB_INFO['port'],
            dbname=DB_INFO['database'],
            user=DB_INFO['username'],
            password=DB_INFO['password'],
            options="-c timezone=Asia/Seoul",
            connect_timeout=DB_INFO['timeout']
        ) as conn:
            with conn.cursor() as postCur:
                postCur.execute(qry)
                rows = postCur.fetchall()

                columns = [column[0] for column in postCur.description]
                for row in rows:
                    data.append(dict(zip(columns, row)))

        if not data:
            return {"result": "nodata", "msg": "No data", "data": []}

        datas = json.dumps(data, default=str, indent=4, ensure_ascii=False)
        jsonDatas = json.loads(datas)
        jsonDatas = convert_null_to_blank(jsonDatas)

        rstData = {"result": "ok", "msg": "process finished", "data": jsonDatas}

    except Exception as e:
        rstData = {"result": "error", "msg": "error : " + str(e), "data": []}

    return rstData


def load_language_data():
    
    
    global language_dataset

    sql = f'''
SELECT code
	, CASE COALESCE(refcode1,'1') 
		WHEN '1' THEN codename 
		WHEN '2' THEN codename2
		WHEN '3' THEN codename3
		WHEN '4' THEN codename4 ELSE codename END AS language
    , codename
    , coalesce(codename2, codename) as codename2
    , coalesce(codename3, codename) as codename3
    , coalesce(codename4, codename) as codename4  
    , refcode1       
FROM aasrepo.aas_codeinfo
WHERE grpcode = 'LANG100'
    '''

    result = getDataSet(sql)

    #print("="*100, 'language_dataset' ,"="*100,result)

    if result["result"] == "ok":
        language_dataset = result["data"]
    else:
        # language_dataset = None
        language_dataset = []
        

if language_dataset is None or len(language_dataset) == 0:
    load_language_data()
    

def Message():
    """저장된 언어 데이터를 반환합니다."""
    return language_dataset

def Message(messageCode:str):
    return Message(messageCode, '1')

def Message(messageCode:str, lang_code:Union[int, str] = '1'):

    """저장된 언어 데이터를 반환합니다."""
    if language_dataset is None or len(language_dataset) == 0 :
        load_language_data()

    message = next((item['codename' + ('' if str(lang_code) == '1' else str(lang_code)) ] for item in language_dataset if item['code'] == messageCode), "")
    return message

# def Message(messageCode: str = "", lang_code: Union[int, str] = "1"):
#     global language_dataset

#     try:
#         if not language_dataset:
#             load_language_data()

#         if not language_dataset:
#             return messageCode

#         key = "codename" if str(lang_code) == "1" else f"codename{lang_code}"

#         return next(
#             (
#                 item.get(key, item.get("codename", messageCode))
#                 for item in language_dataset
#                 if item.get("code") == messageCode
#             ),
#             messageCode
#         )

#     except Exception:
#         return messageCode
    