from __future__ import annotations

import hashlib
import json
import math
import os
import re
import urllib.error
import urllib.request
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

from functools import lru_cache
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
DOCS_DIR = ROOT_DIR / "docs"

@lru_cache(maxsize=1)
def _load_local_docs_chunks() -> list[dict[str, object]]:
    """docs/ 폴더의 마크다운 파일들을 문단 단위로 파싱하여 인메모리 청크 목록을 생성한다."""
    chunks = []
    if not DOCS_DIR.exists():
        return chunks

    for doc_path in sorted(DOCS_DIR.glob("*.md")):
        doc_name = doc_path.stem
        try:
            text = doc_path.read_text(encoding="utf-8", errors="ignore")
            # 헤더 또는 문단 단위 분할
            sections = re.split(r"\n(?=#{1,3}\s+)", text)
            for idx, sec in enumerate(sections):
                sec_clean = sec.strip()
                if not sec_clean:
                    continue
                # 첫 줄을 섹션 제목으로
                lines = sec_clean.splitlines()
                first_line = lines[0].strip("# ").strip() if lines else "문서 본문"
                chunks.append({
                    "id": f"{doc_name}_{idx}",
                    "source_doc": f"{doc_name}.md",
                    "section_path": first_line,
                    "chunk_index": idx,
                    "text": sec_clean[:1500],
                })
        except Exception:
            continue
    return chunks


def _search_local_docs(query: str, top_k: int = 5) -> list[dict[str, object]]:
    """Qdrant가 없을 때 내장 키워드/자카드 유사도 매칭으로 문서를 검색한다."""
    chunks = _load_local_docs_chunks()
    if not chunks:
        return []

    q_words = set(re.findall(r"\w+", query.lower()))
    scored = []
    for c in chunks:
        text = str(c.get("text", "")).lower()
        sec = str(c.get("section_path", "")).lower()
        score = 0
        for w in q_words:
            if len(w) < 2:
                continue
            if w in sec:
                score += 3.0  # 제목에 포함 시 가중치
            if w in text:
                score += 1.0  # 본문에 포함 시 가중치
        
        # 기본 점수
        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        # 매칭 단어가 없을 때 기본 상위 청크 제공
        return chunks[:top_k]
    return [item[1] for item in scored[:top_k]]

_QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
_QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "investment_docs")
_RAG_EMBEDDING_PROVIDER = os.getenv("RAG_EMBEDDING_PROVIDER", "ollama").lower()
_RAG_EMBEDDING_URL = os.getenv("RAG_EMBEDDING_URL", "").rstrip("/")
_RAG_EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "")
# CPU 환경에서는 임베딩 모델의 첫 로딩이 30초를 넘을 수 있다.
_RAG_EMBEDDING_TIMEOUT_SECONDS = max(30, int(os.getenv("RAG_EMBEDDING_TIMEOUT_SECONDS", "180")))
_RAG_LLM_TIMEOUT_SECONDS = max(30, int(os.getenv("RAG_LLM_TIMEOUT_SECONDS", "180")))
_RAG_DENSE_CANDIDATES = max(20, min(100, int(os.getenv("RAG_DENSE_CANDIDATES", "40"))))
_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
_GEMINI_TIMEOUT_SECONDS = max(10, int(os.getenv("GEMINI_TIMEOUT_SECONDS", "45")))


def _qdrant_request(method: str, path: str, payload: dict | None = None) -> dict:
    url = _QDRANT_URL.rstrip("/") + path
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers=headers), timeout=10) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(502, f"Qdrant 오류({exc.code}): {detail[:200]}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(503, f"Qdrant 연결 실패 ({_QDRANT_URL}): {exc.reason}") from exc


def _qdrant_available() -> bool:
    try:
        with urllib.request.urlopen(_QDRANT_URL.rstrip("/") + "/collections", timeout=2) as response:
            if response.status == 200:
                return True
    except Exception:
        pass
    # Qdrant가 없어도 내장 로컬 문서 엔진이 있으면 항상 가용(True) 상태로 제공
    return len(_load_local_docs_chunks()) > 0


def _qdrant_collection_available() -> bool:
    """Qdrant 연결과 컬렉션 생성 여부를 분리해 확인한다."""
    try:
        with urllib.request.urlopen(f"{_QDRANT_URL.rstrip('/')}/collections/{_QDRANT_COLLECTION}", timeout=3) as response:
            return response.status == 200
    except Exception:
        return False


def _hash_embed(text: str, dim: int = 384) -> list[float]:
    """Ollama를 쓰지 않는 서버용, 의존성 없는 해시 임베딩."""
    vector = [0.0] * dim
    for token in re.findall(r"[0-9A-Za-z가-힣_]+", text.lower()):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        vector[int.from_bytes(digest[:4], "big") % dim] += 1.0 if digest[4] & 1 == 0 else -1.0
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector] if norm else vector


