// ── 확대 차트 모달 (공용) ───────────────────────────────────────────────────────
// 대시보드 홈과 금일 상승종목 등 여러 화면에서 "종목 클릭 → 캔들+MA+MACD+RSI+매물대
// 큰 차트 모달" 동작을 그대로 재사용할 수 있도록 분리한 모듈이다.
// 사용법: const modal = mountChartModal(container); modal.open({ id, name, ticker }, triggerEl);
import {
  isIntradayInterval, maCategoryForInterval, MA_CATEGORY_OPTIONS, MA_CATEGORY_DEFAULTS, MA_LINE_COLORS,
  computeChartSeries, buildCandleConfig, buildVolumeConfig, buildMacdConfig, buildRsiConfig, barsFootLabel, trendAnalysis, renderVolumeProfile,
} from './chartSeries.js';

const CHART_CACHE_PREFIX = 'investment_analysis_chart_v1:';
const CHART_CACHE_MAX_ENTRIES = 8;

function chartCacheTtl(interval) {
  if (isIntradayInterval(interval)) return 30_000;
  if (interval === '1d') return 5 * 60_000;
  if (['2y', '5y'].includes(interval)) return 30 * 60_000;
  if (interval === '1wk') return 2 * 60 * 60_000;
  if (interval === '1mo') return 6 * 60 * 60_000;
  if (interval === '1y') return 24 * 60 * 60_000;
  return 5 * 60_000;
}

function chartCacheKey(ticker, interval) {
  return `${CHART_CACHE_PREFIX}${ticker}:${interval}`;
}

function readChartCache(key, maxAge) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!cached || Date.now() - cached.savedAt > maxAge || !Array.isArray(cached.data?.ohlcv) || !cached.data.ohlcv.length) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeChartCache(key, data) {
  try {
    const entries = Object.keys(localStorage)
      .filter((storageKey) => storageKey.startsWith(CHART_CACHE_PREFIX) && storageKey !== key)
      .map((storageKey) => ({ storageKey, savedAt: JSON.parse(localStorage.getItem(storageKey) || '{}').savedAt || 0 }))
      .sort((a, b) => a.savedAt - b.savedAt);
    entries.slice(0, Math.max(0, entries.length - CHART_CACHE_MAX_ENTRIES + 1)).forEach(({ storageKey }) => localStorage.removeItem(storageKey));
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // 개인정보 보호 모드·저장공간 부족 등으로 localStorage를 쓸 수 없으면 네트워크 조회를 그대로 사용한다.
  }
}

function periodButtonsHtml() {
  return `
    <button type="button" data-interval="1m">1분</button>
    <button type="button" data-interval="3m">3분</button>
    <button type="button" data-interval="5m">5분</button>
    <button type="button" data-interval="15m">15분</button>
    <button type="button" data-interval="30m">30분</button>
    <button type="button" data-interval="1h">1시간</button>
    <button type="button" data-interval="1d">일</button>
    <button type="button" data-interval="2y">2년</button>
    <button type="button" data-interval="5y">5년</button>
    <button type="button" data-interval="1wk">주</button>
    <button type="button" data-interval="1mo">월</button>
    <button type="button" data-interval="1y">Yearly</button>`;
}

