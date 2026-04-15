/* ══════════════════════════════════════
   DermajestiC CRM — Leads
   ══════════════════════════════════════ */

// ── Filtros ──
function setLeadsFilter(period, btn) {
  currentLeadsFilter = period;
  document.querySelectorAll('#leads-filter-btns .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyLeadsFilter();
}

function filterLeads() {
  applyLeadsFilter();
}

function applyLeadsFilter() {
  const q = document.getElementById('search-input').value;
  let filtered = filterByDate(allLeads, 'criado_em', currentLeadsFilter);

  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(l =>
      (l.nome || '').toLowerCase().includes(lower) ||
      (l.telefone || '').includes(q)
    );
  }

  renderLeadsTable(filtered);
}

// ── Tabela ──
function renderLeadsTable(leads) {
  const tbody = document.getElementById('leads-table-body');

  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty">Nenhum lead encontrado</div></td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(l => `
    <tr onclick="openLeadModal('${l.id}')">
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          ${renderAvatar(l.nome, l.foto_url, 30, 10)}
          <span>${l.nome || '—'}</span>
        </div>
      </td>
      <td class="muted">${formatTelefone(l.telefone)}</td>
      <td class="muted">${l.canal || 'whatsapp'}</td>
      <td>${badgeHtml(l.status)}</td>
      <td class="muted">${fmtDate(l.criado_em)}</td>
    </tr>`
  ).join('');
}

// ── Modal do lead ──
async function openLeadModal(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;

  document.getElementById('modal').classList.add('open');
  document.getElementById('modal-content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const [{ data: convs }, { data: agends }] = await Promise.all([
    sb.from('conversas').select('*').eq('lead_id', id).order('enviado_em', { ascending: true }),
    sb.from('agendamentos').select('*').eq('lead_id', id),
  ]);

  document.getElementById('modal-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem">
      ${renderAvatar(lead.nome, lead.foto_url, 48, 15, 'border:2px solid var(--border)')}
      <div>
        <div class="modal-name">${lead.nome || '—'}</div>
        <div class="modal-phone">${formatTelefone(lead.telefone)}</div>
      </div>
      ${badgeHtml(lead.status)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem">
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;font-weight:700">CANAL</div>
        <div style="font-size:13px;font-weight:500">${lead.canal || 'whatsapp'}</div>
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:12px">
        <div style="font-size:10px;color:var(--muted);margin-bottom:4px;font-weight:700">PRIMEIRO CONTATO</div>
        <div style="font-size:13px;font-weight:500">${fmtDate(lead.criado_em)}</div>
      </div>
    </div>

    <div class="modal-section">Agendamentos (${agends?.length || 0})</div>
    ${agends && agends.length > 0
      ? agends.map(a => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surface2);border-radius:10px;margin-bottom:6px">
            <div>
              <div style="font-size:13px;font-weight:500">${limparServico(a.servico)}</div>
              <div style="font-size:11px;color:var(--muted)">${fmtDate(a.data_agendamento)}</div>
            </div>
            ${badgeHtml(a.status)}
          </div>`).join('')
      : '<div style="font-size:12px;color:var(--muted);padding:8px 0">Nenhum agendamento</div>'
    }

    <div class="modal-section">Conversa (${convs?.length || 0} msgs)</div>
    <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
      ${convs && convs.length > 0
        ? convs.slice(-10).map(m => {
            const isA = m.origem === 'agente';
            return `<div class="msg-bubble ${isA ? 'agente' : ''}" style="animation:none">
              <div class="msg-content">
                <div class="msg-text" style="font-size:12px">${m.mensagem}</div>
                <div class="msg-time">${fmtDate(m.enviado_em)}</div>
              </div>
            </div>`;
          }).join('')
        : '<div style="font-size:12px;color:var(--muted)">Nenhuma mensagem</div>'
      }
    </div>`;
}
