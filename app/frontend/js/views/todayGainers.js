import { mountChartModal } from './chartModal.js';

function formatPrice(value) {
  if (!Number.isFinite(value)) return '--';
  return `${Math.round(value).toLocaleString()}원`;
}

function stockRowMarkup(stock) {
  const ok = stock.status === 'ok';
  const isUp = Number(stock.change_pct) >= 0;
  return `
    <button type="button" class="sector-stock-row${ok ? '' : ' is-error'}" data-ticker="${stock.ticker}" data-name="${stock.name}">
      <span class="sector-stock-name"><strong>${stock.name}</strong><small>${stock.ticker}</small></span>
      <span class="sector-stock-price">${ok ? formatPrice(stock.price) : '조회 불가'}</span>
      <span class="sector-stock-change ${ok ? (isUp ? 'is-up' : 'is-down') : ''}">${ok ? `${isUp ? '▲' : '▼'} ${Math.abs(stock.change_pct).toFixed(2)}%` : '--'}</span>
    </button>`;
}

function sectorPanelMarkup(sector) {
  return `
    <section class="sector-panel">
      <header class="sector-panel-head">
        <i class="fa-solid ${sector.icon}"></i>
        <h2>${sector.label}</h2>
        <span>${sector.stocks.length}종목</span>
      </header>
      <div class="sector-stock-list">${sector.stocks.map(stockRowMarkup).join('')}</div>
    </section>`;
}

export function todayGainersView(container) {
  container.innerHTML = `
    <section class="gainers-page">
      <header class="gainers-head">
        <div>
          <h1><i class="fa-solid fa-chart-pie"></i> 섹터별 대표 종목</h1>
          <p>6개 섹터로 나눈 KOSPI 대표 종목(섹터별 5종목, 총 30종목)의 현재가·등락률입니다. 종목을 클릭하면 이동평균·MACD·RSI가 포함된 큰 차트를 볼 수 있습니다.</p>
        </div>
        <div class="gainers-actions">
          <span id="gainers-stamp">조회 전</span>
          <button type="button" id="gainers-refresh"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
        </div>
      </header>
      <div class="sector-grid" id="sector-grid">
        <div class="gainers-loading"><i class="fa-solid fa-spinner fa-spin"></i> 섹터별 시세를 불러오는 중…</div>
      </div>
      <p class="gainers-note">Yahoo Finance 시세(약 15분 지연) 기준이며, 섹터 분류는 학습용 참고 구분으로 실제 GICS·KRX 업종 분류와 다를 수 있습니다.</p>
    </section>`;

  let disposed = false;
  const chartModal = mountChartModal(container);

  function wireStockClicks() {
    container.querySelectorAll('#sector-grid [data-ticker]').forEach((row) => {
      row.addEventListener('click', () => {
        const ticker = row.dataset.ticker;
        chartModal.open({ id: ticker, name: row.dataset.name, ticker }, row);
      });
    });
  }

  async function loadSectors() {
    const grid = container.querySelector('#sector-grid');
    const stamp = container.querySelector('#gainers-stamp');
    const button = container.querySelector('#gainers-refresh');
    button.disabled = true;
    button.classList.add('is-loading');
    stamp.textContent = '조회 중…';

    try {
      const response = await fetch('/api/market/sector-snapshot');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (disposed) return;
      const sectors = data.sectors || [];
      if (!sectors.length) throw new Error('데이터 없음');

      grid.innerHTML = sectors.map(sectorPanelMarkup).join('');
      wireStockClicks();

      const fetchedAt = data.fetched_at ? new Date(data.fetched_at) : null;
      const stampText = fetchedAt && !Number.isNaN(fetchedAt.valueOf())
        ? `조회 ${fetchedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
        : '조회 완료';
      stamp.textContent = data.is_simulated ? `${stampText} · 시뮬레이션 데이터` : stampText;
      stamp.classList.toggle('is-simulated', Boolean(data.is_simulated));
    } catch (error) {
      if (disposed) return;
      grid.innerHTML = `<div class="gainers-error"><i class="fa-solid fa-triangle-exclamation"></i> 데이터를 불러오지 못했습니다: ${error.message}</div>`;
      stamp.textContent = '조회 실패';
    } finally {
      if (!disposed) {
        button.disabled = false;
        button.classList.remove('is-loading');
      }
    }
  }

  container.querySelector('#gainers-refresh').addEventListener('click', loadSectors);
  loadSectors();

  window._viewCleanup = () => { disposed = true; chartModal.destroy(); };
}