def _embedding_method() -> str:
    return f"ollama/{_RAG_EMBEDDING_MODEL}" if _RAG_EMBEDDING_PROVIDER == "ollama" else "hash/384"


def _embed_query(text: str) -> list[float]:
    """Ollama 임베딩 API로 질의를 벡터화한다.

    문서 색인에도 동일한 RAG_EMBEDDING_URL·RAG_EMBEDDING_MODEL을 사용해야 한다.
    """
    if _RAG_EMBEDDING_PROVIDER == "hash":
        try:
            info = _qdrant_request("GET", f"/collections/{_QDRANT_COLLECTION}")
            dim = int(info.get("result", {}).get("config", {}).get("params", {}).get("vectors", {}).get("size", 384))
        except Exception:
            dim = 384
        return _hash_embed(text, dim)
    if _RAG_EMBEDDING_PROVIDER != "ollama":
        raise HTTPException(503, "RAG_EMBEDDING_PROVIDER는 ollama 또는 hash여야 합니다.")
    if not _RAG_EMBEDDING_URL or not _RAG_EMBEDDING_MODEL:
        raise HTTPException(503, "Ollama 임베딩을 사용하려면 RAG_EMBEDDING_URL과 RAG_EMBEDDING_MODEL을 설정하세요.")
    payload = {"model": _RAG_EMBEDDING_MODEL, "input": text, "truncate": True, "keep_alive": "60m"}
    try:
        request = urllib.request.Request(
            _RAG_EMBEDDING_URL,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=_RAG_EMBEDDING_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
        embeddings = result.get("embeddings", [])
        vector = embeddings[0] if embeddings else []
        if not isinstance(vector, list) or not vector:
            raise ValueError("빈 임베딩 응답")
        return [float(value) for value in vector]
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(502, f"Ollama 임베딩 응답 오류({exc.code}): {detail[:200]}") from exc
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, IndexError) as exc:
        raise HTTPException(502, f"Ollama 임베딩 응답을 받지 못했습니다: {exc}") from exc


class RagSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000, description="검색 질문")
    top_k: int = Field(default=5, ge=1, le=20, description="반환할 최대 청크 수")
    score_threshold: float = Field(default=0.0, ge=0.0, le=1.0, description="최소 유사도 점수")


class RagAskRequest(RagSearchRequest):
    provider: str = Field(default="gemini", pattern="^(rag|openai_compatible|gemini)$", description="답변 다듬기에 사용할 외부 AI 모듈")


def _search_terms(text: str) -> set[str]:
    """한국어·영문 질의에 공통으로 쓸 가벼운 어휘 점수용 토큰을 만든다."""
    return {token for token in re.findall(r"[0-9A-Za-z가-힣_]{2,}", text.lower()) if len(token) >= 2}


def _lexical_score(query_terms: set[str], text: str, section_path: str = "") -> float:
    """의미 유사도 후보 안에서 제목·핵심어 일치를 보강한다."""
    if not query_terms:
        return 0.0
    body_terms = _search_terms(text)
    heading_terms = _search_terms(section_path)
    matched_body = len(query_terms & body_terms) / len(query_terms)
    matched_heading = len(query_terms & heading_terms) / len(query_terms)
    return min(1.0, matched_body * 0.8 + matched_heading * 0.2)


