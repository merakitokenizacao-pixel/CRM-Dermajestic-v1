/* ══════════════════════════════════════
   DermajestiC CRM — Conversas
   ══════════════════════════════════════ */

let conversaLeadsCache = [];

// ── Carrega lista de leads na sidebar de conversas ──
function loadConversaLeads() {
  renderConversaLeadsList(allLeads);
}

function renderConversaLeadsList(leads) {
  conversaLeadsCache = leads;
  renderConversaList(leads);
}

function filterConversaLeads(q) {
  const filtered = q
    ? conversaLeadsCache.filter(l =>
        (l.nome || '').toLowerCase().includes(q.toLowerCase()) ||
        (l.telefone || '').includes(q)
      )
    : conversaLeadsCache;
  renderConversaList(filtered);
}

function renderConversaList(leads) {
  const container = document.getElementById('conversa-leads-list');

  if (!leads.length) {
    container.innerHTML = '<div class="empty">Nenhum lead</div>';
    return;
  }

  container.innerHTML = leads.map(l => `
    <div class="conversa-contact" onclick="loadConversas('${l.id}', '${(l.nome || l.telefone).replace(/'/g, "\\'")}')" id="cc-${l.id}">
      ${renderAvatar(l.nome, l.foto_url, 38, 11)}
      <div class="conversa-contact-info">
        <div class="conversa-contact-name">${l.nome || l.telefone}</div>
        <div class="conversa-contact-preview">${badgeHtml(l.status)}</div>
      </div>
    </div>`
  ).join('');
}

// ── Carrega mensagens do lead selecionado ──
async function loadConversas(leadId, leadName) {
  // Marca contato ativo
  document.querySelectorAll('.conversa-contact').forEach(c => c.classList.remove('active'));
  const el = document.getElementById('cc-' + leadId);
  if (el) el.classList.add('active');

  // Atualiza header
  const nameEl = document.getElementById('conversa-lead-name');
  nameEl.textContent = leadName;
  nameEl.style.color = '';

  // Loading
  document.getElementById('conversa-messages').innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';

  const { data } = await sb
    .from('conversas')
    .select('*')
    .eq('lead_id', leadId)
    .order('enviado_em', { ascending: true });

  if (!data || !data.length) {
    document.getElementById('conversa-messages').innerHTML =
      '<div class="empty">Nenhuma mensagem</div>';
    return;
  }

  document.getElementById('conversa-messages').innerHTML = data.map(m => {
    const isA = m.origem === 'agente';
    return `
      <div class="msg-bubble ${isA ? 'agente' : ''}">
        <div class="msg-avatar" style="background:${isA ? '#6c5ce722' : '#2d6a4f22'};color:${isA ? '#6c5ce7' : '#2d6a4f'}">
          ${isA ? 'IA' : getInitials(leadName)}
        </div>
        <div class="msg-content">
          <div class="msg-text">${m.mensagem}</div>
          <div class="msg-time">${fmtDate(m.enviado_em)}</div>
        </div>
      </div>`;
  }).join('');

  // Scroll para o final
  const msgs = document.getElementById('conversa-messages');
  msgs.scrollTop = msgs.scrollHeight;
}
