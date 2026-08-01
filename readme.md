# 주식 투자 기초 학습 웹앱

중학생도 이해할 수 있는 수준에서 주식 투자 기초를 5단계로 학습하는 웹앱입니다. 경제와 산업, 회사의 재무제표, 차트와 거래, 주식·ETF, 분산투자와 위험 관리까지 순서대로 다룹니다.

이 서비스는 학습용이며 특정 종목의 매수·매도 또는 수익을 권유하지 않습니다. 세금·수수료·거래 규칙은 바뀔 수 있으므로 실제 거래 전에는 증권사와 공공기관의 최신 안내를 확인해야 합니다.

## 이번 개편 내용

- 학습 과정을 `주식 1`부터 `주식 5`까지 5개 문서로 통합했습니다.
- 기존 문서에서 빠졌던 주식 상식, 공시, 세금, 반도체, 한국·미국 시장, 계좌 개설, 주문 방법을 다시 보강했습니다.
- 파이썬 실습과 코드는 학습 문서에서 제거했습니다.
- 문장을 중학생 수준으로 정리하고, 영문 약어에는 전체 영문명과 쉬운 뜻을 함께 넣었습니다.
- 단어장에 거래 용어와 투자 은어를 추가했습니다. 예: 국장, 미장, 주린·주린이, 손절, 익절, 존버, 물타기, 불타기.
- 퀴즈를 주식 1~5별 20문항, 총 100문항으로 개편했습니다.
- 외부 자료를 5개 학습 주제에 맞춰 위키백과·YouTube·NotebookLM 안내로 정리했습니다.
- 대시보드의 시세 차트·이미지 영역을 제거하고 분석 바로가기만 남겼습니다.
- 웹앱 메뉴에서 실습, AI 분석, 에이전트, 증시뉴스 항목을 제거했습니다.
- 백엔드의 기능별 라우터와 서비스 모듈을 분리해 `main.py`의 역할을 줄였습니다.
- `app/src`의 ML/DL 예제 소스를 제거했습니다.

## 5단계 학습 과정

| 과정 | 문서 | 핵심 내용 |
| --- | --- | --- |
| 주식 1 | [docs/03.md](docs/03.md) | 경제·금리·환율·산업, 반도체 섹터, 한국과 미국 시장의 연결 |
| 주식 2 | [docs/04.md](docs/04.md) | 재무제표, 이익과 현금, 기업 경쟁력, 기업 공시 읽기 |
| 주식 3 | [docs/05.md](docs/05.md) | 차트, 캔들·양봉·음봉, 거래량, 수급, 투자 심리 |
| 주식 4 | [docs/06.md](docs/06.md) | 계좌 개설, HTS·MTS·WTS, 주문·체결, 주식·펀드·ETF, 세금·공공기관 |
| 주식 5 | [docs/07.md](docs/07.md) | 분산투자, 자산배분, 리밸런싱, 손실 관리, 투자 기록 |

용어는 [docs/voca.md](docs/voca.md)에서 확인합니다. 영문 약어는 영어 전체 이름, 우리말 뜻, 쉬운 설명 순서로 정리했습니다.

## 학습 원칙

1. 주식 가격보다 먼저 회사와 산업을 이해합니다.
2. 차트는 과거를 보여 주는 도구이며 미래를 보장하지 않습니다.
3. 생활비·비상금·빚으로 투자하지 않습니다.
4. 공시와 공식 자료를 우선 확인합니다.
5. 모르는 상품은 이해할 때까지 거래하지 않습니다.

## 퀴즈

퀴즈는 각 과정 20문항, 총 100문항입니다.

| 과정 | 문항 수 | 연결 문서 |
| --- | ---: | --- |
| 주식 1 | 20 | `docs/03.md` |
| 주식 2 | 20 | `docs/04.md` |
| 주식 3 | 20 | `docs/05.md` |
| 주식 4 | 20 | `docs/06.md` |
| 주식 5 | 20 | `docs/07.md` |

문항 원본은 [app/backend/quiz_seed.sql](app/backend/quiz_seed.sql)에 있고, 실행 시 MongoDB의 `quiz_questions` 컬렉션에 적재합니다.

```bash
./scripts/init_quiz_mongodb.sh --replace
```

