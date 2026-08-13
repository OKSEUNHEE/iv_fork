const HOME_MARKETS = [
  { id: 'kospi', name: 'KOSPI', ticker: '^KS11', color: '#0078d4' },
  { id: 'kosdaq', name: 'KOSDAQ', ticker: '^KQ11', color: '#8b5cf6' },
  { id: 'nasdaq', name: 'NASDAQ', ticker: '^IXIC', color: '#0f766e' },
  { id: 'sp500', name: 'S&P 500', ticker: '^GSPC', color: '#d97706' },
];

const PERIODS = [['1d', '1일'], ['1mo', '1M'], ['3mo', '3M'], ['6mo', '6M'], ['1y', '1Y']];
const UPWARD_COLOR = '#e11d48';
const DOWNWARD_COLOR = '#2563eb';
const MACD_LINE_COLOR = '#7c3aed';
const MACD_SIGNAL_COLOR = '#f59e0b';
const MACD_HIST_UP_COLOR = '#16a34a';
const MACD_HIST_DOWN_COLOR = '#dc2626';

function isIntradayPeriod(period) {
  return period === '1d';
}

function calcEma(data, span) {
  const k = 2 / (span + 1);
  const out = [];
  data.forEach((value, index) => out.push(index === 0 ? value : out[index - 1] * (1 - k) + value * k));
  return out;
}

function calcMACD(ohlcv, fast = 12, slow = 26, signalSpan = 9) {
  const closes = ohlcv.map((point) => point.c);
  const emaFast = calcEma(closes, fast);
  const emaSlow = calcEma(closes, slow);
  const macdLine = emaFast.map((value, index) => (index < slow - 1 ? null : value - emaSlow[index]));
  const signalRaw = calcEma(macdLine.map((value) => value ?? 0), signalSpan);
  const signalLine = signalRaw.map((value, index) => (macdLine[index] == null ? null : value));
  const histogram = macdLine.map((value, index) => (value == null || signalLine[index] == null ? null : value - signalLine[index]));
  return { macdLine, signalLine, histogram };
}

function computeChartSeries(ohlcv) {
  const candles = ohlcv.map((point) => ({
    x: new Date(point.date).getTime(), y: [point.o, point.h, point.l, point.c],
  }));
  const ma20 = ohlcv.map((point, index) => ({
    x: new Date(point.date).getTime(),
    y: index < 19 ? null : ohlcv.slice(index - 19, index + 1).reduce((sum, item) => sum + item.c, 0) / 20,
  }));
  const volume = ohlcv.map((point) => ({
    x: new Date(point.date).getTime(), y: point.v || 0,
    fillColor: point.c >= point.o ? UPWARD_COLOR : DOWNWARD_COLOR,
  }));
  const { macdLine, signalLine, histogram } = calcMACD(ohlcv);
  const macdSeries = ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: macdLine[index] }));
  const signalSeries = ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: signalLine[index] }));
  const histogramSeries = ohlcv.map((point, index) => ({
    x: new Date(point.date).getTime(), y: histogram[index],
    fillColor: (histogram[index] ?? 0) >= 0 ? MACD_HIST_UP_COLOR : MACD_HIST_DOWN_COLOR,
  }));
  return { candles, ma20, volume, macdSeries, signalSeries, histogramSeries };
}

function buildCandleConfig(market, series, period, height) {
  const intraday = isIntradayPeriod(period);
  return {
    chart: { type: 'candlestick', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [
      { name: market.name, type: 'candlestick', data: series.candles },
      { name: 'MA20', type: 'line', data: series.ma20 },
      { name: '거래량', type: 'bar', data: series.volume },
    ],
    plotOptions: { candlestick: { colors: { upward: UPWARD_COLOR, downward: DOWNWARD_COLOR }, wick: { useFillColor: true } }, bar: { columnWidth: '65%' } },
    colors: [UPWARD_COLOR, market.color, '#94a3b8'],
    stroke: { curve: 'smooth', width: [1, 1.7, 0] },
    xaxis: { type: 'datetime', labels: { format: intraday ? 'HH:mm' : 'MM-dd', style: { fontSize: '10px', colors: '#94a3b8' }, hideOverlappingLabels: true, datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: [{ labels: { formatter: (value) => value ? Math.round(value).toLocaleString() : '', style: { fontSize: '10px', colors: '#94a3b8' } } }, { show: false }, { show: false }],
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { right: 10, left: 4 } },
    tooltip: { shared: false, x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) } },
    legend: { show: false },
  };
}

