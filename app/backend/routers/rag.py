from __future__ import annotations

import hashlib
import json
import math
import os
import re
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..services.ollama import OLLAMA_HOST, OLLAMA_MODEL, _ollama_available, _ollama_chat
except ImportError:  # Supports importing through `uvicorn main:app`.
    from services.ollama import OLLAMA_HOST, OLLAMA_MODEL, _ollama_available, _ollama_chat  # type: ignore

router = APIRouter()

# ─── RAG (Retrieval-Augmented Generation) ────────────────────────────────────

_QDRANT_URL        = os.getenv("QDRANT_URL",        "http://localhost:6333")
_QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "investment_docs")
_OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def _qdrant_request(method: str, path: str, payload: dict | None = None) -> dict:
    url = _QDRANT_URL.rstrip("/") + path
    data = None
    headers: dict[str, str] = {}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=502, detail=f"Qdrant 오류({exc.code}): {err_body[:200]}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=503, detail=f"Qdrant 연결 실패 ({_QDRANT_URL}): {exc.reason}") from exc


def _qdrant_available() -> bool:
    try:
        req = urllib.request.Request(_QDRANT_URL.rstrip("/") + "/collections")
        with urllib.request.urlopen(req, timeout=3) as r:
            return r.status == 200
    except Exception:
        return False


def _ollama_embed(text: str, model: str = _OLLAMA_EMBED_MODEL) -> list[float] | None:
    """Ollama /api/embeddings 호출. 실패 시 None."""
    try:
        result = _ollama_request(
            "/api/embeddings",
            {"model": model, "prompt": text},
            timeout=30,
        )
        emb = result.get("embedding")
        if emb and len(emb) > 0:
            return [float(v) for v in emb]
        return None
    except Exception:
        return None


def _hash_embed(text: str, dim: int = 384) -> list[float]:
    """해시 기반 폴백 임베딩 (upload_docs_to_qdrant.sh 해시 임베딩과 동일)."""
    import hashlib, math as _math, re as _re
    TOKEN = _re.compile(r"[0-9A-Za-z가-힣_]+")
    vec = [0.0] * dim
    tokens = TOKEN.findall(text.lower())
    if not tokens:
        return vec
    for token in tokens:
        digest = hashlib.sha256(token.encode()).digest()
        idx = int.from_bytes(digest[:4], "big") % dim
        sign = 1.0 if (digest[4] & 1) == 0 else -1.0
        vec[idx] += sign
    norm = _math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def _embed_query(text: str) -> tuple[list[float], str]:
    """쿼리 텍스트를 임베딩. Ollama 성공 시 (vector, 'ollama'), 폴백 시 (vector, 'hash')."""
    if _ollama_available():
        emb = _ollama_embed(text)
        if emb:
            return emb, "ollama"
    # 컬렉션 벡터 크기 확인해서 hash dim 맞추기
    try:
        col_info = _qdrant_request("GET", f"/collections/{_QDRANT_COLLECTION}")
        dim = col_info.get("result", {}).get("config", {}).get("params", {}).get("vectors", {}).get("size", 384)
    except Exception:
        dim = 384
    return _hash_embed(text, dim=int(dim)), "hash"


class RagSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000, description="검색 질문")
    top_k: int = Field(default=5, ge=1, le=20, description="반환할 최대 청크 수")
    score_threshold: float = Field(default=0.0, ge=0.0, le=1.0, description="최소 유사도 점수 (0=필터 없음)")


class RagAskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000, description="질문")
    top_k: int = Field(default=5, ge=1, le=20)
    score_threshold: float = Field(default=0.0, ge=0.0, le=1.0)
    ollama_model: str | None = Field(default=None, description="답변 생성 모델 (미지정 시 기본값)")


@router.post("/api/rag/search")
def rag_search(req: RagSearchRequest) -> dict[str, object]:
    """Qdrant에서 관련 문서 청크를 검색합니다."""
    if not _qdrant_available():
        raise HTTPException(
            status_code=503,
            detail=(
                f"Qdrant 서버에 연결할 수 없습니다 ({_QDRANT_URL}). "
                "서버를 실행하고 scripts/upload_docs_to_qdrant.sh 로 문서를 업로드하세요."
            ),
        )

    vector, embed_method = _embed_query(req.query)

    search_payload: dict[str, object] = {
        "vector": vector,
        "limit": req.top_k,
        "with_payload": True,
        "with_vector": False,
    }
    if req.score_threshold > 0:
        search_payload["score_threshold"] = req.score_threshold

    result = _qdrant_request(
        "POST",
        f"/collections/{_QDRANT_COLLECTION}/points/search",
        search_payload,
    )

    hits = result.get("result", [])
    chunks = [
        {
            "score":       round(h.get("score", 0), 4),
            "source_doc":  h.get("payload", {}).get("source_doc", ""),
            "chunk_index": h.get("payload", {}).get("chunk_index", 0),
            "text":        h.get("payload", {}).get("text", ""),
        }
        for h in hits
    ]

    return {
        "query":        req.query,
        "embed_method": embed_method,
        "count":        len(chunks),
        "results":      chunks,
    }


