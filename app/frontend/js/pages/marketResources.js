const sections = [
  {
    title: '국내 IPTV 경제·증권 채널',
    description: 'IPTV 채널 번호와 편성은 통신사·상품·지역에 따라 달라질 수 있어요. 채널명으로 검색하거나 각 방송사 편성표를 확인하세요.',
    items: [
      ['한국경제TV', '국내외 증시, 산업과 경제 이슈를 다루는 경제 전문 방송이에요.', 'https://www.wowtv.co.kr/'],
      ['매일경제TV', '매일경제 계열의 경제·증권 방송과 시황 정보를 볼 수 있어요.', 'https://www.mktv.co.kr/'],
      ['서울경제TV SEN', '국내 증시와 산업 이슈를 다루는 경제 방송이에요.', 'https://www.sentv.co.kr/'],
      ['이데일리TV', '금융·산업·정책 뉴스를 영상으로 확인할 수 있어요.', 'https://tv.edaily.co.kr/'],
      ['MTN 머니투데이방송', '국내외 시장과 기업 이슈를 다루는 경제 전문 채널이에요.', 'https://www.mtn.co.kr/'],
      ['토마토증권통', '국내 증시 시황과 투자 교육 콘텐츠를 제공해요.', 'https://www.tomato-tong.com/'],
      ['SBS Biz', '경제·산업 뉴스와 시황 프로그램을 제공해요.', 'https://biz.sbs.co.kr/'],
    ],
  },
  {
    title: '해외 시장 방송·뉴스',
    description: '미국장과 세계 경제를 볼 때 도움이 되는 영어 자료예요. 방송 시간과 무료 제공 범위는 서비스마다 달라질 수 있어요.',
    items: [
      ['Bloomberg Television', '세계 증시, 금리, 환율, 원자재와 기업 뉴스를 빠르게 확인할 수 있어요.', 'https://www.bloomberg.com/live'],
      ['CNBC', '미국 시장 개장·마감과 기업 실적 관련 보도를 참고할 수 있어요.', 'https://www.cnbc.com/markets/'],
      ['Reuters Markets', '통신사 기사로 세계 시장과 주요 경제 뉴스를 비교해 볼 수 있어요.', 'https://www.reuters.com/markets/'],
      ['Yahoo Finance', '미국 주가, 실적 일정, 기본 지표를 찾아보기 쉬운 사이트예요.', 'https://finance.yahoo.com/'],
    ],
  },
  {
    title: '주식 공부에 먼저 볼 공식·기초 사이트',
    description: '방송의 의견보다 회사가 직접 낸 공시와 거래소 자료를 먼저 확인하는 습관이 중요해요.',
    items: [
      ['DART 전자공시', '사업보고서, 실적, 유상증자, 감사 의견 등 회사의 원문 공시를 확인해요.', 'https://dart.fss.or.kr/'],
      ['KIND 한국거래소 공시', '상장회사 공시와 시장 정보를 확인할 수 있어요.', 'https://kind.krx.co.kr/'],
      ['한국거래소(KRX)', '시장 제도, 지수, 상장·공시 관련 공식 정보를 제공해요.', 'https://www.krx.co.kr/'],
      ['금융감독원(FSS)', '금융 소비자 정보와 제도 안내를 확인할 수 있어요.', 'https://www.fss.or.kr/'],
      ['네이버페이 증권', '국내 종목의 기본 시세·뉴스를 빠르게 훑어볼 수 있어요. 공시는 원문으로 다시 확인하세요.', 'https://finance.naver.com/'],
      ['TradingView', '국내외 차트를 비교하고 시간 단위를 바꾸어 볼 수 있어요. 차트는 매매 신호가 아니라 확인 도구예요.', 'https://www.tradingview.com/'],
    ],
  },
];

const card = ([name, description, url]) => `
  <article class="card resource-card">
    <div class="resource-category">참고 자료</div>
    <h3>${name}</h3>
    <p>${description}</p>
    <a class="resource-link" href="${url}" target="_blank" rel="noopener noreferrer">공식 사이트 열기 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
  </article>`;

document.getElementById('page-content').innerHTML = `
  <div class="resource-hero">
    <h1><i class="fa-solid fa-tower-broadcast" style="color:#2563eb"></i> 시장 방송·정보 사이트</h1>
    <p>시황을 이해하는 데 도움 되는 방송과 사이트예요. 추천·리딩 신호가 아니라, 여러 자료를 비교하는 출발점으로 사용하세요.</p>
  </div>
  <div class="resource-safety-note"><i class="fa-solid fa-circle-info"></i><span><strong>안전한 확인 순서:</strong> 방송·뉴스로 이슈를 파악한 뒤 → DART·KIND 공시 원문을 확인하고 → 회사의 실적·위험과 내 투자 계획을 따로 점검하세요. 방송 출연자의 의견만으로 주문하지 않아요.</span></div>
  ${sections.map((section) => `
    <section class="resource-module">
      <div class="resource-module-head"><div><div class="resource-module-kicker">시장 참고</div><h2>${section.title}</h2></div><p>${section.description}</p></div>
      <div class="grid-3">${section.items.map(card).join('')}</div>
    </section>`).join('')}`;
