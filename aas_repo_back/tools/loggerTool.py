import os
import logging
import datetime
from config.config import get_config_value, get_section_dict
from tools.stringTool import newUUID
import psycopg

formatter = logging.Formatter('|%(asctime)s|==|%(name)s||%(levelname)s|\n\t%(message)s\n')
DEBUG_FLAG = get_config_value('debug', 'mode')
MSG_LENGTH = get_config_value('log', 'length', 'system')
LOG_NAME = get_config_value('log', 'name')
LOG_DBNAME = get_config_value('log', 'db_name')
DB_INFO = get_section_dict('postgres')

postConn = None

## 로그 메시지 중복 방지
def prevent_duplicate(logger):
    logger.propagate = False
    if logger.hasHandlers():
        logger.handlers.clear()


def infoLogger(msg: str = "", logName=None, target: str = "", user_seq: int = 0, errFlag=False):
    target = newUUID() if target == "" else target

    if logName is None:
        name = LOG_NAME
    else:
        name = f"{LOG_NAME}|{logName}{ '|' + target if target != '' else ''}|{user_seq}|"

    infoLog = logging.getLogger(name=name)
    infoLog.setLevel(logging.INFO)
    prevent_duplicate(infoLog)

    stream_handler = logging.StreamHandler() ## 스트림 핸들러 생성
    stream_handler.setFormatter(formatter) ## 텍스트 포맷 설정
    infoLog.addHandler(stream_handler) ## 핸들러 등록

    if DEBUG_FLAG == 1 and user_seq != 0:
        log_text = msg[:MSG_LENGTH] if len(msg) > MSG_LENGTH else msg
        if errFlag:
            infoLog.error("\n\t" + "-"*77 + f"\n\n\t\t\t{log_text}\n\n\t" + "-"*77)
        else:
            infoLog.info("\n\t" + "-"*77 + f"\n\n\t\t\t{log_text}\n\n\t" + "-"*77)

    return infoLog


# ✅ user_seq를 반드시 keyword로만 받도록 수정 완료
def dbLogger(
    msg: str = "",
    logName: str | None = None,
    target: str = "",
    *,
    user_seq: int = 0,
    errFlag: bool = False,
    dblogFlag: bool = True
):
    target = newUUID() if target == "" else target
    current_year = datetime.datetime.now().year
    log_table_name = f"{LOG_DBNAME}logs_{current_year}"
    global postConn

    if logName is None:
        name = LOG_NAME
    else:
        name = f"{LOG_NAME}|{logName}"

    try:
        infoLog = infoLogger(msg, logName, target, user_seq, errFlag)

        if postConn is None or postConn.closed:
            postConn = psycopg.connect(
                host=DB_INFO['host'], port=DB_INFO['port'],
                dbname=DB_INFO['database'], user=DB_INFO['username'],
                password=DB_INFO['password'],
                options="-c timezone=Asia/Seoul",
                connect_timeout=DB_INFO['timeout']
            )
        postCur = postConn.cursor()

        if dblogFlag and user_seq != 0:
            create_sql = f"""
                CREATE TABLE IF NOT EXISTS aasrepo.{log_table_name} (
                    dt TIMESTAMP,
                    log_type VARCHAR(50),
                    msg TEXT,
                    target VARCHAR(50),
                    state VARCHAR(50),
                    flag CHAR(1),
                    user_seq INT
                )
            """

            log_sql = f"""
                INSERT INTO aasrepo.{log_table_name}
                (dt, log_type, msg, target, state, flag, user_seq)
                VALUES (localtimestamp, %s, %s, %s, %s, 'N', %s)
            """

            params = (name, str(msg), target, "ERROR" if errFlag else "LOG", user_seq)

            postCur.execute(create_sql)
            postCur.execute(log_sql, params)
            postConn.commit()

    except Exception as e:
        print("+"*150, f"\n {logName}|{target}|\n log db insert error : {str(e)} \n", "+"*150)

    return infoLog
