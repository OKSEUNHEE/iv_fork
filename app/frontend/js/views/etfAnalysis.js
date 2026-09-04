import { api } from '../api.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatPrice(val, currency = 'KRW') {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  if (currency === 'USD') {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return num.toLocaleString('ko-KR') + ' 원';
}

function formatChange(pct) {
  if (pct === null || pct === undefined) return '';
  const num = Number(pct);
  const isUp = num > 0;
  const isDown = num < 0;
  const sign = isUp ? '+' : '';
  const color = isUp ? '#10b981' : isDown ? '#ef4444' : '#64748b';
  const icon = isUp ? '▲' : isDown ? '▼' : '-';
  return `<span style="color:${color};font-weight:700;font-size:0.86rem;">${icon} ${sign}${num.toFixed(2)}%</span>`;
}

export function etfAnalysisView(container) {
  container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:20px;">
      
      <!-- 헤더 & 탭 네비게이션 -->
      <section class="card" style="padding:20px 24px;border-radius:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <h1 style="margin:0 0 6px;font-size:1.45rem;display:flex;align-items:center;gap:10px;">
              <i class="fa-solid fa-chart-pie" style="color:#0ea5e9;"></i> ETF / ETN 스마트 분석 & 섹터 트렌드
            </h1>
            <p style="margin:0;color:var(--text-muted);font-size:0.88rem;">
              국내·미국 <strong>핫 섹터 랭킹, 운용사(KODEX·TIGER·ACE·SOL·RISE) 수수료 비교, 1:1 맞춤 비교기</strong>를 제공합니다.
            </p>
          </div>
          <button id="etf-refresh-btn" class="btn btn-secondary" style="font-size:0.85rem;">
            <i class="fa-solid fa-arrows-rotate"></i> 실시간 시세 갱신
          </button>
        </div>

        <!-- 탭 버튼 -->
        <div style="display:flex;gap:10px;margin-top:20px;border-top:1px solid var(--border);padding-top:16px;flex-wrap:wrap;">
          <button id="tab-hot" class="btn btn-primary" style="padding:8px 16px;font-size:0.9rem;border-radius:8px;">
            <i class="fa-solid fa-fire"></i> 🔥 요즘 핫한 섹터 & 테마
          </button>
          <button id="tab-brands" class="btn btn-secondary" style="padding:8px 16px;font-size:0.9rem;border-radius:8px;">
            <i class="fa-solid fa-building-columns"></i> 🏛️ 운용사별 수수료 비교
          </button>
          <button id="tab-compare" class="btn btn-secondary" style="padding:8px 16px;font-size:0.9rem;border-radius:8px;">
            <i class="fa-solid fa-scale-balanced"></i> ⚖️ ETF 1:1 맞춤 비교기
          </button>
        </div>
      </section>

      <!-- ═══════════════ [1. 핫 섹터 & 테마 랭킹 패널] ═══════════════ -->
      <div id="panel-hot" style="display:flex;flex-direction:column;gap:20px;">
        <div id="hot-sectors-container" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:16px;">
          <div style="padding:24px;text-align:center;color:var(--text-muted);background:var(--surface);border-radius:12px;border:1px solid var(--border);">
            <i class="fa-solid fa-spinner fa-spin"></i> 핫 섹터 데이터 분석 중...
          </div>
        </div>
      </div>

      <!-- ═══════════════ [2. 운용사별 수수료 비교 패널] ═══════════════ -->
      <div id="panel-brands" style="display:none;flex-direction:column;gap:20px;">
        <div id="brands-container" style="display:flex;flex-direction:column;gap:16px;">
          <div style="padding:24px;text-align:center;color:var(--text-muted);background:var(--surface);border-radius:12px;border:1px solid var(--border);">
            <i class="fa-solid fa-spinner fa-spin"></i> 운용사 데이터 불러오는 중...
          </div>
        </div>
      </div>

      <!-- ═══════════════ [3. ETF 1:1 맞춤 비교기 패널] ═══════════════ -->
      <div id="panel-compare" style="display:none;flex-direction:column;gap:20px;">
        <section class="card" style="padding:24px;border-radius:16px;">
          <h2 style="font-size:1.15rem;margin:0 0 12px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-magnifying-glass" style="color:#0ea5e9;"></i> 비교할 ETF 티커/이름 입력
          </h2>
          <form id="compare-form" style="display:flex;gap:10px;margin-bottom:12px;">
            <input id="compare-input" class="param-input" value="SPY, QQQ, SCHD, 360750" placeholder="티커 또는 코드 쉼표로 구분 (예: SPY, QQQ, SCHD 또는 360750, 379800)" style="flex:1;font-weight:700;" />
            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-scale-balanced"></i> 비교하기</button>
          </form>
          
          <!-- 추천 프리셋 태그 -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
            <span style="font-size:0.78rem;color:var(--text-muted);">추천 비교:</span>
            <button class="btn btn-secondary preset-btn" data-preset="SPY, QQQ, SCHD" style="padding:3px 10px;font-size:0.76rem;border-radius:6px;">🇺🇸 미국 3대장 (S&P500 vs 나스닥 vs 배당)</button>
            <button class="btn btn-secondary preset-btn" data-preset="360750, 379800, 360200, 433330" style="padding:3px 10px;font-size:0.76rem;border-radius:6px;">🇰🇷 국내상장 S&P500 (TIGER vs KODEX vs ACE vs SOL)</button>
            <button class="btn btn-secondary preset-btn" data-preset="SCHD, JEPI, 458730, 446720" style="padding:3px 10px;font-size:0.76rem;border-radius:6px;">💰 고배당·월배당 대결</button>
            <button class="btn btn-secondary preset-btn" data-preset="SOXX, 396500, 0167A0" style="padding:3px 10px;font-size:0.76rem;border-radius:6px;">🤖 반도체/AI 대결</button>
          </div>

          <!-- 비교 결과 테이블 -->
          <div id="compare-result-container" style="overflow-x:auto;"></div>
        </section>
      </div>

    </div>
  `;

  // 탭 제어
  const tabHot = container.querySelector('#tab-hot');
  const tabBrands = container.querySelector('#tab-brands');
  const tabCompare = container.querySelector('#tab-compare');
  const panelHot = container.querySelector('#panel-hot');
  const panelBrands = container.querySelector('#panel-brands');
  const panelCompare = container.querySelector('#panel-compare');
  const refreshBtn = container.querySelector('#etf-refresh-btn');

  const hotContainer = container.querySelector('#hot-sectors-container');
  const brandsContainer = container.querySelector('#brands-container');
  const compareForm = container.querySelector('#compare-form');
  const compareInput = container.querySelector('#compare-input');
  const compareResult = container.querySelector('#compare-result-container');

  function switchTab(activeTab, activePanel) {
    [tabHot, tabBrands, tabCompare].forEach(t => t.className = 'btn btn-secondary');
    [panelHot, panelBrands, panelCompare].forEach(p => p.style.display = 'none');
    activeTab.className = 'btn btn-primary';
    activePanel.style.display = 'flex';
  }

  tabHot.addEventListener('click', () => switchTab(tabHot, panelHot));
  tabBrands.addEventListener('click', () => {
    switchTab(tabBrands, panelBrands);
    if (!brandsContainer.querySelector('.brand-card')) loadBrands();
  });
  tabCompare.addEventListener('click', () => {
    switchTab(tabCompare, panelCompare);
    if (!compareResult.querySelector('table')) runCompare(compareInput.value);
  });

  // 1. 핫 섹터 로드
  async function loadHotSectors() {
    try {
      const data = await api.etfHotSectors();
      if (!data || !data.sectors || !data.sectors.length) {
        hotContainer.innerHTML = '<p style="color:var(--text-muted);">핫 섹터 데이터를 불러올 수 없습니다.</p>';
        return;
      }

      hotContainer.innerHTML = data.sectors.map((sec, idx) => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:0.75rem;width:22px;height:22px;background:#0ea5e9;color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;">${idx + 1}</span>
                <strong style="font-size:1.05rem;color:var(--text-main);">${escapeHtml(sec.sector)}</strong>
              </div>
              <div style="font-size:0.88rem;padding:3px 8px;border-radius:6px;background:${sec.avg_change_pct >= 0 ? '#ecfdf5' : '#fef2f2'};">
                평균 ${formatChange(sec.avg_change_pct)}
              </div>
            </div>
            
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${sec.top_etfs.map(t => `
                <div style="padding:10px 12px;background:var(--surface-subtle);border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;">
                  <div style="display:flex;flex-direction:column;gap:2px;">
                    <span style="font-weight:700;color:var(--text-main);">${escapeHtml(t.name)}</span>
                    <span style="font-size:0.72rem;color:var(--text-muted);">${escapeHtml(t.code)} · 거래량 ${(t.volume || 0).toLocaleString()}주</span>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:800;">${formatPrice(t.price)}</div>
                    <div>${formatChange(t.change_pct)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin-top:14px;padding-top:10px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--text-muted);">
            <span>총 ${sec.etf_count}개 관련 ETF 상장</span>
            <button class="btn btn-secondary compare-sector-btn" data-codes="${sec.top_etfs.map(x=>x.code).join(',')}" style="padding:3px 8px;font-size:0.74rem;">
              이 테마 비교하기 <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `).join('');

      // 테마 비교 버튼 클릭
      hotContainer.querySelectorAll('.compare-sector-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const codes = btn.getAttribute('data-codes');
          compareInput.value = codes;
          switchTab(tabCompare, panelCompare);
          runCompare(codes);
        });
      });

    } catch (err) {
      hotContainer.innerHTML = `<div style="color:#ef4444;padding:16px;">핫 섹터 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 2. 운용사별 수수료 비교 로드
  async function loadBrands() {
    try {
      const data = await api.etfBrands();
      if (!data || !data.brands) return;

      brandsContainer.innerHTML = data.brands.map(b => `
        <div class="brand-card" style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <div>
              <span style="font-size:1.2rem;font-weight:800;color:#0284c7;margin-right:8px;">${escapeHtml(b.brand)}</span>
              <span style="font-size:0.88rem;font-weight:600;color:var(--text-main);">${escapeHtml(b.company)}</span>
              <p style="margin:2px 0 0;font-size:0.78rem;color:var(--text-muted);">${escapeHtml(b.desc)}</p>
            </div>
            <button class="btn btn-secondary compare-brand-btn" data-codes="${b.items.map(x=>x.code).join(',')}" style="font-size:0.78rem;padding:4px 10px;">
              전체 라인업 비교
            </button>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
            ${b.items.map(it => `
              <div style="padding:12px;background:var(--surface-subtle);border-radius:10px;border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;gap:6px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.72rem;padding:2px 6px;border-radius:4px;background:#e0f2fe;color:#0369a1;font-weight:700;">${escapeHtml(it.theme)}</span>
                    <span style="font-size:0.75rem;font-weight:800;color:#e11d48;background:#ffe4e6;padding:2px 6px;border-radius:4px;">보수 ${escapeHtml(it.fee)}</span>
                  </div>
                  <div style="font-weight:700;font-size:0.88rem;color:var(--text-main);margin-top:6px;">${escapeHtml(it.name)}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">${escapeHtml(it.code)}</div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px;">
                  <span style="font-size:1rem;font-weight:800;">${it.price ? formatPrice(it.price) : '-'}</span>
                  ${formatChange(it.change_pct)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      brandsContainer.querySelectorAll('.compare-brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const codes = btn.getAttribute('data-codes');
          compareInput.value = codes;
          switchTab(tabCompare, panelCompare);
          runCompare(codes);
        });
      });

    } catch (err) {
      brandsContainer.innerHTML = `<div style="color:#ef4444;padding:16px;">운용사 데이터 로드 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 3. 1:1 맞춤 비교기 실행
  async function runCompare(tickers) {
    if (!tickers) return;
    compareResult.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> 비교 지표 계산 중...</div>';
    
    try {
      const data = await api.etfCompare(tickers);
      if (!data || !data.items || !data.items.length) {
        compareResult.innerHTML = '<p style="color:var(--text-muted);padding:16px;text-align:center;">비교할 ETF 정보를 찾을 수 없습니다.</p>';
        return;
      }

      const items = data.items;
      compareResult.innerHTML = `
        <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:0.88rem;text-align:center;">
          <thead>
            <tr style="background:var(--surface-subtle);border-bottom:2px solid var(--border);">
              <th style="padding:12px;text-align:left;font-size:0.82rem;color:var(--text-muted);">비교 지표</th>
              ${items.map(it => `
                <th style="padding:12px;font-size:0.95rem;font-weight:800;color:#0284c7;">
                  ${escapeHtml(it.name)}<br>
                  <span style="font-size:0.75rem;color:var(--text-muted);font-weight:normal;">(${escapeHtml(it.ticker)}) · ${escapeHtml(it.market)}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-building"></i> 운용사 / 발행사</td>
              ${items.map(it => `<td style="padding:12px;font-weight:600;">${escapeHtml(it.issuer)}</td>`).join('')}
            </tr>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-dollar-sign"></i> 실시간 현재가</td>
              ${items.map(it => `<td style="padding:12px;font-weight:800;font-size:1.05rem;">${formatPrice(it.price, it.currency)}</td>`).join('')}
            </tr>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-chart-line"></i> 오늘 등락률</td>
              ${items.map(it => `<td style="padding:12px;">${formatChange(it.change_pct)}</td>`).join('')}
            </tr>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-receipt"></i> 총보수율 (운용수수료)</td>
              ${items.map(it => `<td style="padding:12px;font-weight:800;color:#e11d48;background:rgba(225,29,72,0.04);">${escapeHtml(it.fee)}</td>`).join('')}
            </tr>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-sack-dollar"></i> 배당률 (분배금)</td>
              ${items.map(it => `<td style="padding:12px;font-weight:800;color:#059669;background:rgba(5,150,105,0.04);">${escapeHtml(it.dividend_yield)}</td>`).join('')}
            </tr>
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:12px;font-weight:700;text-align:left;background:var(--surface-subtle);"><i class="fa-solid fa-coins"></i> 시가총액 / 순자산</td>
              ${items.map(it => `<td style="padding:12px;">${it.market_sum_억 ? Number(it.market_sum_억).toLocaleString() + ' 억원' : '글로벌 초대형'}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      `;

    } catch (err) {
      compareResult.innerHTML = `<div style="color:#ef4444;padding:16px;">비교 실패: ${escapeHtml(err.message)}</div>`;
    }
  }

  // 폼 제출
  compareForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runCompare(compareInput.value.trim());
  });

  // 프리셋 버튼
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      compareInput.value = preset;
      runCompare(preset);
    });
  });

  // 새로고침
  refreshBtn.addEventListener('click', () => {
    loadHotSectors();
    loadBrands();
    runCompare(compareInput.value.trim());
  });

  // 초기 실행
  loadHotSectors();
}