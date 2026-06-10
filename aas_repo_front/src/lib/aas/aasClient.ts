/**
 * AAS SDK 클라이언트 - import 중앙화 계층
 *
 * `@aas-core-works/aas-core3.1-typescript` 의 서브모듈을 한 곳에서 re-export 한다.
 * 다른 lib/aas 파일과 (2단계 이후) 컴포넌트들은 SDK 를 직접 import 하지 않고
 * 항상 이 파일을 통해 접근한다. 그래야 SDK 버전 교체/모킹/경로 변경이 한 곳에서 끝난다.
 *
 * 주의: SDK 는 JSON 직렬화(jsonization)만 사용한다. XML(xmlization)은
 *       백엔드 BaSyx 흐름에서 처리하므로 여기서는 의도적으로 re-export 하지 않는다.
 */

import * as aasTypes from "@aas-core-works/aas-core3.1-typescript/types";
import * as aasJsonization from "@aas-core-works/aas-core3.1-typescript/jsonization";
import * as aasVerification from "@aas-core-works/aas-core3.1-typescript/verification";
import * as aasStringification from "@aas-core-works/aas-core3.1-typescript/stringification";

export { aasTypes, aasJsonization, aasVerification, aasStringification };
