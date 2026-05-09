import json
import time
from fastapi import HTTPException
import psycopg
from psycopg import AsyncConnection
from starlette import status

from config.config import get_config_value, get_section_dict
from tools.loggerTool import *
from tools.stringTool import (
    convert_null_to_blank,
    valueValidationFalse,
    convert_ISO8601Date_to_Date,
    newUUID,
    debug_sql,
)
from tools.asyncTool import asyncify


#커넥션 타임 일단 7초
#디버그1이면 출력(오류제외), 개별설정을 위해변수처리
DEBUG_FLAG = get_config_value('debug', 'mode')
DB_INFO = get_section_dict('postgres')


# Sync DB Connection
def timescaleDB():
    return psycopg.connect(
        host=DB_INFO['host'],
        port=DB_INFO['port'],
        dbname=DB_INFO['database'],
        user=DB_INFO['username'],
        password=DB_INFO['password'],
        options="-c timezone=Asia/Seoul",
        connect_timeout=DB_INFO['timeout']
    )


# Async DB Connection
async def asyncTimescaleDB():
    return await AsyncConnection.connect(
        host=DB_INFO['host'],
        port=DB_INFO['port'],
        dbname=DB_INFO['database'],
        user=DB_INFO['username'],
        password=DB_INFO['password'],
        options="-c timezone=Asia/Seoul",
        connect_timeout=DB_INFO['timeout']
    )


def timescaleDB2(ip, port, id, pw, database):
    try:
        conn = psycopg.connect(
            host=ip,
            port=port,
            dbname=database,
            user=id,
            password=pw,
            options="-c timezone=Asia/Seoul",
            connect_timeout=DB_INFO['timeout']
        )
        return conn
    except Exception:
        return None

# 연결할 DB 상태확인
def postDBCheckEvent(dbinfo, user_seq: int = 0):
    msg = ""
    result = "Database connection error"

    try:
        sql = f"SELECT 'ONLINE' as status FROM pg_catalog.pg_database WHERE datname='{dbinfo['database']}'"
        rst = exPostQueryDataOne(dbinfo, sql, user_seq=user_seq)

        if rst["data"] != "":
            result = rst["data"]
        else:
            result = "Database connection error"

    except Exception as e:
        result = "Database connection error : " + str(e)
        dbLogger(str(e), "CONNECT_FAIL", user_seq=user_seq)

    return result

## postgresql 쿼리 실행
def exPostExecuteQuery(dbinfo, qry, postConn=None, autoCommit=True, user_seq: int = 0):
    if postConn is None:
        postConn = timescaleDB2(dbinfo["ip"], dbinfo["port"], dbinfo["id"], dbinfo["pw"], dbinfo["database"])
    if postConn is None:
        return {"result": "error", "msg": "Database connection error", "data": ""}
    return postExecuteQuery(qry, postConn, autoCommit, user_seq=user_seq)


