/**
 * pages/notebooklm.js — Google NotebookLM에 이 저장소의 학습 자료를 업로드해
 * AI 요약/음성 개요/질의응답 노트북으로 활용하는 방법을 안내한다.
 * NotebookLM은 구글 로그인 기반 개인 노트북 서비스라 임베드가 불가능하므로
 * 새 탭 연결(CTA) + 업로드 대상 파일 안내 형태로 구성한다.
 */
import { LEARN_DOCS } from '../data/resourceTopics.js';

const NOTEBOOKLM_URL = 'https://notebooklm.google/';

function render() {
  const el = document.getElementById('page-content');
  if (!el) return;

  const docItems = LEARN_DOCS.map((d) => `
    <li>
      <span>${d.title}</span>
      <span class="doc-file">docs/${d.file}</span>
    </li>
  `).join('');

  el.innerHTML = `
    <div class="resource-hero">
      <h1><i class="fa-solid fa-book-open"></i> NotebookLM 학습노트</h1>
      <p>
        Google <a href="${NOTEBOOKLM_URL}" target="_blank" rel="noopener noreferrer">NotebookLM</a>은
        업로드한 문서만 근거로 요약·질의응답·음성 개요(Audio Overview)를 만들어주는 개인화 AI 노트북입니다.
        이 저장소의 <code>docs/*.md</code> 학습 자료를 소스로 올려두면, 시험 대비 질의응답이나
        Day별 핵심 요약을 빠르게 만들 수 있습니다. Google 계정 로그인이 필요하며,
        페이지 임베드가 지원되지 않아 새 탭에서 열립니다.
      </p>
      <a class="resource-cta" href="${NOTEBOOKLM_URL}" target="_blank" rel="noopener noreferrer">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> NotebookLM 열기
      </a>
    </div>

    <div class="grid-2">
      <section class="card">
        <h3 class="card-title"><i class="fa-solid fa-list-ol"></i>사용 방법</h3>
        <ol class="resource-steps">
          <li>위 버튼으로 NotebookLM을 열고 Google 계정으로 로그인합니다.</li>
          <li>"새 노트북 만들기"를 클릭합니다.</li>
          <li>"소스 추가"에서 아래 <code>docs/*.md</code> 파일을 다운로드해 업로드하거나,
              문서 내용을 복사해 붙여넣습니다.</li>
          <li>업로드가 끝나면 우측 채팅창에서 "재무제표 분석 핵심만 요약해줘"처럼 질문할 수 있습니다.</li>
          <li>"음성 개요" 기능으로 Day별 학습 내용을 팟캐스트 형태로 들을 수도 있습니다.</li>
        </ol>
      </section>

      <section class="card">
        <h3 class="card-title"><i class="fa-solid fa-folder-open"></i>추천 업로드 파일 (docs/)</h3>
        <ul class="resource-doc-list">${docItems}</ul>
      </section>
    </div>
  `;
}

render();
