// ── Mini CandleChart (canvas-based, no deps) ─────────────────────────────────
class MiniCandleChart {
  constructor(canvas, prices) {
    this.cv  = canvas;
    this.ctx = canvas.getContext('2d');
    this.prices = prices; // [{date,o,h,l,c,v}]
    this.pad = { l: 64, r: 20, t: 18, b: 36 };
    this._resize();
  }
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.cv.offsetWidth, h = this.cv.offsetHeight;
    this.cv.width  = w * dpr; this.cv.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.W = w; this.H = h;
  }
  draw() {
    const { ctx, W, H, prices, pad: { l, r, t, b } } = this;
    const cW = W - l - r, cH = H - t - b, n = prices.length;
    if (!n) return;

    const allH = prices.map(p => p.h), allL = prices.map(p => p.l);
    const maxP = Math.max(...allH) * 1.005;
    const minP = Math.min(...allL) * 0.995;
    const rng  = maxP - minP || 1;

    const xOf = i => l + (i + 0.5) / n * cW;
    const yOf = v => t + (1 - (v - minP) / rng) * cH;
    const bW  = Math.max(2, cW / n * 0.55);

    ctx.clearRect(0, 0, W, H);

    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // grid lines
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = t + i / steps * cH;
      const v = maxP - i / steps * rng;
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(W - r, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(v).toLocaleString(), l - 6, y + 4);
    }

    // MA20
    const ma20 = prices.map((_, i) => {
      if (i < 19) return null;
      return prices.slice(i - 19, i + 1).reduce((s, p) => s + p.c, 0) / 20;
    });
    ctx.beginPath(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.2; ctx.setLineDash([]);
    let started = false;
    ma20.forEach((v, i) => {
      if (v == null) return;
      started ? ctx.lineTo(xOf(i), yOf(v)) : ctx.moveTo(xOf(i), yOf(v));
      started = true;
    });
    ctx.stroke();

    // candles
    prices.forEach((p, i) => {
      const x = xOf(i);
      const bull = p.c >= p.o;
      ctx.strokeStyle = bull ? '#22c55e' : '#ef4444';
      ctx.fillStyle   = bull ? '#166534' : '#7f1d1d';
      ctx.lineWidth   = 1;
      const yH = yOf(p.h), yL = yOf(p.l);
      ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
      const top = Math.min(yOf(p.o), yOf(p.c));
      const ht  = Math.max(1.5, Math.abs(yOf(p.c) - yOf(p.o)));
      ctx.fillRect(x - bW / 2, top, bW, ht);
      ctx.strokeRect(x - bW / 2, top, bW, ht);
    });

    // x-axis date labels
    ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(n / 8));
    prices.forEach((p, i) => {
      if (i % step === 0 && p.date) {
        ctx.fillText(p.date.slice(5), xOf(i), H - b + 14);
      }
    });
  }
}

