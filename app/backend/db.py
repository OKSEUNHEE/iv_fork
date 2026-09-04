"""애플리케이션 전역에서 공유하는 비동기 MongoDB 연결 관리 모듈.

MongoDB 서버가 없거나 연결이 거부되는 환경(예: Render 단독 배포 등)에서도
서버가 크래시되지 않고 안전하게 동작하도록 Fallback 메커니즘을 제공한다.
"""
from __future__ import annotations

import logging
import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "investment_db")


class DummyCursor:
    def __init__(self, data=None):
        self._data = data or []

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, length=None):
        return self._data[:length] if length else self._data


class DummyCollection:
    """MongoDB가 연결되지 않을 때 서버 크래시를 방지하는 메모리 더미 컬렉션"""
    def __init__(self, name: str):
        self.name = name

    async def find_one(self, *args, **kwargs):
        return None

    def find(self, *args, **kwargs):
        return DummyCursor()

    async def insert_one(self, doc, *args, **kwargs):
        class DummyResult:
            inserted_id = "dummy_id"
        return DummyResult()

    async def update_one(self, *args, **kwargs):
        return None

    async def delete_one(self, *args, **kwargs):
        return None

    async def count_documents(self, *args, **kwargs):
        return 0


class DummyDatabase:
    """MongoDB 연결 실패 시 안전하게 대체되는 더미 DB"""
    def __init__(self):
        self._collections = {}

    def __getitem__(self, name: str):
        if name not in self._collections:
            self._collections[name] = DummyCollection(name)
        return self._collections[name]

    def __getattr__(self, name: str):
        return self[name]


def get_client() -> AsyncIOMotorClient | None:
    global _client
    if _client is None:
        try:
            _client = AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
                socketTimeoutMS=2000
            )
        except Exception as e:
            logger.warning("MongoDB client init failed: %s", e)
            _client = None
    return _client


def get_db() -> AsyncIOMotorDatabase | DummyDatabase:
    global _db
    if _db is None:
        try:
            client = get_client()
            if client:
                _db = client[MONGODB_DB]
            else:
                _db = DummyDatabase()
        except Exception as e:
            logger.warning("MongoDB get_db failed, using DummyDatabase: %s", e)
            _db = DummyDatabase()
    return _db


async def close_client() -> None:
    global _client, _db
    if _client:
        try:
            _client.close()
        except Exception:
            pass
        _client = None
        _db = None