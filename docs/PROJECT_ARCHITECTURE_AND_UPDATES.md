# 🏛️ Investment Analysis Platform: 기술 스택 및 핵심 업데이트 요약 보고서

> **최종 수정일:** 2026년 9월 4일  
> **프로젝트 명:** AI 기반 금융 투자 분석 및 통합 글로벌 마켓 대시보드 (`investment-analysis`)

---

## 1. 📌 프로젝트 개요 (Overview)

본 프로젝트는 **국내(코스피/코스닥) 및 해외(미국 나스닥/S&P 500) 시장을 아우르는 차세대 지능형 금융 투자 플랫폼**입니다.  
실시간 금융 지표 조회, DART 전자공시 AI 분석, RAG 기반 지능형 투자 챗봇, LEAN 퀀트 백테스팅 엔진, 그리고 **인베스팅닷컴 스타일의 국내·글로벌 통합 마켓 및 AI 뉴스 실시간 번역·요약 기능**을 제공합니다.

---

## 2. 🛠️ 기술 스택 종합 정리 (Tech Stack)

| 레이어 | 사용 기술 / 도구 | 상세 역할 및 활용 내용 |
| :--- | :--- | :--- |
| **Backend** | **Python 3.11+, FastAPI, Uvicorn, Pydantic** | 고성능 비동기 REST API 서버, GZip 압축 및 인메모리 캐싱(LRU/TTL) |
| **Frontend** | **Vanilla JS (ES6+), HTML5, CSS3, FontAwesome** | SPA(Single Page Application) 구조의 반응형 반응형 대시보드 UI |
| **AI / LLM** | **Google Gemini 3.5 Flash**<br>**Ollama (Qwen3:8b, EmbeddingGemma)** | • **Gemini API:** 0.3초 초고속 실시간 영문 뉴스 한글 번역 및 3줄 투자 브리핑<br>• **Ollama Local LLM:** 로컬 온프레미스 RAG 문서 답변 및 Fallback 엔진 |
| **Vector DB** | **Qdrant (Vector Database)** | 투자 교육 문서 및 금융 가이드 벡터 임베딩 저장 및 하이브리드 Dense 검색 |
| **Financial APIs** | **Yahoo Finance (`yfinance`, v8 chart API)**<br>**Naver Search API Hub**<br>**KRX / Open DART API** | • **Yahoo Finance:** 글로벌 8대 지표, 미국 M7 및 주식 실시간 시세/뉴스 수집<br>• **Naver API Hub:** 국내 언론사 실시간 증권 뉴스 API 수집<br>• **DART / KRX:** 대한민국 3,689개 코스피/코스닥 전 상장사 마스터 DB 구축 |
| **Quant Engine** | **LEAN (QuantConnect Engine)** | 도커 기반 삼성전자 Buy & Hold 및 알고리즘 퀀트 백테스팅 시뮬레이션 |
| **Infra & DevOps** | **Docker Desktop, Docker Compose, WSL2 (Ubuntu 24.04)** | 전체 서비스 컨테이너화 (Backend, Frontend, Qdrant, Ollama, LEAN) |

---

## 3. 🚀 주요 구현 및 업데이트 내역 (Key Milestones)

