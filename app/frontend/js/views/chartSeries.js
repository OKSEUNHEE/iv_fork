// ── 캔들/MACD/RSI 차트 공용 계산 · ApexCharts 설정 빌더 ──────────────────────────
// home.js(대시보드 카드 + 확대 모달)와 chartModal.js(다른 화면에서 재사용하는 확대
// 모달)이 함께 쓰는 순수 계산 로직이다. DOM을 건드리지 않는다.

export const UPWARD_COLOR = '#e11d48';
export const DOWNWARD_COLOR = '#2563eb';
export const MACD_LINE_COLOR = '#7c3aed';
export const MACD_SIGNAL_COLOR = '#f59e0b';
export const MACD_HIST_UP_COLOR = '#16a34a';
export const MACD_HIST_DOWN_COLOR = '#dc2626';
export const RSI_LINE_COLOR = '#0891b2';
export const BUY_SIGNAL_COLOR = '#16a34a';
export const SELL_SIGNAL_COLOR = '#dc2626';

export function isIntradayPeriod(period) {
  return period === '1d';
}

export function isIntradayInterval(interval) {
  return ['1m', '3m', '5m', '15m', '30m', '1h'].includes(interval);
}

// 여러 해에 걸친 구간(2년/5년/주봉/월봉/연봉)에서는 'MM-dd'만 쓰면 같은 월·일이
// 해마다 반복 표시되어(예: 01-01, 07-01, 01-01, ...) 어느 해인지 구분할 수 없다.
export function xAxisDateFormat(interval, intraday) {
  if (intraday) return 'HH:mm';
  if (['2y', '5y', '1wk', '1mo', '1y'].includes(interval)) return 'yyyy-MM';
  return 'MM-dd';
}

// 시계열 단위(분봉/일봉/주봉/월봉/연봉)마다 실전에서 흔히 쓰는 이동평균 기간이 다르므로
// 봉 단위 카테고리별로 선택 가능한 이동평균 목록과 기본 선택값을 따로 둔다.
export const MA_CATEGORY_OPTIONS = {
  intraday: [5, 10, 20, 60],
  daily:    [5, 20, 60, 120, 200],
  weekly:   [4, 13, 26, 52],
  monthly:  [6, 12, 24, 60],
  yearly:   [3, 5, 10],
};
export const MA_CATEGORY_DEFAULTS = {
  intraday: [20],
  daily:    [20, 60],
  weekly:   [13, 26],
  monthly:  [12, 24],
  yearly:   [5],
};
export const MA_LINE_COLORS = ['#0078d4', '#f59e0b', '#8b5cf6', '#16a34a', '#dc2626'];

export function maCategoryForInterval(interval) {
  if (!interval) return 'daily';
  if (isIntradayInterval(interval)) return 'intraday';
  if (interval === '1wk') return 'weekly';
  if (interval === '1mo') return 'monthly';
  if (interval === '1y') return 'yearly';
  return 'daily'; // '1d' · '2y' · '5y'는 모두 일봉 캔들
}

