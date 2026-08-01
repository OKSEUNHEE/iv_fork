export function homeView(container, navigate) {
  container.innerHTML = `
    <div class="home-dashboard" id="home-dashboard">
      <section class="home-quick-links" aria-label="분석 바로가기">
        <button data-view="macro-realtime"><i class="fa-solid fa-satellite-dish"></i> 거시경제현황</button>
        <button data-view="industry-analysis"><i class="fa-solid fa-industry"></i> 산업 경쟁력 분석</button>
        <button data-view="dart-financial-analysis"><i class="fa-solid fa-file-invoice-dollar"></i> DART 재무 AI 분석</button>
        <button data-view="technical-chart"><i class="fa-solid fa-chart-candlestick"></i> 기술적 분석</button>
      </section>
    </div>`;

  container.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.view));
  });
}
