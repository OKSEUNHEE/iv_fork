"""우체국 예금 Best 금리를 조회하고 응답 형식을 출력한다."""

import json
import os
from typing import Any

import requests


BASE_URL = "https://apis.data.go.kr/B552886/svc_postDepoBest"
# 기존 소스의 "인증키" 문자열은 실제 키가 아니어도 API 요청에 포함됐다.
# 환경 변수로만 받아 키를 코드와 버전 관리에서 분리한다.
API_KEY = os.environ.get("POST_DEPOSIT_API_KEY", "")


def extract_items(data: dict[str, Any]) -> list[dict[str, Any]]:
    """공공데이터포털의 단건·복수건 응답을 동일한 목록으로 변환한다."""
    items = (
        data.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )
    if isinstance(items, dict):
        # 기존 소스와 같이 단건 응답도 항상 목록으로 맞춰 이후 순회를 안전하게 한다.
        return [items]
    return items if isinstance(items, list) else []


def print_items(items: list[dict[str, Any]]) -> None:
    if not items:
        print("항목 데이터 없음 — 응답 구조를 직접 확인하세요.")
        return

    print("\n[우체국 예금 Best 상품 목록]")
    print(f"{'순위':<4} {'상품명':<20} {'기간':<8} {'기본금리':>8} {'최고금리':>8}")
    print("-" * 55)
    for idx, item in enumerate(items, 1):
        name = item.get("finPrdtNm", item.get("prdtNm", "-"))
        period = item.get("saveTrm", item.get("term", "-"))
        base_rate = item.get("intrRate", item.get("baseRate", "-"))
        max_rate = item.get("intrRate2", item.get("maxRate", "-"))
        print(
            f"{idx:<4} {name:<20} {str(period) + '개월':<8} "
            f"{str(base_rate) + '%':>8} {str(max_rate) + '%':>8}"
        )


def fetch_best_deposits(api_key: str) -> list[dict[str, Any]]:
    """API를 호출하고, HTTP·JSON 오류를 사람이 읽을 수 있게 보고한다."""
    params = {
        "serviceKey": api_key,
        "numOfRows": 10,
        "pageNo": 1,
        "resultType": "json",
    }
    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        print(f"상태 코드 : {response.status_code}")
        print(f"요청 URL  : {response.url}\n")
        response.raise_for_status()
        data = response.json()
    # 기존 소스는 HTTP 200이어도 JSON이 아닌 응답에서 예외가 발생했다.
    except requests.exceptions.JSONDecodeError:
        print("JSON 응답이 아닙니다.")
        return []
    # 기존 소스는 상태 코드를 출력만 하고 비정상 HTTP 응답 본문을 계속 처리했다.
    except requests.RequestException as error:
        print(f"요청 실패: {error}")
        return []

    if not isinstance(data, dict):
        print("예상한 JSON 객체 응답이 아닙니다.")
        return []
    print("[전체 응답 JSON]")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return extract_items(data)


def main() -> None:
    print("=" * 55)
    print("  우체국 예금 Best 금리 조회")
    print("=" * 55)

    if not API_KEY:
        # 유효하지 않은 기본 키로 불필요한 외부 요청 및 오류 메시지가 발생하던 문제를 막는다.
        print("POST_DEPOSIT_API_KEY 환경 변수가 없어 실시간 조회를 건너뜁니다.")
        return
    print_items(fetch_best_deposits(API_KEY))


if __name__ == "__main__":
    main()
