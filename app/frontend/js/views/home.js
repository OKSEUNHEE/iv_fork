import { computeChartSeries, buildCandleConfig, buildMacdConfig, barsFootLabel } from './chartSeries.js';
import { mountChartModal } from './chartModal.js';

const HOME_MARKETS = [
  { id: 'kospi', name: 'KOSPI', ticker: '^KS11', color: '#0078d4' },
  { id: 'kosdaq', name: 'KOSDAQ', ticker: '^KQ11', color: '#8b5cf6' },
  { id: 'nasdaq', name: 'NASDAQ', ticker: '^IXIC', color: '#0f766e' },
  { id: 'sp500', name: 'S&P 500', ticker: '^GSPC', color: '#d97706' },
];

const PERIODS = [['1d', '1일'], ['1mo', '1M'], ['3mo', '3M'], ['6mo', '6M'], ['1y', '1Y']];
const QUOTE_CACHE_KEY = 'investment_analysis_home_quotes_v2';

const US_MEGA_CAPS = [
  { ticker: 'AAPL',  name: 'Apple' },
  { ticker: 'MSFT',  name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN',  name: 'Amazon' },
  { ticker: 'NVDA',  name: 'NVIDIA' },
  { ticker: 'META',  name: 'Meta' },
  { ticker: 'TSLA',  name: 'Tesla' },
];

const KOREAN_BLUE_CHIPS = [
  { ticker: '005930.KS', name: '삼성전자' },
  { ticker: '000660.KS', name: 'SK하이닉스' },
  { ticker: '373220.KS', name: 'LG에너지솔루션' },
  { ticker: '207940.KS', name: '삼성바이오로직스' },
  { ticker: '005380.KS', name: '현대차' },
  { ticker: '000270.KS', name: '기아' },
  { ticker: '035420.KS', name: 'NAVER' },
];

function periodButtonsHtml(activePeriod) {
  return PERIODS.map(([value, label]) => `<button type="button" data-period="${value}" class="${value === activePeriod ? 'active' : ''}">${label}</button>`).join('');
}

function chartCard(market) {
  return `
    <section class="home-market-card" data-market-card="${market.id}">
      <header class="home-market-card-head">
        <div>
          <div class="home-market-name">${market.name} <span>· ${market.ticker}</span></div>
          <div class="home-market-price-row">
            <strong data-price="${market.id}">--</strong>
            <em data-change="${market.id}">--</em>
          </div>
        </div>
        <div class="home-market-controls">
          <div class="home-market-periods" data-periods="${market.id}">${periodButtonsHtml('3mo')}</div>
          <button type="button" class="home-market-expand" data-expand="${market.id}" aria-label="${market.name} 차트 크게 보기" title="크게 보기">
            <i class="fa-solid fa-expand"></i>
          </button>
        </div>
      </header>
      <div class="home-market-chart-wrap">
        <div class="home-market-chart" data-chart="${market.id}"></div>
        <div class="home-market-loading" data-loading="${market.id}"><i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…</div>
        <div class="home-chart-ma20-badge"><span class="dot" style="background:${market.color}"></span>MA20 (20일 이동평균)</div>
      </div>
      <div class="home-market-macd-wrap">
        <div class="home-market-macd-label">MACD (12, 26, 9)</div>
        <div class="home-market-macd" data-macd="${market.id}"></div>
      </div>
      <footer class="home-market-foot">
        <span data-foot-label="${market.id}"><i class="fa-solid fa-chart-line"></i> ${barsFootLabel('3mo')}</span>
        <span data-source="${market.id}"></span>
      </footer>
    </section>`;
}

function quotePanel(title, subtitle, items, region) {
  return `
    <section class="home-quote-panel" aria-label="${title} 대표 종목 시세">
      <header class="home-quote-panel-head">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <span class="home-quote-count">${items.length}종목</span>
      </header>
      <div class="home-quote-ag-grid" data-quote-grid="${region}" aria-label="${title} 대표 기업 지표 표"></div>
    </section>`;
}

function formatQuoteValue(value, region) {
  if (!Number.isFinite(value)) return '--';
  return region === 'kr'
    ? `${Math.round(value).toLocaleString()}원`
    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFundamentals(quote, region) {
  const per = Number(quote.per);
  const pbr = Number(quote.pbr);
  const revenue = Number(quote.revenue_ttm);
  const metric = (label, value) => Number.isFinite(value) && value > 0 ? `${label} ${value.toFixed(1)}배` : `${label} --`;
  const revenueText = !Number.isFinite(revenue) || revenue <= 0
    ? '매출(TTM) --'
    : region === 'kr'
      ? `매출(TTM) ${(revenue / 1e12).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조원`
      : `매출(TTM) $${(revenue / 1e9).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`;
  return { per: metric('PER', per), pbr: metric('PBR', pbr), revenue: revenueText };
}

function quoteCacheDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function readQuoteCache(tickers) {
  try {
    const cached = JSON.parse(localStorage.getItem(QUOTE_CACHE_KEY));
    if (cached?.date !== quoteCacheDate() || !Array.isArray(cached.tickers) || cached.tickers.join('|') !== tickers.join('|') || !Array.isArray(cached.items)) return null;
    return cached;
  } catch { return null; }
}

function saveQuoteCache(tickers, data) {
  try {
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ date: quoteCacheDate(), tickers, fetched_at: data.fetched_at, items: data.items || [] }));
  } catch { /* 저장 공간을 사용할 수 없어도 실시간 조회는 계속한다. */ }
}

