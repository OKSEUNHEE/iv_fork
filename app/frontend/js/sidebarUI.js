/**
 * sidebarUI.js — 사이드바 열기/닫기, 섹션 토글 공통 로직.
 * index.html(SPA)과 pages/*.html(외부 자료 MPA 페이지) 양쪽에서 공유한다.
 */
const DESKTOP_BREAKPOINT = 1024;
let _sidebarOpen = window.innerWidth > DESKTOP_BREAKPOINT;

function syncSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-expanded', String(_sidebarOpen));
  toggle.setAttribute('aria-label', _sidebarOpen ? '메뉴 닫기' : '메뉴 열기');
}

function toggleSidebar() {
  _sidebarOpen ? closeSidebar() : openSidebar();
}
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.body.classList.remove('sidebar-collapsed');
  if (window.innerWidth <= DESKTOP_BREAKPOINT) {
    document.getElementById('overlay').classList.add('show');
  }
  _sidebarOpen = true;
  syncSidebarToggle();
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  if (window.innerWidth > DESKTOP_BREAKPOINT) {
    document.body.classList.add('sidebar-collapsed');
  }
  _sidebarOpen = false;
  syncSidebarToggle();
}
function toggleNav(id) {
  const el = document.getElementById('nav-' + id);
  const chev = document.getElementById('chev-' + id);
  const open = el.classList.toggle('open');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
}
// auto-open a section (e.g. quiz/learn while that view is active)
window._openNavSection = function(id) {
  const el = document.getElementById('nav-' + id);
  const chev = document.getElementById('chev-' + id);
  if (el && !el.classList.contains('open')) {
    el.classList.add('open');
    if (chev) chev.style.transform = 'rotate(180deg)';
  }
};
// close every section (used before opening only the section(s) currently in use)
function closeAllNavSections() {
  document.querySelectorAll('.nav-children').forEach((el) => {
    el.classList.remove('open');
    const chev = document.getElementById('chev-' + el.id.replace(/^nav-/, ''));
    if (chev) chev.style.transform = '';
  });
}
// close everything, then open only the section(s) relevant to the current view
window._setActiveNavSections = function(ids) {
  closeAllNavSections();
  (ids || []).forEach((id) => window._openNavSection(id));
};

window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= DESKTOP_BREAKPOINT;
  document.getElementById('overlay').classList.remove('show');

  if (isMobile) {
    document.body.classList.remove('sidebar-collapsed');
    document.getElementById('sidebar').classList.remove('open');
    _sidebarOpen = false;
  } else {
    document.getElementById('sidebar').classList.toggle('open', !document.body.classList.contains('sidebar-collapsed'));
    _sidebarOpen = !document.body.classList.contains('sidebar-collapsed');
  }

  syncSidebarToggle();
});

if (window.innerWidth > DESKTOP_BREAKPOINT) {
  document.getElementById('sidebar').classList.add('open');
}
syncSidebarToggle();
