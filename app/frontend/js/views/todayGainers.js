function formatPrice(value) {
  if (!Number.isFinite(value)) return '--';
  return `${Math.round(value).toLocaleString()}원`;
}

function rowMarkup(item) {
  const isUp = item.change_pct >= 0;
  const rankClass = item.rank <= 3 ? ` is-top${item.rank}` : '';
  return `
    <article class="gainers-row${rankClass}">
      <span class="gainers-rank">${item.rank}</span>
      <div class="gainers-name">
        <strong>${item.name}</strong>
        <span>${item.ticker} · ${item.sector}</span>
      </div>
      <span class="gainers-price">${formatPrice(item.price)}</span>
      <span class="gainers-change ${isUp ? 'is-up' : 'is-down'}">${isUp ? '▲' : '▼'} ${Math.abs(item.change_pct).toFixed(2)}%</span>
    </article>`;
}

export function todayGainersView(container) {
  container.innerHTML = `
    <section class="gainers-page">
      <header class="gainers-head">
        <div>
          <h1><i class="fa-solid fa-arrow-trend-up"></i> 금일 상승종목 TOP 20</h1>
          <p>KOSPI 대표 종목(약 28종목) 중 오늘 등락률이 높은 상위 20종목입니다. 전체 시장 스크리너가 아닌, 학습용 참고 순위입니다.</p>
        </div>
        <div class="gainers-actions">
          <span id="gainers-stamp">조회 전</span>
          <button type="button" id="gainers-refresh"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
        </div>
      </header>
      <div class="gainers-list" id="gainers-list">
        <div class="gainers-loading"><i class="fa-solid fa-spinner fa-spin"></i> 오늘의 등락률을 불러오는 중…</div>
      </div>
      <p class="gainers-note">Yahoo Finance 시세(약 15분 지연) 기준이며, 장중에는 순위가 실시간으로 계속 바뀝니다. 상승률 상위라는 것이 좋은 투자 대상이라는 뜻은 아니며, 급등 이유(실적·공시·수급)를 반드시 별도로 확인하세요.</p>
    </section>`;

  let disposed = false;

  async function loadGainers() {
    const list = container.querySelector('#gainers-list');
    const stamp = container.querySelector('#gainers-stamp');
    const button = container.querySelector('#gainers-refresh');
    button.disabled = true;
    button.classList.add('is-loading');
    stamp.textContent = '조회 중…';

    try {
      const response = await fetch('/api/market/top-gainers?limit=20');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (disposed) return;
      const items = data.items || [];
      if (!items.length) throw new Error('데이터 없음');

      list.innerHTML = items.map(rowMarkup).join('');
      const fetchedAt = data.fetched_at ? new Date(data.fetched_at) : null;
      const stampText = fetchedAt && !Number.isNaN(fetchedAt.valueOf())
        ? `조회 ${fetchedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
        : '조회 완료';
      stamp.textContent = data.is_simulated ? `${stampText} · 시뮬레이션 데이터` : stampText;
      stamp.classList.toggle('is-simulated', Boolean(data.is_simulated));
    } catch (error) {
      if (disposed) return;
      list.innerHTML = `<div class="gainers-error"><i class="fa-solid fa-triangle-exclamation"></i> 데이터를 불러오지 못했습니다: ${error.message}</div>`;
      stamp.textContent = '조회 실패';
    } finally {
      if (!disposed) {
        button.disabled = false;
        button.classList.remove('is-loading');
      }
    }
  }

  container.querySelector('#gainers-refresh').addEventListener('click', loadGainers);
  loadGainers();

  window._viewCleanup = () => { disposed = true; };
}
