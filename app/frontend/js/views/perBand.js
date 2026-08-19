// ── PER 밴드 차트 실습 ─────────────────────────────────────────────────────────
// 기업의 트레일링 EPS × 여러 단계의 PER 배수로 그린 '밴드'와 실제 주가를 겹쳐,
// 타사 비교가 아닌 그 기업 자체의 과거 밸류에이션 이력 안에서 저평가/고평가를
// 판단하는 법을 실습한다. 실계좌·실거래 데이터가 아닌 가상 시나리오로 4가지
// 전형적인 밴드 흐름(우상향 성장/박스권/밸류에이션 트랩/상단 이탈)을 재현한다.

const APEX_FONT = 'Pretendard, -apple-system, "Malgun Gothic", sans-serif';
const PRICE_COLOR = '#111827';
const BAND_LINE_COLORS = ['#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'];
const GOOD_COLOR = '#107c10';
const WARN_COLOR = '#c50f1f';
const NEUTRAL_COLOR = '#b45309';
const WEEKS_PER_QUARTER = 13;

const SCENARIOS = [
  {
    id: 'growth',
    name: '그린에너지테크',
    sector: '2차전지·친환경 (가상 시나리오)',
    scenarioLabel: '밴드 우상향 · 성장형',
    scenarioColor: GOOD_COLOR,
    tagline: '이익이 꾸준히 자라며 밴드 전체가 우상향, 주가가 밴드 하단에서 상단으로 타고 올라간 이상적인 사례',
    seed: 11,
    bandMultiples: [8, 12, 16, 20],
    epsPath: [800, 840, 900, 970, 1050, 1140, 1230, 1330, 1430, 1540, 1650, 1770, 1900, 2040, 2190, 2350],
    multiplePath: [8.6, 9.2, 9.8, 10.6, 11.4, 12.0, 12.8, 13.6, 14.3, 15.1, 15.9, 16.8, 17.6, 18.3, 18.9, 19.4],
  },
  {
    id: 'sideways',
    name: '코리아정유화학',
    sector: '정유·화학 (가상 시나리오)',
    scenarioLabel: '박스권 · 적정가치',
    scenarioColor: '#0078d4',
    tagline: '이익도 주가도 큰 방향성 없이 밴드 중앙을 오가는, 가장 흔한 "적정가치" 사례',
    seed: 23,
    bandMultiples: [5, 7, 9, 11],
    epsPath: [1800, 1850, 1780, 1820, 1900, 1840, 1790, 1860, 1910, 1870, 1830, 1900, 1950, 1880, 1840, 1900],
    multiplePath: [7.0, 7.6, 6.4, 7.2, 8.2, 6.8, 6.2, 7.8, 8.6, 6.6, 6.0, 7.4, 8.4, 6.8, 6.2, 7.6],
  },
  {
    id: 'trap',
    name: '올드리테일',
    sector: '오프라인 유통 (가상 시나리오)',
    scenarioLabel: '밸류에이션 트랩 주의',
    scenarioColor: WARN_COLOR,
    tagline: '주가는 밴드 하단이지만, 이익 자체가 구조적으로 무너지며 밴드선 전체가 꺾이는 함정 사례',
    seed: 37,
    bandMultiples: [6, 9, 12, 15],
    epsPath: [1200, 1250, 1300, 1260, 1180, 1050, 860, 640, 470, 380, 330, 300, 280, 270, 265, 262],
    multiplePath: [9.0, 9.4, 9.8, 9.2, 8.6, 8.0, 7.4, 6.8, 6.2, 5.6, 5.2, 4.8, 4.6, 4.5, 4.4, 4.4],
  },
  {
    id: 'overheated',
    name: '바이오뷰티',
    sector: '헬스케어·뷰티 (가상 시나리오)',
    scenarioLabel: '밴드 상단 이탈 · 고평가',
    scenarioColor: WARN_COLOR,
    tagline: '실적 개선 속도보다 기대감이 앞서면서 주가가 밴드 최상단을 뚫고 오른 상투권 사례',
    seed: 59,
    bandMultiples: [10, 15, 20, 25],
    epsPath: [500, 520, 545, 575, 610, 650, 690, 735, 780, 830, 880, 930, 985, 1040, 1095, 1150],
    multiplePath: [11.0, 11.8, 12.6, 13.4, 14.2, 15.0, 16.0, 17.2, 18.6, 20.4, 22.6, 25.2, 27.8, 29.6, 30.8, 31.6],
  },
];

