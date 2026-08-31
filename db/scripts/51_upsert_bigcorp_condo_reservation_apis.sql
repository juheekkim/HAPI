-- 51_upsert_bigcorp_condo_reservation_apis.sql
-- 로컬 관리자 화면에 등록된 리조트 > 대형법인사 > 콘도 예약 API 8종을 공유 가능한 DB 스크립트로 고정한다.
-- 신규 환경에서는 INSERT하고, 동일 domain이 존재하면 현재 스냅샷으로 갱신한다.

SET client_encoding TO 'UTF8';

BEGIN;

INSERT INTO api_specs (
  category, domain, name, description, endpoints, error_codes, display_order
) VALUES (
  'resort',
  'condo',
  '콘도 예약 API',
  '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다. (대형법인사용)',
  $condo_endpoints$[
  {
    "url": "HBSREMPRR9901",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_rsrvInfo.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.MEMB_NO",
        "type": "String",
        "label": "회원번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.CUST_IDNT_NO",
        "type": "String",
        "label": "고객 식별번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.CONT_NO",
        "type": "String",
        "label": "계약번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.PAKG_NO",
        "type": "String",
        "label": "패키지 번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.CPON_NO",
        "type": "String",
        "label": "쿠폰 번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_LOC_DIV_CD",
        "type": "String",
        "label": "S/C",
        "required": true
      },
      {
        "desc": "\"YYYYMMDD\" 형식",
        "name": "ds_rsrvInfo.ARRV_DATE",
        "type": "String",
        "label": "도착일자",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_ROOM_CNT",
        "type": "String",
        "label": "예약 객실 수",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_NM",
        "type": "String",
        "label": "투숙자명",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO2",
        "type": "String",
        "label": "투숙자 연락처2",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO3",
        "type": "String",
        "label": "투숙자 연락처3",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO4",
        "type": "String",
        "label": "투숙자 연락처4",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_NM",
        "type": "String",
        "label": "예약자명",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO2",
        "type": "String",
        "label": "예약자 연락처2",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO3",
        "type": "String",
        "label": "예약자 연락처3",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO4",
        "type": "String",
        "label": "예약자 연락처4",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.REFRESH_YN",
        "type": "String",
        "label": "리프레쉬 여부",
        "required": false
      }
    ],
    "description": "예약 요청",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_DS",
        "type": "String",
        "label": "처리 일시",
        "example": "2026-08-31 15:00:00"
      },
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_CD",
        "type": "String",
        "label": "처리 코드",
        "example": "00"
      },
      {
        "desc": "",
        "name": "ds_prcsResult.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "example": "0003976115"
      },
      {
        "desc": "",
        "name": "ds_prcsResult.MEMB_NO",
        "type": "String",
        "label": "회원번호",
        "example": "221200700"
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_NO",
        "type": "String",
        "label": "예약번호",
        "example": "2613666412"
      },
      {
        "desc": "",
        "name": "ds_prcsResult.ROOM_RATE",
        "type": "String",
        "label": "객실료",
        "example": "220000"
      }
    ],
    "responseExample": "{\n  \"ds_prcsResult\": [\n    {\n      \"PROC_DS\": \"2026-08-31 15:00:00\",\n      \"PROC_CD\": \"00\",\n      \"CUST_NO\": \"0003976115\",\n      \"MEMB_NO\": \"221200700\",\n      \"RSRV_NO\": \"2613666412\",\n      \"ROOM_RATE\": \"220000\"\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9902",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_cnclInfo.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_cnclInfo.RSRV_NO",
        "type": "String",
        "label": "예약번호 (10자리)",
        "required": true
      }
    ],
    "description": "예약 취소",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_DS",
        "type": "String",
        "label": "처리 일시",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_CD",
        "type": "String",
        "label": "처리 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.ARRV_DATE",
        "type": "String",
        "label": "도착 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.CHKOT_EXPT_DATE",
        "type": "String",
        "label": "퇴실 예정 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_CUST_NM",
        "type": "String",
        "label": "예약자명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_CUST_TEL_NO2",
        "type": "String",
        "label": "예약자 연락처2",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_CUST_TEL_NO3",
        "type": "String",
        "label": "예약자 연락처3",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_CUST_TEL_NO4",
        "type": "String",
        "label": "예약자 연락처4",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.INHS_CUST_NM",
        "type": "String",
        "label": "투숙자명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.INHS_CUST_TEL_NO2",
        "type": "String",
        "label": "투숙자 연락처2",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.INHS_CUST_TEL_NO3",
        "type": "String",
        "label": "투숙자 연락처3",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.INHS_CUST_TEL_NO4",
        "type": "String",
        "label": "투숙자 연락처4",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_DATE",
        "type": "String",
        "label": "예약 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.CUST_IDNT_NO",
        "type": "String",
        "label": "고객 식별 번호",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_prcsResult\": [\n    {\n      \"PROC_DS\": null,\n      \"PROC_CD\": null,\n      \"CUST_NO\": null,\n      \"LOC_CD\": null,\n      \"ARRV_DATE\": null,\n      \"OVNT_CNT\": null,\n      \"CHKOT_EXPT_DATE\": null,\n      \"RSRV_CUST_NM\": null,\n      \"RSRV_CUST_TEL_NO2\": null,\n      \"RSRV_CUST_TEL_NO3\": null,\n      \"RSRV_CUST_TEL_NO4\": null,\n      \"INHS_CUST_NM\": null,\n      \"INHS_CUST_TEL_NO2\": null,\n      \"INHS_CUST_TEL_NO3\": null,\n      \"INHS_CUST_TEL_NO4\": null,\n      \"RSRV_DATE\": null,\n      \"CUST_IDNT_NO\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9903",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_search.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.RSRV_NO",
        "type": "String",
        "label": "예약번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.RSRV_DATE_STRT",
        "type": "String",
        "label": "예약 일자 시작",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.RSRV_DATE_END",
        "type": "String",
        "label": "예약 일자 종료",
        "required": true
      }
    ],
    "description": "예약 조회",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_result.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_NO",
        "type": "String",
        "label": "예약번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.CPON_NO",
        "type": "String",
        "label": "쿠폰 번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.CONT_NO",
        "type": "String",
        "label": "계약 번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.BRCH_CD",
        "type": "String",
        "label": "사업장 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_DATE",
        "type": "String",
        "label": "예약 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ARRV_DATE",
        "type": "String",
        "label": "도착 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_ROOM_CNT",
        "type": "String",
        "label": "예약 객실 수",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.INHS_CUST_NM",
        "type": "String",
        "label": "투숙자명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.INHS_CUST_TEL_NO2",
        "type": "String",
        "label": "투숙자 연락처2",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.INHS_CUST_TEL_NO3",
        "type": "String",
        "label": "투숙자 연락처3",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.INHS_CUST_TEL_NO4",
        "type": "String",
        "label": "투숙자 연락처4",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_CUST_NM",
        "type": "String",
        "label": "예약자명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_CUST_TEL_NO2",
        "type": "String",
        "label": "예약자 연락처2",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_CUST_TEL_NO3",
        "type": "String",
        "label": "예약자 연락처3",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.RSRV_CUST_TEL_NO4",
        "type": "String",
        "label": "예약자 연락처4",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ROOM_RSRV_STAT_CD",
        "type": "String",
        "label": "객실 예약 상태 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ROOM_RSRV_STAT_NM",
        "type": "String",
        "label": "객실 예약 상태명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.CNCL_DATE",
        "type": "String",
        "label": "취소 일자",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_result\": [\n    {\n      \"CUST_NO\": null,\n      \"RSRV_NO\": null,\n      \"CPON_NO\": null,\n      \"CONT_NO\": null,\n      \"BRCH_CD\": null,\n      \"RSRV_DATE\": null,\n      \"ARRV_DATE\": null,\n      \"ROOM_TYPE_CD\": null,\n      \"RSRV_ROOM_CNT\": null,\n      \"OVNT_CNT\": null,\n      \"INHS_CUST_NM\": null,\n      \"INHS_CUST_TEL_NO2\": null,\n      \"INHS_CUST_TEL_NO3\": null,\n      \"INHS_CUST_TEL_NO4\": null,\n      \"RSRV_CUST_NM\": null,\n      \"RSRV_CUST_TEL_NO2\": null,\n      \"RSRV_CUST_TEL_NO3\": null,\n      \"RSRV_CUST_TEL_NO4\": null,\n      \"ROOM_RSRV_STAT_CD\": null,\n      \"ROOM_RSRV_STAT_NM\": null,\n      \"CNCL_DATE\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9903",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_rsrvInfo.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.CUST_IDNT_NO",
        "type": "String",
        "label": "고객 식별 번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_NO",
        "type": "String",
        "label": "예약번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.ARRV_DATE",
        "type": "String",
        "label": "도착 일자",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_NM",
        "type": "String",
        "label": "투숙자명",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO2",
        "type": "String",
        "label": "투숙자 연락처2",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO3",
        "type": "String",
        "label": "투숙자 연락처3",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.INHS_CUST_TEL_NO4",
        "type": "String",
        "label": "투숙자 연락처4",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_NM",
        "type": "String",
        "label": "예약자명",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO2",
        "type": "String",
        "label": "예약자 연락처2",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO3",
        "type": "String",
        "label": "예약자 연락처3",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_rsrvInfo.RSRV_CUST_TEL_NO4",
        "type": "String",
        "label": "예약자 연락처4",
        "required": true
      }
    ],
    "description": "예약 수정",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_DS",
        "type": "String",
        "label": "처리 일시",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.PROC_CD",
        "type": "String",
        "label": "처리 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.MEMB_NO",
        "type": "String",
        "label": "회원번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.RSRV_NO",
        "type": "String",
        "label": "예약번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_prcsResult.ROOM_RATE",
        "type": "String",
        "label": "객실료",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_prcsResult\": [\n    {\n      \"PROC_DS\": null,\n      \"PROC_CD\": null,\n      \"CUST_NO\": null,\n      \"MEMB_NO\": null,\n      \"RSRV_NO\": null,\n      \"ROOM_RATE\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9905",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_search.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.CONT_NO",
        "type": "String",
        "label": "계약번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.PAKG_NO",
        "type": "String",
        "label": "패키지 번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.CPON_NO",
        "type": "String",
        "label": "쿠폰 번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.STRT_DATE",
        "type": "String",
        "label": "시작 일자",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.END_DATE",
        "type": "String",
        "label": "종료 일자",
        "required": true
      }
    ],
    "description": "캐파 조회",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_result.PROC_DS",
        "type": "String",
        "label": "처리 일시",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.STRT_DATE",
        "type": "String",
        "label": "시작 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.END_DATE",
        "type": "String",
        "label": "종료 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.SESN_DATE",
        "type": "String",
        "label": "시즌 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.SESN_NM",
        "type": "String",
        "label": "시즌명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.ALLC_ROOM_CNT",
        "type": "String",
        "label": "할당 객실 수",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.RSRV_POSBL_CNT",
        "type": "String",
        "label": "잔여 객실 수",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.RSRV_LOC_DIV_CD",
        "type": "String",
        "label": "S/C",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_roomStatus.MSG",
        "type": "String",
        "label": "메시지",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_result\": [\n    {\n      \"PROC_DS\": null,\n      \"LOC_CD\": null,\n      \"STRT_DATE\": null,\n      \"END_DATE\": null\n    }\n  ],\n  \"ds_roomStatus\": [\n    {\n      \"SESN_DATE\": null,\n      \"SESN_NM\": null,\n      \"ROOM_TYPE_CD\": null,\n      \"ALLC_ROOM_CNT\": null,\n      \"RSRV_POSBL_CNT\": null,\n      \"RSRV_LOC_DIV_CD\": null,\n      \"LOC_CD\": null,\n      \"MSG\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9906",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_search.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.CONT_NO",
        "type": "String",
        "label": "계약번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.ARRV_DATE",
        "type": "String",
        "label": "도착 일자",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.CHKOT_EXPT_DATE",
        "type": "String",
        "label": "퇴실 예정 일자",
        "required": false
      },
      {
        "desc": "\"\" 입력 시, 전체 영업장 조회",
        "name": "ds_search.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "required": true
      }
    ],
    "description": "패키지 목록 조회",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_result.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.PAKG_NO",
        "type": "String",
        "label": "패키지 번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.PAKG_NM",
        "type": "String",
        "label": "패키지명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.VALI_PRID_STRT_DATE",
        "type": "String",
        "label": "유효 기간 시작 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.VALI_PRID_END_DATE",
        "type": "String",
        "label": "유효 기간 종료 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.SALE_STRT_DATE",
        "type": "String",
        "label": "판매 시작 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.SALE_END_DATE",
        "type": "String",
        "label": "판매 종료 일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.PAKG_TYPE_NM",
        "type": "String",
        "label": "패키지 타입",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_result\": [\n    {\n      \"LOC_CD\": null,\n      \"PAKG_NO\": null,\n      \"PAKG_NM\": null,\n      \"VALI_PRID_STRT_DATE\": null,\n      \"VALI_PRID_END_DATE\": null,\n      \"SALE_STRT_DATE\": null,\n      \"SALE_END_DATE\": null,\n      \"PAKG_TYPE_NM\": null,\n      \"OVNT_CNT\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9907",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_search.CUST_NO",
        "type": "String",
        "label": "고객번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.CONT_NO",
        "type": "String",
        "label": "계약번호",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.ARRV_DATE",
        "type": "String",
        "label": "도착 일자",
        "required": true
      },
      {
        "desc": "null 입력 시 ARRV_DATE + OVNT_CNT 로 대체 되어 조회(패키지의 경우 OVNT_CNT 대신 패키지의 세팅된 박수를 더하여 대체)",
        "name": "ds_search.SEARCH_END_DATE",
        "type": "String",
        "label": "조회 종료 일자",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.OVNT_CNT",
        "type": "String",
        "label": "박 수",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.RSRV_ROOM_CNT",
        "type": "String",
        "label": "예약 객실 수",
        "required": true
      },
      {
        "desc": "",
        "name": "ds_search.MEMB_NO",
        "type": "String",
        "label": "회원번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.PAKG_NO",
        "type": "String",
        "label": "패키지 번호",
        "required": false
      },
      {
        "desc": "",
        "name": "ds_search.RSRV_LOC_DIV_CD",
        "type": "String",
        "label": "예약처 구분 코드",
        "required": false
      }
    ],
    "description": "일별 객실료 조회",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_result.BSN_DATE",
        "type": "String",
        "label": "영업일자",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ROOM_RATE",
        "type": "String",
        "label": "객실료",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.LPAY_AMT",
        "type": "String",
        "label": "현지불 금액",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.UPGRAD_YN",
        "type": "String",
        "label": "업그레이드 여부",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.FEE_RATE",
        "type": "String",
        "label": "수수료율",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ORIG_ROOM_RATE",
        "type": "String",
        "label": "객실료 입금가",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.CALC_ROOM_RATE",
        "type": "String",
        "label": "수수료율 적용 객실료",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.GOODS_NM",
        "type": "String",
        "label": "부가 서비스명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.SVC_STDR_AMT",
        "type": "String",
        "label": "단가",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.SVC_QTY",
        "type": "String",
        "label": "수량",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.SVC_AMT",
        "type": "String",
        "label": "총 금액",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.FEE_RATE",
        "type": "String",
        "label": "수수료율",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.ORIG_SVC_RATE",
        "type": "String",
        "label": "부가 서비스 입금가",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_pakgAdiSvcList.CALC_SVC_RATE",
        "type": "String",
        "label": "수수료율 적용 총 금액",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_result\": [\n    {\n      \"BSN_DATE\": null,\n      \"ROOM_RATE\": null,\n      \"LPAY_AMT\": null,\n      \"UPGRAD_YN\": null,\n      \"FEE_RATE\": null,\n      \"ORIG_ROOM_RATE\": null,\n      \"CALC_ROOM_RATE\": null\n    }\n  ],\n  \"ds_pakgAdiSvcList\": [\n    {\n      \"GOODS_NM\": null,\n      \"SVC_STDR_AMT\": null,\n      \"SVC_QTY\": null,\n      \"SVC_AMT\": null,\n      \"FEE_RATE\": null,\n      \"ORIG_SVC_RATE\": null,\n      \"CALC_SVC_RATE\": null\n    }\n  ]\n}"
  },
  {
    "url": "HBSREMPRR9931",
    "method": "POST",
    "params": [
      {
        "desc": "",
        "name": "ds_search.PAKG_NO",
        "type": "String",
        "label": "패키지 번호",
        "required": true
      }
    ],
    "description": "패키지 구성 조회",
    "responseFields": [
      {
        "desc": "",
        "name": "ds_result.GOODS_NO",
        "type": "String",
        "label": "패키지 번호",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.GOODS_NM",
        "type": "String",
        "label": "패키지명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.BRCH_CD",
        "type": "String",
        "label": "사업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.BRCH_NM",
        "type": "String",
        "label": "사업장명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.LOC_CD",
        "type": "String",
        "label": "영업장 코드",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.LOC_NM",
        "type": "String",
        "label": "영업장명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.INNER_GOODS_NM",
        "type": "String",
        "label": "상품명",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.LOC_ROOM_TYPE_NM",
        "type": "String",
        "label": "객실 타입명 (홈페이지 표시)",
        "example": ""
      },
      {
        "desc": "",
        "name": "ds_result.ROOM_TYPE_CD",
        "type": "String",
        "label": "객실 타입 코드",
        "example": ""
      }
    ],
    "responseExample": "{\n  \"ds_result\": [\n    {\n      \"GOODS_NO\": null,\n      \"GOODS_NM\": null,\n      \"BRCH_CD\": null,\n      \"BRCH_NM\": null,\n      \"LOC_CD\": null,\n      \"LOC_NM\": null,\n      \"INNER_GOODS_NM\": null,\n      \"LOC_ROOM_TYPE_NM\": null,\n      \"ROOM_TYPE_CD\": null\n    }\n  ]\n}"
  }
]$condo_endpoints$::jsonb,
  $condo_error_codes$[]$condo_error_codes$::jsonb,
  1
)
ON CONFLICT (domain) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  endpoints = EXCLUDED.endpoints,
  error_codes = EXCLUDED.error_codes,
  display_order = EXCLUDED.display_order;

COMMIT;

