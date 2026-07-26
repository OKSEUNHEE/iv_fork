#!/usr/bin/env python3
"""RESOURCE_TOPICS(app/frontend/js/data/resourceTopics.js)의 각 주제에 대해
YouTube 검색 결과를 수집하고, 임베드 재생이 가능한(playableInEmbed) 영상만 골라
app/frontend/js/data/youtubeVideos.json 으로 저장한다.

런타임(배포된 앱)에서는 크롤링을 하지 않는다 — 이 스크립트는 개발 중 수동으로
실행해 정적 데이터 파일을 갱신하는 용도다. YouTube가 공식 지원하는 API가 아니라
검색결과 페이지에 내장된 ytInitialData / 시청페이지의 ytInitialPlayerResponse를
파싱하는 방식이라, YouTube 페이지 구조가 바뀌면 깨질 수 있다.

사용법: .venv/bin/python3 scripts/crawl_youtube_videos.py
"""
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_JS = ROOT / "app" / "frontend" / "js" / "data" / "resourceTopics.js"
OUT_JSON = ROOT / "app" / "frontend" / "js" / "data" / "youtubeVideos.json"

VIDEOS_PER_TOPIC = 3
CANDIDATES_TO_CHECK = 8
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_topics_from_js() -> list[dict]:
    """resourceTopics.js의 RESOURCE_TOPICS 배열을 정규식으로 파싱 (JS 모듈이라 직접 import 불가)."""
    text = TOPICS_JS.read_text(encoding="utf-8")
    block = re.search(r"RESOURCE_TOPICS\s*=\s*\[(.*?)\];", text, re.S).group(1)
    entries = re.findall(
        r"\{\s*category:\s*'([^']*)',\s*label:\s*'([^']*)',\s*query:\s*'([^']*)'\s*\}",
        block,
    )
    return [{"category": c, "label": l, "query": q} for c, l, q in entries]


def search_candidates(query: str) -> list[dict]:
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": query})
    html = fetch(url)
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        return []
    data = json.loads(m.group(1))

    out: list[dict] = []

    def walk(obj):
        if isinstance(obj, dict):
            if "videoRenderer" in obj:
                out.append(obj["videoRenderer"])
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    walk(data)
    return out[:CANDIDATES_TO_CHECK]


def check_embeddable(video_id: str) -> bool:
    try:
        html = fetch(f"https://www.youtube.com/watch?v={video_id}")
        m = re.search(r"var ytInitialPlayerResponse = (\{.*?\});", html)
        if not m:
            return False
        data = json.loads(m.group(1))
        status = data.get("playabilityStatus", {})
        return bool(status.get("playableInEmbed")) and status.get("status") == "OK"
    except Exception as exc:  # noqa: BLE001
        print(f"    embeddable check failed for {video_id}: {exc}")
        return False


def main() -> None:
    topics = parse_topics_from_js()
    print(f"{len(topics)}개 주제에 대해 크롤링을 시작합니다.")

    result: dict[str, list[dict]] = {}
    for t in topics:
        print(f"- {t['category']} / {t['label']} ({t['query']})")
        candidates = search_candidates(t["query"])
        picked = []
        for c in candidates:
            if len(picked) >= VIDEOS_PER_TOPIC:
                break
            vid = c.get("videoId")
            if not vid:
                continue
            time.sleep(0.3)
            if not check_embeddable(vid):
                print(f"    skip (임베드 불가): {vid}")
                continue
            title = "".join(r.get("text", "") for r in c.get("title", {}).get("runs", []))
            channel = "".join(r.get("text", "") for r in c.get("ownerText", {}).get("runs", []))
            length = c.get("lengthText", {}).get("simpleText", "")
            thumbs = c.get("thumbnail", {}).get("thumbnails", [])
            thumb = thumbs[-1]["url"] if thumbs else f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
            picked.append({
                "videoId": vid,
                "title": title,
                "channel": channel,
                "length": length,
                "thumbnail": thumb,
            })
            print(f"    OK: {vid} - {title}")
        result[t["label"]] = {
            "category": t["category"],
            "query": t["query"],
            "videos": picked,
        }
        time.sleep(0.5)

    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(v["videos"]) for v in result.values())
    print(f"\n완료: {OUT_JSON.relative_to(ROOT)} ({total}개 영상)")


if __name__ == "__main__":
    main()
