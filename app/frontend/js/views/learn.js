/**
 * learn.js — MD 파일 학습 뷰 (marked.js CDN 렌더링)
 * /api/learn/doc/{docId} 엔드포인트에서 markdown 텍스트를 받아 렌더링
 */

const DOC_MAP = {
  '01': { title: 'Day 1 · 법인·세무·회계 기초',        file: '01' },
  '02': { title: 'Day 2 · 매크로 분석 및 금리',         file: '02' },
  '03': { title: 'Day 3 · 경제지표 분석',               file: '03' },
  '04': { title: 'Day 4 · 거시경제 상황 분석 실습',     file: '04' },
  '05': { title: 'Day 5 · 산업 분석',                   file: '05' },
  '06': { title: 'Day 6 · 산업 분석 실습',              file: '06' },
  '07': { title: 'Day 7 · 재무제표 분석 I',             file: '07' },
  '08': { title: 'Day 8 · 재무제표 분석 II',            file: '08' },
  '09': { title: 'Day 9 · 상대가치 평가',               file: '09' },
  '10': { title: 'Day 10 · 기술적 분석 I',              file: '10' },
  '11': { title: 'Day 11 · 기술적 분석 II',             file: '11' },
  '12': { title: 'Day 12 · 주식·배당·파생상품 기초',    file: '12' },
  '13': { title: 'Day 13 · 금융상품의 구분',            file: '13' },
  '14': { title: 'Day 14 · 파생상품 이해',              file: '14' },
  '15': { title: 'Day 15 · 포트폴리오 이론 및 성과',    file: '15' },
  'voca': { title: '핵심 용어집',                       file: 'voca' },
};

function ensureMarked() {
  if (window.marked) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/marked@11/marked.min.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function ensureMermaid() {
  if (window.mermaid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.type = 'module';
    s.textContent = `
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      window.mermaid = mermaid;
      window.dispatchEvent(new Event('mermaid-ready'));
    `;
    window.addEventListener('mermaid-ready', () => resolve(), { once: true });
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/** marked이 만든 <pre><code class="language-mermaid"> 블록을 mermaid가 인식하는
 *  <pre class="mermaid"> 블록으로 바꾸고 렌더링한다. */
async function renderMermaidBlocks(root) {
  const blocks = [...root.querySelectorAll('code.language-mermaid')];
  if (!blocks.length) return;

  await ensureMermaid();

  blocks.forEach((code) => {
    const pre = code.closest('pre');
    const graphDef = code.textContent;
    const wrap = document.createElement('pre');
    wrap.className = 'mermaid';
    wrap.textContent = graphDef;
    pre.replaceWith(wrap);
  });

  try {
    await window.mermaid.run({ nodes: root.querySelectorAll('pre.mermaid') });
  } catch (err) {
    console.error('mermaid 렌더링 실패:', err);
  }
}

function buildToc(container) {
  const heads = [...container.querySelectorAll('h2, h3')];
  if (!heads.length) return '';
  return `<div class="learn-toc" id="learn-toc">
    <div class="learn-toc-hdr">
      <div class="learn-toc-title"><i class="fa-solid fa-list-ul"></i> 목차</div>
      <button class="learn-toc-close" id="learn-toc-close" type="button" aria-label="목차 닫기">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <ul class="toc-list">
      ${heads.map(h => {
        const cls = h.tagName === 'H3' ? 'toc-item h3' : 'toc-item';
        return `<li class="${cls}" data-id="${h.id}">${h.textContent.replace(/^[#\s]+/,'')}</li>`;
      }).join('')}
    </ul>
  </div>`;
}

export function learnView(app, docId) {
  const info = DOC_MAP[docId];
  if (!info) {
    app.innerHTML = `<div class="card"><p>문서를 찾을 수 없습니다: ${docId}</p></div>`;
    return;
  }

  app.innerHTML = `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <div class="loading-text">문서 로딩 중…</div>
    </div>`;

  Promise.all([
    ensureMarked(),
    fetch(`/api/learn/doc/${info.file}`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
  ]).then(([, data]) => {
    const html = window.marked.parse(data.content || '');

    app.innerHTML = `
      <div class="learn-container" id="learn-wrap">
        <div class="learn-body">
          <div class="md-body" id="md-content">${html}</div>
        </div>
        <button class="toc-toggle-btn" id="toc-toggle" type="button">
          <i class="fa-solid fa-list-ul"></i> 목차
        </button>
        <div class="toc-overlay" id="toc-overlay"></div>
        <div id="toc-placeholder"></div>
      </div>`;

    // 화면 전환 시(다른 학습 문서/뷰로 이동) 열려 있던 목차 offcanvas를 정리
    window._viewCleanup = () => closeToc();

    // add heading IDs for TOC navigation
    const mdContent = app.querySelector('#md-content');
    mdContent.querySelectorAll('h2, h3').forEach((h, i) => {
      if (!h.id) h.id = `heading-${i}`;
    });

    // mermaid 코드블록(```mermaid ... ```) 렌더링
    renderMermaidBlocks(mdContent);

    // inject TOC (문서에 소제목이 없으면 목차 버튼도 숨김)
    const tocEl = app.querySelector('#toc-placeholder');
    const tocHtml = buildToc(mdContent);
    if (tocEl) tocEl.outerHTML = tocHtml;
    if (!tocHtml) app.querySelector('#toc-toggle')?.style.setProperty('display', 'none');

    // 목차 offcanvas 열기/닫기
    function openToc() {
      app.querySelector('#learn-toc')?.classList.add('open');
      app.querySelector('#toc-overlay')?.classList.add('show');
    }
    function closeToc() {
      app.querySelector('#learn-toc')?.classList.remove('open');
      app.querySelector('#toc-overlay')?.classList.remove('show');
    }
    app.querySelector('#toc-toggle')?.addEventListener('click', openToc);
    app.querySelector('#toc-overlay')?.addEventListener('click', closeToc);
    app.querySelector('#learn-toc-close')?.addEventListener('click', closeToc);

    // wire TOC clicks
    app.querySelectorAll('.toc-item').forEach(li => {
      li.addEventListener('click', () => {
        const target = document.getElementById(li.dataset.id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.innerWidth <= 1024) closeToc();
      });
    });

    // TOC active tracking
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          app.querySelectorAll('.toc-item').forEach(li => li.classList.remove('active'));
          const li = app.querySelector(`.toc-item[data-id="${e.target.id}"]`);
          if (li) li.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    mdContent.querySelectorAll('h2, h3').forEach(h => observer.observe(h));

  }).catch(err => {
    app.innerHTML = `<div class="card">
      <p style="color:var(--red)">문서를 불러오지 못했습니다: ${err.message}</p>
      <p style="font-size:.82rem;color:var(--text-muted)">백엔드 서버가 실행 중인지 확인하세요.</p>
    </div>`;
  });
}