@router.post("/api/rag/ask")
def rag_ask(req: RagAskRequest) -> dict[str, object]:
    """RAG: Qdrant 검색 후 Ollama로 답변을 생성합니다."""
    if not _qdrant_available():
        raise HTTPException(
            status_code=503,
            detail=(
                f"Qdrant 서버에 연결할 수 없습니다 ({_QDRANT_URL}). "
                "서버를 실행하고 scripts/upload_docs_to_qdrant.sh 로 문서를 업로드하세요."
            ),
        )

    # 1. 벡터 검색
    vector, embed_method = _embed_query(req.query)
    search_payload: dict[str, object] = {
        "vector": vector,
        "limit": req.top_k,
        "with_payload": True,
        "with_vector": False,
    }
    if req.score_threshold > 0:
        search_payload["score_threshold"] = req.score_threshold

    result = _qdrant_request(
        "POST",
        f"/collections/{_QDRANT_COLLECTION}/points/search",
        search_payload,
    )
    hits = result.get("result", [])
    chunks = [
        {
            "score":      round(h.get("score", 0), 4),
            "source_doc": h.get("payload", {}).get("source_doc", ""),
            "text":       h.get("payload", {}).get("text", ""),
        }
        for h in hits
    ]

    # 2. 컨텍스트 구성
    context_parts = []
    for i, c in enumerate(chunks, 1):
        context_parts.append(f"[출처: {c['source_doc']} | 유사도: {c['score']}]\n{c['text']}")
    context = "\n\n---\n\n".join(context_parts)

    # 3. Ollama 답변 생성
    ollama_ok = _ollama_available()
    answer: str | None = None
    model_used: str | None = None

    if ollama_ok:
        model_to_use = req.ollama_model or OLLAMA_MODEL
        system_prompt = (
            "당신은 한국 금융·투자·경제 교육 전문가입니다. "
            "아래 참고 문서를 바탕으로 질문에 한국어로 정확하고 간결하게 답하세요. "
            "참고 문서에 없는 내용은 '제공된 문서에 해당 정보가 없습니다'라고 명시하세요."
        )
        user_prompt = (
            f"【참고 문서】\n{context}\n\n"
            f"【질문】\n{req.query}\n\n"
            "위 참고 문서를 기반으로 질문에 답해주세요."
        )
        try:
            answer = _ollama_chat(model_to_use, system_prompt, user_prompt, temperature=0.2, num_predict=800)
            model_used = model_to_use
        except Exception:
            ollama_ok = False

    if not ollama_ok or not answer:
        # Ollama 없을 때 검색 결과만 반환
        answer = (
            "Ollama 서버에 연결할 수 없어 검색 결과만 반환합니다. "
            "아래 참고 문서를 확인하세요."
        )

    return {
        "query":        req.query,
        "answer":       answer,
        "embed_method": embed_method,
        "ollama_model": model_used,
        "sources":      chunks,
        "source_count": len(chunks),
    }


@router.get("/api/rag/status")
def rag_status() -> dict[str, object]:
    """Qdrant 연결 상태 및 컬렉션 정보를 반환합니다."""
    qdrant_ok = _qdrant_available()
    collection_info: dict = {}
    if qdrant_ok:
        try:
            col = _qdrant_request("GET", f"/collections/{_QDRANT_COLLECTION}")
            res = col.get("result", {})
            collection_info = {
                "points_count": res.get("points_count", 0),
                "vector_size":  res.get("config", {}).get("params", {}).get("vectors", {}).get("size"),
                "status":       res.get("status", "unknown"),
            }
        except Exception:
            collection_info = {"error": "컬렉션이 없거나 조회 실패"}

    return {
        "qdrant": {
            "available":  qdrant_ok,
            "url":        _QDRANT_URL,
            "collection": _QDRANT_COLLECTION,
            **collection_info,
        },
        "ollama": {
            "available":    _ollama_available(),
            "host":         OLLAMA_HOST,
            "embed_model":  _OLLAMA_EMBED_MODEL,
            "chat_model":   OLLAMA_MODEL,
        },
        "upload_hint": "문서 업로드: bash scripts/upload_docs_to_qdrant.sh",
    }

