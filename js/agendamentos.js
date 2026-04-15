/* ══════════════════════════════════════
   DermajestiC CRM — Agendamentos
   ══════════════════════════════════════ */

// ── Carregamento principal ──
async function loadAgendamentos() {
  const { data } = await sb
    .from('agendamentos')
    .select('*, leads(nome, telefone, foto_url)')
    .order('data_agendamento', { ascending: true });

  allAgendamentos = data || [];

  renderAgendMetrics(allAgendamentos);
  renderKanban(allAgendamentos);
  applyAgendFilters();
  initCalendar();
  populateLeadSelect();
}

// ── Métricas ──
function renderAgendMetrics(list) {
  const total = list.length;
  const pend  = list.filter(a => a.status === 'pendente').length;
  const conf  = list.filter(a => a.status === 'confirmado').length;
  const real  = list.filter(a => a.status === 'realizado').length;

  document.getElementById('agend-metrics').innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total</div>
      <div class="metric-value">${total}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Pendentes</div>
      <div class="metric-value" style="color:var(--amber)">${pend}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Confirmados</div>
      <div class="metric-value" style="color:var(--purple)">${conf}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Realizados</div>
      <div class="metric-value" style="color:var(--green)">${real}</div>
    </div>`;
}

// ── Kanban ──
const KANBAN_COLS = [
  { status: 'pendente',   title: 'Pendentes',   color: 'var(--amber)',  bg: 'var(--amber-bg)'  },
  { status: 'confirmado', title: 'Confirmados', color: 'var(--purple)', bg: 'var(--purple-bg)' },
  { status: 'realizado',  title: 'Realizados',  color: 'var(--green)',  bg: 'var(--green-bg)'  },
  { status: 'cancelado',  title: 'Cancelados',  color: 'var(--red)',    bg: 'var(--red-bg)'    },
];

function renderKanban(list) {
  document.getElementById('kanban-board').innerHTML = KANBAN_COLS.map(col => {
    const items = list.filter(a => a.status === col.status);

    const cards = items.length === 0
      ? '<div class="kanban-empty">Nenhum</div>'
      : items.map(a => {
          const dt   = a.data_agendamento ? new Date(a.data_agendamento) : null;
          const time = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
          const date = dt ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
          return `
            <div class="kanban-card" draggable="true"
              ondragstart="event.dataTransfer.setData('text/plain', '${a.id}')"
              onclick="openEditAgendamento('${a.id}')">
              <div class="kanban-card-name">${a.leads?.nome || '—'}</div>
              <div class="kanban-card-service">${limparServico(a.servico)}</div>
              <div class="kanban-card-meta">
                <span>${date}</span>
                <span style="opacity:0.4">|</span>
                <span>${time}</span>
              </div>
            </div>`;
        }).join('');

    return `
      <div class="kanban-col"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="handleDrop(event,'${col.status}');this.classList.remove('drag-over')">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.title}</span>
          <span class="kanban-col-count" style="background:${col.bg};color:${col.color}">${items.length}</span>
        </div>
        ${cards}
      </div>`;
  }).join('');
}

async function handleDrop(e, newStatus) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const { error } = await sb.from('agendamentos').update({ status: newStatus }).eq('id', id);
  if (!error) {
    showToast('Status atualizado para ' + newStatus, 'success');
    loadAgendamentos();
  }
}

// ── Lista com filtro de data ──
function setAgendDateFilter(period, btn) {
  currentAgendDateFilter = period;
  document.querySelectorAll('#agend-date-filter-btns .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyAgendFilters();
}

function applyAgendFilters() {
  const filtered = filterByDate(allAgendamentos, 'data_agendamento', currentAgendDateFilter);
  renderAgendList(filtered, currentAgendDateFilter === 'tudo' ? 'Todos' : '');
}

function filterAgendamentos(status, btn) {
  document.querySelectorAll('.filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'todos' ? allAgendamentos : allAgendamentos.filter(a => a.status === status);
  renderAgendList(filtered, status === 'todos' ? 'Todos' : status);
}

function renderAgendList(list, title) {
  document.getElementById('agend-list-title').textContent = title || 'Agendamentos';

  if (!list.length) {
    document.getElementById('agend-list').innerHTML = '<div class="empty">Nenhum agendamento</div>';
    return;
  }

  document.getElementById('agend-list').innerHTML = list.map(a => {
    const lead = a.leads;
    const dt   = a.data_agendamento ? new Date(a.data_agendamento) : null;
    const time = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
    const date = dt ? dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—';

    return `
      <div class="agend-item" onclick="openEditAgendamento('${a.id}')">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:52px;gap:2px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--accent);font-weight:500">${time}</span>
          <span style="font-size:10px;color:var(--muted)">${date}</span>
        </div>
        ${renderAvatar(lead?.nome, lead?.foto_url, 36, 12)}
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;margin-bottom:2px">${lead?.nome || '—'}</div>
          <div style="font-size:12px;color:var(--accent);font-weight:500">${limparServico(a.servico)}</div>
        </div>
        ${badgeHtml(a.status)}
      </div>`;
  }).join('');
}

// ── Calendário ──
function initCalendar() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();
  selectedCalDate = now.toISOString().split('T')[0];
  renderCalendar();
  showDayAgendamentos(selectedCalDate);
}

function renderCalendar() {
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const first  = new Date(calYear, calMonth, 1).getDay();
  const days   = new Date(calYear, calMonth + 1, 0).getDate();
  const today  = new Date().toISOString().split('T')[0];
  const events = new Set(allAgendamentos.map(a => a.data_agendamento?.split('T')[0]).filter(Boolean));

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <button class="cal-nav" onclick="changeMonth(-1)">&lsaquo;</button>
      <span style="font-size:13px;font-weight:600">${MONTHS[calMonth]} ${calYear}</span>
      <button class="cal-nav" onclick="changeMonth(1)">&rsaquo;</button>
    </div>
    <div class="cal-grid">`;

  ['D','S','T','Q','Q','S','S'].forEach(d => { html += `<div class="cal-weekday">${d}</div>`; });

  for (let i = 0; i < first; i++) html += '<div></div>';

  for (let d = 1; d <= days; d++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const classes = [
      'cal-day',
      ds === today && ds !== selectedCalDate ? 'today'    : '',
      ds === selectedCalDate                 ? 'selected' : '',
      events.has(ds)                         ? 'has-event': '',
    ].filter(Boolean).join(' ');
    const dimmed = ds < today && ds !== selectedCalDate ? 'opacity:0.35;' : '';

    html += `<div class="${classes}" style="${dimmed}" onclick="selectCalDay('${ds}')">${d}</div>`;
  }

  html += '</div>';
  document.getElementById('mini-calendar').innerHTML = html;
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function selectCalDay(ds) {
  selectedCalDate = ds;
  renderCalendar();
  showDayAgendamentos(ds);
}