export function homeView(container) {
  container.innerHTML = `
    <div class="home-dashboard" id="home-dashboard">
      <div class="home-market-grid">${HOME_MARKETS.map(chartCard).join('')}</div>
      <section class="home-quote-dashboard" aria-labelledby="home-quote-title">
        <header class="home-quote-dashboard-head">
          <div>
            <h1 id="home-quote-title">대표 기업 주가</h1>
            <p>미국 매그니피센트 7과 한국 대표 코스피 7종목의 현재가·전일 대비입니다.</p>
          </div>
          <div class="home-quote-actions">
            <span id="home-quote-stamp">조회 전</span>
            <button type="button" id="home-quote-refresh"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
          </div>
        </header>
        <div class="home-quote-grid">
          ${quotePanel('미국', 'Magnificent Seven · USD', US_MEGA_CAPS, 'us')}
          ${quotePanel('한국', 'Korea Seven · 대표 KOSPI 기업 · KRW', KOREAN_BLUE_CHIPS, 'kr')}
        </div>
        <p class="home-quote-note">Yahoo Finance 기준이며, 장중 시세는 지연되거나 시장이 닫힌 경우 마지막 거래 가격일 수 있습니다. 대표 기업 데이터는 한국 시간 기준 하루 한 번 브라우저에 저장됩니다.</p>
      </section>
    </div>`;

  const charts = new Map();
  const macdCharts = new Map();
  const periods = new Map(HOME_MARKETS.map((market) => [market.id, '3mo']));
  let quoteAbortController = null;
  const quoteGrids = new Map();
  const chartModal = mountChartModal(container);

  function destroyChart(id) {
    const chart = charts.get(id);
    if (chart) {
      try { chart.destroy(); } catch {}
      charts.delete(id);
    }
    const macdChart = macdCharts.get(id);
    if (macdChart) {
      try { macdChart.destroy(); } catch {}
      macdCharts.delete(id);
    }
  }

  async function loadChart(market) {
    const id = market.id;
    const period = periods.get(id);
    const card = container.querySelector(`[data-market-card="${id}"]`);
    const chartEl = card.querySelector(`[data-chart="${id}"]`);
    const macdEl = card.querySelector(`[data-macd="${id}"]`);
    const loading = card.querySelector(`[data-loading="${id}"]`);
    const price = card.querySelector(`[data-price="${id}"]`);
    const change = card.querySelector(`[data-change="${id}"]`);
    const source = card.querySelector(`[data-source="${id}"]`);
    const footLabel = card.querySelector(`[data-foot-label="${id}"]`);
    loading.style.display = 'flex';
    destroyChart(id);

    try {
      const response = await fetch(`/api/home/market-candle?market=${encodeURIComponent(id)}&period=${period}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const ohlcv = data.ohlcv || [];
      if (!ohlcv.length) throw new Error('데이터 없음');

      const last = ohlcv.at(-1);
      const previousClose = ohlcv.length > 1 ? ohlcv.at(-2).c : last.o;
      const changePercent = ((last.c / previousClose) - 1) * 100;
      const isUp = changePercent >= 0;
      price.textContent = last.c.toLocaleString(undefined, { maximumFractionDigits: 2 });
      change.textContent = `${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%`;
      change.className = isUp ? 'is-up' : 'is-down';
      source.textContent = data.is_simulated ? '시뮬레이션 데이터' : 'Yahoo Finance · 15분 지연';
      source.classList.toggle('is-simulated', Boolean(data.is_simulated));
      footLabel.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${barsFootLabel(period)}`;

      const series = computeChartSeries(ohlcv, data.display_from || null);

      const chart = new ApexCharts(chartEl, buildCandleConfig(market, series, period, 250));
      charts.set(id, chart);
      await chart.render();

      const macdChart = new ApexCharts(macdEl, buildMacdConfig(series, period, 110));
      macdCharts.set(id, macdChart);
      await macdChart.render();

      loading.style.display = 'none';
    } catch (error) {
      loading.innerHTML = `<span class="home-market-error">데이터 오류: ${error.message}</span>`;
    }
  }

  HOME_MARKETS.forEach((market) => {
    container.querySelector(`[data-periods="${market.id}"]`).addEventListener('click', (event) => {
      const button = event.target.closest('[data-period]');
      if (!button) return;
      periods.set(market.id, button.dataset.period);
      container.querySelectorAll(`[data-periods="${market.id}"] [data-period]`).forEach((item) => item.classList.toggle('active', item === button));
      loadChart(market);
    });
    container.querySelector(`[data-expand="${market.id}"]`).addEventListener('click', (event) => {
      chartModal.open(market, event.currentTarget);
    });
    loadChart(market);
  });

  const quoteTickers = [...US_MEGA_CAPS, ...KOREAN_BLUE_CHIPS].map((item) => item.ticker);

  function quoteGridRows(stocks, region, quoteByTicker = new Map()) {
    return stocks.map((stock) => {
      const quote = quoteByTicker.get(stock.ticker);
      const changePct = Number(quote?.change_pct);
      const fundamentals = quote ? formatFundamentals(quote, region) : { per: '--', pbr: '--', revenue: '--' };
      return {
        company: stock.name, ticker: stock.ticker,
        price: quote?.status === 'ok' ? formatQuoteValue(Number(quote.value), region) : '조회 불가',
        change: Number.isFinite(changePct) ? `${changePct >= 0 ? '▲' : '▼'} ${Math.abs(changePct).toFixed(2)}%` : '--',
        changeDirection: Number.isFinite(changePct) ? (changePct >= 0 ? 'is-up' : 'is-down') : '',
        per: fundamentals.per.replace('PER ', ''), pbr: fundamentals.pbr.replace('PBR ', ''),
        revenue: fundamentals.revenue.replace('매출(TTM) ', ''),
      };
    });
  }

  function createQuoteGrid(region, stocks) {
    const gridElement = container.querySelector(`[data-quote-grid="${region}"]`);
    if (!gridElement || !window.agGrid?.createGrid) {
      if (gridElement) gridElement.textContent = '표 구성 요소를 불러오지 못했습니다.';
      return;
    }
    const api = window.agGrid.createGrid(gridElement, {
      columnDefs: [
        { headerName: '종목', field: 'company', flex: 1.25, minWidth: 120, cellRenderer: (params) => `<div class="quote-company-cell"><strong>${params.value}</strong><small>${params.data.ticker}</small></div>` },
        { headerName: '현재가', field: 'price', flex: .9, minWidth: 88, cellClass: 'quote-number' },
        { headerName: '등락률', field: 'change', flex: .75, minWidth: 74, cellClass: (params) => `quote-number ${params.data.changeDirection}` },
        { headerName: 'PER', field: 'per', flex: .65, minWidth: 58, cellClass: 'quote-number' },
        { headerName: 'PBR', field: 'pbr', flex: .65, minWidth: 58, cellClass: 'quote-number' },
        { headerName: '매출(TTM)', field: 'revenue', flex: 1, minWidth: 102, cellClass: 'quote-number' },
      ],
      rowData: quoteGridRows(stocks, region),
      defaultColDef: { sortable: true, resizable: true, suppressMovable: true },
      headerHeight: 34,
      rowHeight: 48,
      animateRows: false,
      suppressCellFocus: true,
    });
    quoteGrids.set(region, { api, stocks });
  }

  createQuoteGrid('us', US_MEGA_CAPS);
  createQuoteGrid('kr', KOREAN_BLUE_CHIPS);

  function renderQuotes(data) {
    const quoteByTicker = new Map((data.items || []).map((item) => [item.ticker, item]));
    quoteGrids.forEach(({ api, stocks }, region) => {
      api.setGridOption('rowData', quoteGridRows(stocks, region, quoteByTicker));
    });
  }

  async function loadQuotes() {
    const refreshButton = container.querySelector('#home-quote-refresh');
    const stamp = container.querySelector('#home-quote-stamp');
    const cached = readQuoteCache(quoteTickers);
    if (cached) {
      renderQuotes(cached);
      const fetchedAt = cached.fetched_at ? new Date(cached.fetched_at) : null;
      stamp.textContent = fetchedAt && !Number.isNaN(fetchedAt.valueOf())
        ? `오늘 저장 ${fetchedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
        : '오늘 저장 데이터';
      return;
    }

    quoteAbortController?.abort();
    quoteAbortController = new AbortController();
    refreshButton.disabled = true;
    refreshButton.classList.add('is-loading');
    stamp.textContent = '시세 조회 중…';
    try {
      const response = await fetch('/api/market/snapshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: quoteTickers }), signal: quoteAbortController.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      saveQuoteCache(quoteTickers, data);
      renderQuotes(data);
      const fetchedAt = data.fetched_at ? new Date(data.fetched_at) : null;
      stamp.textContent = fetchedAt && !Number.isNaN(fetchedAt.valueOf())
        ? `조회 ${fetchedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 오늘 저장됨`
        : '조회 완료 · 오늘 저장됨';
    } catch (error) {
      if (error.name !== 'AbortError') stamp.textContent = '시세 조회 실패';
    } finally {
      refreshButton.disabled = false;
      refreshButton.classList.remove('is-loading');
    }
  }

  container.querySelector('#home-quote-refresh').addEventListener('click', loadQuotes);
  loadQuotes();

  window._viewCleanup = () => {
    quoteAbortController?.abort();
    quoteGrids.forEach(({ api }) => { try { api.destroy(); } catch {} });
    quoteGrids.clear();
    charts.forEach((chart) => {
      try { chart.destroy(); } catch {}
    });
    macdCharts.forEach((chart) => {
      try { chart.destroy(); } catch {}
    });
    chartModal.destroy();
  };
}
