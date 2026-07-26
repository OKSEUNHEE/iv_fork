FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    grep -v '^torch$' requirements.txt > requirements.nogpu.txt \
    && pip install --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install -r requirements.nogpu.txt

COPY app/ ./app/
RUN mkdir -p app/frontend/vendor \
    && python -c "import pathlib, urllib.request; pathlib.Path('app/frontend/vendor/mermaid.min.js').write_bytes(urllib.request.urlopen('https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.min.js', timeout=90).read())" \
    && test -s app/frontend/vendor/mermaid.min.js
COPY docs/ ./docs/

EXPOSE 8000

CMD ["uvicorn", "app.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
