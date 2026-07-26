import { homeView }            from './views/home.js';
import { crossValidationView } from './views/crossValidation.js';
import { decisionBoundaryView } from './views/decisionBoundary.js';
import { randomForestView }    from './views/randomForest.js';
import { kmeansView }          from './views/kmeans.js';
import { svmView }             from './views/svm.js';
import { mlpView }             from './views/mlp.js';
import { linearRegressionView } from './views/linearRegression.js';
import { textClassifyView }    from './views/textClassify.js';
import { opencvView }          from './views/opencv.js';
import { cnnTimeseriesView }   from './views/cnnTimeseries.js';
import { lstmView }            from './views/lstm.js';
import { transformerView }     from './views/transformer.js';
import { backtestView }        from './views/backtest.js';
import { portfolioView }       from './views/portfolio.js';
import { pipelineView }        from './views/pipeline.js';
import { riskView }            from './views/risk.js';
import { huggingfaceView }     from './views/huggingface.js';
import { macroRealtimeView }    from './views/macroRealtime.js';
import { kospiExcludedView }   from './views/kospiExcluded.js';
import { macroSimulationView }  from './views/macroSimulation.js';
import { industryAnalysisView } from './views/industryAnalysis.js';
import { financialStatementView } from './views/financialStatement.js';
import { dartCompanySearchView } from './views/dartCompanySearch.js';
import { dartRegionSearchView }  from './views/dartRegionSearch.js';
import { groupNetworkView }      from './views/groupNetwork.js';
import { valuationView }        from './views/valuation.js';
import { technicalChartView }  from './views/technicalChart.js';
import { financialKnowledgeView } from './views/financialKnowledge.js';
import { investmentTreeView }   from './views/investmentTree.js';
import { quizHomeView, quizDayView } from './views/quiz.js';
import { companyFinancialView } from './views/companyFinancial.js';
import { learnView }            from './views/learn.js';
import { taxAccountingView }         from './views/taxAccounting.js';
import { dartFinancialAnalysisView } from './views/dartFinancialAnalysis.js';
import { ollamaView }               from './views/ollama.js';
import { api }                 from './api.js';

const app        = document.getElementById('app');
const breadcrumb = document.getElementById('breadcrumb');
const TOPBAR_MARKETS = ['^KS11', '^IXIC', 'KRW=X'];
const TOPBAR_REFRESH_MS = 30_000;

const learnDocIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', 'voca'];
const learnRoutes = Object.fromEntries(
  learnDocIds.map((docId) => [
    `learn-${docId}`,
    { label: `학습 · ${docId === 'voca' ? '핵심 용어집' : `Day ${docId}`}`, render: () => learnView(app, docId) },
  ]),
);

const quizDayRoutes = Object.fromEntries(
  Array.from({ length: 15 }, (_, i) => i + 1).map(d => [
    `quiz-day-${d}`,
    { label: `통합 모의고사 응시 Day ${d}`, render: () => quizDayView(app, d, navigate) },
  ])
);

