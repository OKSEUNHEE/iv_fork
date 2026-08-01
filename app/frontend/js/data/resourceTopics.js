/** 주식 1~5 학습 순서에 맞춘 외부 참고자료 공통 목록. */
export const RESOURCE_MODULES = [
  {
    id: 1,
    title: '주식 1',
    subtitle: '경제와 산업을 살펴봐요',
    description: '경제의 큰 흐름과 회사가 뛰는 산업을 함께 알아봐요.',
    topics: [
      { label: '경제의 계절', query: '경기 순환 회복 확장 침체 쉬운 설명' },
      { label: '산업과 경쟁', query: '산업 분석 경쟁 쉬운 설명' },
      { label: '회사 공시', query: 'DART 전자공시 쉬운 설명' },
    ],
  },
  {
    id: 2,
    title: '주식 2',
    subtitle: '회사 성적표를 읽어요',
    description: '회사가 번 돈, 가진 것, 실제 현금을 차례로 살펴봐요.',
    topics: [
      { label: '손익계산서', query: '손익계산서 쉬운 설명' },
      { label: '자산과 빚', query: '재무상태표 자산 부채 쉬운 설명' },
      { label: '회사값', query: 'PER PBR 기업가치 쉬운 설명' },
    ],
  },
  {
    id: 3,
    title: '주식 3',
    subtitle: '차트와 시장을 읽어요',
    description: '가격 그림을 지도처럼 보고, 여러 투자자의 움직임을 이해해요.',
    topics: [
      { label: '주가 추세', query: '주식 차트 추세 이동평균 쉬운 설명' },
      { label: '거래량', query: '주식 거래량 쉬운 설명' },
      { label: '시장 참여자', query: '개인 기관 외국인 투자자 쉬운 설명' },
    ],
  },
  {
    id: 4,
    title: '주식 4',
    subtitle: '주식과 ETF를 알아봐요',
    description: '주식, 배당, 펀드, ETF의 차이와 주의할 점을 배워요.',
    topics: [
      { label: '주식과 주주', query: '주식 주주 보통주 우선주 쉬운 설명' },
      { label: '배당', query: '주식 배당 쉬운 설명' },
      { label: 'ETF', query: 'ETF 펀드 차이 쉬운 설명' },
    ],
  },
  {
    id: 5,
    title: '주식 5',
    subtitle: '나누어 담고 지켜요',
    description: '한 곳에 몰아넣지 않고, 내 상황에 맞게 나누어 담는 법을 생각해요.',
    topics: [
      { label: '분산', query: '분산투자 쉬운 설명' },
      { label: '자산배분', query: '주식 채권 현금 자산배분 쉬운 설명' },
      { label: '리밸런싱', query: '리밸런싱 쉬운 설명' },
    ],
  },
];

export const RESOURCE_TOPICS = RESOURCE_MODULES.flatMap((module) =>
  module.topics.map((topic) => ({ ...topic, category: module.title })),
);

/** docs/*.md에서 자동 생성한 학습 자료 목록 (NotebookLM 안내와 학습 메뉴가 공유). */
export { LEARN_DOCS } from './learnDocs.js';