// period(예: 20)마다 종가의 단순이동평균(SMA)을 구한다. 롤링 합으로 계산해 기간이
// 길어도(연봉 MA10 등) 매번 구간을 다시 훑지 않는다.
export function calcMA(ohlcv, period) {
  const out = new Array(ohlcv.length).fill(null);
  let sum = 0;
  for (let i = 0; i < ohlcv.length; i++) {
    sum += ohlcv[i].c;
    if (i >= period) sum -= ohlcv[i - period].c;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function calcEma(data, span) {
  const k = 2 / (span + 1);
  const out = [];
  data.forEach((value, index) => out.push(index === 0 ? value : out[index - 1] * (1 - k) + value * k));
  return out;
}

export function calcMACD(ohlcv, fast = 12, slow = 26, signalSpan = 9) {
  const closes = ohlcv.map((point) => point.c);
  const emaFast = calcEma(closes, fast);
  const emaSlow = calcEma(closes, slow);
  const macdLine = emaFast.map((value, index) => (index < slow - 1 ? null : value - emaSlow[index]));
  const signalRaw = calcEma(macdLine.map((value) => value ?? 0), signalSpan);
  const signalLine = signalRaw.map((value, index) => (macdLine[index] == null ? null : value));
  const histogram = macdLine.map((value, index) => (value == null || signalLine[index] == null ? null : value - signalLine[index]));
  return { macdLine, signalLine, histogram };
}

export function calcRSI(ohlcv, period = 14) {
  const closes = ohlcv.map((point) => point.c);
  const diffs = closes.map((value, index) => (index === 0 ? 0 : value - closes[index - 1]));
  return closes.map((_, index) => {
    if (index < period) return null;
    const win = diffs.slice(index - period + 1, index + 1);
    const gain = win.filter((value) => value > 0).reduce((sum, value) => sum + value, 0) / period;
    const loss = -win.filter((value) => value < 0).reduce((sum, value) => sum + value, 0) / period;
    return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  });
}

// 각 봉의 거래량을 고가~저가 구간에 겹치는 비율만큼 나눠 가격대별로 합산한다.
// 체결별 데이터가 아닌 OHLCV 기반의 추정 매물대이므로, 실제 호가/체결 분포와는 차이가 날 수 있다.
export function calcVolumeProfile(ohlcv) {
  const points = ohlcv.filter((point) => [point.h, point.l, point.c, point.v].every(Number.isFinite));
  if (!points.length) return { bins: [], maxVolume: 0, poc: null };

  const low = Math.min(...points.map((point) => point.l));
  const high = Math.max(...points.map((point) => point.h));
  const range = high - low;
  if (range <= 0) {
    const volume = points.reduce((sum, point) => sum + Math.max(0, point.v), 0);
    return { bins: [{ low, high, volume }], maxVolume: volume, poc: { low, high, volume } };
  }

  const count = Math.max(14, Math.min(28, Math.round(Math.sqrt(points.length) * 2)));
  const step = range / count;
  const bins = Array.from({ length: count }, (_, index) => ({
    low: low + step * index,
    high: index === count - 1 ? high : low + step * (index + 1),
    volume: 0,
  }));

  points.forEach((point) => {
    const candleLow = Math.min(point.l, point.h);
    const candleHigh = Math.max(point.l, point.h);
    const volume = Math.max(0, point.v);
    if (!volume) return;
    if (candleHigh === candleLow) {
      const index = Math.min(count - 1, Math.max(0, Math.floor((point.c - low) / step)));
      bins[index].volume += volume;
      return;
    }
    const candleRange = candleHigh - candleLow;
    bins.forEach((bin) => {
      const overlap = Math.max(0, Math.min(candleHigh, bin.high) - Math.max(candleLow, bin.low));
      if (overlap) bin.volume += volume * (overlap / candleRange);
    });
  });

  const poc = bins.reduce((highest, bin) => bin.volume > highest.volume ? bin : highest, bins[0]);
  return { bins, maxVolume: poc.volume, poc };
}

export function formatProfilePrice(value) {
  if (!Number.isFinite(value)) return '--';
  return value.toLocaleString(undefined, { maximumFractionDigits: Math.abs(value) < 100 ? 2 : 0 });
}

export function renderVolumeProfile(ohlcv) {
  const profile = calcVolumeProfile(ohlcv);
  if (!profile.bins.length || !profile.maxVolume) {
    return '<p class="home-volume-profile-empty">거래량 데이터가 없어 매물대를 계산할 수 없습니다.</p>';
  }
  const currentPrice = ohlcv.at(-1)?.c;
  const rows = [...profile.bins].reverse().map((bin) => {
    const center = (bin.low + bin.high) / 2;
    const width = Math.max(2, (bin.volume / profile.maxVolume) * 100);
    const isPoc = bin === profile.poc;
    const direction = center <= currentPrice ? 'is-below' : 'is-above';
    return `<li class="home-volume-profile-row ${direction}${isPoc ? ' is-poc' : ''}" title="${formatProfilePrice(bin.low)} ~ ${formatProfilePrice(bin.high)}: ${Math.round(bin.volume).toLocaleString()}">
      <span>${formatProfilePrice(center)}</span><i><b style="width:${width.toFixed(1)}%"></b></i>${isPoc ? '<em>최대</em>' : ''}
    </li>`;
  }).join('');
  return `<div class="home-volume-profile-summary"><span>현재가 ${formatProfilePrice(currentPrice)}</span><span>최대 매물 ${formatProfilePrice((profile.poc.low + profile.poc.high) / 2)}</span></div><ol class="home-volume-profile-bars">${rows}</ol>`;
}

// a선이 b선을 아래→위로 뚫으면 매수, 위→아래로 뚫으면 매도 지점에 그 시점의 a값을 표시한다.
// (MACD가 Signal을 골든/데드크로스하는 지점을 잡는 데 쓴다.)
export function crossSignal(aFull, bFull) {
  const buy = aFull.map((p) => ({ x: p.x, y: null }));
  const sell = aFull.map((p) => ({ x: p.x, y: null }));
  for (let i = 1; i < aFull.length; i++) {
    const prevA = aFull[i - 1].y, prevB = bFull[i - 1].y, curA = aFull[i].y, curB = bFull[i].y;
    if (prevA == null || prevB == null || curA == null || curB == null) continue;
    if (prevA < prevB && curA >= curB) buy[i].y = curA;
    else if (prevA > prevB && curA <= curB) sell[i].y = curA;
  }
  return { buy, sell };
}

// RSI가 과매도(30) 구간을 위로 탈출하면 매수, 과매수(70) 구간을 아래로 이탈하면 매도로 본다.
export function rsiZoneSignal(rsiFull) {
  const buy = rsiFull.map((p) => ({ x: p.x, y: null }));
  const sell = rsiFull.map((p) => ({ x: p.x, y: null }));
  for (let i = 1; i < rsiFull.length; i++) {
    const prev = rsiFull[i - 1].y, cur = rsiFull[i].y;
    if (prev == null || cur == null) continue;
    if (prev < 30 && cur >= 30) buy[i].y = cur;
    else if (prev > 70 && cur <= 70) sell[i].y = cur;
  }
  return { buy, sell };
}

// displayFrom(있으면)보다 앞선 봉은 이동평균 등 지표의 선행 구간(lookback) 계산에만
// 쓰고 실제 차트에는 표시하지 않는다. 그래야 짧은 기간을 선택해도 이동평균선이
// 화면 맨 앞부터 끊김 없이 보인다. maPeriods는 함께 그릴 이동평균 기간들(예: [20, 60]).
function priceSignalRules(interval, candleCount) {
  const base = isIntradayInterval(interval) ? { minGap: 8, threshold: 0.002 }
    : interval === '1wk' ? { minGap: 3, threshold: 0.01 }
      : interval === '1mo' ? { minGap: 2, threshold: 0.015 }
        : interval === '1y' ? { minGap: 1, threshold: 0.03 }
          : { minGap: 5, threshold: 0.006 };
  // 화면 폭과 무관하게 신호 라벨을 약 40개 이내로 제한해 긴 기간 차트에서도 겹치지 않게 한다.
  return { ...base, minGap: Math.max(base.minGap, Math.ceil(candleCount / 40)) };
}

export function computeChartSeries(ohlcv, displayFrom, maPeriods = [20], interval = '1d') {
  const toSeries = (arr) => ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: arr[index] }));
  const maFullByPeriod = new Map(maPeriods.map((p) => [p, toSeries(calcMA(ohlcv, p))]));
  const { macdLine, signalLine, histogram } = calcMACD(ohlcv);
  const macdFull = ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: macdLine[index] }));
  const signalFull = ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: signalLine[index] }));
  const histogramFull = ohlcv.map((point, index) => ({
    x: new Date(point.date).getTime(), y: histogram[index],
    fillColor: (histogram[index] ?? 0) >= 0 ? MACD_HIST_UP_COLOR : MACD_HIST_DOWN_COLOR,
  }));
  const rsi = calcRSI(ohlcv);
  const rsiFull = ohlcv.map((point, index) => ({ x: new Date(point.date).getTime(), y: rsi[index] }));
  const macdCross = crossSignal(macdFull, signalFull);
  const rsiZones = rsiZoneSignal(rsiFull);

  const startIdx = displayFrom ? Math.max(0, ohlcv.findIndex((point) => point.date >= displayFrom)) : 0;
  const displayOhlcv = startIdx > 0 ? ohlcv.slice(startIdx) : ohlcv;
  const candles = displayOhlcv.map((point) => ({ x: new Date(point.date).getTime(), y: [point.o, point.h, point.l, point.c] }));
  const volume = displayOhlcv.map((point) => ({
    x: new Date(point.date).getTime(), y: point.v || 0,
    fillColor: point.c >= point.o ? UPWARD_COLOR : DOWNWARD_COLOR,
  }));
  const cut = (arr) => (startIdx > 0 ? arr.slice(startIdx) : arr);
  const sortedPeriods = [...maPeriods].sort((a, b) => a - b);
  const maLines = sortedPeriods.map((p, i) => ({ period: p, color: MA_LINE_COLORS[i % MA_LINE_COLORS.length], data: cut(maFullByPeriod.get(p)) }));

  // 종가가 (선택된 이동평균 중 가장 짧은 기간의) 이동평균선을 아래→위로 뚫으면
  // 매수시점, 위→아래로 뚫으면 매도시점으로 표시한다.
  const buySignal = candles.map((c) => ({ x: c.x, y: null }));
  const sellSignal = candles.map((c) => ({ x: c.x, y: null }));
  const refMa = maLines[0]?.data;
  if (refMa) {
    const { minGap, threshold } = priceSignalRules(interval, candles.length);
    let lastSignalIndex = -minGap;
    for (let i = 1; i < candles.length; i++) {
      const prevMa = refMa[i - 1].y, curMa = refMa[i].y;
      if (prevMa == null || curMa == null) continue;
      const prevClose = candles[i - 1].y[3], curClose = candles[i].y[3];
      // 이평선 바로 주변의 작은 왕복은 신호로 표시하지 않고, 최근 신호와 지나치게
      // 가까운 봉도 생략한다. 긴 기간 차트에서 매수·매도 라벨이 겹치는 것을 막는다.
      if (i - lastSignalIndex < minGap || Math.abs(curClose / curMa - 1) < threshold) continue;
      if (prevClose < prevMa && curClose >= curMa) {
        buySignal[i].y = +(candles[i].y[2] * 0.985).toFixed(2); // 캔들 저가 살짝 아래
        lastSignalIndex = i;
      } else if (prevClose > prevMa && curClose <= curMa) {
        sellSignal[i].y = +(candles[i].y[1] * 1.015).toFixed(2); // 캔들 고가 살짝 위
        lastSignalIndex = i;
      }
    }
  }

  return {
    candles, volume, maLines, buySignal, sellSignal, displayOhlcv,
    macdSeries: cut(macdFull),
    signalSeries: cut(signalFull),
    histogramSeries: cut(histogramFull),
    rsiSeries: cut(rsiFull),
    macdBuySignal: cut(macdCross.buy),
    macdSellSignal: cut(macdCross.sell),
    rsiBuySignal: cut(rsiZones.buy),
    rsiSellSignal: cut(rsiZones.sell),
  };
}

