from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

from fastapi import HTTPException

# ─── Ollama Configuration ─────────────────────────────────────────────────────
OLLAMA_HOST  = os.getenv("OLLAMA_HOST",  "http://172.29.32.1:11435")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")
_OLLAMA_TIMEOUT = 120  # seconds


def _ollama_request(endpoint: str, payload: dict, timeout: int = _OLLAMA_TIMEOUT) -> dict:
    """Send a JSON request to the Ollama API and return parsed response."""
    url  = OLLAMA_HOST.rstrip("/") + endpoint
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(url, data=data,
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=503,
                            detail=f"Ollama 연결 실패 ({OLLAMA_HOST}): {exc.reason}") from exc
    except Exception as exc:
        raise HTTPException(status_code=503,
                            detail=f"Ollama 오류: {exc}") from exc


def _ollama_available() -> bool:
    """Quick connectivity check — returns False instead of raising."""
    try:
        url = OLLAMA_HOST.rstrip("/") + "/api/tags"
        with urllib.request.urlopen(url, timeout=3) as r:
            return r.status == 200
    except Exception:
        return False


def _ollama_models() -> list[dict]:
    """Return list of locally installed Ollama models."""
    try:
        url = OLLAMA_HOST.rstrip("/") + "/api/tags"
        with urllib.request.urlopen(url, timeout=5) as r:
            return json.loads(r.read()).get("models", [])
    except Exception:
        return []


def _ollama_chat(
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    num_predict: int = 800,
) -> str:
    """Call Ollama /api/chat and return assistant text content."""
    result = _ollama_request(
        "/api/chat",
        {
            "model":  model,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": num_predict},
            "messages": [
                {"role": "system",  "content": system_prompt},
                {"role": "user",    "content": user_prompt},
            ],
        },
    )
    return (result.get("message") or {}).get("content", "").strip()


def _build_financial_analysis_prompt(
    corp_name: str, market: str, bsns_year: str,
    financials: dict, ratios: dict, score: float, grade: str,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) for Ollama financial analysis."""
    system_prompt = (
        "당신은 한국 상장기업 재무분석 전문가입니다. "
        "DART 전자공시 데이터를 기반으로 투자자가 이해하기 쉬운 한국어로 "
        "재무 건전성 분석과 투자 의견을 제시합니다. "
        "답변은 반드시 한국어로, 명확하고 구체적으로 작성하세요."
    )

    def fmt(v: object, unit: str = "억원") -> str:
        if v is None:
            return "N/A"
        return f"{float(v):,.1f}{unit}"

    def fpct(v: object) -> str:
        if v is None:
            return "N/A"
        return f"{float(v):.1f}%"

    user_prompt = f"""다음 기업의 재무 데이터를 분석해주세요.

【기업 정보】
- 기업명: {corp_name}
- 상장시장: {market}
- 분석 연도: {bsns_year}년

【재무 현황】 (단위: 억원)
- 매출액: {fmt(financials.get('revenue'))} (전기: {fmt(financials.get('prev_revenue'))}, YoY {fpct(ratios.get('revenue_growth'))})
- 영업이익: {fmt(financials.get('op_income'))} (영업이익률 {fpct(ratios.get('op_margin'))})
- 당기순이익: {fmt(financials.get('net_income'))} (순이익률 {fpct(ratios.get('net_margin'))})
- 자산총계: {fmt(financials.get('total_assets'))}
- 부채총계: {fmt(financials.get('total_liabilities'))} (부채비율 {fpct(ratios.get('debt_equity_ratio'))})
- 자본총계: {fmt(financials.get('total_equity'))}
- 유동비율: {fpct(ratios.get('current_ratio'))}
- ROE: {fpct(ratios.get('roe'))} / ROA: {fpct(ratios.get('roa'))}
- 재무 건전성 점수: {score:.0f}/100점 (등급: {grade})

다음 5개 항목으로 나누어 분석해주세요:
① 재무 건전성 종합 평가 (2~3문장)
② 수익성 분석 (1~2문장)
③ 안정성 분석 (1~2문장)
④ 성장성 분석 (1~2문장)
⑤ 투자 의견: 반드시 "매수", "중립", "매도" 중 하나를 명시하고 근거를 1~2문장으로 작성"""

    return system_prompt, user_prompt
