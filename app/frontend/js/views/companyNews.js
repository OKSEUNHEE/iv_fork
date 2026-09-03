import { api } from '../api.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? (value || '발행시각 정보 없음')
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function companyNewsView(container) {
  container.innerHTML = `
    <section class="card" style="max-width:980px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px;">
        <h1 style="margin:0;font-size:1.35rem;"><i class="fa-solid fa-chart-line" style="color:#0f766e;"></i> 기업 증권 & 투자 뉴스</h1>
        <span style="font-size:0.75rem;padding:4px 8px;border-radius:999px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:600;">
          <i class="fa-solid fa-filter"></i> 증권·실적·공시 필터 적용
        </span>
      </div>
      <p style="margin:0;color:var(--text-muted);line-height:1.6;">기업명을 검색하면 잡다한 일반 기사를 배제하고 <strong>주가, 실적, 공시, 증권사 리포트 등 핵심 투자 뉴스</strong>만 정밀 선별합니다.</p>
      <form id="company-news-form" style="display:flex;gap:8px;margin-top:20px;">
        <input id="company-news-input" class="param-input" value="삼성전자" maxlength="80" placeholder="예: 삼성전자, SK하이닉스, 현대차, 에코프로" aria-label="기업명" style="flex:1;min-width:0;" />
        <button class="btn btn-primary" type="submit"><i class="fa-solid fa-magnifying-glass"></i> 증권 뉴스 검색</button>
      </form>
      <p id="company-news-status" style="margin:12px 0 0;color:var(--text-muted);font-size:.82rem;"></p>
      <div id="company-news-results" style="display:grid;gap:12px;margin-top:14px;"></div>
    </section>`;

  const form = container.querySelector('#company-news-form');
  const input = container.querySelector('#company-news-input');
  const status = container.querySelector('#company-news-status');
  const results = container.querySelector('#company-news-results');
  const button = form.querySelector('button');

  async function search() {
    const companyName = input.value.trim();
    if (!companyName) return;
    button.disabled = true;
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 최신 증권 뉴스를 분석·수집하는 중입니다…';
    results.innerHTML = '';
    try {
      const data = await api.naverCompanyNews({ company_name: companyName, limit: 12 });
      if (data.is_unlisted) {
        status.textContent = '';
        results.innerHTML = `
          <div style="padding:20px;border:1px solid #fed7aa;border-radius:12px;background:#fff7ed;color:#9a3412;line-height:1.6;">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;"><i class="fa-solid fa-triangle-exclamation" style="color:#ea580c;"></i> 상장 기업이 아닙니다</div>
            <p style="margin:0;font-size:0.88rem;">${escapeHtml(data.message)}</p>
          </div>`;
        return;
      }

      status.textContent = `“${data.query}” 관련 핵심 증권 뉴스 ${data.count}건`;
      results.innerHTML = data.items.length ? data.items.map((item) => `
        <article style="padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface);transition:transform 0.15s, box-shadow 0.15s;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" style="color:#0f766e;text-decoration:none;flex:1;">
              <strong style="font-size:0.98rem;line-height:1.5;color:var(--text-main,#0f172a);">${escapeHtml(item.title)}</strong>
            </a>
            <span style="font-size:0.75rem;padding:2px 7px;border-radius:4px;background:var(--surface-subtle,#f1f5f9);color:var(--text-muted,#475569);white-space:nowrap;font-weight:600;border:1px solid var(--border);">
              ${escapeHtml(item.publisher || '증권뉴스')}
            </span>
          </div>
          ${item.description ? `<p style="margin:8px 0 0;color:var(--text-muted);font-size:.85rem;line-height:1.6;">${escapeHtml(item.description)}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:0.78rem;color:var(--text-subtle);">
            <span><i class="fa-regular fa-clock"></i> ${escapeHtml(formatDate(item.published_at))}</span>
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" style="color:#0284c7;text-decoration:none;font-weight:500;">
              원문 읽기 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.7rem;"></i>
            </a>
          </div>
        </article>`).join('') : '<p style="color:var(--text-muted);padding:16px;text-align:center;">표시할 증권 뉴스가 없습니다.</p>';
    } catch (error) {
      status.textContent = '';
      results.innerHTML = `<p style="margin:0;padding:12px;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;background:#fef2f2;">뉴스 조회 실패: ${escapeHtml(error.message)}</p>`;
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search();
  });
}