const routes = {
  'home':              { label: '홈',                     render: () => homeView(app, navigate) },
  'cross-validation':  { label: 'Cross Validation',       render: () => crossValidationView(app) },
  'decision-boundary': { label: 'Decision Boundary',      render: () => decisionBoundaryView(app) },
  'random-forest':     { label: 'Random Forest',          render: () => randomForestView(app) },
  'kmeans':            { label: 'KMeans 클러스터링',       render: () => kmeansView(app) },
  'svm':               { label: 'SVM 분류기',             render: () => svmView(app) },
  'mlp':               { label: 'MLP 신경망',             render: () => mlpView(app) },
  'linear-regression': { label: '선형 회귀',              render: () => linearRegressionView(app) },
  'text-classify':     { label: '텍스트 분류 (TF-IDF)',   render: () => textClassifyView(app) },
  'opencv':            { label: 'OpenCV 애니메이션',      render: () => opencvView(app) },
  'cnn-timeseries':    { label: '1D CNN 시계열',          render: () => cnnTimeseriesView(app) },
  'lstm':              { label: 'LSTM 예측기',            render: () => lstmView(app) },
  'transformer':       { label: 'Transformer',            render: () => transformerView(app) },
  'backtest':          { label: '백테스트 엔진',          render: () => backtestView(app) },
  'portfolio':         { label: '포트폴리오 최적화',      render: () => portfolioView(app) },
  'pipeline':          { label: '퀀트 파이프라인',        render: () => pipelineView(app) },
  'risk':              { label: '리스크 분석 (VaR)',       render: () => riskView(app) },
  'huggingface':       { label: 'HuggingFace 이미지 생성', render: () => huggingfaceView(app) },
  'macro-realtime':    { label: '거시경제현황 1 (실시간)',    render: () => macroRealtimeView(app) },
  'macro-simulation':  { label: '거시경제현황 2 (시뮬레이션)', render: () => macroSimulationView(app) },
  'kospi-excluded':    { label: 'KOSPI 제외 지수 분석',       render: () => kospiExcludedView(app) },
  'industry-analysis': { label: '산업 경쟁력 분석',           render: () => industryAnalysisView(app) },
  'company-financial':   { label: '기업 파이낸셜 분석',          render: () => companyFinancialView(app) },
  'financial-statement': { label: '재무제표분석',              render: () => financialStatementView(app) },
  'dart-company-search': { label: 'DART 상장기업 검색',        render: () => dartCompanySearchView(app) },
  'dart-region-search':  { label: 'DART 지역·종사자수 조회',    render: () => dartRegionSearchView(app) },
  'group-network':       { label: '그룹사 계열사 네트워크',      render: () => groupNetworkView(app) },
  'valuation':           { label: '밸류에이션 실습',            render: () => valuationView(app) },
  'technical-chart':     { label: '기술적 분석 실습',            render: () => technicalChartView(app) },
  'financial-knowledge': { label: '금융상품·자산배분',           render: () => financialKnowledgeView(app) },
  'investment-tree':     { label: '투자 성향 분석',              render: () => investmentTreeView(app) },
  'tax-accounting':              { label: '세무·회계 시뮬레이션',         render: () => taxAccountingView(app) },
  'dart-financial-analysis':    { label: 'DART 재무 AI 분석',             render: () => dartFinancialAnalysisView(app) },
  'ollama':                     { label: 'Ollama AI 엔진 관리',           render: () => ollamaView(app) },
  'quiz-home':           { label: '퀴즈 · 통합 모의고사',        render: () => quizHomeView(app, navigate) },
  ...quizDayRoutes,
  ...learnRoutes,
};

let currentView = null;
const MOBILE_BREAKPOINT = 1024;

function updateQuizSidebarLock() {
  for (let d = 2; d <= 15; d++) {
    const el = document.querySelector(`.nav-item[data-view="quiz-day-${d}"]`);
    if (!el) continue;
    const prevDone = (() => {
      try { const p = JSON.parse(localStorage.getItem(`quiz_progress_day${d - 1}`)); return p?.finished === true; } catch { return false; }
    })();
    el.classList.toggle('locked', !prevDone);
  }
}

function navigate(view) {
  const route = routes[view] || routes['home'];
  currentView = view;

  // Views that create resources needing teardown (e.g. ApexCharts instances,
  // which keep an internal window-resize listener alive) register a cleanup
  // via window._viewCleanup. Run it before swapping in the next view's HTML,
  // otherwise the orphaned chart's resize handler fires against a detached
  // container and throws (NaN width/transform errors from apexcharts).
  if (typeof window._viewCleanup === 'function') {
    try { window._viewCleanup(); } catch (e) { /* noop */ }
  }
  window._viewCleanup = null;

  // Update active sidebar link
  document.querySelectorAll('.nav-item[data-view], .sidebar-link[data-view]').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });

  // Update breadcrumb
  if (breadcrumb) breadcrumb.textContent = route.label;

  // 현재 화면이 속한 사이드바 섹션만 펼치고 나머지는 닫는다 (사용 중인 메뉴만 열림)
  const _practiceViews = ['macro-realtime','macro-simulation','kospi-excluded','industry-analysis',
    'dart-region-search','group-network','company-financial','financial-statement','valuation',
    'portfolio','risk','technical-chart','backtest','pipeline','cross-validation','random-forest',
    'kmeans','svm','mlp','linear-regression','lstm','transformer','market-snapshot','financial-knowledge'];
  const _aiViews = ['dart-financial-analysis','dart-company-search','tax-accounting','ollama'];
  const activeSections = [];
  if (view?.startsWith('learn-')) activeSections.push('learn');
  if (view?.startsWith('quiz-')) activeSections.push('quiz');
  if (_practiceViews.includes(view)) activeSections.push('practice');
  if (_aiViews.includes(view)) activeSections.push('aitools');
  if (typeof window._setActiveNavSections === 'function') window._setActiveNavSections(activeSections);

  if (view?.startsWith('quiz-')) updateQuizSidebarLock();

  route.render();

  if (window.innerWidth <= MOBILE_BREAKPOINT && typeof closeSidebar === 'function') closeSidebar();
}

