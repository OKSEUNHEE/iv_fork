import { api } from '../api.js';

const RESOURCE_CONFIG = [
  { id: 'cpu', label: 'CPU', icon: 'fa-microchip', color: '#f97316', description: '짧은 구간의 평균 사용률' },
  { id: 'memory', label: '메모리', icon: 'fa-memory', color: '#8b5cf6', description: '사용 가능 메모리 기준' },
  { id: 'disk', label: 'Disk', icon: 'fa-hard-drive', color: '#0ea5e9', description: '루트 디스크(/) 기준' },
];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: index < 3 ? 0 : 1 })} ${units[index]}`;
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '--';
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', hour12: false,
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function chartOptions(config) {
  return {
    chart: { type: 'donut', height: 255, animations: { enabled: false }, fontFamily: 'Pretendard, -apple-system, "Malgun Gothic", sans-serif' },
    series: [0, 100],
    labels: ['사용', '여유'],
    colors: [config.color, '#e2e8f0'],
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { y: { formatter: (value) => `${Number(value).toFixed(1)}%` } },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: true, offsetY: -8, color: '#64748b', fontSize: '12px' },
            value: { show: true, offsetY: 6, color: '#0f172a', fontSize: '25px', fontWeight: 800, formatter: (value) => `${Number(value).toFixed(1)}%` },
            total: { show: true, label: config.label, color: '#64748b', formatter: () => '' },
          },
        },
      },
    },
  };
}

export function serverResourcesView(container) {
  container.innerHTML = `
    <section class="server-resource-page">
      <header class="server-resource-head">
        <div>
          <h1><i class="fa-solid fa-server"></i> 서버 리소스</h1>
          <p>웹앱 서버의 CPU, 메모리, 루트 디스크 사용량을 확인합니다.</p>
        </div>
        <div class="server-resource-actions">
          <span id="server-resource-stamp">조회 전</span>
          <button type="button" id="server-resource-refresh"><i class="fa-solid fa-rotate-right"></i> 새로고침</button>
        </div>
      </header>
      <div class="server-resource-grid">
        ${RESOURCE_CONFIG.map((config) => `
          <article class="server-resource-card">
            <header><span class="server-resource-icon" style="--resource-color:${config.color}"><i class="fa-solid ${config.icon}"></i></span><div><h2>${config.label}</h2><p>${config.description}</p></div></header>
            <div class="server-resource-chart" id="server-resource-chart-${config.id}"></div>
            <p class="server-resource-detail" id="server-resource-detail-${config.id}">사용량을 불러오는 중…</p>
          </article>`).join('')}
      </div>
      <p class="server-resource-note">CPU는 약 0.1초 동안 측정한 평균 사용률입니다. 컨테이너 환경에서는 호스트 또는 컨테이너 설정에 따라 관측 범위가 달라질 수 있습니다.</p>
    </section>`;

  const charts = new Map();
  let disposed = false;

  RESOURCE_CONFIG.forEach((config) => {
    const element = container.querySelector(`#server-resource-chart-${config.id}`);
    const chart = new ApexCharts(element, chartOptions(config));
    charts.set(config.id, chart);
    chart.render();
  });

  async function refresh() {
    const button = container.querySelector('#server-resource-refresh');
    const stamp = container.querySelector('#server-resource-stamp');
    button.disabled = true;
    button.classList.add('is-loading');
    try {
      const data = await api.systemResources();
      if (disposed) return;
      RESOURCE_CONFIG.forEach((config) => {
        const resource = data[config.id] || {};
        const percent = Math.max(0, Math.min(Number(resource.used_percent) || 0, 100));
        charts.get(config.id)?.updateSeries([percent, 100 - percent]);
        const detail = container.querySelector(`#server-resource-detail-${config.id}`);
        if (config.id === 'cpu') {
          detail.textContent = `사용률 ${percent.toFixed(1)}% · 서버 논리 CPU ${resource.logical_cores || '--'}개`;
        } else {
          detail.textContent = `${formatBytes(resource.used_bytes)} 사용 / ${formatBytes(resource.total_bytes)} 전체`;
        }
      });
      stamp.textContent = `조회 ${formatTimestamp(data.fetched_at)}`;
    } catch (error) {
      if (!disposed) stamp.textContent = `조회 실패: ${error.message}`;
    } finally {
      if (!disposed) {
        button.disabled = false;
        button.classList.remove('is-loading');
      }
    }
  }

  container.querySelector('#server-resource-refresh').addEventListener('click', refresh);
  refresh();
  const timer = window.setInterval(refresh, 15_000);
  window._viewCleanup = () => {
    disposed = true;
    window.clearInterval(timer);
    charts.forEach((chart) => { try { chart.destroy(); } catch {} });
  };
}