`--replace`는 기존 퀴즈 문항을 모두 지운 뒤 현재 100문항으로 교체합니다. 실행 전 대상 MongoDB 주소와 데이터베이스 이름을 꼭 확인하세요.

```bash
MONGODB_URL=mongodb://localhost:27017 \
MONGODB_DB=investment_db \
./scripts/init_quiz_mongodb.sh --replace
```

## 외부 자료

외부 자료 페이지도 주식 1~5의 순서에 맞춰 구성했습니다.

- 위키백과: 모르는 기본 용어를 쉬운 뜻으로 확인
- YouTube: 과정별 주제 영상 탐색·시청
- NotebookLM: 과정별 학습 자료를 찾기 위한 검색어 제공
- 시장 방송·정보 사이트: 국내 IPTV 경제 채널, Bloomberg 등 해외 시장 방송, 공시·차트 사이트를 목적별로 안내

외부 자료는 배경지식용입니다. 회사의 실적, 계약, 증자, 감사 의견처럼 투자 판단에 중요한 사실은 반드시 공시 원문으로 다시 확인해야 합니다.

## 공시·세금·공공기관

주식 4는 아래 공식 경로를 안내합니다.

| 기관·서비스 | 용도 | 홈페이지 |
| --- | --- | --- |
| 금융위원회 | 금융·자본시장 정책 | <https://www.fsc.go.kr/> |
| 금융감독원 | 금융회사 감독·소비자 보호 | <https://www.fss.or.kr/> |
| DART | 기업 공시 원문 조회 | <https://dart.fss.or.kr/> |
| 한국거래소 | 시장·상장·공시 정보 | <https://www.krx.co.kr/> |
| KIND | 거래소 공시 조회 | <https://kind.krx.co.kr/> |
| 한국예탁결제원 | 전자증권·결제·권리 행사 | <https://www.ksd.or.kr/> |
| 국세청 | 양도소득·배당 등 세금 안내 | <https://www.nts.go.kr/> |

세금은 국내·해외 주식, 배당, ETF 등 상품과 거래 방식에 따라 달라집니다. 학습 문서에는 기본 구조와 확인 방법만 담았으며, 신고 전에는 국세청과 증권사의 최신 안내를 확인해야 합니다.

## 프로젝트 구조

```text
investment-analysis/
├── app/
│   ├── backend/
│   │   ├── main.py                 # FastAPI 앱과 공통 기능
│   │   ├── routers/                # 퀴즈·세금·RAG·퀀트 등 기능별 라우터
│   │   ├── services/               # 외부 서비스 연동
│   │   ├── db.py                   # MongoDB 연결 관리
│   │   └── quiz_seed.sql           # 100문항 퀴즈 원본
│   ├── frontend/
│   │   ├── index.html              # 웹앱 진입점
│   │   ├── js/views/               # 학습·퀴즈·대시보드 화면
│   │   ├── js/pages/               # 외부 자료 페이지
│   │   └── images/                 # 학습 이미지
│   └── src/                        # 백테스트·포트폴리오·리스크 관리 예제
├── docs/
│   ├── 03.md ~ 07.md               # 주식 1~5 학습 문서
│   ├── 10.md                        # 참고: 법인·회사 구조
│   ├── 11.md                        # 참고: 거시경제·경제지표
│   └── voca.md                     # 주식 단어장
├── scripts/
│   ├── sync_learning_menu.py       # 문서 제목을 학습 메뉴에 반영
│   ├── init_quiz_mongodb.sh        # 퀴즈 MongoDB 적재
│   └── upload_docs_to_qdrant.sh    # 선택 사항: 문서 검색 인덱싱
├── Dockerfile
├── docker-compose.yml
└── docker-compose.prod.yml
```

## 로컬 실행

### 1. 준비

- Python 3.12 이상 권장
- MongoDB: 퀴즈 사용 시 필요
- `mongosh`: 퀴즈 초기화 스크립트 사용 시 필요

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`app/backend/.env` 파일을 만들고 필요한 값만 설정합니다.

```dotenv
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=investment_db

# 선택 사항: 기업 공시 검색 기능
DART_API_KEY=

# 선택 사항: 문서 검색 기능
QDRANT_URL=http://localhost:6333
```

비밀 키와 서버 주소는 Git에 올리지 않습니다.