window.navigate = navigate;

// Wire up sidebar links
document.querySelectorAll('.nav-item[data-view], .sidebar-link[data-view]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(a.dataset.view);
  });
});

document.querySelectorAll('[data-view="home"].brand').forEach((button) => {
  button.addEventListener('click', () => navigate('home'));
});

// Health check
async function checkHealth() {
  const dot  = document.getElementById('health-dot');
  const text = document.getElementById('health-text');
  try {
    await api.health();
    if (dot)  dot.style.background  = '#22c55e';
    if (text) text.textContent = '백엔드 연결됨';
  } catch {
    if (dot)  dot.style.background  = '#ef4444';
    if (text) text.textContent = '백엔드 오프라인';
  }
}

function formatMarketValue(label, value) {
  const digits = label === 'USD/KRW' ? 2 : 0;
  return Number(value).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatTimestamp(ts) {
  if (!ts) return '--';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

async function refreshTopbarMarkets() {
  const stamp = document.getElementById('ticker-stamp');
  const nodes = [...document.querySelectorAll('.ticker-item[data-market-label]')];
  if (!nodes.length) return;

  try {
    const data = await api.marketSnapshot({ tickers: TOPBAR_MARKETS });
    const byLabel = Object.fromEntries((data.items || []).map((item) => [item.label, item]));

    nodes.forEach((node) => {
      const label = node.dataset.marketLabel;
      const valueEl = node.querySelector('b');
      const changeEl = node.querySelector('em');
      const item = byLabel[label];

      if (!item || item.status !== 'ok') {
        valueEl.textContent = '-';
        changeEl.textContent = '조회 실패';
        changeEl.className = '';
        return;
      }

      valueEl.textContent = formatMarketValue(label, item.value);
      const sign = item.change_pct >= 0 ? '+' : '';
      changeEl.textContent = `${sign}${item.change_pct.toFixed(2)}%`;
      changeEl.className = item.change_pct >= 0 ? 'up' : 'dn';
      node.title = `데이터 시각 ${formatTimestamp(item.latest_data_at)}`;
    });

    if (stamp) stamp.textContent = `조회 시각 ${formatTimestamp(data.fetched_at)} (15분 지연)`;
  } catch {
    nodes.forEach((node) => {
      const valueEl = node.querySelector('b');
      const changeEl = node.querySelector('em');
      valueEl.textContent = '-';
      changeEl.textContent = '조회 실패';
      changeEl.className = '';
    });
    if (stamp) stamp.textContent = '조회 시각 확인 불가';
  }
}

checkHealth();
setInterval(checkHealth, 30000);
refreshTopbarMarkets();
setInterval(refreshTopbarMarkets, TOPBAR_REFRESH_MS);

// Boot
// pages/*.html(외부 자료 정적 페이지)의 사이드바 링크가 index.html?view=xxx 형태로
// 돌아오므로, 쿼리스트링에 유효한 view가 있으면 그 화면으로 바로 진입한다.
const requestedView = new URLSearchParams(window.location.search).get('view');
navigate(requestedView && routes[requestedView] ? requestedView : 'home');