function destroyChart(state) {
  if (state.chart) {
    try { state.chart.destroy(); } catch (e) { /* noop */ }
    state.chart = null;
  }
}

function card(title, icon, body, accent = '#0078d4') {
  return `<div style="background:#fff;border-radius:10px;padding:20px;margin-bottom:16px;
                      border:1px solid #e8e8e8;border-left:3px solid ${accent};box-shadow:0 1px 4px rgba(0,0,0,.05);">
    <h3 style="font-size:0.95rem;font-weight:700;color:#111;margin:0 0 14px;">
      <i class="${icon}" style="color:${accent};margin-right:7px;"></i>${title}
    </h3>${body}</div>`;
}

function info(html, color = '#0078d4') {
  return `<div style="background:${color}0d;border:1px solid ${color}30;border-radius:7px;
                      padding:11px 14px;font-size:0.85rem;color:#333;line-height:1.65;margin-bottom:14px;">${html}</div>`;
}

function statTile(label, value, color = '#111') {
  return `<div style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:12px;text-align:center;">
    <div style="font-size:0.75rem;color:#9e9e9e;margin-bottom:4px;">${label}</div>
    <div style="font-size:0.92rem;font-weight:700;color:${color};">${value}</div>
  </div>`;
}

// 분기별 트레일링 EPS(계단식)와 분기 사이를 선형보간한 적용 PER 배수로
// 주간 단위 주가·밴드 시계열을 만든다. 밴드선은 실제 PER 밴드 차트처럼
// 분기 실적 발표 시점(계단)에서만 값이 바뀐다.
function buildSeries(scenario) {
  const quarters = scenario.epsPath.length;
  const totalWeeks = quarters * WEEKS_PER_QUARTER;
  let rng = scenario.seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) % 2 ** 32; return rng / 2 ** 32; };

  const today = new Date();
  const start = new Date(today.getTime() - totalWeeks * 7 * 24 * 3600 * 1000);

  const dates = [];
  const epsSeries = [];
  const priceSeries = [];
  const bandSeries = scenario.bandMultiples.map(() => []);

  for (let w = 0; w < totalWeeks; w++) {
    const q = Math.min(quarters - 1, Math.floor(w / WEEKS_PER_QUARTER));
    const qNext = Math.min(quarters - 1, q + 1);
    const qFrac = (w % WEEKS_PER_QUARTER) / WEEKS_PER_QUARTER;
    const eps = scenario.epsPath[q];
    const mult = scenario.multiplePath[q] + (scenario.multiplePath[qNext] - scenario.multiplePath[q]) * qFrac;
    const noise = 1 + (rand() - 0.5) * 0.03;
    const date = new Date(start.getTime() + w * 7 * 24 * 3600 * 1000).getTime();

    dates.push(date);
    epsSeries.push(eps);
    priceSeries.push(Math.round(eps * mult * noise));
    scenario.bandMultiples.forEach((m, i) => bandSeries[i].push(Math.round(eps * m)));
  }
  return { dates, epsSeries, priceSeries, bandSeries };
}