export function buildCandleConfig(market, series, period, height, interval = '') {
  const intraday = interval ? isIntradayInterval(interval) : isIntradayPeriod(period);
  const maLines = series.maLines || [];
  const maSeries = maLines.map((ma) => ({ name: `MA${ma.period}`, type: 'line', data: ma.data }));
  const buyIdx = 1 + maLines.length; // candlestick(0) + MA선들 다음이 매수
  const sellIdx = buyIdx + 1;
  return {
    chart: { type: 'candlestick', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [
      { name: market.name, type: 'candlestick', data: series.candles },
      ...maSeries,
      { name: '매수', type: 'scatter', data: series.buySignal, dataLabels: { offsetY: 16 } },
      { name: '매도', type: 'scatter', data: series.sellSignal, dataLabels: { offsetY: -16 } },
    ],
    plotOptions: { candlestick: { colors: { upward: UPWARD_COLOR, downward: DOWNWARD_COLOR }, wick: { useFillColor: true } } },
    colors: [UPWARD_COLOR, ...maLines.map((ma) => ma.color), BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR],
    stroke: { curve: 'smooth', width: [1, ...maLines.map(() => 1.7), 0, 0] },
    markers: { size: [0, ...maLines.map(() => 0), 7, 7], strokeColors: '#fff', strokeWidth: 2, hover: { size: 9 } },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [buyIdx, sellIdx],
      formatter: (value, opts) => (value == null ? '' : opts.seriesIndex === buyIdx ? '매수' : opts.seriesIndex === sellIdx ? '매도' : ''),
      style: { fontSize: '10px', fontWeight: 800, colors: ['#334155', ...maLines.map(() => '#334155'), BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR] },
      background: { enabled: true, foreColor: '#fff', borderWidth: 0, opacity: 0.92 },
    },
    // 날짜 축은 아래 거래량 패널에만 표시해 가격·거래량이 겹쳐 보이지 않게 한다.
    xaxis: { type: 'datetime', labels: { show: false, format: xAxisDateFormat(interval, intraday), datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: [
      { seriesName: market.name, labels: { formatter: (value) => value ? Math.round(value).toLocaleString() : '', style: { fontSize: '10px', colors: '#94a3b8' } } },
      ...maLines.map(() => ({ seriesName: market.name, show: false })),
      { seriesName: market.name, show: false },
      { seriesName: market.name, show: false },
    ],
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { right: 10, left: 4 } },
    tooltip: { shared: false, x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) } },
    legend: { show: false },
  };
}

