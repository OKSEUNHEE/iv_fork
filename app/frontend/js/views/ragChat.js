const EXAMPLES = ['PER과 PBR의 차이를 알려줘', 'ETF 괴리율은 왜 생기나요?', '지정가 주문과 시장가 주문의 차이는?', '분산투자의 목적은 무엇인가요?'];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function ragChatView(app) {
  const messages = [];

  function render() {
    app.innerHTML = `
      <section class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div>
            <h2 style="margin:0 0 5px;font-size:1.25rem;"><i class="fa-solid fa-comments" style="color:var(--primary);margin-right:8px;"></i>문서 검색 채팅</h2>
            <p style="margin:0;color:var(--text-muted);font-size:.87rem;">Qdrant 벡터 DB에서 학습 문서를 찾아 관련 내용을 보여 줍니다. 투자 판단은 원문 공시와 상품 설명서를 다시 확인하세요.</p>
          </div>
          <span id="rag-status" class="badge badge-gray">연결 확인 중</span>
        </div>
      </section>
      <section class="card" style="padding:0;overflow:hidden;">
        <div id="rag-messages" style="min-height:360px;max-height:58vh;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:14px;">
          ${messages.length ? messages.map((message) => message.html).join('') : `<div style="color:var(--text-muted);line-height:1.6;"><strong style="color:var(--text);">무엇이 궁금한가요?</strong><br>예: “ETF 괴리율은 왜 생기나요?”</div>`}
        </div>
        <div style="padding:14px 20px;border-top:1px solid var(--border);background:var(--surface-alt);">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">${EXAMPLES.map((example) => `<button class="btn btn-secondary btn-sm rag-example" data-query="${escapeHtml(example)}">${escapeHtml(example)}</button>`).join('')}</div>
          <form id="rag-form" style="display:flex;gap:8px;">
            <input id="rag-input" maxlength="500" placeholder="문서에서 찾을 질문을 입력하세요" aria-label="문서 검색 질문" style="flex:1;min-width:0;padding:11px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font:inherit;" />
            <button class="btn btn-primary" type="submit"><i class="fa-solid fa-paper-plane"></i> 질문</button>
          </form>
        </div>
      </section>`;

    const messagesEl = app.querySelector('#rag-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
    app.querySelectorAll('.rag-example').forEach((button) => button.addEventListener('click', () => ask(button.dataset.query)));
    app.querySelector('#rag-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const input = app.querySelector('#rag-input');
      ask(input.value.trim());
    });
    fetch('/api/rag/status').then((response) => response.json()).then((data) => {
      const status = app.querySelector('#rag-status');
      if (!status) return;
      if (data.qdrant?.available) {
        status.className = 'badge badge-green';
        status.textContent = `문서 ${Number(data.qdrant.points_count || 0).toLocaleString()}개 청크 연결됨`;
      } else status.textContent = '벡터 DB 연결 안 됨';
    }).catch(() => {
      const status = app.querySelector('#rag-status');
      if (status) status.textContent = '벡터 DB 상태 확인 실패';
    });
  }

  async function ask(query) {
    if (!query) return;
    messages.push({ html: `<div style="align-self:flex-end;max-width:82%;padding:10px 13px;border-radius:12px 12px 2px 12px;background:var(--primary);color:#fff;line-height:1.55;">${escapeHtml(query)}</div>` });
    messages.push({ html: '<div class="rag-loading" style="align-self:flex-start;color:var(--text-muted);">문서에서 찾는 중…</div>' });
    render();
    try {
      const response = await fetch('/api/rag/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, top_k: 5 }) });
      const data = await response.json();
      messages.pop();
      if (!response.ok) throw new Error(data.detail || '문서 검색에 실패했습니다.');
      const sources = (data.sources || []).map((source) => `<details style="margin-top:8px;border:1px solid var(--border);border-radius:7px;padding:8px 10px;background:var(--surface);"><summary style="cursor:pointer;font-weight:700;font-size:.82rem;">${escapeHtml(source.source_doc)} · 문서 조각 ${Number(source.chunk_index) + 1} <span style="color:var(--text-muted);font-weight:500;">유사도 ${Number(source.score).toFixed(3)}</span></summary><p style="white-space:pre-wrap;margin:8px 0 0;font-size:.84rem;line-height:1.6;">${escapeHtml(source.text)}</p></details>`).join('');
      messages.push({ html: `<div style="align-self:flex-start;max-width:92%;padding:12px 14px;border:1px solid var(--border);border-radius:12px 12px 12px 2px;background:var(--surface-alt);line-height:1.55;"><strong>${escapeHtml(data.answer)}</strong>${sources || '<p style="margin:8px 0 0;">관련 문서를 찾지 못했습니다. 다른 표현으로 질문해 보세요.</p>'}</div>` });
    } catch (error) {
      messages.pop();
      messages.push({ html: `<div style="align-self:flex-start;padding:10px 13px;border:1px solid var(--red);border-radius:10px;color:var(--red);">${escapeHtml(error.message)}</div>` });
    }
    render();
  }

  render();
}