### 3. 학습 메뉴 생성

문서 제목을 바꾼 뒤에는 메뉴 생성 스크립트를 실행합니다.

```bash
python3 scripts/sync_learning_menu.py
```

### 4. 서버 시작

```bash
cd app/backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

브라우저에서 <http://localhost:8000>을 엽니다. 상태 확인 주소는 <http://localhost:8000/api/health>입니다.

## Docker로 로컬 PC에서 실행

Docker Desktop(Windows·macOS) 또는 Docker Engine과 Docker Compose 플러그인(Linux)을 설치한 뒤, 저장소 최상위 폴더에서 실행합니다. 기본 Compose는 앱, MongoDB(퀴즈), Qdrant(문서 검색)를 함께 시작하므로 별도의 Docker 네트워크나 외부 DB가 필요 없습니다.

```bash
# 처음 한 번: 앱과 DB를 빌드·시작하고 퀴즈 100문항까지 적재
docker compose --profile init up --build -d

# 이후 실행
docker compose up -d
```

브라우저에서 <http://localhost:8000>을 열고, 상태는 <http://localhost:8000/api/health>에서 확인합니다. 이미 8000·27017·6333·6334 포트를 쓰고 있다면 저장소 루트에 `.env` 파일을 만들고 다음처럼 포트를 바꿉니다. 이 `.env` 파일은 Git에 포함되지 않습니다.

```dotenv
APP_PORT=8080
MONGO_PORT=27018
QDRANT_PORT=6335
QDRANT_GRPC_PORT=6336

# 선택 사항: 공시·통계 API 키
DART_API_KEY=
KOSIS_API_KEY=
BOK_API_KEY=

```

문서 검색 색인은 외부 생성형 AI 없이 384차원 해시 임베딩을 사용합니다. 아래 명령으로 문서를 색인합니다.

```bash
docker compose --profile tools run --rm docs-index
```

문서 변경 후에도 같은 명령으로 색인을 다시 만들 수 있습니다. 컨테이너 상태와 로그는 다음과 같이 확인합니다.

```bash
docker compose ps
docker compose logs -f backend
```

종료는 `docker compose down`으로 합니다. 데이터까지 초기화하려면 `docker compose down -v`를 사용합니다. 이 명령은 MongoDB 퀴즈 데이터와 Qdrant 문서 색인을 지우므로, 정말 새로 시작할 때만 사용하세요.

운영 서버 배포는 로컬용 `docker-compose.yml`이 아니라 `docker-compose.prod.yml`을 사용합니다.

## 배포

`main` 브랜치에 푸시하면 [GitHub Actions 배포 워크플로](.github/workflows/deploy.yml)가 컨테이너 이미지를 만들고 EC2 환경에 배포합니다.

배포에는 다음 GitHub Secrets가 필요할 수 있습니다.

```text
SSH_HOST
SSH_USER
SSH_KEY
DART_API_KEY
KOSIS_API_KEY
BOK_API_KEY
```

문서가 바뀌면 배포 과정에서 Qdrant 문서 검색 인덱스를 다시 만들 수 있습니다. Qdrant를 쓰지 않는 환경에서는 해당 기능을 별도로 구성하거나 비활성화하세요.

## 문서 수정 규칙

- 학습 과정 내용은 `docs/03.md`부터 `docs/07.md`에 작성합니다. 법인·거시경제 참고 문서는 `docs/10.md`, `docs/11.md`에 둡니다.
- 영문 약어는 처음 나올 때 전체 영어 이름과 쉬운 우리말 설명을 함께 적습니다.
- 파이썬 코드, 과제 지시, 수익 보장 표현은 학습 문서에 넣지 않습니다.
- 세금·수수료·규정·시장 수치처럼 바뀔 수 있는 정보는 날짜와 공식 출처를 확인합니다.
- 문서를 수정한 뒤에는 아래 검사를 실행합니다.

```bash
python3 scripts/sync_learning_menu.py
git diff --check
```

## 라이선스와 자료 이용

학습 문서의 이미지는 출처를 표시하고, 원본 권리와 이용 조건을 따릅니다. 외부 링크와 시장 정보는 학습 편의를 위한 것이며, 서비스 운영자는 외부 사이트의 내용·변경·가용성을 보장하지 않습니다.