function evaluateStatus(scenario, series) {
  const last = series.priceSeries.length - 1;
  const price = series.priceSeries[last];
  const bandVals = scenario.bandMultiples.map((_, i) => series.bandSeries[i][last]);
  const low = bandVals[0], high = bandVals[bandVals.length - 1];
  const pct = (price - low) / (high - low);

  let label, color, advice;
  if (pct < 0)        { label = '극심한 저평가 (밴드 하단 이탈)'; color = GOOD_COLOR;
    advice = '시장 악재로 과도하게 매도된 구간일 수 있습니다. 단, 이익 자체가 무너지는 중은 아닌지 아래 EPS 추세를 함께 확인하세요.'; }
  else if (pct < 0.25) { label = '저평가 구간'; color = GOOD_COLOR;
    advice = '역사적 저PER 구간에 가깝습니다. 분할 매수를 검토할 수 있는 구간입니다.'; }
  else if (pct <= 0.75) { label = '적정가치 구간'; color = NEUTRAL_COLOR;
    advice = '밴드 중앙 부근입니다. 실적 성장 여부를 지켜보며 보유·관망하기 좋은 구간입니다.'; }
  else if (pct <= 1)   { label = '고평가 접근'; color = WARN_COLOR;
    advice = '밴드 상단에 가깝습니다. 기대감이 상당 부분 반영된 구간이므로 비중 조절을 고려하세요.'; }
  else                 { label = '고평가 (밴드 상단 이탈)'; color = WARN_COLOR;
    advice = '기대감이 과도하게 반영된 상투권일 수 있습니다. 차익 실현을 검토해야 하는 구간입니다.'; }

  const q = scenario.epsPath;
  const recent = q.slice(-4).reduce((a, b) => a + b, 0) / 4;
  const prior  = q.slice(-8, -4).reduce((a, b) => a + b, 0) / 4;
  const epsTrendPct = (recent / prior - 1) * 100;
  const trendUp   = epsTrendPct > 3;
  const trendDown = epsTrendPct < -3;
  const trapWarning = trendDown && pct < 0.4;

  return { price, low, high, pct, label, color, advice, epsTrendPct, trendUp, trendDown, trapWarning,
    perTtm: price / q[q.length - 1] };
}

function buildChartConfig(scenario, series) {
  const priceData = series.dates.map((d, i) => ({ x: d, y: series.priceSeries[i] }));
  const bandData = scenario.bandMultiples.map((m, i) => ({
    name: `PER ${m}배`,
    data: series.dates.map((d, idx) => ({ x: d, y: series.bandSeries[i][idx] })),
  }));

  return {
    chart: { type: 'line', height: 380, toolbar: { show: false }, zoom: { enabled: false },
      animations: { enabled: false }, background: '#fff', fontFamily: APEX_FONT },
    series: [
      { name: `${scenario.name} 주가`, data: priceData },
      ...bandData,
    ],
    colors: [PRICE_COLOR, ...BAND_LINE_COLORS.slice(0, scenario.bandMultiples.length)],
    stroke: { curve: 'straight', width: [2.6, ...scenario.bandMultiples.map(() => 1.3)],
      dashArray: [0, ...scenario.bandMultiples.map(() => 4)] },
    xaxis: { type: 'datetime', labels: { format: 'yyyy-MM', style: { fontSize: '10px', colors: '#9e9e9e', fontFamily: APEX_FONT } },
      axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v) => v ? Math.round(v).toLocaleString() + '원' : '',
      style: { fontSize: '10px', colors: '#9e9e9e', fontFamily: APEX_FONT } } },
    grid: { borderColor: '#f0f0f0', strokeDashArray: 3, padding: { right: 10 } },
    legend: { show: true, fontSize: '11px', markers: { width: 8, height: 8 }, itemMargin: { horizontal: 10, vertical: 4 } },
    tooltip: { shared: true, x: { format: 'yyyy-MM-dd' },
      y: { formatter: (v) => v == null ? '' : Math.round(v).toLocaleString() + '원' } },
  };
}

