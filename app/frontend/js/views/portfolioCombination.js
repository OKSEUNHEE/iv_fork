import { api } from '../api.js';

const EXAMPLES = [
  ['AAPL', 'JNJ'],
  ['NVDA', 'KO'],
  ['005930.KS', '000660.KS'],
];

const SIGNALS = {
  green: { icon: 'fa-circle-check', label: '분산 효과 기대', className: 'is-green' },
  yellow: { icon: 'fa-triangle-exclamation', label: '보통', className: 'is-yellow' },
  red: { icon: 'fa-circle-exclamation', label: '함께 움직이는 편', className: 'is-red' },
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatChartDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(date);
}

function renderFlowChart(points, tickerA, tickerB, signal) {
  if (!Array.isArray(points) || points.length < 2) return '';

  const width = 760;
  const height = 250;
  const padding = { top: 20, right: 22, bottom: 34, left: 22 };
  const values = points.flatMap((point) => [Number(point.a), Number(point.b)]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const x = (index) => padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value) => padding.top + (1 - (value - min) / range) * (height - padding.top - padding.bottom);
  const line = (key) => points.map((point, index) => `${x(index).toFixed(1)},${y(Number(point[key])).toFixed(1)}`).join(' ');
  const mid = points[Math.floor(points.length / 2)];
  const why = {
    green: '두 선이 같은 방향으로만 움직이지 않고 갈라지는 구간이 보입니다. 한 종목의 변화가 포트폴리오 전체에 그대로 이어질 가능성을 낮추는 데 도움이 될 수 있습니다.',
    yellow: '두 선이 함께 움직이는 구간과 다른 방향을 보이는 구간이 섞여 있습니다. 분산 효과는 있지만, 시장 상황에 따라 두 종목이 동시에 흔들릴 수도 있습니다.',
    red: '두 선이 비슷한 시점에 오르내리는 구간이 많이 보입니다. 한 종목이 흔들릴 때 다른 종목도 함께 영향을 받을 가능성이 있어 분산 효과가 제한적일 수 있습니다.',
  }[signal] || '';

  return `
    <article class="combination-chart-card">
      <div class="combination-chart-head">
        <div>
          <h3><i class="fa-solid fa-chart-line"></i> 같은 출발선에서 본 가격 흐름</h3>
          <p>종목별 가격 단위는 달라도, 어느 쪽이 더 오르내렸는지는 한눈에 비교할 수 있도록 그렸습니다.</p>
        </div>
        <div class="chart-legend"><span class="line-a"><i></i>${escapeHtml(tickerA)}</span><span class="line-b"><i></i>${escapeHtml(tickerB)}</span></div>
      </div>
      <div class="flow-chart-wrap" role="img" aria-label="${escapeHtml(tickerA)}와 ${escapeHtml(tickerB)}의 기간별 가격 흐름 비교 차트">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <line x1="${padding.left}" x2="${width - padding.right}" y1="${height / 2}" y2="${height / 2}" class="flow-grid" />
          <polyline points="${line('a')}" class="flow-line flow-line-a" />
          <polyline points="${line('b')}" class="flow-line flow-line-b" />
        </svg>
        <div class="flow-chart-dates"><span>${formatChartDate(points[0].date)}</span><span>${formatChartDate(mid.date)}</span><span>${formatChartDate(points[points.length - 1].date)}</span></div>
      </div>
      <p class="chart-why"><i class="fa-solid fa-lightbulb"></i> <b>차트 읽기:</b> ${why}</p>
    </article>`;
}