// ── Home view ─────────────────────────────────────────────────────────────────
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
        { icon: 'fa-solid fa-magnifying-glass-chart', name: 'DART 기업검색',   tag: '종목코드', view: 'dart-company-search' },
        { icon: 'fa-solid fa-scale-balanced',          name: '재무제표분석',    tag: 'IS·BS·CF', view: 'financial-statement' },
        { icon: 'fa-solid fa-briefcase',               name: '포트폴리오 최적화', tag: '샤프비율', view: 'portfolio' },
        { icon: 'fa-solid fa-shield-halved',           name: '리스크 분석',    tag: 'VaR', view: 'risk' },
        { icon: 'fa-solid fa-calculator',              name: '밸류에이션',     tag: 'DCF · EVA', view: 'valuation' },
      ],
    },
    {
      title: '기술적 분석',
      icon: 'fa-solid fa-chart-line',
      items: [
        { icon: 'fa-solid fa-chart-candlestick', name: '기술적 분석',  tag: 'MA·캔들·지표', view: 'technical-chart' },
        { icon: 'fa-solid fa-clock-rotate-left', name: '백테스트',    tag: 'MA 크로스오버', view: 'backtest' },
        { icon: 'fa-solid fa-diagram-project',   name: '퀀트 파이프라인', tag: 'RSI·MACD·ML', view: 'pipeline' },
      ],
    },
    {
      title: '퀀트 금융 지식',
      icon: 'fa-solid fa-layer-group',
      items: [
        { icon: 'fa-solid fa-sitemap',     name: '투자 성향 분석',    tag: '의사결정 트리', view: 'investment-tree' },
        { icon: 'fa-solid fa-layer-group', name: '금융상품·자산배분', tag: '5일 커리큘럼', view: 'financial-knowledge' },
        { icon: 'fa-solid fa-briefcase',   name: '자산배분 최적화',   tag: 'Risk-Parity', view: 'portfolio' },
        { icon: 'fa-solid fa-shield-halved', name: '리스크 지표',    tag: 'VaR · CVaR', view: 'risk' },
      ],
    },
  ];

  container.innerHTML = `
    <div id="home-kospi-section" style="
      background:#0f172a; border-radius:12px; padding:20px 24px 16px;
      border:1px solid #1e293b; margin-bottom:20px; box-shadow:0 4px 20px rgba(0,0,0,.25);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:1rem; font-weight:700; color:#e2e8f0;">
            <i class="fa-solid fa-chart-candlestick" style="color:#eab308; margin-right:6px;"></i>KOSPI (^KS11)
          </span>
          <span id="kospi-price" style="font-size:1.3rem; font-weight:800; color:#e2e8f0;">--</span>
          <span id="kospi-change" style="font-size:0.85rem; font-weight:600; padding:2px 8px; border-radius:6px; background:#1e293b; color:#94a3b8;">--</span>
        </div>
        <div style="display:flex; gap:6px;" id="kospi-period-btns">
          ${['1mo','3mo','6mo','1y'].map((p, i) => `
            <button data-period="${p}" style="
              padding:4px 10px; border-radius:6px; font-size:0.75rem; cursor:pointer;
              border:1px solid #334155; transition:all .15s;
              background:${p === '3mo' ? '#2563eb' : '#1e293b'};
              color:${p === '3mo' ? '#fff' : '#64748b'};">
              ${p === '1mo' ? '1달' : p === '3mo' ? '3달' : p === '6mo' ? '6달' : '1년'}
            </button>`).join('')}
        </div>
      </div>
      <div style="position:relative; height:260px;">
        <canvas id="kospi-canvas" style="width:100%; height:100%; display:block;"></canvas>
        <div id="kospi-loading" style="
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          font-size:0.85rem; color:#64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;"></i>데이터 로딩 중...
        </div>
      </div>
      <div id="kospi-simulated-notice" style="display:none; margin-top:8px;
           font-size:0.72rem; color:#92400e; background:#422006; border-radius:6px; padding:6px 10px;">
        <i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>시뮬레이션 데이터 (yfinance 연결 불가)
      </div>
      <div style="margin-top:10px; font-size:0.72rem; color:#334155;">
        MA20 <span style="color:#f59e0b;">━</span>&nbsp;&nbsp;
        상승 <span style="color:#22c55e;">▮</span>&nbsp;&nbsp;
        하락 <span style="color:#ef4444;">▮</span>
      </div>
    </div>

    <div id="home-cards-grid" style="
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap:12px;
    ">
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

  // ── card click ─────────────────────────────────────────────────────────────
  container.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.view));
  });

  // ── period button toggle ───────────────────────────────────────────────────
  let currentPeriod = '3mo';
  container.querySelectorAll('#kospi-period-btns button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPeriod = btn.dataset.period;
      container.querySelectorAll('#kospi-period-btns button').forEach(b => {
        b.style.background = b === btn ? '#2563eb' : '#1e293b';
        b.style.color      = b === btn ? '#fff'    : '#64748b';
      });
      loadChart(currentPeriod);
    });
  });

  // ── chart load ────────────────────────────────────────────────────────────
  async function loadChart(period) {
    const canvas   = container.querySelector('#kospi-canvas');
    const loading  = container.querySelector('#kospi-loading');
    const simNote  = container.querySelector('#kospi-simulated-notice');
    const priceEl  = container.querySelector('#kospi-price');
    const changeEl = container.querySelector('#kospi-change');

    loading.style.display = 'flex';
    canvas.style.opacity  = '0.3';

    try {
      const res  = await fetch(`/api/home/kospi-candle?period=${period}`);
      const data = await res.json();
      const ohlcv = data.ohlcv || [];

      loading.style.display = 'none';
      canvas.style.opacity  = '1';
      simNote.style.display = data.is_simulated ? 'block' : 'none';

      if (ohlcv.length) {
        const last = ohlcv[ohlcv.length - 1];
        const prev = ohlcv.length > 1 ? ohlcv[ohlcv.length - 2].c : last.o;
        const chg  = ((last.c / prev) - 1) * 100;
        const isUp = chg >= 0;
        priceEl.textContent  = last.c.toLocaleString();
        changeEl.textContent = `${isUp ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%`;
        changeEl.style.color      = isUp ? '#22c55e' : '#ef4444';
        changeEl.style.background = isUp ? '#14532d' : '#7f1d1d';

        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const chart = new MiniCandleChart(canvas, ohlcv);
        chart.draw();
      }
    } catch (e) {
      loading.innerHTML = `<span style="color:#ef4444;">데이터 오류: ${e.message}</span>`;
      loading.style.display = 'flex';
      canvas.style.opacity  = '0';
    }
  }

  loadChart(currentPeriod);
}