function chartModalMarkup() {
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
            <div class="home-chart-search">
              <label class="home-chart-instrument-label" for="home-chart-modal-search">종목</label>
              <input id="home-chart-modal-search" class="home-chart-instrument-select" type="search" placeholder="종목명 또는 티커 검색" autocomplete="off" aria-label="종목명 또는 티커 검색">
              <div id="home-chart-search-results" class="home-chart-search-results" role="listbox" hidden></div>
            </div>
            <div class="home-market-periods home-chart-intervals" id="home-chart-modal-intervals" aria-label="분봉 간격">
              ${periodButtonsHtml()}
            </div>
            <button type="button" class="home-chart-modal-close" aria-label="차트 닫기"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </header>
        <div class="home-chart-modal-body">
          <div class="home-market-chart-wrap home-chart-modal-chart-wrap">
            <div class="home-market-chart" id="home-chart-modal-chart"></div>
            <div class="home-market-loading" id="home-chart-modal-loading"><i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…</div>
            <div class="home-chart-ma-toggles" id="home-chart-modal-ma-toggles" role="group" aria-label="이동평균선 선택"></div>
          </div>
          <div class="home-market-volume-wrap">
            <div class="home-market-macd-label">거래량</div>
            <div class="home-market-volume" id="home-chart-modal-volume"></div>
          </div>
          <section class="home-volume-profile" aria-labelledby="home-volume-profile-title">
            <header>
              <h3 id="home-volume-profile-title"><i class="fa-solid fa-chart-bar"></i> 매물대 <small>표시 구간의 거래량 분포</small></h3>
              <span>OHLCV 추정</span>
            </header>
            <div id="home-chart-modal-volume-profile">데이터를 불러오는 중…</div>
          </section>
          <div class="home-market-macd-wrap">
            <div class="home-market-macd-label">MACD (12, 26, 9)</div>
            <div class="home-market-macd home-chart-modal-macd" id="home-chart-modal-macd"></div>
          </div>
          <section class="home-macd-learning" aria-labelledby="home-macd-learning-title">
            <header>
              <h3 id="home-macd-learning-title"><i class="fa-solid fa-chart-column"></i> MACD 오실레이터 읽기</h3>
              <span>추세 강도 · 모멘텀 참고</span>
            </header>
            <p>MACD 오실레이터(히스토그램)는 단기·장기 이동평균선의 차이인 <b>MACD선</b>과 그 평균값인 <b>시그널선</b> 사이의 격차를 막대로 보여주는 지표입니다. 추세 방향뿐 아니라 추세의 강도와 모멘텀 변화를 빠르게 파악할 때 유용합니다.</p>
            <div class="home-macd-learning-grid">
              <article>
                <h4>구성 요소</h4>
                <ul>
                  <li><b>MACD선</b>: 단기 이동평균(기본 12일) − 장기 이동평균(기본 26일)</li>
                  <li><b>시그널선</b>: MACD선의 9일 지수이동평균</li>
                  <li><b>오실레이터</b>: MACD선 − 시그널선을 나타낸 막대</li>
                </ul>
              </article>
              <article>
                <h4>주요 신호</h4>
                <ul>
                  <li><b>상향 돌파</b>: MACD선이 시그널선 위로 올라가면 상승 모멘텀의 시작 신호로 봅니다.</li>
                  <li><b>하향 돌파</b>: MACD선이 시그널선 아래로 내려가면 하락 모멘텀의 시작 신호로 봅니다.</li>
                  <li><b>막대 변화</b>: 0선 위·아래로 길어지면 기존 추세 강화, 줄어들면 힘이 약해지는 전환 임계점일 수 있습니다.</li>
                </ul>
              </article>
              <article>
                <h4>실전에서 함께 보기</h4>
                <ul>
                  <li><b>다이버전스</b>: 주가와 오실레이터의 고·저점이 엇갈리면 추세 반전 가능성을 살핍니다.</li>
                  <li><b>지연성 보완</b>: MACD선보다 막대 길이가 줄어드는 시점을 먼저 확인해 볼 수 있습니다.</li>
                  <li><b>횡보장 주의</b>: 박스권에서는 속임 신호가 잦아 RSI·거래량과 함께 판단합니다.</li>
                </ul>
              </article>
            </div>
          </section>
          <div class="home-market-macd-wrap">
            <div class="home-market-macd-label">RSI (14)</div>
            <div class="home-market-macd home-chart-modal-rsi" id="home-chart-modal-rsi"></div>
          </div>
          <section class="home-chart-trend" aria-labelledby="home-chart-trend-title">
            <h3 id="home-chart-trend-title"><i class="fa-solid fa-chart-line"></i> 추세 해설 <small>기술적 참고 정보</small></h3>
            <div id="home-chart-modal-trend">데이터를 불러오는 중…</div>
          </section>
          <section class="home-chart-learning" aria-labelledby="home-chart-learning-title">
            <header><h3 id="home-chart-learning-title"><i class="fa-solid fa-graduation-cap"></i> 차트를 쉽게 읽는 방법</h3><span>예시 인포그래픽</span></header>
            <div class="home-chart-learning-grid">
              <article class="trend-lesson is-up">
                <div class="trend-illustration" aria-hidden="true"><i></i><i></i><i></i><b class="price-line"></b><b class="ma-line"></b></div>
                <h4><i class="fa-solid fa-arrow-trend-up"></i> 상승 추세</h4>
                <p>저점과 고점이 차례로 높아지고, 가격이 우상향하는 이평선 위에서 움직이는 모습입니다.</p>
                <small>확인: <b>가격 &gt; MA20</b> · MA20 기울기 ↑</small>
              </article>
              <article class="trend-lesson is-down">
                <div class="trend-illustration" aria-hidden="true"><i></i><i></i><i></i><b class="price-line"></b><b class="ma-line"></b></div>
                <h4><i class="fa-solid fa-arrow-trend-down"></i> 하락 추세</h4>
                <p>저점과 고점이 낮아지고, 가격이 하향하는 이평선 아래에서 움직이는 모습입니다.</p>
                <small>확인: <b>가격 &lt; MA20</b> · MA20 기울기 ↓</small>
              </article>
              <article class="trend-lesson is-ma">
                <div class="trend-illustration" aria-hidden="true"><i></i><i></i><i></i><b class="price-line"></b><b class="ma-line"></b></div>
                <h4><i class="fa-solid fa-wave-square"></i> 이평선 함께 보기</h4>
                <p>가격 한 번의 움직임보다 MA20의 방향과 MA20·MA60의 위아래 관계를 같이 봅니다.</p>
                <small>순서: <b>가격 위치 → MA20 방향 → MA20/60 관계</b></small>
              </article>
            </div>
            <p class="home-chart-learning-note"><i class="fa-solid fa-lightbulb"></i> 예를 들어 가격이 MA20 위에 있어도 MA20이 아래로 꺾이면 상승 힘이 약해졌을 수 있습니다. 거래량과 기업 뉴스도 함께 확인하세요.</p>
            <section class="home-volume-profile-learning" aria-labelledby="volume-profile-learning-title">
              <h4 id="volume-profile-learning-title"><i class="fa-solid fa-chart-bar"></i> 매물대(Volume Profile) 읽기</h4>
              <p>일반 거래량이 <b>특정 날짜·시간</b>의 거래량을 보여준다면, 매물대는 <b>특정 가격대</b>에 거래가 얼마나 집중됐는지 보여주는 세로축 지표입니다. 막대가 길수록 그 가격대의 누적 거래량이 많습니다.</p>
              <div class="volume-profile-concepts">
                <article><b>매물대 막대</b><span>특정 가격 구간에서 체결된 총 거래량입니다. 길수록 많은 참여자의 거래 가격이 모여 있습니다.</span></article>
                <article><b>POC (최대 매물대)</b><span>표시 구간에서 거래량이 가장 많이 쌓인 가격대입니다. 이 화면에서는 보라색 테두리와 ‘최대’로 표시됩니다.</span></article>
              </div>
              <div class="volume-profile-support-resistance">
                <article><i class="fa-solid fa-arrow-up"></i><div><b>저항 가능 구간</b><span>현재가 위의 두꺼운 매물대는 상승 시 과거 매수자의 매도 물량이 나올 수 있어 저항으로 작용할 수 있습니다.</span></div></article>
                <article><i class="fa-solid fa-arrow-down"></i><div><b>지지 가능 구간</b><span>현재가 아래의 두꺼운 매물대는 하락 시 방어 매수와 신규 매수 관심이 모여 지지로 작용할 수 있습니다.</span></div></article>
              </div>
              <div class="volume-profile-use-table-wrap"><table class="volume-profile-use-table"><thead><tr><th>상황</th><th>차트 특징</th><th>읽어 볼 점</th></tr></thead><tbody>
                <tr><td>상향 돌파</td><td>두꺼운 매물대를 거래량과 함께 통과</td><td>매도 물량이 소화됐는지 이후 가격 유지 여부를 확인합니다.</td></tr>
                <tr><td>하향 이탈</td><td>아래 받치던 매물대 아래로 내려감</td><td>기존 지지 구간이 저항으로 바뀔 수 있어 위험 관리 기준을 점검합니다.</td></tr>
                <tr><td>매물대 공백</td><td>막대가 얇거나 거의 없는 가격 구간</td><td>지지·저항이 약해 가격이 빠르게 움직일 수 있습니다.</td></tr>
              </tbody></table></div>
              <small><i class="fa-solid fa-circle-info"></i> 매물대는 과거 거래를 요약한 참고 지표입니다. 이 화면은 OHLCV로 추정하므로 실제 체결 분포와 다를 수 있으며, 뉴스·실적·시장 상황과 함께 확인하세요.</small>
            </section>
          </section>
          <footer class="home-market-foot">
            <span id="home-chart-modal-foot-label"><i class="fa-solid fa-chart-line"></i></span>
            <span id="home-chart-modal-source"></span>
          </footer>
        </div>
      </section>
    </div>`;
}

// container 안에 확대 차트 모달을 붙이고 { open(market, trigger), destroy() }를 반환한다.
// market: { id, name, ticker } — id는 /api/home/market-candle의 market 파라미터,
// ticker가 있으면 서버가 이를 우선해 임의 종목도 그대로 조회한다.
export function mountChartModal(container) {
  container.insertAdjacentHTML('beforeend', chartModalMarkup());

  const modalPeriod = '1d';
  let modalMarket = null;
  let modalInterval = '1d';
  let modalChart = null;
  let modalVolumeChart = null;
  let modalMacdChart = null;
  let modalRsiChart = null;
  let modalTrigger = null;
  let modalAbortController = null;
  let modalSearchAbortController = null;
  let modalSearchTimer = null;
  let modalOhlcv = [];
  let modalDisplayFrom = null;
  const modalActiveMAs = new Map(Object.entries(MA_CATEGORY_DEFAULTS).map(([category, defaults]) => [category, new Set(defaults)]));

  function currentMAPeriods() {
    const category = maCategoryForInterval(modalInterval);
    return [...modalActiveMAs.get(category)].sort((a, b) => a - b);
  }

  function destroyModalCharts() {
    if (modalChart) { try { modalChart.destroy(); } catch {} modalChart = null; }
    if (modalVolumeChart) { try { modalVolumeChart.destroy(); } catch {} modalVolumeChart = null; }
    if (modalMacdChart) { try { modalMacdChart.destroy(); } catch {} modalMacdChart = null; }
    if (modalRsiChart) { try { modalRsiChart.destroy(); } catch {} modalRsiChart = null; }
  }

  function renderMAToggles() {
    const toggles = container.querySelector('#home-chart-modal-ma-toggles');
    if (!toggles) return;
    const category = maCategoryForInterval(modalInterval);
    const options = MA_CATEGORY_OPTIONS[category];
    const active = modalActiveMAs.get(category);
    const sortedActive = [...active].sort((a, b) => a - b);
    toggles.innerHTML = options.map((p) => {
      const isActive = active.has(p);
      const color = isActive ? MA_LINE_COLORS[sortedActive.indexOf(p) % MA_LINE_COLORS.length] : '#cbd5e1';
      return `<button type="button" class="home-chart-ma-toggle${isActive ? ' active' : ''}" data-ma-period="${p}" style="--ma-color:${color}"><span class="dot"></span>MA${p}</button>`;
    }).join('');
  }

  async function rerenderModalCandle() {
    if (!modalOhlcv.length || !modalMarket) return;
    const series = computeChartSeries(modalOhlcv, modalDisplayFrom, currentMAPeriods(), modalInterval);
    const chartEl = container.querySelector('#home-chart-modal-chart');
    if (modalChart) { try { modalChart.destroy(); } catch {} modalChart = null; }
    modalChart = new ApexCharts(chartEl, buildCandleConfig(modalMarket, series, modalPeriod, '100%', modalInterval));
    await modalChart.render();
    const footLabel = container.querySelector('#home-chart-modal-foot-label');
    if (footLabel) footLabel.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${barsFootLabel(modalPeriod, true, modalInterval, currentMAPeriods())}`;
  }

  async function loadModalChart(market, period, interval) {
    const chartEl = container.querySelector('#home-chart-modal-chart');
    const volumeEl = container.querySelector('#home-chart-modal-volume');
    const macdEl = container.querySelector('#home-chart-modal-macd');
    const rsiEl = container.querySelector('#home-chart-modal-rsi');
    const loading = container.querySelector('#home-chart-modal-loading');
    const price = container.querySelector('#home-chart-modal-price');
    const change = container.querySelector('#home-chart-modal-change');
    const source = container.querySelector('#home-chart-modal-source');
    const footLabel = container.querySelector('#home-chart-modal-foot-label');
    const trend = container.querySelector('#home-chart-modal-trend');
    const volumeProfile = container.querySelector('#home-chart-modal-volume-profile');
    loading.style.display = 'flex';
    loading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 데이터 불러오는 중…';
    modalAbortController?.abort();
    modalAbortController = new AbortController();
    const signal = modalAbortController.signal;
    destroyModalCharts();

    try {
      const cacheKey = chartCacheKey(market.ticker, interval);
      let data = readChartCache(cacheKey, chartCacheTtl(interval));
      if (!data) {
        const response = await fetch(`/api/home/market-candle?market=${encodeURIComponent(market.id)}&period=${period}&interval=${interval}&ticker=${encodeURIComponent(market.ticker)}&timeframe=${interval}`, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
        writeChartCache(cacheKey, data);
      }
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

      modalOhlcv = ohlcv;
      modalDisplayFrom = data.display_from || null;
      renderMAToggles();
      const maPeriods = currentMAPeriods();
      footLabel.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${barsFootLabel(period, true, interval, maPeriods)}`;

      const series = computeChartSeries(ohlcv, modalDisplayFrom, maPeriods, interval);
      trend.innerHTML = trendAnalysis(ohlcv, interval);
      volumeProfile.innerHTML = renderVolumeProfile(series.displayOhlcv);

      modalChart = new ApexCharts(chartEl, buildCandleConfig(market, series, period, '100%', interval));
      await modalChart.render();

      modalVolumeChart = new ApexCharts(volumeEl, buildVolumeConfig(series, period, '100%', interval));
      await modalVolumeChart.render();

      modalMacdChart = new ApexCharts(macdEl, buildMacdConfig(series, period, '100%', interval));
      await modalMacdChart.render();

      modalRsiChart = new ApexCharts(rsiEl, buildRsiConfig(series, period, '100%', interval));
      await modalRsiChart.render();

      loading.style.display = 'none';
    } catch (error) {
      if (error.name === 'AbortError') return;
      trend.textContent = '추세 해설을 계산할 수 없습니다.';
      volumeProfile.textContent = '매물대를 계산할 수 없습니다.';
      loading.innerHTML = `<span class="home-market-error">데이터 오류: ${error.message}</span>`;
    }
  }

  const modalEl = container.querySelector('#home-chart-modal');
  const modalPanel = modalEl.querySelector('.home-chart-modal');
  const modalSearchInput = container.querySelector('#home-chart-modal-search');
  const modalSearchResults = container.querySelector('#home-chart-search-results');

  function updateModalHeader() {
    container.querySelector('#home-chart-modal-title').textContent = `${modalMarket.name} · ${modalMarket.ticker}`;
    container.querySelectorAll('#home-chart-modal-intervals [data-interval]').forEach((button) => {
      button.classList.toggle('active', button.dataset.interval === modalInterval);
    });
  }

  function open(market, trigger) {
    modalMarket = market;
    modalInterval = '1d';
    modalTrigger = trigger || null;
    updateModalHeader();
    modalEl.hidden = false;
    modalPanel.focus();
    loadModalChart(modalMarket, modalPeriod, modalInterval);
  }

  function close() {
    modalEl.hidden = true;
    modalAbortController?.abort();
    modalSearchAbortController?.abort();
    destroyModalCharts();
    modalTrigger?.focus();
    modalMarket = null;
  }

  modalEl.querySelector('.home-chart-modal-close').addEventListener('click', close);
  modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) close();
  });
  modalPanel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  container.querySelector('#home-chart-modal-intervals').addEventListener('click', (event) => {
    const button = event.target.closest('[data-interval]');
    if (!button || !modalMarket) return;
    modalInterval = button.dataset.interval;
    updateModalHeader();
    loadModalChart(modalMarket, modalPeriod, modalInterval);
  });
  container.querySelector('#home-chart-modal-ma-toggles').addEventListener('click', (event) => {
    const button = event.target.closest('[data-ma-period]');
    if (!button) return;
    const category = maCategoryForInterval(modalInterval);
    const active = modalActiveMAs.get(category);
    const period = Number(button.dataset.maPeriod);
    if (active.has(period)) {
      if (active.size <= 1) return; // 최소 1개는 남겨 둔다.
      active.delete(period);
    } else {
      active.add(period);
    }
    renderMAToggles();
    rerenderModalCandle();
  });
  modalSearchInput.addEventListener('input', () => {
    const query = modalSearchInput.value.trim();
    clearTimeout(modalSearchTimer);
    modalSearchAbortController?.abort();
    modalSearchResults.hidden = true;
    modalSearchResults.replaceChildren();
    if (!query) return;
    modalSearchTimer = setTimeout(async () => {
      modalSearchAbortController = new AbortController();
      try {
        const response = await fetch(`/api/home/chart-search?q=${encodeURIComponent(query)}`, { signal: modalSearchAbortController.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        (data.items || []).forEach((item) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'home-chart-search-result';
          button.setAttribute('role', 'option');
          button.textContent = `${item.name} · ${item.ticker}${item.exchange ? ` (${item.exchange})` : ''}`;
          button.addEventListener('click', () => {
            modalMarket = { id: item.ticker, name: item.name, ticker: item.ticker };
            modalSearchInput.value = '';
            modalSearchResults.hidden = true;
            updateModalHeader();
            loadModalChart(modalMarket, modalPeriod, modalInterval);
          });
          modalSearchResults.appendChild(button);
        });
        modalSearchResults.hidden = !modalSearchResults.childElementCount;
      } catch (error) {
        if (error.name !== 'AbortError') modalSearchResults.hidden = true;
      }
    }, 250);
  });

  function destroy() {
    modalAbortController?.abort();
    modalSearchAbortController?.abort();
    destroyModalCharts();
    modalEl.remove();
  }

  return { open, close, destroy };
}
