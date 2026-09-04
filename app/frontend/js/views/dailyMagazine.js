import { api } from '../api.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatChange(pct) {
  if (pct === null || pct === undefined) return '';
  const num = Number(pct);
  const isUp = num > 0;
  const isDown = num < 0;
  const sign = isUp ? '+' : '';
  const color = isUp ? '#10b981' : isDown ? '#ef4444' : '#94a3b8';
  const icon = isUp ? '▲' : isDown ? '▼' : '-';
  return `<span style="color:${color};font-weight:800;font-size:0.85rem;">${icon} ${sign}${num.toFixed(2)}%</span>`;
}

// html2canvas 동적 로드
function loadHtml2Canvas(callback) {
  if (window.html2canvas) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  script.onload = callback;
  document.head.appendChild(script);
}

// 홈과 전용 페이지에서 같은 매거진 UI를 재사용한다.
export function mountDailyMagazine(container) {
  container.innerHTML = `
    <div style="max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:20px;">
      
      <!-- 상단 컨트롤 바 -->
      <section class="card" style="padding:16px 20px;border-radius:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;gap:8px;">
          <button id="btn-morning" class="btn btn-primary" style="padding:8px 16px;border-radius:8px;font-size:0.88rem;font-weight:700;">
            🌅 모닝 에디션 (Morning Cut)
          </button>
          <button id="btn-evening" class="btn btn-secondary" style="padding:8px 16px;border-radius:8px;font-size:0.88rem;font-weight:700;">
            🌇 이브닝 에디션 (Evening Cut)
          </button>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="btn-capture-insta" class="btn btn-secondary" style="padding:8px 14px;font-size:0.84rem;color:#e11d48;border-color:#fecdd3;background:#fff1f2;">
            <i class="fa-solid fa-download"></i> 한눈에 보는 이미지 저장하기
          </button>
          <button id="btn-refresh-mag" class="btn btn-secondary" style="padding:8px 12px;font-size:0.84rem;">
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
        </div>
      </section>

      <!-- ═══════════════ [매거진 캡처 캔버스 영역] ═══════════════ -->
      <div id="magazine-capture-root" style="padding:4px;">
        
        <!-- 매거진 전체 카드 -->
        <div id="magazine-sheet" style="background:var(--surface);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.06);display:flex;flex-direction:column;">
          
          <!-- 매거진 헤더 / 커버 -->
          <div id="magazine-cover" style="padding:36px 36px 28px;background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);color:#fff;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:12px;">
              <span id="mag-vol" style="font-family:monospace;font-size:0.85rem;letter-spacing:2px;color:#a5b4fc;font-weight:800;">VOL. 0904</span>
              <span style="font-size:0.75rem;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);letter-spacing:1px;font-weight:700;">DAILY STOCK MAGAZINE</span>
              <span id="mag-date" style="font-size:0.82rem;color:#cbd5e1;">2026.09.04 (금)</span>
            </div>

            <h1 id="mag-title" style="margin:0 0 10px;font-size:1.8rem;font-weight:900;line-height:1.35;letter-spacing:-0.5px;">
              뉴욕 증시 훈풍과 빅테크 실적 기대감 속 오늘 장 출발
            </h1>
            <p id="mag-subtitle" style="margin:0;font-size:0.95rem;color:#cbd5e1;line-height:1.5;">
              AI 반도체 수요 견조 · 달러/원 환율 안정세 · 개장 전 필수 체크포인트
            </p>
          </div>

          <!-- 4대 핵심 지표 바 -->
          <div id="mag-metrics" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1px;background:var(--border);border-top:1px solid var(--border);border-bottom:1px solid var(--border);"></div>

          <!-- 본문 스토리 3선 -->
          <div style="padding:32px 36px;display:flex;flex-direction:column;gap:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <h2 style="font-size:1.15rem;margin:0;display:flex;align-items:center;gap:8px;font-weight:800;color:var(--text-main);">
                <i class="fa-solid fa-bolt" style="color:#f59e0b;"></i> TODAY'S 3 KEY ISSUES
              </h2>
              <span style="font-size:0.75rem;color:var(--text-muted);letter-spacing:1px;">CURATED BY AI ANALYST</span>
            </div>

            <div id="mag-stories-container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;"></div>

            <!-- 에디터스 픽 (Hot Pick ETF) -->
            <div id="mag-hotpick-box" style="margin-top:10px;padding:20px 24px;border-radius:16px;background:linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.06) 100%);border:1px solid rgba(99,102,241,0.25);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <span style="font-size:0.72rem;padding:2px 8px;border-radius:4px;background:#6366f1;color:#fff;font-weight:800;">EDITOR'S HOT PICK</span>
                  <strong id="hotpick-name" style="font-size:1.05rem;color:#1e1b4b;">TIGER 반도체TOP10</strong>
                </div>
                <p id="hotpick-reason" style="margin:0;font-size:0.84rem;color:var(--text-muted);">
                  글로벌 AI 반도체 랠리와 HBM 공급망 확대 수혜 1순위 ETF
                </p>
              </div>
              <div style="text-align:right;">
                <span id="hotpick-stat" style="font-size:0.82rem;font-weight:800;color:#4338ca;padding:4px 10px;border-radius:6px;background:#e0e7ff;">
                  최근 1개월 수급 강세
                </span>
              </div>
            </div>

            <!-- 매거진 푸터 -->
            <div style="margin-top:12px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--text-subtle);">
              <span>© 2026 INVESTMENT ANALYSIS MAGAZINE | FOR INVESTORS</span>
              <span>INSTAGRAM: @INVESTMENT_DAILY</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  const btnMorning = container.querySelector('#btn-morning');
  const btnEvening = container.querySelector('#btn-evening');
  const btnCapture = container.querySelector('#btn-capture-insta');
  const btnRefresh = container.querySelector('#btn-refresh-mag');

  const magVol = container.querySelector('#mag-vol');
  const magDate = container.querySelector('#mag-date');
  const magTitle = container.querySelector('#mag-title');
  const magSubtitle = container.querySelector('#mag-subtitle');
  const magMetrics = container.querySelector('#mag-metrics');
  const magStories = container.querySelector('#mag-stories-container');
  const magCover = container.querySelector('#magazine-cover');
  const hotpickName = container.querySelector('#hotpick-name');
  const hotpickReason = container.querySelector('#hotpick-reason');
  const hotpickStat = container.querySelector('#hotpick-stat');

  let magazineData = null;
  let currentEdition = 'morning';

  function renderEdition(type) {
    if (!magazineData) return;
    currentEdition = type;
    const ed = magazineData[type];
    if (!ed) return;

    if (type === 'morning') {
      btnMorning.className = 'btn btn-primary';
      btnEvening.className = 'btn btn-secondary';
      magCover.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)';
    } else {
      btnEvening.className = 'btn btn-primary';
      btnMorning.className = 'btn btn-secondary';
      magCover.style.background = 'linear-gradient(135deg, #1c1917 0%, #431407 60%, #7c2d12 100%)';
    }

    magVol.textContent = ed.vol;
    magDate.textContent = ed.date_label;
    magTitle.textContent = ed.title;
    magSubtitle.textContent = ed.subtitle;

    // 지표 바
    magMetrics.innerHTML = ed.key_metrics.map(m => `
      <div style="padding:16px 20px;background:var(--surface);display:flex;flex-direction:column;justify-content:center;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
          <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">${escapeHtml(m.label)}</span>
          <span style="font-size:0.68rem;color:var(--text-subtle);">${escapeHtml(m.sub)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <strong style="font-size:1.1rem;color:var(--text-main);">${escapeHtml(m.val)}</strong>
          ${formatChange(m.pct)}
        </div>
      </div>
    `).join('');

    // 3대 스토리
    magStories.innerHTML = ed.stories.map((s, idx) => `
      <article style="padding:20px;background:var(--surface-subtle);border-radius:14px;border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:0.7rem;font-weight:800;letter-spacing:1px;color:#6366f1;">#${idx+1} ${escapeHtml(s.tag)}</span>
            <span style="font-size:0.7rem;padding:2px 6px;border-radius:4px;background:rgba(99,102,241,0.1);color:#4f46e5;font-weight:700;">INSIGHT</span>
          </div>
          <h3 style="font-size:0.96rem;font-weight:800;color:var(--text-main);margin:0 0 8px;line-height:1.45;">
            ${escapeHtml(s.headline)}
          </h3>
          <p style="margin:0;font-size:0.82rem;color:var(--text-muted);line-height:1.6;white-space:pre-line;">
            ${escapeHtml(s.body)}
          </p>
        </div>
        <div style="padding-top:10px;border-top:1px dashed var(--border);font-size:0.75rem;font-weight:700;color:#0ea5e9;">
          <i class="fa-solid fa-check"></i> ${escapeHtml(s.highlight)}
        </div>
      </article>
    `).join('');

    // 핫픽
    if (ed.hot_pick) {
      hotpickName.textContent = ed.hot_pick.name;
      hotpickReason.textContent = ed.hot_pick.reason;
      hotpickStat.textContent = ed.hot_pick.stat;
    }
  }

  async function loadData() {
    try {
      const res = await api.dailyMagazine();
      if (res && res.status === 'success') {
        magazineData = res;
        renderEdition(res.active_edition || 'morning');
      }
    } catch (err) {
      console.error(err);
    }
  }

  btnMorning.addEventListener('click', () => renderEdition('morning'));
  btnEvening.addEventListener('click', () => renderEdition('evening'));
  btnRefresh.addEventListener('click', loadData);

  // 인스타그램 이미지 캡처 다운로드
  btnCapture.addEventListener('click', () => {
    btnCapture.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 이미지 생성 중...';
    loadHtml2Canvas(() => {
      const target = container.querySelector('#magazine-sheet');
      window.html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a'
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `Stock_Magazine_${currentEdition}_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        btnCapture.innerHTML = '<i class="fa-solid fa-download"></i> 한눈에 보는 이미지 저장하기';
      }).catch((err) => {
        alert('이미지 저장 중 오류가 발생했습니다.');
        btnCapture.innerHTML = '<i class="fa-solid fa-download"></i> 한눈에 보는 이미지 저장하기';
      });
    });
  });

  loadData();
}

export function dailyMagazineView(container) {
  mountDailyMagazine(container);
}
