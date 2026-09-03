import { api } from '../api.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatPrice(val, currency = 'USD') {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (currency === 'KRW') {
    return num.toLocaleString('ko-KR') + ' 원';
  }
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(change, pct) {
  if (pct === null || pct === undefined) return '';
  const num = Number(pct);
  const isUp = num > 0;
  const isDown = num < 0;
  const sign = isUp ? '+' : '';
  const color = isUp ? '#10b981' : isDown ? '#ef4444' : '#64748b';
  const icon = isUp ? '▲' : isDown ? '▼' : '-';
  return `<span style="color:${color};font-weight:700;font-size:0.85rem;">${icon} ${sign}${num.toFixed(2)}%</span>`;
}

function formatDate(value) {
  if (!value) return '방금 전';
  const date = new Date(value);
  return isNaN(date.getTime()) ? value
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function renderAiSummaryCard(aiData, isUs = false) {
  if (!aiData || !aiData.summary || !aiData.summary.length) return '';
  const sentiment = aiData.sentiment || '중립';
  const isPositive = sentiment.includes('호재') || sentiment.includes('긍정');
  const isNegative = sentiment.includes('악재') || sentiment.includes('주의');
  const badgeBg = isPositive ? '#ecfdf5' : isNegative ? '#fef2f2' : '#f8fafc';
  const badgeColor = isPositive ? '#065f46' : isNegative ? '#991b1b' : '#334155';
  const badgeBorder = isPositive ? '#a7f3d0' : isNegative ? '#fecaca' : '#cbd5e1';
  const badgeIcon = isPositive ? 'fa-arrow-trend-up' : isNegative ? 'fa-triangle-exclamation' : 'fa-minus';

  return `
    <div style="margin-bottom:16px;padding:18px 20px;background:linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(139,92,246,0.06) 100%);border:1px solid rgba(139,92,246,0.3);border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.1rem;background:linear-gradient(135deg,#8b5cf6,#2563eb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;">
            <i class="fa-solid fa-wand-magic-sparkles" style="-webkit-text-fill-color:#8b5cf6;"></i> AI 스마트 ${isUs ? '한국어 번역 & ' : ''}3줄 브리핑
          </span>
          <span style="font-size:0.75rem;padding:2px 7px;border-radius:999px;background:#ede9fe;color:#5b21b6;font-weight:600;">AI 실시간 생성</span>
        </div>
        <div style="font-size:0.8rem;padding:4px 10px;border-radius:8px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};font-weight:700;">
          <i class="fa-solid ${badgeIcon}"></i> 투자 심리: ${escapeHtml(sentiment)}
        </div>
      </div>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;color:var(--text-main);font-size:0.88rem;line-height:1.6;">
        ${aiData.summary.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
      <div style="margin-top:10px;font-size:0.72rem;color:var(--text-muted);text-align:right;">
        * ${isUs ? '미국 현지 영문 뉴스를 AI가 한글로 번역 및 분석한 요약입니다.' : '국내 최신 증권 기사를 종합 분석한 AI 요약입니다.'}
      </div>
    </div>
  `;
}

export function globalMarketView(container) {
  container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:20px;">
      
      <!-- 헤더 & 탭 네비게이션 -->
      <section class="card" style="padding:20px 24px;border-radius:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <h1 style="margin:0 0 6px;font-size:1.45rem;display:flex;align-items:center;gap:10px;">
              <i class="fa-solid fa-earth-americas" style="color:#2563eb;"></i> 통합 금융 마켓 대시보드
            </h1>
            <p style="margin:0;color:var(--text-muted);font-size:0.88rem;">
              인베스팅닷컴 스타일의 <strong>국내(코스피·코스닥) 및 미국/글로벌 핵심 지수, 대형주, AI 뉴스 번역·요약</strong> 통합 플랫폼입니다.
            </p>
          </div>
          <button id="global-refresh-btn" class="btn btn-secondary" style="font-size:0.85rem;">
            <i class="fa-solid fa-arrows-rotate"></i> 실시간 시세 새로고침
          </button>
        </div>

        <!-- 탭 전환 버튼 -->
        <div style="display:flex;gap:10px;margin-top:20px;border-top:1px solid var(--border);padding-top:16px;">
          <button id="tab-kr" class="btn btn-primary" style="padding:8px 18px;font-size:0.92rem;border-radius:8px;">
            <i class="fa-solid fa-won-sign"></i> 🇰🇷 국내 증시 (KRX / 코스피·코스닥)
          </button>
          <button id="tab-global" class="btn btn-secondary" style="padding:8px 18px;font-size:0.92rem;border-radius:8px;">
            <i class="fa-solid fa-dollar-sign"></i> 🇺🇸 미국 & 글로벌 증시 (Global Market)
          </button>
        </div>
      </section>

      <!-- ═══════════════ [1. 국내 증시 패널] ═══════════════ -->
      <div id="panel-kr" style="display:flex;flex-direction:column;gap:24px;">
        
        <!-- 국내 전광판 -->
        <section>
          <h2 style="font-size:1.1rem;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-chart-line" style="color:#0f766e;"></i> 국내 주요 지수 & 환율 전광판
          </h2>
          <div id="kr-overview-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;">
            <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin"></i> 국내 지표 불러오는 중...
            </div>
          </div>
        </section>

        <!-- 국내 시총 상위 대형주 -->
        <section>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.1rem;margin:0;display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-crown" style="color:#eab308;"></i> 국내 시가총액 TOP 10 대형주 시세
            </h2>
            <span style="font-size:0.78rem;color:var(--text-muted);">종목 카드를 클릭하면 해당 기업의 AI 요약과 증권 뉴스가 즉시 조회됩니다.</span>
          </div>
          <div id="kr-top-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
            <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin"></i> 국내 대표 종목 시세 불러오는 중...
            </div>
          </div>
        </section>

        <!-- 국내 종목 검색 & AI 요약 & 증권 뉴스 피드 -->
        <section class="card" style="padding:24px;border-radius:16px;">
          <h2 style="font-size:1.15rem;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-magnifying-glass" style="color:#0f766e;"></i> 국내 상장 기업 검색 & AI 증권 뉴스 분석
          </h2>
          <form id="kr-search-form" style="display:flex;gap:10px;margin-bottom:16px;">
            <input id="kr-search-input" class="param-input" value="삼성전자" maxlength="50" placeholder="국내 기업명 입력 (예: 삼성전자, SK하이닉스, 현대차, 에코프로, 카카오)" style="flex:1;" />
            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-search"></i> 분석 및 뉴스 검색</button>
          </form>
          
          <div id="kr-news-status" style="margin-bottom:12px;font-size:0.84rem;color:var(--text-muted);"></div>
          
          <!-- AI 브리핑 영역 -->
          <div id="kr-ai-summary-box"></div>

          <!-- 뉴스 목록 -->
          <div id="kr-news-list" style="display:grid;gap:12px;"></div>
        </section>

      </div>

      <!-- ═══════════════ [2. 미국/글로벌 증시 패널] ═══════════════ -->
      <div id="panel-global" style="display:none;flex-direction:column;gap:24px;">
        
        <!-- 글로벌 전광판 -->
        <section>
          <h2 style="font-size:1.1rem;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-chart-simple" style="color:#0ea5e9;"></i> 글로벌 주요 지수 & 원자재 전광판
          </h2>
          <div id="global-overview-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;">
            <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin"></i> 글로벌 지표 불러오는 중...
            </div>
          </div>
        </section>

        <!-- 미국 M7 빅테크 시세 -->
        <section>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.1rem;margin:0;display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-fire" style="color:#f59e0b;"></i> 미국 빅테크 (Magnificent 7) 실시간 시세
            </h2>
            <span style="font-size:0.78rem;color:var(--text-muted);">종목 카드를 클릭하면 미국 현지 속보가 한글로 자동 번역·요약됩니다.</span>
          </div>
          <div id="m7-stocks-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
            <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin"></i> 빅테크 시세 불러오는 중...
            </div>
          </div>
        </section>

        <!-- 미국 주식 검색 & AI 번역·요약 & 글로벌 속보 피드 -->
        <section class="card" style="padding:24px;border-radius:16px;">
          <h2 style="font-size:1.15rem;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-magnifying-glass" style="color:#8b5cf6;"></i> 미국 종목 검색 & AI 영문 속보 번역 브리핑
          </h2>
          <form id="global-search-form" style="display:flex;gap:10px;margin-bottom:16px;">
            <input id="global-ticker-input" class="param-input" value="NVDA" maxlength="15" placeholder="미국 티커 입력 (예: NVDA, TSLA, AAPL, MSFT, AMD, PLTR)" style="flex:1;text-transform:uppercase;font-weight:700;letter-spacing:1px;" />
            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-search"></i> 미국 뉴스 분석</button>
          </form>

          <!-- 선택된 종목 요약 카드 -->
          <div id="selected-stock-card" style="margin-bottom:16px;display:none;"></div>

          <!-- AI 번역 브리핑 영역 -->
          <div id="global-ai-summary-box"></div>

          <!-- 글로벌 뉴스 목록 -->
          <div id="global-news-list" style="display:grid;gap:12px;"></div>
        </section>

      </div>

    </div>
  `;

  // 요소 참조
  const tabKr = container.querySelector('#tab-kr');
  const tabGlobal = container.querySelector('#tab-global');
  const panelKr = container.querySelector('#panel-kr');
  const panelGlobal = container.querySelector('#panel-global');
  const refreshBtn = container.querySelector('#global-refresh-btn');

  // 국내 패널 요소
  const krOverviewGrid = container.querySelector('#kr-overview-grid');
  const krTopGrid = container.querySelector('#kr-top-grid');
  const krSearchForm = container.querySelector('#kr-search-form');
  const krSearchInput = container.querySelector('#kr-search-input');
  const krNewsStatus = container.querySelector('#kr-news-status');
  const krAiSummaryBox = container.querySelector('#kr-ai-summary-box');
  const krNewsList = container.querySelector('#kr-news-list');

  // 글로벌 패널 요소
  const globalOverviewGrid = container.querySelector('#global-overview-grid');
  const m7Grid = container.querySelector('#m7-stocks-grid');
  const globalSearchForm = container.querySelector('#global-search-form');
  const globalTickerInput = container.querySelector('#global-ticker-input');
  const stockCard = container.querySelector('#selected-stock-card');
  const globalAiSummaryBox = container.querySelector('#global-ai-summary-box');
  const globalNewsList = container.querySelector('#global-news-list');

  // 탭 전환 핸들러
  tabKr.addEventListener('click', () => {
    tabKr.className = 'btn btn-primary';
    tabGlobal.className = 'btn btn-secondary';
    panelKr.style.display = 'flex';
    panelGlobal.style.display = 'none';
  });

  tabGlobal.addEventListener('click', () => {
    tabGlobal.className = 'btn btn-primary';
    tabKr.className = 'btn btn-secondary';
    panelGlobal.style.display = 'flex';
    panelKr.style.display = 'none';
    if (!globalOverviewGrid.querySelector('.ticker-card')) {
      loadGlobalData();
    }
  });

  // 1. 국내 지표 로드
  async function loadKrData() {
    try {
      const [ovData, topData] = await Promise.all([
        api.globalKrOverview(),
        api.globalKrTopStocks()
      ]);

      if (ovData && ovData.items) {
        krOverviewGrid.innerHTML = ovData.items.map((item) => `
          <div class="ticker-card" style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-weight:700;font-size:0.92rem;color:var(--text-main);">${escapeHtml(item.display_name)}</span>
              <span style="font-size:0.72rem;padding:2px 6px;border-radius:4px;background:var(--surface-subtle);color:var(--text-muted);">${escapeHtml(item.category)}</span>
            </div>
            <div style="font-size:1.25rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">
              ${item.symbol === '^KS11' || item.symbol === '^KQ11' || item.symbol === '^KS200' ? Number(item.price).toLocaleString('ko-KR', { minimumFractionDigits: 2 }) : formatPrice(item.price, item.currency)}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.75rem;color:var(--text-subtle);">${escapeHtml(item.symbol)}</span>
              ${formatChange(item.change, item.change_pct)}
            </div>
          </div>
        `).join('');
      }

      if (topData && topData.items) {
        krTopGrid.innerHTML = topData.items.map((item) => `
          <div class="kr-card" data-name="${escapeHtml(item.display_name)}" style="cursor:pointer;padding:15px;background:var(--surface);border:1px solid var(--border);border-radius:12px;transition:transform 0.15s, border-color 0.15s;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="font-size:0.98rem;color:#0f766e;">${escapeHtml(item.display_name)}</strong>
                <span style="font-size:0.72rem;color:var(--text-subtle);">${escapeHtml(item.sector)}</span>
              </div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px;">${escapeHtml(item.stock_code)}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <span style="font-size:1.15rem;font-weight:800;">${formatPrice(item.price, 'KRW')}</span>
              ${formatChange(item.change, item.change_pct)}
            </div>
          </div>
        `).join('');

        krTopGrid.querySelectorAll('.kr-card').forEach((card) => {
          card.addEventListener('click', () => {
            const name = card.getAttribute('data-name');
            krSearchInput.value = name;
            searchKrNews(name);
          });
        });
      }
    } catch (err) {
      krOverviewGrid.innerHTML = `<div style="color:#ef4444;padding:12px;">국내 데이터 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 국내 뉴스 검색 & AI 요약
  async function searchKrNews(companyName) {
    if (!companyName) return;
    krNewsStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 최신 증권 뉴스를 수집하는 중입니다...';
    krAiSummaryBox.innerHTML = '';
    krNewsList.innerHTML = '';
    try {
      const data = await api.naverCompanyNews({ company_name: companyName, limit: 8 });
      if (data.is_unlisted) {
        krNewsStatus.textContent = '';
        krNewsList.innerHTML = `
          <div style="padding:16px;border:1px solid #fed7aa;border-radius:10px;background:#fff7ed;color:#9a3412;">
            <strong style="font-size:0.92rem;"><i class="fa-solid fa-triangle-exclamation"></i> 상장 기업이 아닙니다</strong>
            <p style="margin:4px 0 0;font-size:0.85rem;">${escapeHtml(data.message)}</p>
          </div>`;
        return;
      }
      krNewsStatus.textContent = `“${data.query}” 관련 핵심 증권 뉴스 ${data.count}건`;
      
      // 기사 목록 렌더링
      if (data.items && data.items.length) {
        krNewsList.innerHTML = data.items.map((item) => `
          <article style="padding:15px;border:1px solid var(--border);border-radius:10px;background:var(--surface);">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
              <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" style="color:var(--text-main);font-weight:700;font-size:0.95rem;text-decoration:none;line-height:1.5;flex:1;">
                ${escapeHtml(item.title)}
              </a>
              <span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:var(--surface-subtle);color:var(--text-muted);white-space:nowrap;border:1px solid var(--border);">
                ${escapeHtml(item.publisher || '증권뉴스')}
              </span>
            </div>
            ${item.description ? `<p style="margin:6px 0 0;color:var(--text-muted);font-size:0.84rem;line-height:1.55;">${escapeHtml(item.description)}</p>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:0.75rem;color:var(--text-subtle);">
              <span><i class="fa-regular fa-clock"></i> ${escapeHtml(formatDate(item.published_at))}</span>
              <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" style="color:#0284c7;text-decoration:none;font-weight:600;">
                원문 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </article>
        `).join('');

        // 비동기 AI 브리핑 로드
        krAiSummaryBox.innerHTML = `
          <div style="padding:14px;background:var(--surface-subtle);border:1px dashed var(--border);border-radius:12px;color:var(--text-muted);font-size:0.85rem;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-wand-magic-sparkles fa-spin" style="color:#8b5cf6;"></i> AI가 최신 증권 뉴스를 분석하여 3줄 브리핑을 생성하고 있습니다...
          </div>
        `;
        api.aiNewsSummary({ company_name: companyName, is_us: false, articles: data.items })
          .then((aiRes) => {
            krAiSummaryBox.innerHTML = renderAiSummaryCard(aiRes, false);
          })
          .catch(() => {
            krAiSummaryBox.innerHTML = '';
          });

      } else {
        krNewsList.innerHTML = '<p style="color:var(--text-muted);padding:12px;text-align:center;">표시할 증권 뉴스가 없습니다.</p>';
      }
    } catch (err) {
      krNewsStatus.textContent = '';
      krNewsList.innerHTML = `<div style="color:#ef4444;padding:12px;">뉴스 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 2. 글로벌 지표 로드
  async function loadGlobalData() {
    try {
      const [ovData, topData] = await Promise.all([
        api.globalMarketOverview(),
        api.globalTopStocks()
      ]);

      if (ovData && ovData.items) {
        globalOverviewGrid.innerHTML = ovData.items.map((item) => `
          <div class="ticker-card" style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-weight:700;font-size:0.92rem;color:var(--text-main);">${escapeHtml(item.display_name)}</span>
              <span style="font-size:0.72rem;padding:2px 6px;border-radius:4px;background:var(--surface-subtle);color:var(--text-muted);">${escapeHtml(item.category)}</span>
            </div>
            <div style="font-size:1.25rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">
              ${formatPrice(item.price, item.currency)}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.75rem;color:var(--text-subtle);">${escapeHtml(item.symbol)}</span>
              ${formatChange(item.change, item.change_pct)}
            </div>
          </div>
        `).join('');
      }

      if (topData && topData.items) {
        m7Grid.innerHTML = topData.items.map((item) => `
          <div class="m7-card" data-ticker="${escapeHtml(item.symbol)}" style="cursor:pointer;padding:15px;background:var(--surface);border:1px solid var(--border);border-radius:12px;transition:transform 0.15s, border-color 0.15s;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <strong style="font-size:1rem;color:#2563eb;">${escapeHtml(item.symbol)}</strong>
                <span style="font-size:0.72rem;color:var(--text-subtle);">${escapeHtml(item.sector)}</span>
              </div>
              <div style="font-size:0.86rem;font-weight:600;color:var(--text-main);margin-bottom:8px;">${escapeHtml(item.display_name)}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <span style="font-size:1.15rem;font-weight:800;">${formatPrice(item.price, item.currency)}</span>
              ${formatChange(item.change, item.change_pct)}
            </div>
          </div>
        `).join('');

        m7Grid.querySelectorAll('.m7-card').forEach((card) => {
          card.addEventListener('click', () => {
            const ticker = card.getAttribute('data-ticker');
            globalTickerInput.value = ticker;
            searchGlobalStock(ticker);
          });
        });
      }
    } catch (err) {
      globalOverviewGrid.innerHTML = `<div style="color:#ef4444;padding:12px;">글로벌 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 미국 주식 & 뉴스 검색 & AI 한글 번역 브리핑
  async function searchGlobalStock(ticker) {
    if (!ticker) return;
    globalAiSummaryBox.innerHTML = '';
    globalNewsList.innerHTML = '<div style="padding:14px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> 미국 현지 속보 및 시세를 불러오는 중...</div>';
    try {
      const [quote, newsData] = await Promise.all([
        api.globalStockDetail(ticker),
        api.globalStockNews(ticker)
      ]);

      if (quote) {
        stockCard.style.display = 'block';
        stockCard.innerHTML = `
          <div style="padding:16px;background:linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.08) 100%);border:1px solid rgba(37,99,235,0.25);border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:1.25rem;font-weight:800;color:#1e40af;">${escapeHtml(quote.symbol)}</span>
                <span style="font-size:0.95rem;font-weight:600;color:var(--text-main);">${escapeHtml(quote.name)}</span>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
                52주 최고: ${formatPrice(quote.high_52w)} | 52주 최저: ${formatPrice(quote.low_52w)}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.45rem;font-weight:800;">${formatPrice(quote.price, quote.currency)}</div>
              <div>${formatChange(quote.change, quote.change_pct)}</div>
            </div>
          </div>
        `;
      }

      if (newsData && newsData.items && newsData.items.length) {
        globalNewsList.innerHTML = newsData.items.map((n) => `
          <article style="padding:15px;background:var(--surface);border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;gap:6px;">
            <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer" style="font-weight:700;font-size:0.94rem;color:#0369a1;text-decoration:none;line-height:1.5;">
              ${escapeHtml(n.title)}
            </a>
            ${n.description ? `<p style="margin:2px 0 0;color:var(--text-muted);font-size:0.83rem;line-height:1.5;">${escapeHtml(n.description)}</p>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:0.75rem;color:var(--text-subtle);">
              <span><i class="fa-solid fa-globe"></i> ${escapeHtml(n.publisher)} · ${escapeHtml(formatDate(n.published_at))}</span>
              <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none;font-weight:600;">
                원문 보기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </article>
        `).join('');

        // 비동기 AI 영문 뉴스 번역 & 브리핑 로드
        globalAiSummaryBox.innerHTML = `
          <div style="padding:14px;background:var(--surface-subtle);border:1px dashed var(--border);border-radius:12px;color:var(--text-muted);font-size:0.85rem;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-wand-magic-sparkles fa-spin" style="color:#8b5cf6;"></i> AI가 미국 현지 영문 뉴스를 한국어로 번역하고 3줄 요약하고 있습니다...
          </div>
        `;
        api.aiNewsSummary({ company_name: ticker, is_us: true, articles: newsData.items })
          .then((aiRes) => {
            globalAiSummaryBox.innerHTML = renderAiSummaryCard(aiRes, true);
          })
          .catch(() => {
            globalAiSummaryBox.innerHTML = '';
          });

      } else {
        globalNewsList.innerHTML = '<p style="color:var(--text-muted);padding:12px;text-align:center;">관련 글로벌 뉴스가 없습니다.</p>';
      }
    } catch (err) {
      globalNewsList.innerHTML = `<div style="color:#ef4444;padding:12px;">조회 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 폼 이벤트
  krSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchKrNews(krSearchInput.value.trim());
  });

  globalSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchGlobalStock(globalTickerInput.value.trim().toUpperCase());
  });

  refreshBtn.addEventListener('click', () => {
    loadKrData();
    searchKrNews(krSearchInput.value.trim());
    loadGlobalData();
    searchGlobalStock(globalTickerInput.value.trim().toUpperCase());
  });

  // 초기 실행
  loadKrData();
  searchKrNews('삼성전자');
}