// 거래량은 가격·이동평균과 축 단위가 달라 같은 캔들 영역에 겹치면 가격처럼 오해하기
// 쉽다. 시간축을 공유하는 독립 패널로 렌더링한다.
export function buildVolumeConfig(series, period, height, interval = '') {
  const intraday = interval ? isIntradayInterval(interval) : isIntradayPeriod(period);
  return {
    chart: { type: 'bar', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [{ name: '거래량', data: series.volume }],
    plotOptions: { bar: { columnWidth: '65%', borderRadius: 1 } },
    colors: ['#94a3b8'],
    dataLabels: { enabled: false },
    xaxis: { type: 'datetime', labels: { format: xAxisDateFormat(interval, intraday), style: { fontSize: '10px', colors: '#94a3b8' }, hideOverlappingLabels: true, datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (value) => value == null ? '' : Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(value), style: { fontSize: '9px', colors: '#94a3b8' } } },
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { top: -6, bottom: 0, left: 4, right: 10 } },
    tooltip: { x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : `${Number(value).toLocaleString()}주` } },
    legend: { show: false },
  };
}

export function buildMacdConfig(series, period, height, interval = '') {
  const intraday = interval ? isIntradayInterval(interval) : isIntradayPeriod(period);
  return {
    chart: { type: 'line', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [
      { name: 'MACD', type: 'line', data: series.macdSeries },
      { name: 'Signal', type: 'line', data: series.signalSeries },
      { name: 'Histogram', type: 'bar', data: series.histogramSeries },
      { name: '매수', type: 'scatter', data: series.macdBuySignal, dataLabels: { offsetY: 14 } },
      { name: '매도', type: 'scatter', data: series.macdSellSignal, dataLabels: { offsetY: -14 } },
    ],
    plotOptions: { bar: { columnWidth: '65%' } },
    colors: [MACD_LINE_COLOR, MACD_SIGNAL_COLOR, '#94a3b8', BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR],
    stroke: { curve: 'smooth', width: [1.5, 1.5, 0, 0, 0] },
    markers: { size: [0, 0, 0, 6, 6], strokeColors: '#fff', strokeWidth: 2, hover: { size: 8 } },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [3, 4],
      formatter: (value, opts) => (value == null ? '' : opts.seriesIndex === 3 ? '매수' : opts.seriesIndex === 4 ? '매도' : ''),
      style: { fontSize: '9px', fontWeight: 800, colors: ['#334155', '#334155', '#334155', BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR] },
      background: { enabled: true, foreColor: '#fff', borderWidth: 0, opacity: 0.92 },
    },
    xaxis: { type: 'datetime', labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { tickAmount: 3, labels: { formatter: (value) => value == null ? '' : Number(value).toFixed(1), style: { fontSize: '9px', colors: '#94a3b8' } } },
    annotations: { yaxis: [{ y: 0, strokeDashArray: 3, borderColor: '#cbd5e1', borderWidth: 1 }] },
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { top: 0, bottom: 0, left: 4, right: 10 } },
    legend: { show: true, fontSize: '9px', markers: { width: 7, height: 7 }, itemMargin: { horizontal: 6, vertical: 0 }, offsetY: -4 },
    tooltip: { shared: true, x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toFixed(2) } },
  };
}

