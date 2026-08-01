/**
 * pages/wikimedia.js — 저장소 학습 주제에 맞춘 위키백과(한국어) 검색 바로가기.
 * 정확한 문서 제목을 확신할 수 없는 경우가 많아, 존재를 보장할 수 없는 특정
 * /wiki/문서명 링크 대신 항상 유효한 위키백과 검색 결과 URL로 안내한다.
 */
import { RESOURCE_MODULES } from '../data/resourceTopics.js';

function wikipediaSearchUrl(query) {
  return `https://ko.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special:검색`;
}

function render() {
  const el = document.getElementById('page-content');
  if (!el) return;

  const modules = RESOURCE_MODULES.map((module) => `
    <section class="resource-module">
      <div class="resource-module-head">
        <div><span class="resource-module-kicker">${module.title}</span><h2>${module.subtitle}</h2></div>
        <p>${module.description}</p>
      </div>
      <div class="grid-3">${module.topics.map((topic) => `
        <div class="card resource-card">
          <h3>${topic.label}</h3>
          <p>어려운 말이 나오면 뜻만 먼저 찾아보세요. 외울 필요는 없어요.</p>
          <a class="resource-link" target="_blank" rel="noopener noreferrer" href="${wikipediaSearchUrl(topic.query)}">
            <i class="fa-brands fa-wikipedia-w"></i> 쉬운 뜻 찾아보기
          </a>
        </div>`).join('')}</div>
    </section>
  `).join('');

  el.innerHTML = `
    <div class="resource-hero">
      <h1><i class="fa-brands fa-wikipedia-w"></i> 위키백과 참고자료</h1>
      <p>
        주식 1부터 주식 5까지, 모르는 말을 쉬운 뜻으로 확인하는 참고 페이지예요.
        위키백과는 배경을 이해하는 데 쓰고, 회사 정보는 DART 같은 공식 자료로 다시 확인하세요.
      </p>
    </div>
    <div class="resource-safety-note"><i class="fa-solid fa-shield-heart"></i><span>검색 결과는 공부를 위한 참고예요. 한 문장만 보고 사고팔지 않아요.</span></div>
    ${modules}
  `;
}

render();