function showDayAgendamentos(ds) {
  const d = new Date(ds + 'T12:00:00');
  document.getElementById('selected-day-label').textContent =
    d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const dayAgends = allAgendamentos.filter(a => a.data_agendamento?.startsWith(ds));

  if (!dayAgends.length) {
    document.getElementById('day-agendamentos').innerHTML =
      '<div style="font-size:12px;color:var(--muted);padding:6px 0">Nenhum agendamento</div>';
    return;
  }

  document.getElementById('day-agendamentos').innerHTML = dayAgends.map(a => {
    const dt = a.data_agendamento ? new Date(a.data_agendamento) : null;
    const t  = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px;cursor:pointer"
        onclick="openEditAgendamento('${a.id}')">
        <span style="font-size:11px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:500">${t}</span>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${a.leads?.nome || '—'}</div>
          <div style="font-size:11px;color:var(--muted)">${limparServico(a.servico)}</div>
        </div>
        ${badgeHtml(a.status)}
      </div>`;
  }).join('');
}

// ── Novo agendamento ──
function populateLeadSelect() {
  document.getElementById('agend-lead-select').innerHTML =
    '<option value="">Selecione...</option>' +
    allLeads.map(l => `<option value="${l.id}">${l.nome || l.telefone}</option>`).join('');
}

function openNewAgendamento() {
  document.getElementById('agend-msg').textContent = '';
  document.getElementById('agend-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal-agend').classList.add('open');
}

async function salvarAgendamento() {
  const leadId  = document.getElementById('agend-lead-select').value;
  const servico = document.getElementById('agend-servico').value;
  const data    = document.getElementById('agend-data').value;
  const hora    = document.getElementById('agend-hora').value;
  const status  = document.getElementById('agend-status').value;
  const msgEl   = document.getElementById('agend-msg');

  if (!leadId || !servico || !data || !hora) {
    msgEl.style.color = 'var(--red)';
    msgEl.textContent = 'Preencha todos os campos!';
    return;
  }

  msgEl.style.color = 'var(--muted)';
  msgEl.textContent = 'Salvando...';

  const { error } = await sb.from('agendamentos').insert({
    lead_id: leadId,
    servico,
    data_agendamento: `${data}T${hora}:00`,
    status,
  });

  if (error) {
    msgEl.style.color = 'var(--red)';
    msgEl.textContent = 'Erro: ' + error.message;
    return;
  }

  await sb.from('leads').update({ status: 'agendado' }).eq('id', leadId);

  msgEl.style.color = 'var(--green)';
  msgEl.textContent = 'Agendamento salvo!';
  showToast('Agendamento criado com sucesso', 'success');

  setTimeout(() => {
    document.getElementById('modal-agend').classList.remove('open');
    loadAgendamentos();
    loadDashboard();
  }, 1000);
}

function closeAgendModal(e) {
  if (e.target === document.getElementById('modal-agend')) {
    document.getElementById('modal-agend').classList.remove('open');
  }
}

// ── Editar agendamento ──
async function openEditAgendamento(id) {
  const a = allAgendamentos.find(x => x.id === id);
  if (!a) return;

  const lead    = a.leads;
  const dt      = a.data_agendamento ? new Date(a.data_agendamento) : null;
  const visitas = allAgendamentos.filter(x => x.lead_id === a.lead_id && x.status === 'realizado').length;
  const totalAgends = allAgendamentos.filter(x => x.lead_id === a.lead_id).length;

  document.getElementById('modal-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem">
      ${renderAvatar(lead?.nome, lead?.foto_url, 48, 15, 'border:2px solid var(--border)')}
      <div style="flex:1">
        <div class="modal-name">${lead?.nome || '—'}</div>
        <div class="modal-phone">${lead?.telefone ? formatTelefone(lead.telefone) : '—'}</div>
      </div>
      ${badgeHtml(a.status)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:1rem">
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">SERVIÇO</div>
        <div style="font-size:13px;font-weight:500;color:var(--accent)">${limparServico(a.servico)}</div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">DATA</div>
        <div style="font-size:13px;font-weight:500">${dt ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">HORÁRIO</div>
        <div style="font-size:13px;font-weight:500">${dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem">
      <div style="background:var(--green-bg);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">VISITAS</div>
        <div style="font-size:22px;font-weight:700;color:var(--green)">${visitas}</div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">TOTAL AGEND.</div>
        <div style="font-size:22px;font-weight:700">${totalAgends}</div>
      </div>
    </div>

    <div class="modal-section">Atualizar status</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${['pendente','confirmado','realizado','cancelado'].map(s =>
        `<button class="filter-btn ${a.status === s ? 'active' : ''}" onclick="updateAgendStatus('${id}','${s}')">${s}</button>`
      ).join('')}
    </div>
    <div id="status-msg" style="font-size:12px;margin-top:10px;min-height:16px"></div>

    <div style="border-top:1px solid var(--border);margin:1rem 0"></div>
    <button onclick="confirmarExcluir()" style="width:100%;background:var(--red-bg);border:1px solid rgba(176,48,48,0.2);color:var(--red);padding:10px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Jost',sans-serif">
      Excluir agendamento
    </button>
    <div id="delete-confirm" style="display:none;margin-top:10px;background:var(--surface2);border-radius:10px;padding:14px;text-align:center">
      <div style="font-size:13px;margin-bottom:10px">Tem certeza?</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button onclick="document.getElementById('delete-confirm').style.display='none'"
          style="background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:8px 16px;border-radius:8px;cursor:pointer;font-family:'Jost',sans-serif">
          Cancelar
        </button>
        <button onclick="excluirAgendamento('${id}')"
          style="background:var(--red);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-family:'Jost',sans-serif;font-weight:600">
          Excluir
        </button>
      </div>
    </div>`;

  document.getElementById('modal').classList.add('open');
}

async function updateAgendStatus(id, status) {
  const { error } = await sb.from('agendamentos').update({ status }).eq('id', id);
  const msg = document.getElementById('status-msg');

  if (error) {
    msg.style.color = 'var(--red)';
    msg.textContent = 'Erro: ' + error.message;
    return;
  }

  msg.style.color = 'var(--green)';
  msg.textContent = 'Status atualizado!';
  showToast('Status atualizado', 'success');

  setTimeout(() => {
    document.getElementById('modal').classList.remove('open');
    loadAgendamentos();
  }, 800);
}

function confirmarExcluir() {
  document.getElementById('delete-confirm').style.display = 'block';
}

async function excluirAgendamento(id) {
  const { error } = await sb.from('agendamentos').delete().eq('id', id);
  if (error) { alert('Erro: ' + error.message); return; }
  document.getElementById('modal').classList.remove('open');
  showToast('Agendamento excluído', 'info');
  loadAgendamentos();
}
