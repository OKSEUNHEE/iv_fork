// ── Home view — KOSPI chart via ApexCharts ───────────────────────────────────
export function homeView(container, navigate) {
  const groups = [
    {
      title: '매크로 분석',
      icon: 'fa-solid fa-globe',
      items: [
        { icon: 'fa-solid fa-satellite-dish', name: '거시경제현황 1', tag: '실시간', view: 'macro-realtime' },
        { icon: 'fa-solid fa-chart-area',     name: '거시경제현황 2', tag: '시뮬레이션', view: 'macro-simulation' },
      ],
    },
    {
      title: '산업적 분석',
      icon: 'fa-solid fa-industry',
      items: [
        { icon: 'fa-solid fa-industry', name: '산업 경쟁력 분석', tag: 'Porter · SWOT', view: 'industry-analysis' },
      ],
    },
    {
      title: '기본적 분석',
      icon: 'fa-solid fa-file-invoice-dollar',
      items: [
        { icon: 'fa-solid fa-magnifying-glass-chart', name: 'DART 기업검색',    tag: '종목코드', view: 'dart-company-search' },
        { icon: 'fa-solid fa-scale-balanced',          name: '재무제표분석',     tag: 'IS · BS · CF', view: 'financial-statement' },
        { icon: 'fa-solid fa-briefcase',               name: '포트폴리오 최적화', tag: '샤프비율', view: 'portfolio' },
        { icon: 'fa-solid fa-shield-halved',           name: '리스크 분석',     tag: 'VaR', view: 'risk' },
        { icon: 'fa-solid fa-calculator',              name: '밸류에이션',      tag: 'DCF · EVA', view: 'valuation' },
      ],
    },
    {
      title: '기술적 분석',
      icon: 'fa-solid fa-chart-line',
      items: [
        { icon: 'fa-solid fa-chart-candlestick', name: '기술적 분석',    tag: 'MA · 캔들 · 지표', view: 'technical-chart' },
        { icon: 'fa-solid fa-clock-rotate-left', name: '백테스트',      tag: 'MA 크로스오버', view: 'backtest' },
        { icon: 'fa-solid fa-diagram-project',   name: '퀀트 파이프라인', tag: 'RSI · MACD · ML', view: 'pipeline' },
      ],
    },
    {
      title: '퀀트 금융 지식',
      icon: 'fa-solid fa-layer-group',
      items: [
        { icon: 'fa-solid fa-sitemap',       name: '투자 성향 분석',    tag: '의사결정 트리', view: 'investment-tree' },
        { icon: 'fa-solid fa-layer-group',   name: '금융상품·자산배분', tag: '5일 커리큘럼', view: 'financial-knowledge' },
        { icon: 'fa-solid fa-briefcase',     name: '자산배분 최적화',   tag: 'Risk-Parity', view: 'portfolio' },
        { icon: 'fa-solid fa-shield-halved', name: '리스크 지표',      tag: 'VaR · CVaR', view: 'risk' },
      ],
    },
  ];

  container.innerHTML = `
    <!-- ── KOSPI 캔들 차트 ── -->
    <div id="home-kospi-section" style="
      background:#ffffff; border:1px solid #e8e8e8;
      border-radius:10px; padding:20px 24px 10px;
      margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,.06);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <span style="font-size:0.82rem; font-weight:600; color:#757575; letter-spacing:.02em;">KOSPI &nbsp;·&nbsp; ^KS11</span>
          <span id="kospi-price" style="font-size:1.6rem; font-weight:700; color:#111; letter-spacing:-.5px; line-height:1;">--</span>
          <span id="kospi-change" style="font-size:0.82rem; font-weight:600; padding:3px 10px; border-radius:20px; background:#f5f5f5; color:#757575;">--</span>
        </div>
        <div style="display:flex; gap:4px;" id="kospi-period-btns">
          ${['1mo','3mo','6mo','1y'].map(p => `
            <button data-period="${p}" style="
              padding:4px 12px; border-radius:5px; font-size:0.78rem; font-weight:600;
              cursor:pointer; transition:all .12s; letter-spacing:.01em;
              border:1px solid ${p === '3mo' ? '#0078d4' : '#e0e0e0'};
              background:${p === '3mo' ? '#0078d4' : '#fff'};
              color:${p === '3mo' ? '#fff' : '#757575'};">
              ${p === '1mo' ? '1M' : p === '3mo' ? '3M' : p === '6mo' ? '6M' : '1Y'}
            </button>`).join('')}
        </div>
      </div>

      <div style="position:relative; min-height:260px;">
        <div id="kospi-chart" style="width:100%;"></div>
        <div id="kospi-loading" style="
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          font-size:0.9rem; color:#9e9e9e; background:#fff; border-radius:8px;">
          <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px; color:#0078d4;"></i>데이터 불러오는 중…
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:14px; margin-top:6px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:12px; font-size:0.73rem; color:#bdbdbd;">
          <span><span style="display:inline-block;width:20px;height:2px;background:#0078d4;vertical-align:middle;margin-right:4px;border-radius:1px;"></span>MA20</span>
          <span><span style="display:inline-block;width:9px;height:9px;background:#e6f4ea;border:1.5px solid #107c10;border-radius:1px;vertical-align:middle;margin-right:3px;"></span>상승</span>
          <span><span style="display:inline-block;width:9px;height:9px;background:#c50f1f;border-radius:1px;vertical-align:middle;margin-right:3px;"></span>하락</span>
          <span>· yfinance 15분 지연</span>
        </div>
        <div id="kospi-simulated-notice" style="display:none; font-size:0.73rem;
             color:#c47900; background:#fff8e1; border:1px solid #ffe082;
             border-radius:4px; padding:3px 10px;">
          <i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>시뮬레이션 데이터
        </div>
      </div>
    </div>

    <!-- ── 분석 카드 그리드 ── -->
    <div id="home-cards-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:10px;">
      ${groups.map(group => `
        <div class="home-mini-group">
          <div class="home-mini-group-head">
            <i class="${group.icon}"></i>
            <span>${group.title}</span>
          </div>
          <div class="home-mini-items">
            ${group.items.map(item => `
              <div class="home-mini-card ${item.disabled ? 'is-disabled' : ''}"
                   ${item.view ? `data-view="${item.view}"` : ''}>
                <i class="${item.icon} home-mini-icon"></i>
                <div class="home-mini-text">
                  <div class="home-mini-name">${item.name}</div>
                  <div class="home-mini-tag">${item.tag}</div>
                </div>
                <i class="fa-solid fa-chevron-right home-mini-arrow"></i>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
  `;

  container.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.view));
  });

  let currentPeriod = '3mo';
  let _chart = null;

  container.querySelectorAll('#kospi-period-btns button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPeriod = btn.dataset.period;
      container.querySelectorAll('#kospi-period-btns button').forEach(b => {
        const on = b === btn;
        b.style.background  = on ? '#0078d4' : '#fff';
        b.style.color       = on ? '#fff'    : '#757575';
        b.style.borderColor = on ? '#0078d4' : '#e0e0e0';
      });
      loadChart(currentPeriod);
    });
  });

  async function loadChart(period) {
    const chartEl  = container.querySelector('#kospi-chart');
    const loading  = container.querySelector('#kospi-loading');
    const simNote  = container.querySelector('#kospi-simulated-notice');
    const priceEl  = container.querySelector('#kospi-price');
    const changeEl = container.querySelector('#kospi-change');

    loading.style.display = 'flex';
    if (_chart) { try { _chart.destroy(); } catch(e) {} _chart = null; }

    try {
      const res   = await fetch(`/api/home/kospi-candle?period=${period}`);
      const data  = await res.json();
      const ohlcv = data.ohlcv || [];

      simNote.style.display = data.is_simulated ? 'flex' : 'none';

      if (!ohlcv.length) { loading.innerHTML = '<span style="color:#9e9e9e;">데이터 없음</span>'; return; }

      const last = ohlcv[ohlcv.length - 1];
      const prev = ohlcv.length > 1 ? ohlcv[ohlcv.length - 2].c : last.o;
      const chg  = ((last.c / prev) - 1) * 100;
      const isUp = chg >= 0;

      priceEl.textContent         = last.c.toLocaleString(undefined, { maximumFractionDigits: 2 });
      changeEl.textContent        = `${isUp ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%`;
      changeEl.style.background   = isUp ? '#e6f4ea' : '#fde7e9';
      changeEl.style.color        = isUp ? '#107c10' : '#c50f1f';

      const candleSeries = ohlcv.map(p => ({ x: new Date(p.date).getTime(), y: [p.o, p.h, p.l, p.c] }));
      const ma20Series   = ohlcv.map((p, i) => ({
        x: new Date(p.date).getTime(),
        y: i < 19 ? null : ohlcv.slice(i - 19, i + 1).reduce((s, pt) => s + pt.c, 0) / 20,
      }));

      _chart = new ApexCharts(chartEl, {
        chart: {
          type: 'candlestick', height: 260,
          toolbar: { show: false }, zoom: { enabled: false },
          background: '#fff', animations: { enabled: false },
          fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif',
        },
        series: [
          { name: 'KOSPI', type: 'candlestick', data: candleSeries },
          { name: 'MA20',  type: 'line',         data: ma20Series  },
        ],
        plotOptions: {
          candlestick: { colors: { upward: '#107c10', downward: '#c50f1f' }, wick: { useFillColor: true } }
        },
        colors: ['#107c10', '#0078d4'],
        stroke: { curve: 'smooth', width: [1, 1.8] },
        xaxis: {
          type: 'datetime',
          labels: { format: 'MM-dd', style: { fontSize: '11px', colors: '#9e9e9e', fontFamily: 'Pretendard, sans-serif' }, hideOverlappingLabels: true, datetimeUTC: false },
          axisBorder: { show: false }, axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            formatter: v => v ? Math.round(v).toLocaleString() : '',
            style: { fontSize: '11px', colors: '#9e9e9e', fontFamily: 'Pretendard, sans-serif' }
          }
        },
        grid: { borderColor: '#f0f0f0', strokeDashArray: 4, padding: { right: 12 } },
        tooltip: { shared: false, x: { format: 'yyyy-MM-dd' } },
        legend: { show: false },
        theme: { mode: 'light' },
      });
      await _chart.render();
      loading.style.display = 'none';

    } catch (e) {
      loading.innerHTML     = `<span style="color:#c50f1f; font-size:0.85rem;">데이터 오류: ${e.message}</span>`;
      loading.style.display = 'flex';
    }
  }

  loadChart(currentPeriod);
}
