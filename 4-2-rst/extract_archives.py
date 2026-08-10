#!/usr/bin/env python3
"""
폴더에 압축파일(zip/tar/tar.gz/tgz)이 들어오면 해제해서 안의 데이터 파일을
같은 폴더로 꺼내놓는 모듈. watch_and_report.py 의 파이프라인에서 가장 먼저
(확장자 정규화보다도 먼저) 호출된다.

  0순위: 압축 해제 (이 모듈)
  0.5순위: 확장자 정규화
  1순위: JSON 정합성 검사 + 분석

해제 후 원본 압축파일은 지우지 않고 ARCHIVE_SUBDIR로 옮겨 감사(audit) 추적이
가능하게 한다. 압축 안의 디렉터리 구조는 무시하고(flatten) 파일만 최상위로
꺼내며, 같은 이름의 파일이 이미 있으면 덮어쓰지 않고 건너뛴다(로그만 남김).
"""
import os
import zipfile
import tarfile

ARCHIVE_EXTS = {".zip", ".tar", ".tar.gz", ".tgz", ".gz"}
ARCHIVE_SUBDIR = "_archives_processed"

# 압축 안에서 무시할 항목(맥OS 메타데이터, 디렉터리 자체 등)
_IGNORE_PREFIXES = ("__MACOSX/", ".")


def _archive_ext(name):
    lower = name.lower()
    for ext in sorted(ARCHIVE_EXTS, key=len, reverse=True):
        if lower.endswith(ext):
            return ext
    return None


def _safe_target(dst_dir, filename):
    """압축 내부 경로(디렉터리 포함)를 무시하고 파일명만 사용."""
    base = os.path.basename(filename)
    return os.path.join(dst_dir, base) if base else None


def _extract_zip(fp, dst_dir):
    extracted = []
    skipped = []
    with zipfile.ZipFile(fp) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename
            if any(name.startswith(p) for p in _IGNORE_PREFIXES):
                continue
            target = _safe_target(dst_dir, name)
            if not target:
                continue
            if os.path.exists(target):
                skipped.append(os.path.basename(target))
                continue
            with zf.open(info) as src, open(target, "wb") as out:
                out.write(src.read())
            extracted.append(os.path.basename(target))
    return extracted, skipped


def _extract_tar(fp, dst_dir):
    extracted = []
    skipped = []
    with tarfile.open(fp) as tf:
        for member in tf.getmembers():
            if not member.isfile():
                continue
            name = member.name
            if any(name.startswith(p) for p in _IGNORE_PREFIXES):
                continue
            target = _safe_target(dst_dir, name)
            if not target:
                continue
            if os.path.exists(target):
                skipped.append(os.path.basename(target))
                continue
            src = tf.extractfile(member)
            if src is None:
                continue
            with open(target, "wb") as out:
                out.write(src.read())
            extracted.append(os.path.basename(target))
    return extracted, skipped


def extract_archives(dir_path):
    """dir_path 최상위의 압축파일을 모두 해제한다.

    반환: [{"archive": 파일명, "extracted": [...], "skipped": [...]}, ...]
    """
    results = []
    archive_dir = os.path.join(dir_path, ARCHIVE_SUBDIR)

    for name in sorted(os.listdir(dir_path)):
        fp = os.path.join(dir_path, name)
        if not os.path.isfile(fp):
            continue
        ext = _archive_ext(name)
        if not ext:
            continue

        try:
            if ext == ".zip":
                extracted, skipped = _extract_zip(fp, dir_path)
            elif ext in (".tar", ".tar.gz", ".tgz"):
                extracted, skipped = _extract_tar(fp, dir_path)
            elif ext == ".gz":
                # 단일 파일 gzip (.tar.gz 가 아닌 경우) 은 tarfile 로 열리지 않으므로 skip
                extracted, skipped = [], []
            else:
                extracted, skipped = [], []
        except Exception as e:
            results.append({"archive": name, "extracted": [], "skipped": [], "error": str(e)})
            continue

        os.makedirs(archive_dir, exist_ok=True)
        moved_to = os.path.join(archive_dir, name)
        if os.path.exists(moved_to):
            base, ext2 = os.path.splitext(name)
            i = 1
            while os.path.exists(os.path.join(archive_dir, f"{base}_{i}{ext2}")):
                i += 1
            moved_to = os.path.join(archive_dir, f"{base}_{i}{ext2}")
        os.rename(fp, moved_to)

        results.append({"archive": name, "extracted": extracted, "skipped": skipped})

    return results


if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    for r in extract_archives(target):
        print(r)
