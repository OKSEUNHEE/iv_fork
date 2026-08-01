const HOME_MARKETS = [
  { id: 'kospi', name: 'KOSPI', ticker: '^KS11', color: '#0078d4' },
  { id: 'kosdaq', name: 'KOSDAQ', ticker: '^KQ11', color: '#8b5cf6' },
  { id: 'nasdaq', name: 'NASDAQ', ticker: '^IXIC', color: '#0f766e' },
  { id: 'sp500', name: 'S&P 500', ticker: '^GSPC', color: '#d97706' },
];

const PERIODS = [['1mo', '1M'], ['3mo', '3M'], ['6mo', '6M'], ['1y', '1Y']];
const UPWARD_COLOR = '#e11d48';
const DOWNWARD_COLOR = '#2563eb';

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
        <div class="home-market-periods" data-periods="${market.id}">
          ${PERIODS.map(([value, label]) => `<button type="button" data-period="${value}" class="${value === '3mo' ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </header>
      <div class="home-market-chart-wrap">
        <div class="home-market-chart" data-chart="${market.id}"></div>
        <div class="home-market-loading" data-loading="${market.id}"><i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…</div>
      </div>
      <footer class="home-market-foot">
        <span><i class="fa-solid fa-chart-line"></i> 일봉 · MA20 · 거래량</span>
        <span data-source="${market.id}"></span>
      </footer>
    </section>`;
}

export function homeView(container) {
  container.innerHTML = `
    <div class="home-dashboard" id="home-dashboard">
      <div class="home-market-grid">${HOME_MARKETS.map(chartCard).join('')}</div>
    </div>`;

  const charts = new Map();
  const periods = new Map(HOME_MARKETS.map((market) => [market.id, '3mo']));

  function destroyChart(id) {
    const chart = charts.get(id);
    if (chart) {
      try { chart.destroy(); } catch {}
      charts.delete(id);
    }
  }

  async function loadChart(market) {
    const id = market.id;
    const card = container.querySelector(`[data-market-card="${id}"]`);
    const chartEl = card.querySelector(`[data-chart="${id}"]`);
    const loading = card.querySelector(`[data-loading="${id}"]`);
    const price = card.querySelector(`[data-price="${id}"]`);
    const change = card.querySelector(`[data-change="${id}"]`);
    const source = card.querySelector(`[data-source="${id}"]`);
    loading.style.display = 'flex';
    destroyChart(id);

    try {
      const response = await fetch(`/api/home/market-candle?market=${encodeURIComponent(id)}&period=${periods.get(id)}`);
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

      const chart = new ApexCharts(chartEl, {
        chart: { type: 'candlestick', height: 250, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
        series: [
          { name: market.name, type: 'candlestick', data: candles },
          { name: 'MA20', type: 'line', data: ma20 },
          { name: '거래량', type: 'bar', data: volume },
        ],
        plotOptions: { candlestick: { colors: { upward: UPWARD_COLOR, downward: DOWNWARD_COLOR }, wick: { useFillColor: true } }, bar: { columnWidth: '65%' } },
        colors: [UPWARD_COLOR, market.color, '#94a3b8'],
        stroke: { curve: 'smooth', width: [1, 1.7, 0] },
        xaxis: { type: 'datetime', labels: { format: 'MM-dd', style: { fontSize: '10px', colors: '#94a3b8' }, hideOverlappingLabels: true, datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: [{ labels: { formatter: (value) => value ? Math.round(value).toLocaleString() : '', style: { fontSize: '10px', colors: '#94a3b8' } } }, { show: false }, { show: false }],
        grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { right: 10, left: 4 } },
        tooltip: { shared: false, x: { format: 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) } },
        legend: { show: false },
      });
      charts.set(id, chart);
      await chart.render();
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
    loadChart(market);
  });

  window._viewCleanup = () => charts.forEach((chart) => {
    try { chart.destroy(); } catch {}
  });
}