function buildMacdConfig(series, period, height) {
  const intraday = isIntradayPeriod(period);
  return {
    chart: { type: 'line', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [
      { name: 'MACD', type: 'line', data: series.macdSeries },
      { name: 'Signal', type: 'line', data: series.signalSeries },
      { name: 'Histogram', type: 'bar', data: series.histogramSeries },
    ],
    plotOptions: { bar: { columnWidth: '65%' } },
    colors: [MACD_LINE_COLOR, MACD_SIGNAL_COLOR, '#94a3b8'],
    stroke: { curve: 'smooth', width: [1.5, 1.5, 0] },
    xaxis: { type: 'datetime', labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { tickAmount: 3, labels: { formatter: (value) => value == null ? '' : Number(value).toFixed(1), style: { fontSize: '9px', colors: '#94a3b8' } } },
    annotations: { yaxis: [{ y: 0, strokeDashArray: 3, borderColor: '#cbd5e1', borderWidth: 1 }] },
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { top: 0, bottom: 0, left: 4, right: 10 } },
    legend: { show: true, fontSize: '9px', markers: { width: 7, height: 7 }, itemMargin: { horizontal: 6, vertical: 0 }, offsetY: -4 },
    tooltip: { shared: true, x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toFixed(2) } },
  };
}

function barsFootLabel(period) {
  return isIntradayPeriod(period) ? '5분봉 · MA20 · MACD · 거래량' : '일봉 · MA20 · MACD · 거래량';
}

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

