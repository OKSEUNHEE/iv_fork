const statementCards = [
  {
    title: '손익계산서 (Income Statement)',
    icon: 'fa-solid fa-chart-column',
    accentColor: '#2563eb',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/income-statement.png', alt: '손익계산서 구조 — 매출·영업이익·순이익 흐름' },
    ],
    summary: '일정 기간 동안 매출이 비용을 거쳐 영업이익과 순이익으로 바뀌는 과정을 보여줍니다.',
    checks: [
      ['매출액', '전년 또는 전분기 대비 성장률을 먼저 확인합니다.'],
      ['매출원가율', '매출이 늘어도 원가율이 같이 뛰면 수익성 개선이 제한됩니다.'],
      ['판관비', '고정비 성격이 강해 매출 증가 시 영업 레버리지 효과를 만듭니다.'],
      ['영업이익', '본업의 경쟁력과 비용 통제력을 보는 핵심 항목입니다.'],
      ['당기순이익', '금융손익, 법인세, 일회성 손익까지 반영된 최종 성과입니다.'],
    ],
    analysis: [
      '매출액 → 매출원가 → 판관비 → 영업이익 → 당기순이익 순서로 흐름을 따라 읽습니다.',
      '매출 증가와 동시에 원가·판관비가 안정적이면 영업이익률 개선 가능성이 큽니다.',
      '영업이익은 흑자인데 순이익이 약하면 금융비용, 법인세, 일회성 손실을 추가 확인해야 합니다.',
    ],
  },
  {
    title: '대차대조표 / 재무상태표 (Balance Sheet)',
    icon: 'fa-solid fa-scale-balanced',
    accentColor: '#7c3aed',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/balance-sheet.png',   alt: '재무상태표 자산·부채·자본 구조' },
      { src: 'images/balance-sheet-1.jpg', alt: '재무상태표 예시 1 — 유동·비유동 분류' },
      { src: 'images/balance-sheet-2.png', alt: '재무상태표 예시 2 — 부채비율 분석' },
      { src: 'images/balance-sheet-3.png', alt: '재무상태표 예시 3 — 자본 구성' },
    ],
    summary: '특정 시점의 자산, 부채, 자본 구조를 보여주며 회사의 재무 안정성을 판단합니다.',
    checks: [
      ['자산', '유동자산과 비유동자산 구성을 나눠 현금화 가능성을 봅니다.'],
      ['부채', '유동부채 비중이 높으면 단기 상환 압박이 커질 수 있습니다.'],
      ['자본', '자본총계가 두껍고 이익잉여금이 누적되면 완충력이 큽니다.'],
      ['자본잉여금', '주식발행초과금처럼 주주와의 자본거래에서 생긴 자본입니다. 영업이익이나 현금 잔고와 혼동하지 않습니다.'],
      ['유동비율', '유동자산 / 유동부채로 단기 지급능력을 봅니다.'],
      ['부채비율', '부채총계 / 자본총계로 레버리지 부담을 봅니다.'],
    ],
    analysis: [
      '자산 = 부채 + 자본 등식을 기준으로 좌(자산)·우(부채+자본) 구조를 한눈에 확인합니다.',
      '유동자산이 유동부채보다 충분히 크면 단기 유동성 위험이 낮아집니다.',
      '자본잉여금 증가는 유상증자·주식보상·자기주식 거래 같은 자본거래의 결과일 수 있습니다. 자금 사용처와 지분 희석을 공시에서 확인하세요.',
      '부채가 빠르게 늘면서 자본 증가가 따라오지 못하면 이자비용과 증자 가능성을 점검해야 합니다.',
    ],
  },
  {
    title: '현금흐름표 (Cash Flow Statement)',
    icon: 'fa-solid fa-money-bill-transfer',
    accentColor: '#059669',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/cash-flow.png',   alt: '현금흐름표 영업·투자·재무 구분' },
      { src: 'images/cash-flow-1.png', alt: '현금흐름표 예시 1 — 영업활동 세부' },
      { src: 'images/cash-flow-2.png', alt: '현금흐름표 예시 2 — 투자·재무활동' },
      { src: 'images/cash-flow-3.png', alt: '현금흐름표 예시 3 — FCF 산출' },
    ],
    summary: '회계상 이익이 실제 현금으로 전환되는지 영업·투자·재무 현금흐름으로 확인합니다.',
    checks: [
      ['영업활동 현금흐름', '본업에서 현금이 들어오는지 보는 가장 중요한 항목입니다.'],
      ['투자활동 현금흐름', '설비투자, 금융상품, 자산 매각 여부를 확인합니다.'],
      ['재무활동 현금흐름', '차입, 상환, 배당, 증자 등 자금조달 흐름을 봅니다.'],
      ['순이익 대비 CFO', '순이익보다 영업현금흐름이 계속 약하면 이익의 질을 의심합니다.'],
      ['FCF', '영업현금흐름에서 설비투자를 뺀 잉여현금 창출력을 봅니다.'],
    ],
    analysis: [
      '영업(+) / 투자(-) / 재무(-) 패턴이면 본업으로 벌어 투자하고 빚 갚는 건강한 기업입니다.',
      '좋은 기업은 대체로 영업현금흐름이 플러스이고, 성장기에는 투자현금흐름이 마이너스일 수 있습니다.',
      '순이익은 흑자인데 영업현금흐름이 반복적으로 마이너스라면 매출채권, 재고, 회계상 이익의 질을 확인해야 합니다.',
    ],
  },
  {
    title: '자산 구성: 유동·유형·무형',
    icon: 'fa-solid fa-cubes-stacked',
    accentColor: '#0f766e',
    sourceLabel: null,
    sourceUrl: null,
    images: [],
    summary: '자산을 현금화 속도와 사용 방식으로 나누면 단기 안전성, 설비 투자, 기술·권리의 가치를 연결해 볼 수 있습니다.',
    checks: [
      ['유동자산', '현금·매출채권·재고처럼 통상 1년 또는 정상 영업주기 안에 현금화·판매·사용될 자산입니다. 유동부채와 비교합니다.'],
      ['당좌자산', '현금·현금성자산·단기금융상품·매출채권 등 재고 판매를 기다리지 않고 비교적 빨리 쓸 수 있는 유동자산입니다. 공시별 포함 계정은 확인합니다.'],
      ['재고자산', '제조업은 원재료 → 재공품 → 제품(완제품), 유통업은 사 와서 파는 상품으로 흐릅니다. 어느 단계의 재고가 늘었는지 봅니다.'],
      ['유형자산', '공장·건물·기계·서버처럼 형태가 있는 장기 사용 자산입니다. Capex, 감가상각, 가동률을 함께 봅니다.'],
      ['무형자산', '특허·상표·소프트웨어·라이선스처럼 형태 없는 식별 가능한 권리·자산입니다. 상각과 손상 위험을 확인합니다.'],
      ['자산의 질', '재고·매출채권은 회수·판매 가능성, 설비는 수익성, 무형자산은 실제 경쟁우위와 연결되는지를 봅니다.'],
    ],
    analysis: [
      '유동자산이 늘어도 매출채권 회수가 늦거나 재고가 쌓인 결과라면 현금 여력은 약할 수 있습니다.',
      '예를 들어 레몬·병은 원재료, 제조 중인 음료는 재공품, 포장 완료 후 출고를 기다리는 음료는 제품(완제품)입니다. 편의점이 사 와 파는 음료는 상품입니다.',
      '현금및현금성자산과 단기금융상품은 만기·가격 변동·사용 제한이 다를 수 있습니다. 합계만 보지 말고 주석에서 실제 사용 가능성을 확인하세요.',
      '유형자산 증가는 성장 투자일 수 있지만, 매출·가동률이 따라오지 않으면 유휴 설비와 감가상각 부담으로 이어질 수 있습니다.',
      '내부에서 만든 브랜드·인력·아이디어는 무형자산으로 모두 잡히지 않습니다. 장부 금액만으로 기술력이나 브랜드 가치를 단정하지 마세요.',
    ],
  },
  {
    title: '자본 구성: 자본금·자본잉여금·이익잉여금',
    icon: 'fa-solid fa-building-columns',
    accentColor: '#7c3aed',
    sourceLabel: null,
    sourceUrl: null,
    images: [],
    summary: '자본은 모두 같은 이유로 생기지 않습니다. 주주가 낸 자금과 회사가 벌어 쌓은 이익을 구분해야 합니다.',
    checks: [
      ['자본금', '주식 발행 때 액면가 기준으로 기록되는 자본입니다. 통장 잔액·시가총액과 같지 않습니다.'],
      ['자본잉여금', '주식발행초과금 등 주주와의 자본거래에서 생깁니다. 본업 이익이나 바로 쓸 수 있는 현금을 뜻하지 않습니다.'],
      ['이익잉여금', '사업으로 번 이익에서 배당 등을 한 뒤 누적된 금액입니다. 장기 수익성과 배당 여력을 볼 때 함께 확인합니다.'],
      ['기타 자본 항목', '자기주식·기타포괄손익누계액 등은 발생 원인이 달라 자본잉여금과 분리해 읽습니다.'],
    ],
    analysis: [
      '액면가 5,000원 주식을 10,000원에 발행하면, 단순화해 액면가 부분은 자본금, 초과분은 자본잉여금이 될 수 있습니다.',
      '자본잉여금이 늘면 유상증자·전환 또는 옵션 행사 등 원인을 먼저 확인하세요. 자금 사용처와 기존 주주의 지분 희석이 중요합니다.',
      '자본잉여금은 현금과 같은 뜻이 아닙니다. 현금흐름표, 자본변동표, 자본 주석을 함께 봐야 실제 자금 흐름을 판단할 수 있습니다.',
    ],
  },
  {
    title: '투자자산: 금융상품·지분 투자',
    icon: 'fa-solid fa-chart-pie',
    accentColor: '#b45309',
    sourceLabel: null,
    sourceUrl: null,
    images: [],
    summary: '본업에 바로 쓰지 않는 여유자금과 전략적 지분 투자는 보유 목적, 회수 시점, 가치 변동 위험을 나눠 읽어야 합니다.',
    checks: [
      ['단기금융상품', '정기예금·단기채 등 가까운 시일에 쓸 자금을 운용한 항목입니다. 만기·중도해지·사용 제한을 확인합니다.'],
      ['채무·지분상품', '채권은 이자와 신용위험, 주식은 배당과 가격 변동 위험을 봅니다. 평가손익의 표시 방식은 분류에 따라 다를 수 있습니다.'],
      ['관계기업·공동기업', '중요한 영향력이나 공동지배가 있으면 지분법이 적용될 수 있습니다. 피투자회사 실적 몫이 손익에 반영될 수 있습니다.'],
      ['투자부동산', '임대료·시세 차익 목적의 토지·건물입니다. 본업 생산에 쓰는 유형자산과 목적이 다릅니다.'],
      ['현금흐름 연결', '취득·처분은 보통 투자활동 현금흐름에서 확인합니다. 평가이익과 실제 현금 유입을 구분합니다.'],
    ],
    analysis: [
      '투자자산이 많아도 단기부채, 설비투자, 운전자본에 필요한 돈을 빼고 실제로 운용 가능한 여유자금인지 먼저 확인합니다.',
      '큰 평가이익은 시장가격·금리 변화로 생긴 일시적 결과일 수 있습니다. 본업 수익성과 분리해 보고 손상·신용위험도 확인하세요.',
      '관계사 지분 투자에는 대여·지급보증·거래 의존이 함께 있을 수 있으므로 지분율과 주석을 같이 읽습니다.',
    ],
  },
  {
    title: '밸류에이션 멀티플 (PER · PBR · EV/EBITDA)',
    icon: 'fa-solid fa-calculator',
    accentColor: '#2563eb',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/multiples.png', alt: '밸류에이션 멀티플 — PER·PBR·EV/EBITDA·PSR 장표' },
    ],
    summary: '기업의 현재 주가가 이익·자산·매출 대비 몇 배에 거래되는지를 나타내는 상대가치 지표입니다.',
    checks: [
      ['PER (주가수익비율)', '주가 / EPS — 동종 업종 평균·과거 밴드와 비교해 고저평가를 판단합니다.'],
      ['PBR (주가순자산비율)', '주가 / BPS — 1배 이하면 장부가보다 싸게 거래. 금융·제조업에서 중요합니다.'],
      ['EV/EBITDA', 'EV / EBITDA — 부채 포함 종합 기업가치 비교. M&A 검토·글로벌 비교에 적합합니다.'],
      ['PSR (주가매출비율)', '주가 / SPS — 이익이 없는 성장주 평가에 활용합니다.'],
      ['업종별 기준', 'IT 성장주: PER 25~40x / 제조·가치주: PER 8~15x / 은행: PBR 0.3~0.7x'],
    ],
    analysis: [
      '멀티플은 반드시 동종 업종 평균, 역사적 밴드와 비교해야 의미가 있습니다.',
      'PER이 낮다고 무조건 저평가가 아닙니다. 이익 감소 가능성을 먼저 확인하세요.',
      'EV/EBITDA는 부채 수준이 다른 기업 간 비교에 PER보다 공정한 잣대를 제공합니다.',
    ],
  },
  {
    title: '유동성 지표 (Liquidity)',
    icon: 'fa-solid fa-droplet',
    accentColor: '#10b981',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/liquidity.png', alt: '유동성 지표 — 유동비율·당좌비율·현금비율·CCC 장표' },
    ],
    summary: '기업이 단기 채무를 갚을 수 있는 능력을 수치로 보여줍니다. 유동성 위기는 흑자부도의 원인이 됩니다.',
    checks: [
      ['유동비율', '유동자산 / 유동부채 × 100 — 150% 이상이면 양호합니다.'],
      ['당좌비율', '당좌자산 / 유동부채 × 100 — 실무에서는 유동자산−재고자산으로 간편 계산하기도 하나, 세부 계정을 확인해야 합니다.'],
      ['현금비율', '현금및현금성자산 / 유동부채 × 100 — 단기금융상품의 만기·사용 제한은 별도로 확인하는 보수적 지급능력 지표입니다.'],
      ['운전자본', '유동자산 − 유동부채 — 양수면 안정, 음수면 유동성 위험 신호입니다.'],
      ['CCC (현금전환주기)', '재고보유+매출채권회수−매입채무지급 기간 — 짧을수록 현금회전이 빠릅니다.'],
    ],
    analysis: [
      '유동비율이 100% 미만이면 1년 안에 갚아야 할 빚을 자산으로 충당하지 못할 수 있습니다.',
      '매출채권·재고자산이 급증하면 유동비율이 높아 보여도 실질 현금창출력은 낮을 수 있습니다.',
      '흑자기업도 현금이 부족하면 부도 가능 — 유동성 분석은 현금흐름표와 반드시 함께 봐야 합니다.',
    ],
  },
  {
    title: '기준금리 (Base Rate)',
    icon: 'fa-solid fa-landmark',
    accentColor: '#7c3aed',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/base-rate.png', alt: '기준금리 — 한국은행 통화정책·DCF 할인율·주가 영향 장표' },
    ],
    summary: '한국은행이 결정하는 기준금리는 대출 금리·채권 수익률·DCF 할인율을 통해 기업가치 전반에 영향을 줍니다.',
    checks: [
      ['기준금리 결정', '금융통화위원회가 연 8회 결정 — 한국은행 ECOS에서 실시간 확인 가능합니다.'],
      ['금리 인상 영향', 'WACC ↑ → DCF 적정주가 ↓ / 대출 이자 ↑ → 소비·투자 위축 / 채권 가격 ↓'],
      ['금리 인하 영향', 'WACC ↓ → DCF 적정주가 ↑ / 소비·투자 촉진 / 채권 가격 ↑ / 원화 약세 경향'],
      ['WACC와 연결', 'WACC = Rf + β×(Rm−Rf) — 기준금리↑ → 무위험수익률(Rf)↑ → 할인율 ↑'],
      ['투자 전략', '인상기: 가치주·단기채 선호 / 인하기: 성장주·장기채 유리'],
    ],
    analysis: [
      '기준금리 인상이 시작되면 성장주(높은 미래 이익 비중)가 상대적으로 더 크게 하락합니다.',
      'DCF 모델에서 할인율(WACC)이 1%p 오르면 적정주가가 평균 10~20% 하락할 수 있습니다.',
      '미국 FOMC 결정은 한국 시장금리에 선행하므로 연준 성명과 점도표도 함께 확인하세요.',
    ],
  },
  {
    title: '시장금리 (Market Rate)',
    icon: 'fa-solid fa-chart-line',
    accentColor: '#f59e0b',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/market-rate.png', alt: '시장금리 — 국고채·회사채·CD금리·장단기 금리차 장표' },
    ],
    summary: '국고채·회사채·CD금리 등 시장에서 결정되는 금리는 기준금리보다 빠르게 경기 기대를 반영합니다.',
    checks: [
      ['국고채 수익률', '무위험수익률(Rf) 기준 — 3년·10년물 추세로 시장의 경기 전망을 읽습니다.'],
      ['회사채 신용스프레드', '신용등급별 회사채 금리 − 국고채 금리 — 확대 시 경기 우려 신호입니다.'],
      ['CD금리(91일물)', '국내 변동금리 기준 — 주택담보대출·기업 단기차입 금리에 직접 연동됩니다.'],
      ['장단기 금리차', '10년물 − 2년물 국고채 수익률 — 역전(음수)이면 경기침체 선행 신호입니다.'],
      ['데이터 원천', '한국은행 ECOS / 금융투자협회 채권정보센터 / KRX 채권시장 '],
    ],
    analysis: [
      '장단기 금리차 역전은 과거 경기침체를 6~18개월 앞서 나타난 선행지표입니다.',
      '회사채 스프레드 급등은 신용 경색의 신호 — 고배당주·안전자산 비중 확대를 검토하세요.',
      '시장금리는 기준금리 결정 전에 선반영되므로, 금리 방향성은 국고채 선물·CDS로도 파악합니다.',
    ],
  },
  {
    title: '투자자 심리 (Investor Sentiment)',
    icon: 'fa-solid fa-face-grin-stars',
    accentColor: '#ef4444',
    sourceLabel: null,
    sourceUrl: null,
    images: [
      { src: 'images/sentiment.png', alt: '투자자 심리 — 공포탐욕지수·VIX·수급·버블 신호 장표' },
    ],
    summary: '기업 가치와 무관하게 시장 참여자의 심리와 수급이 단기 주가를 결정합니다. 역발상의 출발점입니다.',
    checks: [
      ['공포탐욕지수', 'CNN Fear & Greed Index 0~100 — 20 이하 극공포, 80 이상 극탐욕입니다.'],
      ['VIX (공포지수)', 'S&P500 30일 변동성 기대치 — 20 초과 시 불안, 30 초과 시 패닉 국면입니다.'],
      ['투자자 수급', '외국인·기타외국인·기관·개인 순매수 추이 — 외국인계는 외국인과 기타외국인의 합계이며, 지속 매수도 매수 이유와 실적을 함께 확인합니다.'],
      ['신용잔고·공매도', '급증하면 레버리지·약세 심리 과열 — 반등 시 숏커버링 폭발 가능합니다.'],
      ['버블 경고 신호', 'PER 역대 상위권·신용잔고 급증·IPO 과열·주변인 모두 주식 얘기'],
    ],
    analysis: [
      '극공포 구간에서 좋은 기업을 분할 매수하는 전략이 장기적으로 유효한 경우가 많습니다.',
      '극탐욕 구간에서 주식 비중을 줄이고 현금·채권 비중을 높이는 역발상 전략을 검토하세요.',
      '심리 지표는 단기 타이밍 도구 — 펀더멘탈 분석 없이 심리만으로 투자하면 위험합니다.',
    ],
  },
];

