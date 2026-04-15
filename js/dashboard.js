/* ══════════════════════════════════════
   DermajestiC CRM — Dashboard
   ══════════════════════════════════════ */

async function loadDashboard() {
  const { data: leads }       = await sb.from('leads').select('*').order('criado_em', { ascending: false });
  const { data: agendamentos } = await sb.from('agendamentos').select('*');

  allLeads        = leads        || [];
  allAgendamentos = agendamentos || [];

  // Badge de leads de hoje
  const todayLeads = filterByDate(allLeads, 'criado_em', 'hoje').length;
  const badge = document.getElementById('leads-count-badge');
  if (todayLeads > 0) {
    badge.textContent = todayLeads;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  renderDashboardMetrics(allLeads, currentDashFilter);
  renderRecentLeads(allLeads);
  renderFunnel(allLeads, allAgendamentos);
  renderServiceChart(allAgendamentos);
  renderTimelineChart(allLeads);

  // Atualiza tabela de leads e lista de conversas com os dados carregados
  renderLeadsTable(allLeads);
  renderConversaLeadsList(allLeads);
}

// ── Métricas ──
function renderDashboardMetrics(leads, period) {
  const filtered   = filterByDate(leads, 'criado_em', period);
  const total      = filtered.length;
  const agendados  = filtered.filter(l => l.status === 'agendado').length;
  const convertidos= filtered.filter(l => l.status === 'convertido').length;
  const taxa       = total > 0 ? Math.round((agendados + convertidos) / total * 100) : 0;

  const agendsPeriodo = period === 'tudo'
    ? allAgendamentos
    : filterByDate(allAgendamentos, 'data_agendamento', period);

  const receita = agendsPeriodo
    .filter(a => a.status !== 'cancelado' && a.valor)
    .reduce((sum, a) => sum + parseFloat(a.valor || 0), 0);

  const receitaFmt  = receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const receitaSize = receita >= 10000 ? '28px' : receita >= 1000 ? '34px' : '44px';

  document.getElementById('metrics-grid').innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Leads captados</div>
      <div class="metric-value">${total}</div>
      <div class="metric-divider"></div>
      <div class="metric-sub">via WhatsApp</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Consultas agendadas</div>
      <div class="metric-value" style="color:var(--green)">${agendados}</div>
      <div class="metric-divider"></div>
      <div class="metric-sub up">clientes confirmados</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Taxa de conversão</div>
      <div class="metric-value" style="color:var(--amber)">${taxa}<span style="font-size:24px;opacity:0.6">%</span></div>
      <div class="metric-divider"></div>
      <div class="metric-sub">do total de leads</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Receita estimada</div>
      <div class="metric-value" style="color:var(--accent);font-size:${receitaSize}">${receitaFmt}</div>
      <div class="metric-divider"></div>
      <div class="metric-sub up">em agendamentos</div>
    </div>`;
}

function setDashFilter(period, btn) {
  currentDashFilter = period;
  document.querySelectorAll('#dash-filter-btns .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDashboardMetrics(allLeads, period);
}

// ── Leads recentes ──
function renderRecentLeads(leads) {
  const recent = leads.slice(0, 6);
  document.getElementById('recent-leads').innerHTML = recent.length === 0
    ? '<div class="empty"><span class="empty-icon">&#128100;</span>Nenhum lead ainda</div>'
    : '<div class="lead-list">' + recent.map(l =>
        `<div class="lead-item" onclick="openLeadModal('${l.id}')">
          ${renderAvatar(l.nome, l.foto_url)}
          <div class="lead-info">
            <div class="lead-name">${l.nome || l.telefone}</div>
            <div class="lead-meta">${fmtDate(l.criado_em)}</div>
          </div>
          ${badgeHtml(l.status)}
        </div>`
      ).join('') + '</div>';
}

// ── Funil ──
function renderFunnel(leads, agendamentos) {
  const total     = leads.length;
  const engajados = leads.filter(l => l.status !== 'novo').length;
  const agendados = leads.filter(l => l.status === 'agendado').length;
  const realizados= agendamentos.filter(a => a.status === 'realizado').length;

  const steps = [
    { label: 'Leads',     count: total,     pct: 100,                                              color: 'var(--blue)'   },
    { label: 'Engajados', count: engajados,  pct: total ? Math.round(engajados  / total * 100) : 0, color: 'var(--accent)' },
    { label: 'Agendados', count: agendados,  pct: total ? Math.round(agendados  / total * 100) : 0, color: 'var(--gold)'   },
    { label: 'Realizados',count: realizados, pct: total ? Math.round(realizados / total * 100) : 0, color: 'var(--green)'  },
  ];

  document.getElementById('funnel-chart').innerHTML =
    '<div class="funnel">' +
    steps.map(s => `
      <div class="funnel-step">
        <div class="funnel-row">
          <span class="funnel-label">${s.label}</span>
          <span class="funnel-count">${s.count}</span>
        </div>
        <div class="funnel-track">
          <div class="funnel-fill" style="width:${s.pct}%;background:${s.color}"></div>
        </div>
        <div class="funnel-pct">${s.pct}%</div>
      </div>`
    ).join('') + '</div>';
}

// ── Gráfico serviços ──
function renderServiceChart(agendamentos) {
  const svcs = {};
  agendamentos.forEach(a => {
    if (a.servico) {
      const s = limparServico(a.servico);
      svcs[s] = (svcs[s] || 0) + 1;
    }
  });

  const sorted = Object.entries(svcs).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cs     = getChartStyle();
  const colors = [cs.accent, cs.green, cs.blue, cs.gold, '#6c5ce7', '#e74c3c'];

  if (svcChart) svcChart.destroy();
  const ctx = document.getElementById('services-canvas');
  if (!ctx || sorted.length === 0) return;

  svcChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sorted.map(s => s[0]),
      datasets: [{
        data: sorted.map(s => s[1]),
        backgroundColor: colors.slice(0, sorted.length),
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: cs.muted, font: { family: 'Jost', size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 },
        },
      },
      cutout: '65%',
    },
  });
}

// ── Gráfico timeline de leads ──
function renderTimelineChart(leads) {
  const days = {};
  const now  = new Date();

  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = 0;
  }

  leads.forEach(l => {
    if (l.criado_em) {
      const key = l.criado_em.split('T')[0];
      if (key in days) days[key]++;
    }
  });

  const cs = getChartStyle();
  if (timelineChart) timelineChart.destroy();
  const ctx = document.getElementById('leads-timeline-canvas');
  if (!ctx) return;

  timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(days).map(d => {
        const dt = new Date(d + 'T12:00:00');
        return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      }),
      datasets: [{
        data: Object.values(days),
        borderColor: cs.accent,
        backgroundColor: cs.accent + '18',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: cs.accent,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cs.muted, font: { size: 10, family: 'JetBrains Mono' } }, grid: { color: cs.border } },
        y: { beginAtZero: true, ticks: { color: cs.muted, font: { size: 10, family: 'JetBrains Mono' }, stepSize: 1 }, grid: { color: cs.border } },
      },
    },
  });
}