## postgresql 쿼리 실행 (핵심 수정: dbLogger 인자)
def postExecuteQuery(qry, postConn=None, autoCommit=True, user_seq: int = 0):
    rstData = {"result": "ERROR", "msg": "ERROR", "data": []}
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1:
            start = time.time()

        if postConn is None:
            postConn = timescaleDB()

        postCur = postConn.cursor()

        dbLogger(qry, "EXCE_SQL", uuid_str, user_seq=user_seq)

        postCur.execute(qry)
        rstData = {"result": "ok", "msg": "Processing completed"}

        if postCur.description is not None and postCur.rowcount > 0:
            columns = [col[0] for col in postCur.description]
            data = [dict(zip(columns, tuple)) for tuple in postCur.fetchall()]
            rstData['data'] = data

        if autoCommit:
            postConn.commit()

        infoLogger(str(rstData), "EXCE_DATA", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "EXCE_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        rstData = {"result": "error", "msg": f"Error : {str(e)}"}
        if autoCommit:
            postConn.rollback()

    finally:
        postCur.close()
        if autoCommit and postConn:
            postConn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return rstData

## 프로시저 실행
def exPostCallProc(dbinfo, qry, parameters=None, postConn=None, autoCommit=True, user_seq: int = 0):
    if postConn is None:
        postConn = timescaleDB2(dbinfo["ip"], dbinfo["port"], dbinfo["id"], dbinfo["pw"], dbinfo["database"])
    if postConn is None:
        return {"result": "error", "msg": "Database connection error", "data": ""}
    return postCallProc(qry, parameters, postConn, autoCommit, user_seq=user_seq)


## 프로시저 실행
def postCallProc(qry, parameters=None, postConn=None, autoCommit=True, user_seq: int = 0):
    rstData = {"result": "ERROR", "msg": "ERROR", "data": ""}
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1:
            start = time.time()

        if postConn is None:
            postConn = timescaleDB()

        postCur = postConn.cursor()
        dbLogger(qry, "CALL_PROC", uuid_str, user_seq=user_seq)

        if parameters is None:
            postCur.callproc(qry)
        else:
            if DEBUG_FLAG == 1:
                print(qry, parameters)
            postCur.callproc(qry, parameters)

        result = postCur.fetchone()[0]

        if autoCommit:
            postConn.commit()

        rstData = {"result": "ok", "msg": "Processing completed", "data": result}

        dbLogger(result, "CALL_PROC", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "CALL_PROC_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        rstData = {"result": "error", "msg": f"ERROR : {str(e)}", "data": ""}
        if autoCommit:
            postConn.rollback()

    finally:
        postCur.close()
        if autoCommit and postConn:
            postConn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return rstData

## postgresql 다중 여러행 조회 (ex wrapper)
def exPostQueryDataSet(dbinfo, qry, postConn=None, autoCommit=True, user_seq: int = 0, *args):
    if postConn is None:
        postConn = timescaleDB2(dbinfo["ip"], dbinfo["port"], dbinfo["id"], dbinfo["pw"], dbinfo["database"])
    if postConn is None:
        return {"result": "error", "msg": "Database connection error", "data": ""}
    return postQueryDataSet(qry, postConn, autoCommit, user_seq=user_seq)


## postgresql 다중 여러행 조회 (실행)
def postQueryDataSet(qry, postConn=None, autoCommit=True, user_seq: int = 0, *args):
    rstData = {"result": "ERROR", "msg": "ERROR", "data": []}
    data = []
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1:
            start = time.time()

        if postConn is None:
            postConn = timescaleDB()

        postCur = postConn.cursor()
        dbLogger(qry, "SET_SQL", uuid_str, user_seq=user_seq)

        postCur.execute(qry, *args)
        rows = postCur.fetchall()
        columns = [column[0] for column in postCur.description]

        for row in rows:
            data.append(dict(zip(columns, row)))

        if not data:
            return {"result": "ok", "msg": "Data does not exist", "data": []}

        datas = json.dumps(data, default=str, indent=4, ensure_ascii=False)
        jsonDatas = convert_null_to_blank(json.loads(datas))

        if autoCommit:
            postConn.commit()

        rstData = {"result": "ok", "msg": "Processing completed", "data": jsonDatas}
        dbLogger(rstData, "SET_RESULT", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "SET_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        rstData = {"result": "error", "msg": f"ERROR : {str(e)}", "data": []}
        if autoCommit:
            postConn.rollback()

    finally:
        postCur.close()
        if autoCommit and postConn:
            postConn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return rstData


## 비동기 다중조회 (Thread wrapper 기반 async 처리)
async def asyncPostQueryDataSet(qry, postConn=None, autoCommit=True, user_seq: int = 0, *args):
    return await asyncify(postQueryDataSet)(qry, postConn, autoCommit, user_seq, *args)


## postgresql 단일값 조회 (ex wrapper)
def exPostQueryDataOne(dbinfo, qry, postConn=None, autoCommit=True, user_seq: int = 0, log_type: str = "", *args):
    if postConn is None:
        postConn = timescaleDB2(dbinfo["ip"], dbinfo["port"], dbinfo["id"], dbinfo["pw"], dbinfo["database"])
    if postConn is None:
        return {"result": "error", "msg": "Database connection error", "data": ""}
    return postQueryDataOne(qry, postConn, autoCommit, user_seq, log_type, *args)


## postgresql 단일값 조회 실행
def postQueryDataOne(qry, postConn=None, autoCommit=True, user_seq: int = 0, log_type: str = "", *args):
    rstData = {"result": "ERROR", "msg": "ERROR", "data": ""}
    uuid_str = newUUID()
    log_type = "|" + log_type if log_type else ""

    try:
        if DEBUG_FLAG == 1:
            start = time.time()

        if postConn is None:
            postConn = timescaleDB()

        postCur = postConn.cursor()
        dbLogger(f"{qry}", "ONE_SQL" + log_type, uuid_str, user_seq=user_seq)

        postCur.execute(qry, *args)
        row = postCur.fetchone()

        oData = row[0] if row else ""
        rstData = {"result": "ok", "msg": "Processing completed", "data": oData}

        if autoCommit:
            postConn.commit()

        dbLogger(rstData, "ONE_RESULT" + log_type, uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "ONE_FAIL" + log_type, uuid_str, errFlag=True, user_seq=user_seq)
        rstData = {"result": "error", "msg": f"Error {str(e)}", "data": ""}
        if autoCommit:
            postConn.rollback()

    finally:
        postCur.close()
        if autoCommit and postConn:
            postConn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return rstData

def postQueryPageData(qryTable, pageNumber: int = 1, pageSize: int = 10,
                      whereOption: str = "", orderby: str = "",
                      postConn=None, autoCommit=True, nullToBlank=False,
                      pageMode=True, user_seq: int = 0):

    uuid_str = newUUID()
    rstData = {"result": "error", "msg": "ERROR", "data": ""}

    if valueValidationFalse(whereOption) or valueValidationFalse(orderby):
        return {"result": "error", "msg": "[Warning] Forbidden characters detected", "data": ""}

    try:
        if DEBUG_FLAG == 1:
            start = time.time()

        if postConn is None:
            postConn = timescaleDB()

        postCur = postConn.cursor()
        if postConn is None:
            return {"result": "error", "msg": "Database connection error", "data": ""}

        # Query 정규화
        newQry = qryTable.strip()
        if newQry.startswith("(") and newQry.endswith(")"):
            newQry = newQry[1:-1]

        log_sql = f"""
        WITH baseTBL AS ({qryTable}),
        dataTBL AS (
            SELECT ROW_NUMBER() OVER ({f"ORDER BY {orderby}" if orderby else ""})
                   + (({pageNumber}-1) * {pageSize})::bigint AS "AAS_Seq_No",
                   *
            FROM baseTBL
            {whereOption if whereOption else ""}
            {f"ORDER BY {orderby}" if orderby else ""}
            {f"OFFSET (({pageNumber}-1) * {pageSize}) ROWS FETCH NEXT {pageSize} ROWS ONLY" if pageNumber else ""}
        ),
        totTBL AS (SELECT COUNT(*) AS "recordsTotal" FROM baseTBL),
        filterTBL AS (
            {f'SELECT COUNT(*) AS "recordsFiltered" FROM baseTBL {whereOption}' if whereOption else 'SELECT "recordsTotal" AS "recordsFiltered" FROM totTBL'}
        ),
        jsonDataTBL AS (
            SELECT row_to_json(r) AS JsonData FROM dataTBL r
        )
        SELECT row_to_json(r) AS results
        FROM (
            SELECT {pageNumber}::bigint AS draw,
                   coalesce(b."recordsTotal", 0) AS "recordsTotal",
                   c."recordsFiltered",
                   (SELECT json_agg(j.JsonData) FROM jsonDataTBL j) AS data
            FROM totTBL b, filterTBL c
        ) r
        """

        dbLogger(log_sql, "EX_PAGE_SQL", uuid_str, user_seq=user_seq)
        postCur.execute(log_sql)
        result = postCur.fetchone()[0]

        result = convert_null_to_blank(result) if nullToBlank else result
        result = convert_ISO8601Date_to_Date(result)

        if autoCommit:
            postConn.commit()

        rstData = {"result": "ok", "msg": "Processing completed", "data": result}
        dbLogger(rstData, "EX_PAGE_RESULT", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "EX_PAGE_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        rstData = {"result": "error", "msg": f"ERROR {str(e)}", "data": ""}
        if autoCommit:
            postConn.rollback()

    finally:
        postCur.close()
        if autoCommit and postConn:
            postConn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return rstData

async_postQueryDataOne = asyncify(postQueryDataOne)
async_postQueryDataSet = asyncify(postQueryDataSet)
async_postQueryPageData = asyncify(postQueryPageData)
async_postExecuteQuery = asyncify(postExecuteQuery)


# ==========================
# 조회 유틸 함수 모음
# ==========================

def find_one(query, user_seq: int = 0):
    conn = timescaleDB()
    cursor = conn.cursor()
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1: start = time.time()

        cursor.execute(query)
        fetch_one = cursor.fetchone()
        fetch_one = fetch_one[0] if fetch_one is not None else ""

        dbLogger(fetch_one, "FIND_ONE", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "FIND_ONE_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    finally:
        cursor.close()
        conn.close()

        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return fetch_one


def find_one_as_dict(query, user_seq: int = 0):
    conn = timescaleDB()
    cursor = conn.cursor()
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1: start = time.time()

        cursor.execute(query)
        row = cursor.fetchone()

        if row is None:
            return None

        columns = [col[0] for col in cursor.description]
        data = dict(zip(columns, row))

        dbLogger(data, "FIND_ONE_DICT", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "FIND_ONE_DICT_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    finally:
        cursor.close()
        conn.close()
        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return data


def find_all(query, user_seq: int = 0):
    conn = timescaleDB()
    cursor = conn.cursor()
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1: start = time.time()

        cursor.execute(query)
        rows = cursor.fetchall()

        columns = [col[0] for col in cursor.description]
        result = [dict(zip(columns, row)) for row in rows]

        dbLogger(result, "FIND_ALL", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "FIND_ALL_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    finally:
        cursor.close()
        conn.close()
        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return result


def find_all_as_dict(query, user_seq: int = 0):
    conn = timescaleDB()
    cursor = conn.cursor()
    uuid_str = newUUID()

    try:
        if DEBUG_FLAG == 1: start = time.time()

        cursor.execute(query)
        rows = cursor.fetchall()

        result = {k: v for k, v in rows}

        dbLogger(result, "FIND_ALL_DICT", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "FIND_ALL_DICT_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    finally:
        cursor.close()
        conn.close()
        if DEBUG_FLAG == 1:
            print("Processing Time : {} seconds".format(str(time.time() - start)))

    return result


# ==========================
# 컬럼 리스트 조회
# ==========================

def get_col_list(query, conn=None, user_seq: int = 0):

    uuid_str = newUUID()

    try:
        if conn is None:
            conn = timescaleDB()

        cursor = conn.cursor()
        cursor.execute(query)

        result = ["AAS_Seq_No"] + [col[0] for col in cursor.description]

        dbLogger(result, "GET_COL_LIST", uuid_str, user_seq=user_seq)

    except Exception as e:
        dbLogger(str(e), "GET_COL_LIST_FAIL", uuid_str, errFlag=True, user_seq=user_seq)
        result = ["AAS_Seq_No"]

    finally:
        cursor.close()
        if conn: conn.close()

    return result


# ==========================
# 비동기 래핑 처리
# ==========================

async_find_one_as_dict = asyncify(find_one_as_dict)
async_find_one = asyncify(find_one)
async_find_all = asyncify(find_all)