export function financialStatementView(container) {
  container.innerHTML = `
    <div style="margin-bottom:28px;">
      <h1 style="font-size:1.45rem; font-weight:760; color:#131722; margin-bottom:8px;">
        <i class="fa-solid fa-file-invoice-dollar"></i> 기업 펀더멘탈 분석
      </h1>
      <p style="font-size:0.88rem; color:#6b7280; line-height:1.65;">
        재무상태(대차대조표) · 손익계산(손익계산서) · 현금흐름 · 밸류에이션 멀티플 · 유동성 · 기준금리 · 시장금리 · 투자자 심리를 한 화면에서 연결해 읽습니다.
      </p>
    </div>

    <div class="statement-grid">
      ${statementCards.map(card => `
        <article class="statement-card" style="border-top: 3px solid ${card.accentColor};">
          <div class="statement-head">
            <div class="statement-icon" style="color:${card.accentColor};"><i class="${card.icon}"></i></div>
            <div>
              <h2 style="color:${card.accentColor};">${card.title}</h2>
              <p>${card.summary}</p>
            </div>
          </div>

          ${card.images.length ? `<div class="stmt-gallery">
            <div class="stmt-gallery-main">
              <img src="${card.images[0].src}" alt="${card.images[0].alt}"
                   class="stmt-img-main" loading="lazy"
                   onclick="this.closest('.stmt-gallery').querySelector('.stmt-lightbox').classList.add('open');this.closest('.stmt-gallery').querySelector('.stmt-lightbox img').src=this.src" />
            </div>
            ${card.images.length > 1 ? `
            <div class="stmt-gallery-thumbs">
              ${card.images.map((img, i) => `
                <img src="${img.src}" alt="${img.alt}" loading="lazy"
                     class="stmt-thumb${i === 0 ? ' active' : ''}"
                     onclick="
                       this.closest('.stmt-gallery').querySelector('.stmt-img-main').src=this.src;
                       this.closest('.stmt-gallery-thumbs').querySelectorAll('.stmt-thumb').forEach(t=>t.classList.remove('active'));
                       this.classList.add('active');
                     " />
              `).join('')}
            </div>` : ''}
            <div class="stmt-lightbox" onclick="this.classList.remove('open')">
              <img src="" alt="확대 이미지" onclick="event.stopPropagation()" />
              <button onclick="this.closest('.stmt-lightbox').classList.remove('open')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            ${card.sourceUrl ? `
            <div class="stmt-img-credit">
              <a href="${card.sourceUrl}" target="_new" rel="noopener noreferrer">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> ${card.sourceLabel}
              </a>
            </div>` : ''}
          </div>` : ''}

          <div class="statement-table">
            ${card.checks.map(([label, desc]) => `
              <div class="statement-row">
                <strong style="color:${card.accentColor};">${label}</strong>
                <span>${desc}</span>
              </div>`).join('')}
          </div>
          <div class="statement-analysis">
            <div class="statement-analysis-title">분석 포인트</div>
            ${card.analysis.map(text => `<p>${text}</p>`).join('')}
          </div>
        </article>
      `).join('')}
    </div>

    <section class="statement-flow">
      <h2>기업 펀더멘탈 분석 순서</h2>
      <div class="statement-flow-grid">
        <div><b>1. 손익계산서</b><span>매출 성장과 영업이익률로 본업의 힘을 확인합니다.</span></div>
        <div><b>2. 재무상태표</b><span>그 성장이 부채 부담을 키우며 만들어진 것인지 확인합니다.</span></div>
        <div><b>3. 현금흐름표</b><span>이익이 실제 현금으로 들어오고 있는지 최종 검증합니다.</span></div>
        <div><b>4. 유동성 지표</b><span>단기 지급능력과 흑자부도 위험을 점검합니다.</span></div>
        <div><b>5. 멀티플</b><span>동종 업종 대비 고저평가 여부를 PER·PBR·EV/EBITDA로 판단합니다.</span></div>
        <div><b>6. 금리·심리</b><span>기준금리·시장금리·투자자 심리로 매크로 환경과 진입 타이밍을 봅니다.</span></div>
      </div>
    </section>
  `;
}