export function portfolioCombinationView(container) {
  container.innerHTML = `
    <section class="portfolio-combination">
      <div class="page-heading">
        <div>
          <h1><i class="fa-solid fa-traffic-light"></i> 포트폴리오 조합</h1>
          <p>두 종목을 골라 함께 담았을 때의 분산 효과를 신호등으로 확인하세요.</p>
        </div>
      </div>

      <aside class="composition-guide" aria-label="포트폴리오 조합 안내">
        <div class="composition-guide-icon"><i class="fa-solid fa-seedling"></i></div>
        <div>
          <strong>포트폴리오를 나누어 담는 이유</strong>
          <p>한 종목에만 투자하면 그 회사의 좋은 일과 나쁜 일이 내 투자금에 크게 영향을 줍니다. 서로 다른 흐름을 보이는 종목을 함께 담으면, 한쪽이 흔들릴 때 다른 한쪽이 전체 변동을 덜어 줄 수 있습니다.</p>
          <p><b>공분산</b>은 두 종목이 같은 시기에 함께 움직이는 경향을 살펴보는 방법입니다. 이 화면에서는 어려운 숫자 대신, 차트의 두 선과 신호등으로 “두 종목이 얼마나 비슷하게 움직였는지”를 쉽게 보여드립니다.</p>
          <p><b>수익률 상관관계</b>는 두 종목이 오르거나 내린 날에 얼마나 자주 비슷한 방향을 보였는지 살펴보는 기준입니다. 함께 움직이는 날이 많으면 빨간 신호에 가까워지고, 서로 다른 흐름을 보이는 구간이 많으면 초록 신호에 가까워집니다.</p>
        </div>
        <div class="signal-legend" aria-label="신호등 의미">
          <span class="legend-green"><i class="fa-solid fa-circle"></i> 함께 담기 좋은 편</span>
          <span class="legend-yellow"><i class="fa-solid fa-circle"></i> 보통</span>
          <span class="legend-red"><i class="fa-solid fa-circle"></i> 비슷하게 움직이는 편</span>
        </div>
      </aside>

      <div class="combination-card">
        <div class="combination-form">
          <label>
            <span>첫 번째 종목</span>
            <input id="combination-ticker-a" class="param-input" value="AAPL" maxlength="15" autocomplete="off" placeholder="예: AAPL 또는 005930.KS" />
          </label>
          <div class="combination-plus" aria-hidden="true"><i class="fa-solid fa-plus"></i></div>
          <label>
            <span>두 번째 종목</span>
            <input id="combination-ticker-b" class="param-input" value="JNJ" maxlength="15" autocomplete="off" placeholder="예: JNJ 또는 000660.KS" />
          </label>
          <label>
            <span>분석 기간</span>
            <select id="combination-period" class="param-input">
              <option value="3mo">최근 3개월</option>
              <option value="6mo">최근 6개월</option>
              <option value="1y" selected>최근 1년</option>
              <option value="2y">최근 2년</option>
            </select>
          </label>
        </div>
        <div class="combination-actions">
          <button class="run-btn" id="combination-run"><i class="fa-solid fa-chart-simple"></i> 조합 확인하기</button>
          <div class="combination-examples">빠른 선택: ${EXAMPLES.map(([a, b]) => `<button type="button" data-a="${a}" data-b="${b}">${a} + ${b}</button>`).join('')}</div>
        </div>
        <p class="combination-help">미국 종목은 <b>AAPL</b>, 국내 종목은 <b>005930.KS</b>처럼 입력하세요.</p>
      </div>

      <div id="combination-result" class="combination-result" aria-live="polite">
        <div class="combination-empty"><i class="fa-solid fa-traffic-light"></i><p>두 종목을 선택하고 조합을 확인해 보세요.</p></div>
      </div>
    </section>`;

  const tickerA = container.querySelector('#combination-ticker-a');
  const tickerB = container.querySelector('#combination-ticker-b');
  const period = container.querySelector('#combination-period');
  const run = container.querySelector('#combination-run');
  const result = container.querySelector('#combination-result');

  container.querySelectorAll('.combination-examples button').forEach((button) => {
    button.addEventListener('click', () => {
      tickerA.value = button.dataset.a;
      tickerB.value = button.dataset.b;
    });
  });

  async function analyse() {
    const a = tickerA.value.trim().toUpperCase();
    const b = tickerB.value.trim().toUpperCase();
    if (!a || !b) {
      result.innerHTML = '<p class="combination-error">두 종목 코드를 모두 입력해 주세요.</p>';
      return;
    }
    if (a === b) {
      result.innerHTML = '<p class="combination-error">서로 다른 두 종목을 선택해 주세요.</p>';
      return;
    }

    run.disabled = true;
    run.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 데이터 확인 중...';
    result.innerHTML = '<div class="combination-loading"><i class="fa-solid fa-spinner fa-spin"></i> 최근 가격 흐름을 불러오는 중입니다.</div>';
    try {
      const data = await api.portfolioCombination({ ticker_a: a, ticker_b: b, period: period.value });
      const signal = SIGNALS[data.signal] || SIGNALS.yellow;
      const latest = data.latest_data_at ? new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(data.latest_data_at)) : '최근 거래일';
      result.innerHTML = `
        <article class="signal-card ${signal.className}">
          <div class="signal-light"><i class="fa-solid ${signal.icon}"></i></div>
          <div class="signal-copy">
            <p class="signal-eyebrow">${escapeHtml(data.ticker_a)} + ${escapeHtml(data.ticker_b)}</p>
            <h2>${signal.label}</h2>
            <p>${escapeHtml(data.summary)}</p>
          </div>
        </article>
        ${renderFlowChart(data.chart_points, data.ticker_a, data.ticker_b, data.signal)}
        <div class="combination-detail-grid">
          <article class="combination-detail-card">
            <h3><i class="fa-solid fa-calendar-days"></i> 분석 기준</h3>
            <p>${escapeHtml(data.period_label)} 동안 두 종목이 함께 움직인 흐름을 확인했습니다.</p>
            <small>최근 데이터: ${latest} · 공휴일 등으로 실제 거래일 수는 달라질 수 있습니다.</small>
          </article>
          <article class="combination-detail-card">
            <h3><i class="fa-solid fa-compass"></i> 포트폴리오 힌트</h3>
            <p>${escapeHtml(data.portfolio_hint)}</p>
            <small>이 결과는 과거 가격 흐름을 바탕으로 한 참고 정보이며, 미래 성과를 보장하지 않습니다.</small>
          </article>
        </div>`;
    } catch (error) {
      result.innerHTML = `<p class="combination-error">${escapeHtml(error.message || '데이터를 불러오지 못했습니다.')} 종목 코드를 확인한 뒤 다시 시도해 주세요.</p>`;
    } finally {
      run.disabled = false;
      run.innerHTML = '<i class="fa-solid fa-chart-simple"></i> 조합 확인하기';
    }
  }

  run.addEventListener('click', analyse);
}