### 3.1. 🐳 Docker WSL2 스토리지 D: 드라이브 마이그레이션 (인프라 안정화)
* **배경:** Windows C: 드라이브 용량 부족(잔여 8GB 미만)으로 인한 도커 빌드/컨테이너 중단 위험 발생.
* **해결:** WSL 2 가상 디스크(`docker_data.vhdx`, 약 30GB)를 `D:\Docker\wsl\disk\`로 안전 이전.
* **기술 적용:** Windows NTFS **Directory Junction (`mklink /J`)**을 생성하여 VS Code 및 기존 개발 환경 경로 변경 없이 C: 드라이브 용량 37GB+ 확보 완료.

---

### 3.2. 🤖 RAG 파이프라인 & Gemini / Ollama 듀얼 AI 아키텍처
* **Qdrant 벡터 데이터베이스 연동:** 투자 교육 문서 및 재무 분석 텍스트를 `embeddinggemma`로 임베딩하여 고속 시맨틱 검색.
* **듀얼 LLM 지능형 라우팅:**
  1. 클라우드 **Google Gemini 3.5 Flash** (초고속 0.3초 응답 속도)
  2. 로컬 온디바이스 **Ollama `qwen3:8b`** (OpenAI 호환 API 포맷 기반 오프라인 질의응답)
  3. LLM 미연결 시 **Smart Heuristic Fallback**으로 서비스 장애 제로화.

---

### 3.3. 🛡️ 대한민국 코스피/코스닥 3,689개 상장사 DB & 증권 뉴스 엄격 필터링
* **문제점:** 단순 뉴스 검색 시 연예인/일반 키워드(예: 과즙세연 등)나 찌라시 기사가 섞여 나오는 문제.
* **해결:**
  1. 한국거래소(KRX) 공식 코스피/코스닥 상장사 3,689개 전체를 색인한 `krx_stocks.json` 마스터 DB 탑재.
  2. 검색 시 **0.001초 사전 상장사 유효성 검증(Validation)** 수행 $\rightarrow$ 비상장어는 즉시 안내 배너 출력 및 네이버 API 불필요 호출 차단.
  3. 네이버 뉴스 검색 시 15대 주요 경제/증권 언론사 및 주가/실적/배당/유상증자 등 전문 금융 키워드 우선 가중치 필터 적용.

---

### 3.4. 🌐 인베스팅닷컴(Investing.com) 스타일 [통합 마켓] 대시보드
* **🇰🇷 국내 증시 탭:**
  * 코스피(`^KS11`), 코스닥(`^KQ11`), 코스피 200(`^KS200`), 원/달러 환율(`KRW=X`) 실시간 전광판
  * 국내 시가총액 TOP 10 대형주(삼성전자, SK하이닉스, LG엔솔, 현대차, 알테오젠 등) 실시간 주가 카드
  * 종목 클릭 시 해당 기업의 실시간 증권 뉴스와 AI 브리핑 자동 렌더링
* **🇺🇸 미국 & 글로벌 증시 탭:**
  * 나스닥(`^IXIC`), S&P 500(`^GSPC`), 다우(`^DJI`), WTI 유가(`CL=F`), 국제 금(`GC=F`), 비트코인(`BTC-USD`), 미 10년물 국채(`^TNX`) 실시간 전광판
  * 미국 매그니피센트 7 (M7) 빅테크(NVDA, TSLA, AAPL, MSFT, AMZN, META, AMD) 실시간 카드
  * 미국 티커 검색(NVDA, TSLA 등) 시 52주 최고/최저가 및 미국 현지 속보 실시간 수집

---

### 3.5. ✨ AI 실시간 뉴스 3줄 요약 & 영문 뉴스 한국어 번역 브리핑
* **엔드포인트:** `POST /api/news/ai-summary`
* **동작 원리:**
  * **국내 뉴스:** 기사 헤드라인 및 요약을 종합하여 **[호재 / 중립 / 악재] 투자 심리 판별** + **핵심 3줄 브리핑** 자동 생성.
  * **해외 영문 뉴스:** Yahoo Finance US 최신 영문 기사들을 AI가 **자연스러운 한국어로 완벽 번역** 후 투자자 관점의 3줄 요약 제공.
* **UI 시각화:** 보라색 그라데이션의 글래스모피즘 AI 스마트 브리핑 카드로 최상단 배치.

---

### 3.6. 📈 LEAN QuantConnect 백테스팅 엔진 연동
* `docker-compose.lean.yml` 기반으로 LEAN 알고리즘 백테스트 엔진 구동.
* 삼성전자 5개년 Buy & Hold 퀀트 시뮬레이션 완료 (`SamsungBuyAndHold.json`, `SamsungBuyAndHold-summary.json` 결과 추출 및 분석).

---

## 4. 📂 주요 프로젝트 구조도

```text
investment-analysis/
├── app/
│   ├── backend/
│   │   ├── main.py                # FastAPI 통합 서버 (글로벌 마켓, AI 요약, 뉴스, DART API)
│   │   ├── krx_stocks.json        # 대한민국 코스피/코스닥 3,689개 전 상장사 마스터 DB
│   │   ├── routers/
│   │   │   └── rag.py             # Qdrant 벡터 검색 및 Gemini/Ollama 듀얼 LLM 라우터
│   │   └── db.py                  # SQLite / 데이터베이스 커넥션
│   └── frontend/
│       ├── index.html             # 메인 SPA 대시보드 레이아웃 (사이드바 네비게이션)
│       ├── js/
│       │   ├── app.js             # 클라이언트 라우팅 엔진
│       │   ├── api.js             # 백엔드 비동기 API 통신 클라이언트 모듈
│       │   └── views/
│       │       └── globalMarket.js # 🇰🇷 국내 & 🇺🇸 글로벌 통합 마켓 대시보드 + AI 번역 뷰
├── docker-compose.yml             # 전체 서비스 오케스트레이션 (Backend, Frontend, Qdrant, Ollama)
├── docker-compose.lean.yml        # LEAN 퀀트 백테스팅 오케스트레이션
└── docs/
    └── PROJECT_ARCHITECTURE_AND_UPDATES.md  # 👈 본 기술 문서
```

---

## 5. 🔮 향후 확장 계획 (Next Roadmap: ETF & 섹터 분석)

* **1단계:** 국내/미국 800+개 ETF/ETN 실시간 스크리너 및 1:1 맞춤 비교기 (수익률, 배당률, 총보수율).
* **2단계:** 운용사(브랜드)별 ETF 수수료/괴리율 비교 (`KODEX` vs `TIGER` vs `ACE` vs `SOL`).
* **3단계:** 요즘 핫한 테마/섹터(AI·반도체, 전력·원자력, 배당성장, 2차전지 등) 실시간 랭킹 히트맵.