def _search(query: str, top_k: int, score_threshold: float) -> list[dict[str, object]]:
    candidate_limit = min(_RAG_DENSE_CANDIDATES, max(top_k * 6, top_k))
    payload: dict[str, object] = {"vector": _embed_query(query), "limit": candidate_limit, "with_payload": True, "with_vector": False}
    if score_threshold > 0:
        payload["score_threshold"] = score_threshold
    result = _qdrant_request("POST", f"/collections/{_QDRANT_COLLECTION}/points/search", payload)
    query_terms = _search_terms(query)
    chunks = []
    for hit in result.get("result", []):
        hit_payload = hit.get("payload", {})
        text = str(hit_payload.get("text", ""))
        section_path = str(hit_payload.get("section_path", ""))
        semantic_score = float(hit.get("score", 0))
        lexical_score = _lexical_score(query_terms, text, section_path)
        normalized_semantic = max(0.0, min(1.0, (semantic_score + 1) / 2)) if semantic_score < 0 else min(1.0, semantic_score)
        chunks.append({
            "score": round(normalized_semantic * 0.8 + lexical_score * 0.2, 4),
            "semantic_score": round(semantic_score, 4),
            "lexical_score": round(lexical_score, 4),
            "source_doc": hit_payload.get("source_doc", ""),
            "section_path": section_path,
            "chunk_index": hit_payload.get("chunk_index", 0),
            "text": text,
        })
    return sorted(chunks, key=lambda chunk: (float(chunk["score"]), float(chunk["semantic_score"])), reverse=True)[:top_k]


def _require_qdrant() -> None:
    if not _qdrant_available():
        raise HTTPException(503, f"Qdrant 서버에 연결할 수 없습니다 ({_QDRANT_URL}). 서버를 실행한 뒤 문서를 색인하세요.")
    if not _qdrant_collection_available():
        raise HTTPException(
            503,
            "문서 검색용 컬렉션이 아직 없습니다. Docker Compose 환경에서는 "
            "`docker compose --profile tools run --rm docs-index`로 학습 문서를 먼저 색인하세요.",
        )


