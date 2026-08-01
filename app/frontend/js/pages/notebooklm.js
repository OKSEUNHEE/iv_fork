/**
 * NotebookLM은 로그인한 사용자의 노트북 안에서만 웹 소스 검색을 실행한다.
 * 이 페이지는 주식 학습에 맞춘 검색 프롬프트를 모아 복사·실행 흐름을 제공한다.
 */
const NOTEBOOKLM_URL = 'https://notebooklm.google/';
const NOTEBOOKLM_NEW_NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/new?hl=ko';

const STOCK_RESEARCH_TOPICS = [
  ['주식 1', '경제와 산업', '초등학생도 이해할 수 있게 경제의 회복·확장·느려짐·침체와 산업 경쟁을 설명하는 믿을 만한 교육 자료를 찾아줘. 어려운 용어에는 쉬운 뜻을 붙이고, 투자 권유는 제외해줘.'],
  ['주식 2', '회사 성적표', '초등학생도 이해할 수 있게 손익계산서, 재무상태표, 현금흐름표를 레모네이드 가게 비유로 설명하는 교육 자료를 찾아줘. 이익과 현금이 왜 다른지도 알려줘.'],
  ['주식 3', '차트와 시장', '초등학생도 이해할 수 있게 주가 차트, 추세, 이동평균, 거래량을 지도 비유로 설명하는 교육 자료를 찾아줘. 차트가 미래를 약속하지 않는다는 주의도 포함해줘.'],
  ['주식 4', '주식과 ETF', '초등학생도 이해할 수 있게 주식, 주주, 배당, 펀드, ETF의 차이를 설명하는 교육 자료를 찾아줘. 원금이 보장되지 않는다는 점을 꼭 알려줘.'],
  ['주식 5', '나누어 담기', '초등학생도 이해할 수 있게 분산투자, 자산배분, 리밸런싱을 달걀 바구니 비유로 설명하는 교육 자료를 찾아줘. 빚내서 투자하지 말아야 하는 이유도 포함해줘.'],
].map(([category, title, prompt]) => ({ category, title, prompt }));

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

function topicCard(topic, index) {
  return `
    <article class="card notebook-search-card">
      <div class="resource-category">${topic.category}</div>
      <h3>${index + 1}. ${topic.title}</h3>
      <p>${topic.prompt}</p>
      <div class="notebook-card-actions">
        <button class="ghost-btn" type="button" data-copy-topic="${index}">
          <i class="fa-regular fa-copy"></i> 검색어 복사
        </button>
        <a class="resource-cta" href="${NOTEBOOKLM_NEW_NOTEBOOK_URL}" target="_blank" rel="noopener noreferrer" data-open-topic="${index}">
          <i class="fa-solid fa-magnifying-glass"></i> 새 노트북에서 소스 검색
        </a>
      </div>
    </article>`;
}

function render() {
  const el = document.getElementById('page-content');
  if (!el) return;

  el.innerHTML = `
    <div class="resource-hero">
      <h1><i class="fa-solid fa-book-open"></i> NotebookLM 주식 리서치</h1>
      <p>
        주식 1부터 주식 5까지, 쉬운 설명 자료를 찾아 모을 수 있습니다.
      </p>
      <div class="notebook-quick-steps" aria-label="NotebookLM 검색 방법">
        <div><b>1</b><span>새 노트북</span></div>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        <div><b>2</b><span>소스 추가</span></div>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        <div><b>3</b><span>웹 검색</span></div>
      </div>
      <p class="notebook-quick-tip"><strong>카드의 “새 노트북에서 소스 검색”을 누르세요.</strong> 검색어가 자동으로 복사됩니다. 마지막에 <strong>웹 검색</strong> 또는 <strong>Deep Research</strong> 칸에 붙여넣으면 됩니다.</p>
      <div class="notebook-hero-actions">
        <button class="ghost-btn" id="copy-all-notebook-topics" type="button"><i class="fa-regular fa-copy"></i> 전체 검색어 복사</button>
        <a class="resource-cta" href="${NOTEBOOKLM_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> NotebookLM 열기</a>
      </div>
    </div>

    <div class="notebook-search-guide">
      <i class="fa-solid fa-circle-info"></i>
      <span>검색 결과의 출처와 날짜를 확인하고, 광고성·수익 보장 자료는 넣지 마세요. 수집한 자료는 로그인한 내 NotebookLM 노트북에 저장됩니다.</span>
    </div>

    <section class="notebook-topic-grid">
      ${STOCK_RESEARCH_TOPICS.map(topicCard).join('')}
    </section>
  `;

  const setCopied = (button, label) => {
    const original = button.innerHTML;
    button.innerHTML = `<i class="fa-solid fa-check"></i> ${label}`;
    setTimeout(() => { button.innerHTML = original; }, 1600);
  };

  el.querySelectorAll('[data-copy-topic]').forEach((button) => {
    button.addEventListener('click', async () => {
      const topic = STOCK_RESEARCH_TOPICS[Number(button.dataset.copyTopic)];
      if (await copyText(topic.prompt)) setCopied(button, '복사됨');
    });
  });
  el.querySelectorAll('[data-open-topic]').forEach((link) => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const topic = STOCK_RESEARCH_TOPICS[Number(link.dataset.openTopic)];
      // 팝업 차단을 피하기 위해 사용자 클릭 중에 먼저 새 탭을 연다.
      window.open(NOTEBOOKLM_NEW_NOTEBOOK_URL, '_blank', 'noopener');
      if (await copyText(topic.prompt)) {
        const original = link.innerHTML;
        link.innerHTML = '<i class="fa-solid fa-check"></i> 검색어 복사됨';
        setTimeout(() => { link.innerHTML = original; }, 1600);
      }
    });
  });
  el.querySelector('#copy-all-notebook-topics')?.addEventListener('click', async (event) => {
    const prompts = STOCK_RESEARCH_TOPICS.map((topic, index) => `${index + 1}. ${topic.title}\n${topic.prompt}`).join('\n\n');
    if (await copyText(prompts)) setCopied(event.currentTarget, '전체 검색어 복사됨');
  });
}

render();
