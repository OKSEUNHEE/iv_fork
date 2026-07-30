FastAPI로 Web API를 만드는 전체 과정입니다. 핵심 개념만 모아서 **설치부터 실행, 기능 구현, 데이터 검증, 데이터베이스 연동, 배포**까지 순서대로 정리했습니다.

---

## 1. 개발 환경 설정 & 설치

가장 먼저 Python 프로젝트 환경을 잡고 필요한 패키지를 설치합니다.

```bash
# 1. 프로젝트 폴더 생성 및 이동
mkdir my_fastapi_project
cd my_fastapi_project

# 2. 가상환경 생성 및 활성화
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 3. 필수 패키지 설치
pip install fastapi uvicorn

```

* **FastAPI**: API 프레임워크 핵심 패키지
* **Uvicorn**: FastAPI를 실행해 주는 초고속 비동기 웹 서버 (ASGI)

---

## 2. 첫 번째 API 작성 (`main.py`)

루트 디렉토리에 `main.py` 파일을 만들고 basic 코드를 작성합니다.

```python
from fastapi import FastAPI

# FastAPI 앱 객체 생성
app = FastAPI()

# GET 요청을 처리하는 기본 경로(Route)
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# 경로 파라미터(Path Parameter) 예시
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "query": q}

```

---

## 3. 서버 실행 및 스웨거(Swagger) 문서 확인

작성한 코드의 서버를 띄우고 테스트합니다.

```bash
uvicorn main:app --reload

```

* `main:app`: `main.py` 파일 내부의 `app` 객체를 실행하겠다는 의미입니다.
* `--reload`: 코드를 수정할 때마다 서버가 자동으로 재시작됩니다. (개발용)

서버가 실행되면 브라우저에서 아래 주소로 접속해 보세요:

* **API 호출**: `[http://127.0.0.1:8000/](http://127.0.0.1:8000/)`
* **자동 생성 API 문서 (Swagger UI)**: `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)`
* **대체 API 문서 (ReDoc)**: `[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)`

> FastAPI의 가장 큰 장점 중 하나는 별도의 설정 없이 코드 작성만으로 테스트 가능한 **대화형 API 문서가 자동 생성**된다는 점입니다.

---

## 4. Request Body 처리 (Pydantic 데이터 검증)

클라이언트에서 `POST`나 `PUT` 요청으로 JSON 데이터를 보낼 때, Pydantic 라이브러리를 통해 데이터 타입을 자동으로 검증할 수 있습니다.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# 요청받을 데이터 구조 정의
class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None  # 선택 항목 (기본값 None)

@app.post("/items/")
def create_item(item: Item):
    # item 객체는 Pydantic 모델로 타입 자동 검증 완료된 상태
    return {"status": "success", "data": item}

```

---

## 5. 데이터베이스(DB) 연동 (SQLAlchemy)

실제 서비스에서는 DB 연동이 필수입니다. 주로 `SQLAlchemy` ORM과 함께 사용합니다.

1. **패키지 추가 설치**
```bash
pip install sqlalchemy

```


2. **DB 설정 패턴 (`database.py`)**
* DB 연결 객체 생성 (`engine`)
* 세션 생성기 정의 (`SessionLocal`)


3. **의존성 주입(Dependency Injection)을 통한 DB 세션 관리**
```python
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

# DB 세션을 가져오는 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/")
def read_users(db: Session = Depends(get_db)):
    # db 세션을 이용해 데이터 조회
    users = db.query(UserModel).all()
    return users

```



---

## 6. 프로젝트 구조 모듈화 (FastAPI Router)

프로젝트가 커지면 `main.py` 하나에 모든 코드를 넣을 수 없습니다. `APIRouter`를 사용해 기능별로 코드를 분리합니다.

**프로젝트 구조 예시**

```text
my_fastapi_project/
├── main.py
├── database.py
├── routers/
│   ├── users.py
│   └── items.py
└── models/
    └── user.py

```

**`routers/users.py`**

```python
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def get_users():
    return [{"username": "alice"}, {"username": "bob"}]

```

**`main.py` (라우터 등록)**

```python
from fastapi import FastAPI
from routers import users

app = FastAPI()

# 라우터 등록
app.include_router(users.router)

```

---

## 7. 배포 (Deployment)

개발이 끝난 앱을 실제 운영 환경에 배포할 때는 다음과 같은 방식을 사용합니다.

1. **의존성 목록 출력**
```bash
pip freeze > requirements.txt

```


2. **배포 방식 선택**
* **Docker 컨테이너화**: `python:3.11-slim` 이미지를 베이스로 `uvicorn` 실행 환경 구성
* **클라우드 서비스**: AWS (ECS, App Runner), Render, Fly.io, GCP Cloud Run 등에 배포
* **프로덕션 서버 구성**: Nginx (Reverse Proxy) + Uvicorn 프로세스 관리자(Gunicorn) 조합 사용



---