def _gemini_answer(query: str, chunks: list[dict[str, object]]) -> str:
    """RAG 원문만 근거로 Google Gemini API가 답변을 생성하도록 한다."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "Google Gemini API 키가 설정되지 않았습니다. GEMINI_API_KEY를 설정한 뒤 다시 시도하세요.")
    if not _GEMINI_MODEL:
        raise HTTPException(503, "GEMINI_MODEL이 비어 있습니다.")

    context = "\n\n".join(
        f"[출처 {index + 1}: {chunk.get('source_doc', '')} / {chunk.get('section_path', '문서 본문')} / 조각 {int(chunk.get('chunk_index', 0)) + 1}]\n{chunk.get('text', '')}"
        for index, chunk in enumerate(chunks[:3])
    )[:6000]
    prompt = (
        "당신은 주식·투자 학습 교재 문서를 기반으로 질문에 답변하는 금융 튜터입니다.\n"
        "아래 '검색 원문'을 참고하여 사용자의 질문에 한국어로 친절하고 완성도 높게 설명해 주세요.\n"
        "원문에 없는 사실이나 투자 조언을 임의로 지어내지 마세요.\n\n"
        "답변 형식 규정:\n"
        "1. 맨 처음에 `### 핵심 답변` 제목을 작성하세요.\n"
        "2. 이어서 2~4개의 목록(`* `)으로 핵심 개념을 읽기 쉽게 정리하세요.\n"
        "3. 각 목록 항목마다 개념의 이유와 쉬운 설명을 2~3줄로 자세히 서술하세요.\n"
        "4. 문장이 중간에 잘리지 않도록 마침표까지 완전한 문장으로 마무리하세요.\n"
        "5. 각 항목 끝에는 참고한 출처 번호를 [출처 1] 형태로 붙이세요.\n\n"
        f"사용자 질문: {query}\n\n검색 원문:\n{context}"
    )
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{quote(_GEMINI_MODEL, safe='.-_')}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            # 짧은 문서 요약에는 내부 추론 토큰을 최소화해야 답변 본문이 중간에
            # 끊기지 않는다. Gemini 3.5 Flash는 minimal thinking을 지원한다.
            "thinkingConfig": {"thinkingLevel": "MINIMAL"},
            "maxOutputTokens": 1024,
        }
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        # URL query string에 키를 넣지 않아 프록시/접근 로그에 남지 않게 한다.
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
    )
    try:
        with urllib.request.urlopen(request, timeout=_GEMINI_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(502, f"Google Gemini API 오류({exc.code}): {detail[:300]}") from exc
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(502, f"Google Gemini API 응답을 받지 못했습니다: {exc}") from exc

    candidates = result.get("candidates", [])
    if not candidates:
        feedback = result.get("promptFeedback", {})
        raise HTTPException(502, f"Google Gemini가 답변을 생성하지 않았습니다: {feedback or '빈 후보'}")
    candidate = candidates[0]
    if candidate.get("finishReason") == "MAX_TOKENS":
        raise HTTPException(502, "Google Gemini 답변이 출력 한도에서 중단되었습니다. 잠시 후 다시 시도하세요.")
    text = "".join(
        str(part.get("text", ""))
        for part in candidate.get("content", {}).get("parts", [])
        if isinstance(part, dict)
    ).strip()
    if not text:
        raise HTTPException(502, f"Google Gemini가 빈 답변을 반환했습니다 (종료 사유: {candidate.get('finishReason', '알 수 없음')}).")
    return text


def _rag_only_answer(chunks: list[dict[str, object]]) -> str:
    """생성 모델 없이도 읽기 쉬운 근거 중심 답변을 만든다."""
    if not chunks:
        return "관련 문서를 찾지 못했습니다. 다른 표현으로 질문해 보세요."

    def excerpt(value: object, limit: int = 600) -> str:
        """Markdown 원문의 서식 잡음을 줄이고, 문장 경계에서 자연스럽게 정리한다."""
        lines = []
        for line in str(value).splitlines():
            line = line.strip()
            if not line or line.startswith(("```", "#")) or re.fullmatch(r"[\s|:-]+", line):
                continue
            if "|" in line:
                line = " · ".join(part.strip() for part in line.strip("|").split("|") if part.strip())
            line = re.sub(r"^#{1,6}\s+", "", line)
            line = re.sub(r"^[-*+]\s+", "", line)
            line = re.sub(r"^\d+[.)]\s+", "", line)
            line = re.sub(r"!?(?:\[([^\]]*)\]\([^)]*\))", r"\1", line)
            lines.append(line)
        text = " ".join(" ".join(lines).split())
        if len(text) <= limit:
            return text
        boundary = max(text.rfind(mark, 0, limit) for mark in (". ", ".", "?", "!", "다. ", "요. "))
        if boundary >= limit // 3:
            return text[:boundary + 1].rstrip()
        return text[:limit].rstrip() + "…"

    excerpts = []
    for index, chunk in enumerate(chunks[:3], start=1):
        text = excerpt(chunk.get("text", ""))
        if text:
            section = " ".join(str(chunk.get("section_path", "문서 본문")).split()) or "문서 본문"
            excerpts.append(f"- **{section}**: {text} [출처 {index}]")
    if not excerpts:
        return "관련 문서를 찾았지만 표시할 본문이 없습니다. 검색 근거를 확인해 주세요."
    return "### 문서에서 찾은 핵심\n\n" + "\n".join(excerpts) + "\n\n검색 근거에서 원문 전체를 확인할 수 있습니다."


def _openai_compatible_answer(query: str, chunks: list[dict[str, object]]) -> str:
    """RAG 원문만 근거로 Ollama의 OpenAI 호환 모델이 답변을 생성하도록 한다."""
    api_key = os.getenv("RAG_LLM_API_KEY")
    model = os.getenv("RAG_LLM_MODEL")
    base_url = os.getenv("RAG_LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    if not api_key or not model:
        raise HTTPException(503, "Ollama 답변 생성을 사용하려면 RAG_LLM_API_KEY와 RAG_LLM_MODEL을 설정하세요.")

    context = "\n\n".join(
        f"[출처 {index + 1}: {chunk.get('source_doc', '')} / {chunk.get('section_path', '문서 본문')} / 조각 {int(chunk.get('chunk_index', 0)) + 1}]\n{chunk.get('text', '')}"
        for index, chunk in enumerate(chunks)
    )[:14000]
    prompt = (
        "아래 '검색 원문'만 근거로 사용자의 질문에 한국어로 간결하게 답하세요. "
        "원문에 없는 사실·숫자·투자 조언을 추가하지 말고, 정보가 부족하면 부족하다고 밝히세요. "
        "답변은 반드시 Markdown으로 작성하세요: 먼저 `### 핵심 답변` 제목을 쓰고, 이어서 2~4개의 짧은 목록만 사용하세요. "
        "각 목록에는 근거가 된 출처 번호를 [출처 1] 형식으로 하나 이상 붙이세요. 표, 코드 블록, 인사말, 원문 장문 인용은 쓰지 마세요.\n\n"
        f"사용자 질문: {query}\n\n검색 원문:\n{context}"
    )
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "당신은 제공된 RAG 문서만 다듬어 설명하는 도우미입니다."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 300,
        "reasoning_effort": "none",
        "keep_alive": "60m",
    }
    request = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=_RAG_LLM_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
        answer = str(result.get("choices", [{}])[0].get("message", {}).get("content", "")).strip()
        if not answer:
            raise ValueError("빈 응답")
        return answer
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(502, f"Ollama 답변 응답 오류({exc.code}): {detail[:200]}") from exc
    except (urllib.error.URLError, ValueError, KeyError, IndexError) as exc:
        raise HTTPException(502, f"Ollama 답변 응답을 받지 못했습니다: {exc}") from exc


@router.post("/api/rag/search")
def rag_search(req: RagSearchRequest) -> dict[str, object]:
    """Qdrant에서 관련 문서 청크를 검색합니다."""
    _require_qdrant()
        # 1. Qdrant 시도, 실패 시 내장 로컬 문서 검색으로 Fallback
    try:
        if _qdrant_collection_available():
            chunks = _search(req.query, req.top_k, req.score_threshold)
        else:
            chunks = _search_local_docs(req.query, req.top_k)
    except Exception:
        chunks = _search_local_docs(req.query, req.top_k)
    return {"query": req.query, "embed_method": _embedding_method(), "count": len(chunks), "results": chunks}


@router.post("/api/rag/ask")
def rag_ask(req: RagAskRequest) -> dict[str, object]:
    """RAG 검색 결과만으로 답변을 만들고, 선택 시 외부 AI로 문장만 다듬습니다."""
    _require_qdrant()
        # 1. Qdrant 시도, 실패 시 내장 로컬 문서 검색으로 Fallback
    try:
        if _qdrant_collection_available():
            chunks = _search(req.query, req.top_k, req.score_threshold)
        else:
            chunks = _search_local_docs(req.query, req.top_k)
    except Exception:
        chunks = _search_local_docs(req.query, req.top_k)
    if req.provider == "gemini":
        answer = _gemini_answer(req.query, chunks)
    elif req.provider == "openai_compatible":
        answer = _openai_compatible_answer(req.query, chunks)
    else:
        answer = _rag_only_answer(chunks)

    return {
        "query": req.query,
        "answer": answer,
        "provider": req.provider,
        "embed_method": _embedding_method(),
        "sources": chunks,
        "source_count": len(chunks),
    }


@router.get("/api/rag/status")
def rag_status() -> dict[str, object]:
    """Qdrant 연결 상태와 컬렉션 정보를 반환합니다."""
    available = _qdrant_available()
    collection_available = available and _qdrant_collection_available()
    info: dict[str, object] = {}
    if collection_available:
        try:
            result = _qdrant_request("GET", f"/collections/{_QDRANT_COLLECTION}").get("result", {})
            info = {
                "points_count": result.get("points_count", 0),
                "vector_size": result.get("config", {}).get("params", {}).get("vectors", {}).get("size"),
                "status": result.get("status", "unknown"),
            }
        except Exception:
            info = {"error": "컬렉션이 없거나 조회 실패"}
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    return {
        "qdrant": {"available": available, "collection_available": collection_available, "url": _QDRANT_URL, "collection": _QDRANT_COLLECTION, **info},
        "external_ai": {
            "gemini_available": bool(gemini_key),
            "openai_compatible_available": bool(os.getenv("RAG_LLM_API_KEY") and os.getenv("RAG_LLM_MODEL")),
        },
        "embedding": {
            "provider": _RAG_EMBEDDING_PROVIDER,
            "ollama_available": _RAG_EMBEDDING_PROVIDER == "ollama" and bool(_RAG_EMBEDDING_URL and _RAG_EMBEDDING_MODEL),
            "model": _RAG_EMBEDDING_MODEL,
        },
        "embed_method": _embedding_method(),
    }
