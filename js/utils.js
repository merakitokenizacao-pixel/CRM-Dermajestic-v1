/* ══════════════════════════════════════
   DermajestiC CRM — Utilitários
   ══════════════════════════════════════ */

// ── Toast ──
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Avatar ──
function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const avatarPalette = [
  ['#8b5e3c', '#f5ede5'],
  ['#2d6a4f', '#d8f3dc'],
  ['#1a5276', '#e8f0fb'],
  ['#6c5ce7', '#f0edff'],
  ['#c0392b', '#fde8e8'],
  ['#b5540a', '#fef3e2'],
];

function getAvatarColors(name) {
  return avatarPalette[(name || '?').charCodeAt(0) % avatarPalette.length];
}

function renderAvatar(nome, fotoUrl, size = 36, fontSize = 11, extra = '') {
  const [bg, fg] = getAvatarColors(nome || '?');
  const initials = getInitials(nome);
  const fallback = `<div class="avatar" style="background:${bg}22;color:${fg};width:${size}px;height:${size}px;font-size:${fontSize}px;flex-shrink:0;${extra}">${initials}</div>`;

  if (fotoUrl && fotoUrl !== '=' && fotoUrl !== 'null' && fotoUrl !== 'undefined') {
    return `<img src="${fotoUrl}" alt="${nome}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;${extra}" onerror="this.outerHTML='${fallback}'">`;
  }
  return fallback;
}

// ── Formatações ──
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Ontem, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatTelefone(tel) {
  if (!tel) return '—';
  const n = tel.replace(/\D/g, '');
  if (n.length === 13) return '+' + n.slice(0, 2) + ' (' + n.slice(2, 4) + ') ' + n.slice(4, 9) + '-' + n.slice(9);
  if (n.length === 11) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
  return tel;
}

function limparServico(texto) {
  if (!texto) return '—';
  const svc = [
    'Limpeza de pele', 'Botox', 'Peeling', 'Drenagem linfatica',
    'Preenchimento', 'Microagulhamento', 'Depilacao a laser',
    'Hidratacao facial', 'Radiofrequencia', 'Criolipotise',
  ];
  const lower = texto.toLowerCase();
  const found = svc.find(s => lower.includes(s.toLowerCase()));
  if (found) return found;
  return texto.replace(/\*/g, '').trim().split(' ').slice(0, 3).join(' ');
}

// ── Badge HTML ──
function badgeHtml(status) {
  const map = {
    novo:       'badge-novo',
    agendado:   'badge-agendado',
    convertido: 'badge-convertido',
    cancelado:  'badge-cancelado',
    realizado:  'badge-realizado',
    confirmado: 'badge-confirmado',
    pendente:   'badge-pendente',
  };
  return `<span class="badge ${map[status] || 'badge-novo'}">${status || 'novo'}</span>`;
}

// ── Filtros de data ──
function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'hoje':
      return { from: today, to: new Date(today.getTime() + 86400000) };
    case 'ontem': {
      const y = new Date(today.getTime() - 86400000);
      return { from: y, to: today };
    }
    case 'semana': {
      const day = today.getDay();
      return {
        from: new Date(today.getTime() - day * 86400000),
        to:   new Date(today.getTime() + (7 - day) * 86400000),
      };
    }
    case 'mes':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to:   new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    default:
      return null; // "tudo"
  }
}

function filterByDate(items, field, period) {
  const range = getDateRange(period);
  if (!range) return items;
  return items.filter(i => {
    if (!i[field]) return false;
    const d = new Date(i[field].toString().split('T')[0] + 'T12:00:00');
    return d >= range.from && d < range.to;
  });
}

// ── Tema ──
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  document.querySelector('.theme-toggle').innerHTML = isDark ? '&#9789;' : '&#9788;';
  if (svcChart)      updateChartColors(svcChart);
  if (timelineChart) updateChartColors(timelineChart);
}

function updateChartColors(chart) {
  const style  = getComputedStyle(document.documentElement);
  const muted  = style.getPropertyValue('--muted').trim();
  const border = style.getPropertyValue('--border').trim();
  chart.options.scales.x.ticks.color  = muted;
  chart.options.scales.y.ticks.color  = muted;
  chart.options.scales.x.grid.color   = border;
  chart.options.scales.y.grid.color   = border;
  chart.update();
}

function getChartStyle() {
  const s = getComputedStyle(document.documentElement);
  return {
    muted:  s.getPropertyValue('--muted').trim(),
    border: s.getPropertyValue('--border').trim(),
    accent: s.getPropertyValue('--accent').trim(),
    green:  s.getPropertyValue('--green').trim(),
    blue:   s.getPropertyValue('--blue').trim(),
    gold:   s.getPropertyValue('--gold').trim(),
  };
}

// ── Sidebar mobile ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Modal genérico ──
function closeModal(e) {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').classList.remove('open');
  }
}
