/* ══════════════════════════════════════
   DermajestiC CRM — App / Inicialização
   ══════════════════════════════════════ */

// ── Navegação ──
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  leads:        'Leads',
  conversas:    'Conversas',
  agendamentos: 'Agendamentos',
  followup:     'Follow-up',
};

function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');

  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;

  // Carrega dados da página ao navegar
  if (page === 'agendamentos') loadAgendamentos();
  if (page === 'followup')     loadFollowup();
  if (page === 'conversas')    loadConversaLeads();

  closeSidebar();
}

// Alias para o bottom nav mobile
function showPageMobile(page) {
  const navEl = document.querySelector(`.nav-item[onclick*="'${page}'"]`);
  showPage(page, navEl);
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('bn-' + page)?.classList.add('active');
}

// ── Tema: restaura preferência salva ──
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').innerHTML = '&#9788;';
  }
})();

// ── Data no topbar ──
document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR', {
  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
});

// ── Saudação dinâmica ──
(function setGreeting() {
  const h = new Date().getHours();
  const greetEl = document.getElementById('dash-greeting');
  if (!greetEl) return;
  if      (h < 12) greetEl.innerHTML = 'Bom <em>dia</em>';
  else if (h < 18) greetEl.innerHTML = 'Boa <em>tarde</em>';
  else             greetEl.innerHTML = 'Boa <em>noite</em>';
})();

// ── Bootstrap ──
loadDashboard();