export function buildRsiConfig(series, period, height, interval = '') {
  const intraday = interval ? isIntradayInterval(interval) : isIntradayPeriod(period);
  return {
    chart: { type: 'line', height, toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: '#fff', fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [
      { name: 'RSI', type: 'line', data: series.rsiSeries },
      { name: '매수', type: 'scatter', data: series.rsiBuySignal, dataLabels: { offsetY: 14 } },
      { name: '매도', type: 'scatter', data: series.rsiSellSignal, dataLabels: { offsetY: -14 } },
    ],
    colors: [RSI_LINE_COLOR, BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR],
    stroke: { curve: 'smooth', width: [1.6, 0, 0] },
    markers: { size: [0, 6, 6], strokeColors: '#fff', strokeWidth: 2, hover: { size: 8 } },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [1, 2],
      formatter: (value, opts) => (value == null ? '' : opts.seriesIndex === 1 ? '매수' : opts.seriesIndex === 2 ? '매도' : ''),
      style: { fontSize: '9px', fontWeight: 800, colors: [RSI_LINE_COLOR, BUY_SIGNAL_COLOR, SELL_SIGNAL_COLOR] },
      background: { enabled: true, foreColor: '#fff', borderWidth: 0, opacity: 0.92 },
    },
    xaxis: { type: 'datetime', labels: { format: xAxisDateFormat(interval, intraday), style: { fontSize: '10px', colors: '#94a3b8' }, hideOverlappingLabels: true, datetimeUTC: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (value) => value == null ? '' : Math.round(value), style: { fontSize: '9px', colors: '#94a3b8' } } },
    annotations: { yaxis: [
      { y: 70, strokeDashArray: 3, borderColor: '#dc2626', borderWidth: 1, label: { text: '70', style: { fontSize: '9px', color: '#dc2626', background: 'transparent' }, position: 'left', offsetX: 4 } },
      { y: 30, strokeDashArray: 3, borderColor: '#16a34a', borderWidth: 1, label: { text: '30', style: { fontSize: '9px', color: '#16a34a', background: 'transparent' }, position: 'left', offsetX: 4 } },
    ] },
    grid: { borderColor: '#eef2f7', strokeDashArray: 3, padding: { top: 0, bottom: 0, left: 4, right: 10 } },
    legend: { show: false },
    tooltip: { shared: true, x: { format: intraday ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd' }, y: { formatter: (value) => value == null ? '' : Number(value).toFixed(1) } },
  };
}

export function barsFootLabel(period, withRsi = false, interval = '5m', maPeriods = [20]) {
  const labels = { '1m': '1분봉', '3m': '3분봉', '5m': '5분봉', '15m': '15분봉', '30m': '30분봉', '1h': '1시간봉', '1d': '일봉', '2y': '2년 일봉', '5y': '5년 일봉', '1wk': '주봉', '1mo': '월봉', '1y': '연봉' };
  const bar = labels[interval] || (isIntradayPeriod(period) ? '5분봉' : '일봉');
  const maText = [...maPeriods].sort((a, b) => a - b).map((p) => `MA${p}`).join('·') || 'MA 없음';
  return withRsi ? `${bar} · ${maText} · MACD · RSI · 거래량` : `${bar} · ${maText} · MACD · 거래량`;
}

export function trendAnalysis(ohlcv, interval) {
  const closes = ohlcv.map((point) => Number(point.c)).filter(Number.isFinite);
  if (closes.length < 3) return '<p>추세를 설명하기에 충분한 가격 데이터가 없습니다.</p>';
  const last = closes.at(-1);
  const average = (count) => closes.slice(-count).reduce((sum, value) => sum + value, 0) / Math.min(count, closes.length);
  const change = (count) => {
    const start = closes[Math.max(0, closes.length - count)];
    return start ? (last / start - 1) * 100 : 0;
  };
  const ma20 = average(20);
  const ma60 = average(60);
  const shortChange = change(20);
  const mediumChange = change(60);
  const averageMove = closes.slice(-21).reduce((sum, value, index, values) => index ? sum + Math.abs(value / values[index - 1] - 1) : sum, 0) / Math.max(1, Math.min(20, closes.length - 1)) * 100;
  const phase = last >= ma20 && ma20 >= ma60 ? '상승 추세 우위' : last <= ma20 && ma20 <= ma60 ? '하락 추세 우위' : '추세 혼조';
  const relation = last >= ma20 ? '위' : '아래';
  const direction = shortChange >= 0 ? '상승' : '하락';
  const unit = interval === '1y' ? '연' : interval === '1mo' ? '월' : interval === '1wk' ? '주' : isIntradayInterval(interval) ? '분봉' : '일';
  return `
    <div class="home-chart-trend-kpis">
      <span><b>${phase}</b><small>현재 가격이 MA20 ${relation}</small></span>
      <span><b>${shortChange >= 0 ? '+' : ''}${shortChange.toFixed(2)}%</b><small>최근 20개 봉 변화</small></span>
      <span><b>${mediumChange >= 0 ? '+' : ''}${mediumChange.toFixed(2)}%</b><small>최근 60개 봉 변화</small></span>
      <span><b>${averageMove.toFixed(2)}%</b><small>최근 20개 봉 평균 변동폭</small></span>
    </div>
    <p><strong>해설:</strong> 단기 흐름은 ${direction} 방향이며, 현재 가격은 20개 ${unit} 이동평균선 ${relation}에 있습니다. ${ma20 >= ma60 ? '단기 이동평균이 중기 이동평균보다 높아' : '단기 이동평균이 중기 이동평균보다 낮아'} ${phase}로 분류했습니다. 변동폭이 커질수록 같은 방향의 움직임도 빠르게 바뀔 수 있으므로 거래량·뉴스·실적을 함께 확인하세요.</p>`;
}