function chartModal() {
  return `
    <div class="home-chart-modal-backdrop" id="home-chart-modal" hidden>
      <section class="home-chart-modal" role="dialog" aria-modal="true" aria-labelledby="home-chart-modal-title" tabindex="-1">
        <header class="home-chart-modal-header">
          <div>
            <div class="home-market-name" id="home-chart-modal-title">--</div>
            <div class="home-market-price-row">
              <strong id="home-chart-modal-price">--</strong>
              <em id="home-chart-modal-change">--</em>
            </div>
          </div>
          <div class="home-market-controls">
            <div class="home-market-periods" id="home-chart-modal-periods">${periodButtonsHtml('')}</div>
            <button type="button" class="home-chart-modal-close" aria-label="차트 닫기"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </header>
        <div class="home-chart-modal-body">
          <div class="home-market-chart-wrap home-chart-modal-chart-wrap">
            <div class="home-market-chart" id="home-chart-modal-chart"></div>
            <div class="home-market-loading" id="home-chart-modal-loading"><i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…</div>
          </div>
          <div class="home-market-macd-wrap">
            <div class="home-market-macd-label">MACD (12, 26, 9)</div>
            <div class="home-market-macd home-chart-modal-macd" id="home-chart-modal-macd"></div>
          </div>
          <footer class="home-market-foot">
            <span id="home-chart-modal-foot-label"><i class="fa-solid fa-chart-line"></i> ${barsFootLabel('3mo')}</span>
            <span id="home-chart-modal-source"></span>
          </footer>
        </div>
      </section>
    </div>`;
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
      <div class="home-quote-list" data-quote-list="${region}">
        ${items.map((item) => `
          <div class="home-quote-row is-loading" data-quote="${item.ticker}">
            <div class="home-quote-name"><strong>${item.name}</strong><span>${item.ticker}</span></div>
            <div class="home-quote-value"><b>--</b><em>조회 중</em></div>
          </div>`).join('')}
      </div>
    </section>`;
}

function formatQuoteValue(value, region) {
  if (!Number.isFinite(value)) return '--';
  return region === 'kr'
    ? `${Math.round(value).toLocaleString()}원`
    : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <p class="home-quote-note">Yahoo Finance 기준이며, 장중 시세는 지연되거나 시장이 닫힌 경우 마지막 거래 가격일 수 있습니다.</p>
      </section>
      ${chartModal()}
    </div>`;

  const charts = new Map();
  const macdCharts = new Map();
  const periods = new Map(HOME_MARKETS.map((market) => [market.id, '3mo']));
  let quoteAbortController = null;

  let modalMarket = null;
  let modalPeriod = '3mo';
  let modalChart = null;
  let modalMacdChart = null;
  let modalTrigger = null;

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

  function destroyModalCharts() {
    if (modalChart) { try { modalChart.destroy(); } catch {} modalChart = null; }
    if (modalMacdChart) { try { modalMacdChart.destroy(); } catch {} modalMacdChart = null; }
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

      const series = computeChartSeries(ohlcv);

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

  async function loadModalChart(market, period) {
    const chartEl = container.querySelector('#home-chart-modal-chart');
    const macdEl = container.querySelector('#home-chart-modal-macd');
    const loading = container.querySelector('#home-chart-modal-loading');
    const price = container.querySelector('#home-chart-modal-price');
    const change = container.querySelector('#home-chart-modal-change');
    const source = container.querySelector('#home-chart-modal-source');
    const footLabel = container.querySelector('#home-chart-modal-foot-label');
    loading.style.display = 'flex';
    loading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…';
    destroyModalCharts();

    try {
      const response = await fetch(`/api/home/market-candle?market=${encodeURIComponent(market.id)}&period=${period}`);
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

      const series = computeChartSeries(ohlcv);

      modalChart = new ApexCharts(chartEl, buildCandleConfig(market, series, period, 420));
      await modalChart.render();

      modalMacdChart = new ApexCharts(macdEl, buildMacdConfig(series, period, 170));
      await modalMacdChart.render();

      loading.style.display = 'none';
    } catch (error) {
      loading.innerHTML = `<span class="home-market-error">데이터 오류: ${error.message}</span>`;
    }
  }

  const modalEl = container.querySelector('#home-chart-modal');
  const modalPanel = modalEl.querySelector('.home-chart-modal');

  function openModal(market, trigger) {
    modalMarket = market;
    modalPeriod = periods.get(market.id);
    modalTrigger = trigger;
    container.querySelector('#home-chart-modal-title').textContent = `${market.name} · ${market.ticker}`;
    container.querySelectorAll('#home-chart-modal-periods [data-period]').forEach((button) => {
      button.classList.toggle('active', button.dataset.period === modalPeriod);
    });
    modalEl.hidden = false;
    modalPanel.focus();
    loadModalChart(modalMarket, modalPeriod);
  }

  function closeModal() {
    modalEl.hidden = true;
    destroyModalCharts();
    modalTrigger?.focus();
    modalMarket = null;
  }

  modalEl.querySelector('.home-chart-modal-close').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) closeModal();
  });
  modalPanel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
  container.querySelector('#home-chart-modal-periods').addEventListener('click', (event) => {
    const button = event.target.closest('[data-period]');
    if (!button || !modalMarket) return;
    modalPeriod = button.dataset.period;
    container.querySelectorAll('#home-chart-modal-periods [data-period]').forEach((item) => item.classList.toggle('active', item === button));
    loadModalChart(modalMarket, modalPeriod);
  });

  HOME_MARKETS.forEach((market) => {
    container.querySelector(`[data-periods="${market.id}"]`).addEventListener('click', (event) => {
      const button = event.target.closest('[data-period]');
      if (!button) return;
      periods.set(market.id, button.dataset.period);
      container.querySelectorAll(`[data-periods="${market.id}"] [data-period]`).forEach((item) => item.classList.toggle('active', item === button));
      loadChart(market);
    });
    container.querySelector(`[data-expand="${market.id}"]`).addEventListener('click', (event) => {
      openModal(market, event.currentTarget);
    });
    loadChart(market);
  });

  async function loadQuotes() {
    const refreshButton = container.querySelector('#home-quote-refresh');
    const stamp = container.querySelector('#home-quote-stamp');
    quoteAbortController?.abort();
    quoteAbortController = new AbortController();
    refreshButton.disabled = true;
    refreshButton.classList.add('is-loading');
    stamp.textContent = '시세 조회 중…';

    try {
      const tickers = [...US_MEGA_CAPS, ...KOREAN_BLUE_CHIPS].map((item) => item.ticker);
      const response = await fetch('/api/market/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
        signal: quoteAbortController.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const quoteByTicker = new Map((data.items || []).map((item) => [item.ticker, item]));

      [['us', US_MEGA_CAPS], ['kr', KOREAN_BLUE_CHIPS]].forEach(([region, stocks]) => {
        stocks.forEach((stock) => {
          const row = container.querySelector(`[data-quote="${stock.ticker}"]`);
          const quote = quoteByTicker.get(stock.ticker);
          const value = row.querySelector('.home-quote-value b');
          const change = row.querySelector('.home-quote-value em');
          row.classList.remove('is-loading');
          if (!quote || quote.status !== 'ok') {
            row.classList.add('is-error');
            value.textContent = '조회 불가';
            change.textContent = '잠시 후 재시도';
            return;
          }
          const changePct = Number(quote.change_pct) || 0;
          const isUp = changePct >= 0;
          row.classList.remove('is-error');
          value.textContent = formatQuoteValue(Number(quote.value), region);
          change.textContent = `${isUp ? '▲' : '▼'} ${Math.abs(changePct).toFixed(2)}%`;
          change.className = isUp ? 'is-up' : 'is-down';
        });
      });
      const fetchedAt = data.fetched_at ? new Date(data.fetched_at) : null;
      stamp.textContent = fetchedAt && !Number.isNaN(fetchedAt.valueOf())
        ? `조회 ${fetchedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
        : '조회 완료';
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
    charts.forEach((chart) => {
      try { chart.destroy(); } catch {}
    });
    macdCharts.forEach((chart) => {
      try { chart.destroy(); } catch {}
    });
    destroyModalCharts();
  };
}
