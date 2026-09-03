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

export function globalMarketView(container) {
  container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:24px;">
      
      <!-- 헤더 -->
      <section class="card" style="padding:24px;border-radius:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h1 style="margin:0 0 6px;font-size:1.45rem;display:flex;align-items:center;gap:10px;">
              <i class="fa-solid fa-globe" style="color:#2563eb;"></i> 글로벌 마켓 대시보드
            </h1>
            <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">
              인베스팅닷컴 스타일의 전 세계 주요 지수, 환율, 원자재, 미국 빅테크(M7) 시세 및 글로벌 뉴스 피드입니다.
            </p>
          </div>
          <button id="global-refresh-btn" class="btn btn-secondary" style="font-size:0.85rem;">
            <i class="fa-solid fa-arrows-rotate"></i> 실시간 시세 갱신
          </button>
        </div>
      </section>

      <!-- 1. 글로벌 핵심 지표 전광판 (Ticker Bar) -->
      <section>
        <h2 style="font-size:1.1rem;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-chart-simple" style="color:#0ea5e9;"></i> 글로벌 주요 지수 & 자산 전광판
        </h2>
        <div id="ticker-overview-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;">
          <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin"></i> 글로벌 지표 불러오는 중...
          </div>
        </div>
      </section>

      <!-- 2. 미국 매그니피센트 7 (M7) 빅테크 시세 -->
      <section>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h2 style="font-size:1.1rem;margin:0;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-fire" style="color:#f59e0b;"></i> 미국 빅테크 (Magnificent 7) 실시간 시세
          </h2>
          <span style="font-size:0.78rem;color:var(--text-muted);">종목 카드를 클릭하면 상세 뉴스 및 차트가 로드됩니다.</span>
        </div>
        <div id="m7-stocks-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
          <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;text-align:center;color:var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin"></i> 빅테크 시세 불러오는 중...
          </div>
        </div>
      </section>

      <!-- 3. 미국 주식 검색 & 글로벌 뉴스 피드 -->
      <section class="card" style="padding:24px;border-radius:16px;">
        <h2 style="font-size:1.15rem;margin:0 0 14px;display:flex;align-items:center;gap:8px;">
          <i class="fa-solid fa-magnifying-glass" style="color:#8b5cf6;"></i> 미국/글로벌 개별 종목 검색 & 현지 뉴스 피드
        </h2>
        <form id="global-search-form" style="display:flex;gap:10px;margin-bottom:20px;">
          <input id="global-ticker-input" class="param-input" value="NVDA" maxlength="15" placeholder="미국 티커 입력 (예: NVDA, TSLA, AAPL, MSFT, AMD, PLTR)" style="flex:1;text-transform:uppercase;font-weight:700;letter-spacing:1px;" />
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-search"></i> 종목 및 뉴스 조회</button>
        </form>

        <!-- 선택된 종목 요약 바 -->
        <div id="selected-stock-card" style="margin-bottom:20px;display:none;"></div>

        <!-- 글로벌 뉴스 목록 -->
        <h3 style="font-size:1rem;margin:0 0 12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
          <i class="fa-regular fa-newspaper"></i> 최신 글로벌 속보 (Yahoo Finance US)
        </h3>
        <div id="global-news-list" style="display:grid;gap:12px;"></div>
      </section>

    </div>
  `;

  const refreshBtn = container.querySelector('#global-refresh-btn');
  const overviewGrid = container.querySelector('#ticker-overview-grid');
  const m7Grid = container.querySelector('#m7-stocks-grid');
  const searchForm = container.querySelector('#global-search-form');
  const tickerInput = container.querySelector('#global-ticker-input');
  const stockCard = container.querySelector('#selected-stock-card');
  const newsList = container.querySelector('#global-news-list');

  // 1. 글로벌 전광판 로드
  async function loadOverview() {
    try {
      const data = await api.globalMarketOverview();
      if (!data || !data.items || !data.items.length) {
        overviewGrid.innerHTML = '<div style="color:var(--text-muted);">데이터를 불러올 수 없습니다.</div>';
        return;
      }
      overviewGrid.innerHTML = data.items.map((item) => `
        <div style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 4px rgba(0,0,0,0.04);">
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
    } catch (err) {
      overviewGrid.innerHTML = `<div style="color:#ef4444;padding:12px;">전광판 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 2. M7 빅테크 시세 로드
  async function loadM7() {
    try {
      const data = await api.globalTopStocks();
      if (!data || !data.items) return;
      m7Grid.innerHTML = data.items.map((item) => `
        <div class="m7-card" data-ticker="${escapeHtml(item.symbol)}" style="cursor:pointer;padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;transition:transform 0.15s, border-color 0.15s;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <strong style="font-size:1rem;color:#2563eb;">${escapeHtml(item.symbol)}</strong>
              <span style="font-size:0.72rem;color:var(--text-subtle);">${escapeHtml(item.sector)}</span>
            </div>
            <div style="font-size:0.86rem;font-weight:600;color:var(--text-main);margin-bottom:8px;">${escapeHtml(item.display_name)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <span style="font-size:1.2rem;font-weight:800;">${formatPrice(item.price, item.currency)}</span>
            ${formatChange(item.change, item.change_pct)}
          </div>
        </div>
      `).join('');

      // M7 카드 클릭 이벤트
      m7Grid.querySelectorAll('.m7-card').forEach((card) => {
        card.addEventListener('click', () => {
          const ticker = card.getAttribute('data-ticker');
          tickerInput.value = ticker;
          searchStock(ticker);
        });
      });
    } catch (err) {
      m7Grid.innerHTML = `<div style="color:#ef4444;padding:12px;">M7 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 3. 종목 및 뉴스 검색
  async function searchStock(ticker) {
    if (!ticker) return;
    newsList.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> 미국 현지 속보 및 시세 불러오는 중...</div>';
    
    // 시세 + 뉴스 동시 요청
    try {
      const [quote, newsData] = await Promise.all([
        api.globalStockDetail(ticker),
        api.globalStockNews(ticker)
      ]);

      // 종목 요약 카드 표시
      if (quote) {
        stockCard.style.display = 'block';
        stockCard.innerHTML = `
          <div style="padding:18px;background:linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(139,92,246,0.08) 100%);border:1px solid rgba(37,99,235,0.25);border-radius:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:1.3rem;font-weight:800;color:#1e40af;">${escapeHtml(quote.symbol)}</span>
                <span style="font-size:1rem;font-weight:600;color:var(--text-main);">${escapeHtml(quote.name)}</span>
              </div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
                52주 최고: ${formatPrice(quote.high_52w)} | 52주 최저: ${formatPrice(quote.low_52w)}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.6rem;font-weight:800;">${formatPrice(quote.price, quote.currency)}</div>
              <div>${formatChange(quote.change, quote.change_pct)}</div>
            </div>
          </div>
        `;
      }

      // 뉴스 렌더링
      if (newsData && newsData.items && newsData.items.length) {
        newsList.innerHTML = newsData.items.map((n) => `
          <article style="padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;flex-direction:column;gap:6px;">
            <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer" style="font-weight:700;font-size:0.96rem;color:#0369a1;text-decoration:none;line-height:1.5;">
              ${escapeHtml(n.title)}
            </a>
            ${n.description ? `<p style="margin:4px 0 0;color:var(--text-muted);font-size:0.84rem;line-height:1.55;">${escapeHtml(n.description)}</p>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:0.75rem;color:var(--text-subtle);">
              <span><i class="fa-solid fa-globe"></i> ${escapeHtml(n.publisher)} · ${escapeHtml(formatDate(n.published_at))}</span>
              <a href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none;font-weight:600;">
                원문 읽기 <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>
          </article>
        `).join('');
      } else {
        newsList.innerHTML = '<p style="color:var(--text-muted);padding:16px;text-align:center;">관련 글로벌 뉴스가 없습니다.</p>';
      }

    } catch (err) {
      newsList.innerHTML = `<div style="color:#ef4444;padding:16px;">조회 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 검색 폼 이벤트
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchStock(tickerInput.value.trim().toUpperCase());
  });

  // 새로고침 버튼
  refreshBtn.addEventListener('click', () => {
    loadOverview();
    loadM7();
    searchStock(tickerInput.value.trim().toUpperCase());
  });

  // 초기 실행
  loadOverview();
  loadM7();
  searchStock('NVDA');
}