function scenarioPicker(state) {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-bottom:20px;">
    ${SCENARIOS.map((s) => `
      <button type="button" class="perband-scenario-btn" data-scenario="${s.id}" style="text-align:left;cursor:pointer;
        background:#fff;border-radius:10px;padding:14px 16px;border:2px solid ${state.scenario === s.id ? s.scenarioColor : '#e8e8e8'};
        box-shadow:${state.scenario === s.id ? `0 0 0 3px ${s.scenarioColor}20` : 'none'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
          <div style="font-size:0.92rem;font-weight:700;color:#111;">${s.name}</div>
          <span style="background:${s.scenarioColor}14;color:${s.scenarioColor};border:1px solid ${s.scenarioColor}33;
            border-radius:20px;padding:2px 9px;font-size:0.7rem;font-weight:700;white-space:nowrap;">${s.scenarioLabel}</span>
        </div>
        <div style="font-size:0.76rem;color:#9e9e9e;margin-bottom:6px;">${s.sector}</div>
        <div style="font-size:0.78rem;color:#555;line-height:1.5;">${s.tagline}</div>
      </button>`).join('')}
  </div>`;
}

function referenceContent() {
  return card('PER 밴드 차트로 저평가·고평가 구간 잡는 법', 'fa-solid fa-table-list', `
    <div style="overflow-x:auto;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;font-size:0.83rem;">
        <tr style="background:#fafafa;">
          <th style="padding:9px 10px;text-align:left;color:#757575;border-bottom:1px solid #f0f0f0;">주가 위치</th>
          <th style="padding:9px 10px;text-align:left;color:#757575;border-bottom:1px solid #f0f0f0;">밸류에이션 판단</th>
          <th style="padding:9px 10px;text-align:left;color:#757575;border-bottom:1px solid #f0f0f0;">투자 전략 및 의미</th>
        </tr>
        ${[
          ['밴드 최하단 부근 (또는 이탈)', '극심한 저평가 (바닥권)', '시장 악재로 과도하게 매도된 상태. 역사적 최저 PER 구간으로 분할 매수 타점', GOOD_COLOR],
          ['밴드 중앙 (평균선)', '적정 가치', '기업의 평균적인 평가를 받는 구간. 실적 성장 여부에 따라 보유/관망', NEUTRAL_COLOR],
          ['밴드 최상단 부근 (또는 뚫고 상향)', '고평가 (상투권)', '기대감이 지나치게 반영된 상태. 차익 실현을 고려해야 하는 매도 타점', WARN_COLOR],
        ].map(([pos, judge, strat, c]) => `
          <tr style="border-bottom:1px solid #f5f5f5;">
            <td style="padding:9px 10px;color:#111;font-weight:600;">${pos}</td>
            <td style="padding:9px 10px;color:${c};font-weight:700;">${judge}</td>
            <td style="padding:9px 10px;color:#555;">${strat}</td>
          </tr>`).join('')}
      </table>
    </div>
    <div style="font-size:0.85rem;font-weight:700;color:#111;margin-bottom:10px;">실전 매매 적용 시 주의할 점</div>
    <div id="perband-caution-trap" style="margin-bottom:10px;"></div>
    <div id="perband-caution-trend"></div>
  `, '#0078d4');
}

function cautionBox(icon, title, body, active, color) {
  return `<div style="background:${active ? color + '12' : '#fafafa'};border:1px solid ${active ? color + '40' : '#f0f0f0'};
      border-radius:8px;padding:12px 14px;font-size:0.83rem;color:#333;line-height:1.6;">
    <div style="font-weight:700;color:${active ? color : '#555'};margin-bottom:4px;">
      <i class="${icon}"></i> ${title} ${active ? '<span style="font-size:0.72rem;font-weight:700;">— 현재 시나리오에 해당</span>' : ''}
    </div>
    ${body}
  </div>`;
}

function render(container, state) {
  destroyChart(state);
  const scenario = SCENARIOS.find((s) => s.id === state.scenario) || SCENARIOS[0];
  const series = buildSeries(scenario);
  const status = evaluateStatus(scenario, series);

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h1 style="font-size:1.15rem;font-weight:700;color:#111;margin-bottom:5px;">
        <i class="fa-solid fa-layer-group"></i> PER 밴드 차트
      </h1>
      <p style="font-size:0.88rem;color:#757575;line-height:1.65;margin:0;">
        기업의 과거 실적(EPS)에 여러 단계의 PER 배수를 곱해 만든 주가 밴드와 실제 주가 흐름을 겹쳐, 타사 비교 대신
        <strong>그 기업 자체의 과거 평가 이력</strong>을 기준으로 현재 주가의 저평가·고평가 여부를 판단하는 실습 도구입니다.
        아래 4가지 가상 시나리오는 실제 종목이 아닌 교육용 시뮬레이션 데이터입니다.
      </p>
    </div>
    ${scenarioPicker(state)}
    ${card(`${scenario.name} — PER 밴드 차트`, 'fa-solid fa-chart-line', `
      ${info(`<strong>${scenario.sector}</strong> · ${scenario.tagline}`, scenario.scenarioColor)}
      <div id="perband-chart" style="width:100%;min-height:380px;"></div>
    `, scenario.scenarioColor)}
    ${card('현재 밸류에이션 판단', 'fa-solid fa-gauge-high', `
      <div style="padding:16px;border-radius:10px;border:2px solid ${status.color};background:${status.color}0d;
          text-align:center;margin-bottom:16px;">
        <div style="font-size:0.78rem;color:#9e9e9e;margin-bottom:6px;">밴드 내 위치</div>
        <div style="font-size:1.25rem;font-weight:800;color:${status.color};">${status.label}</div>
        <div style="font-size:0.82rem;color:#555;margin-top:8px;line-height:1.6;">${status.advice}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">
        ${statTile('현재가', status.price.toLocaleString() + '원', '#111')}
        ${statTile('최근 트레일링 EPS', Math.round(scenario.epsPath.at(-1)).toLocaleString() + '원', '#111')}
        ${statTile('현재 PER(TTM)', status.perTtm.toFixed(1) + '배', '#0078d4')}
        ${statTile('최근 4분기 EPS 추세', `${status.epsTrendPct >= 0 ? '▲' : '▼'} ${Math.abs(status.epsTrendPct).toFixed(1)}%`,
          status.trendUp ? GOOD_COLOR : status.trendDown ? WARN_COLOR : NEUTRAL_COLOR)}
        ${statTile('밴드 방향', status.trendUp ? '우상향' : status.trendDown ? '우하향 (역성장)' : '횡보', status.trendUp ? GOOD_COLOR : status.trendDown ? WARN_COLOR : NEUTRAL_COLOR)}
      </div>
    `, status.color)}
    ${referenceContent()}`;

  container.querySelector('#perband-caution-trap').innerHTML = cautionBox(
    'fa-solid fa-triangle-exclamation', '① 실적 훼손 여부 확인 (밸류에이션 트랩)',
    '주가가 밴드 최하단에 닿았다고 무조건 매수해서는 안 됩니다. 단순 일시적 악재가 아니라 이익 자체가 급감하는 구조적 역성장이라면, 밴드 선 전체가 아래로 꺾이면서 주가가 계속 하락할 수 있습니다.',
    status.trapWarning, WARN_COLOR,
  );
  container.querySelector('#perband-caution-trend').innerHTML = cautionBox(
    'fa-solid fa-arrow-trend-up', '② 밴드 우상향 여부 확인',
    '기업의 이익이 매년 증가하면 PER 밴드선 전체가 우상향합니다. 이때 주가가 밴드 하단에서 상단으로 타고 올라가는 기업이 가장 이상적인 성장주입니다.',
    status.trendUp, GOOD_COLOR,
  );

  requestAnimationFrame(() => {
    const el = container.querySelector('#perband-chart');
    if (!el) return;
    state.chart = new ApexCharts(el, buildChartConfig(scenario, series));
    state.chart.render();
  });

  container.querySelectorAll('.perband-scenario-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.scenario = btn.dataset.scenario;
      render(container, state);
    });
  });
}

export function perBandView(container) {
  const state = { scenario: 'growth', chart: null };
  window._viewCleanup = () => destroyChart(state);
  render(container, state);
}
