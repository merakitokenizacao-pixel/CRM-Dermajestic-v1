/* ══════════════════════════════════════
   DermajestiC CRM — Follow-up
   ══════════════════════════════════════ */

async function loadFollowup() {
  document.getElementById('followup-cards').innerHTML =
    '<div class="loading"><div class="spinner"></div> Carregando...</div>';

  const [{ data: followups }, { data: agendamentos }] = await Promise.all([
    sb.from('follow_ups').select('*, leads(id, nome, telefone, canal, foto_url)').order('enviado_em', { ascending: false }),
    sb.from('agendamentos').select('*'),
  ]);

  const fups   = followups   || [];
  const agends = agendamentos || [];
  const agora  = new Date();

  // Mapa lead → último agendamento
  const agendMap = {};
  agends.forEach(a => {
    if (!agendMap[a.lead_id] || new Date(a.data_agendamento) > new Date(agendMap[a.lead_id].data_agendamento)) {
      agendMap[a.lead_id] = a;
    }
  });

  // Agrupa por lead
  const leadIds = [...new Set(fups.map(f => f.lead_id))];
  const itens = leadIds.map(lid => {
    const fup    = fups.find(f => f.lead_id === lid);
    const lead   = fup?.leads || {};
    const agend  = agendMap[lid] || {};
    const hist   = fups.filter(f => f.lead_id === lid).sort((a, b) => new Date(b.enviado_em) - new Date(a.enviado_em));
    const diasDesdeEnvio = hist[0]?.enviado_em
      ? Math.floor((agora - new Date(hist[0].enviado_em)) / 86400000)
      : null;

    return { lead, agend, historico: hist, diasDesdeEnvio, leadId: lid };
  });

  // Métricas
  const totalEnvios  = fups.length;
  const totalLeads   = itens.length;
  const recentes     = itens.filter(i => i.diasDesdeEnvio !== null && i.diasDesdeEnvio <= 30).length;
  const recuperados  = agends.filter(a => a.origem === 'followup').length;
  const taxa         = totalLeads > 0 ? Math.round(recuperados / totalLeads * 100) : 0;

  document.getElementById('followup-metrics').innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total follow-ups</div>
      <div class="metric-value">${totalEnvios}</div>
      <div class="metric-sub">mensagens enviadas</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Contactados</div>
      <div class="metric-value" style="color:var(--green)">${totalLeads}</div>
      <div class="metric-sub">receberam follow-up</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Recentes</div>
      <div class="metric-value" style="color:var(--blue)">${recentes}</div>
      <div class="metric-sub">últimos 30 dias</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Recuperados</div>
      <div class="metric-value" style="color:var(--amber)">${taxa}%</div>
      <div class="metric-sub">${recuperados} de ${totalLeads}</div>
    </div>`;

  renderFollowupList(itens);
}

function renderFollowupList(itens) {
  const container = document.getElementById('followup-cards');

  if (!itens.length) {
    container.innerHTML = '<div class="empty"><span class="empty-icon">&#128172;</span>Nenhum follow-up enviado</div>';
    return;
  }

  container.innerHTML = itens.map(({ lead, agend, historico, diasDesdeEnvio, leadId }) => {
    const nome    = lead.nome || '—';
    const tel     = lead.telefone ? formatTelefone(lead.telefone) : '';
    const servico = limparServico(agend.servico);
    const ultimoEnvio = historico[0]?.enviado_em
      ? new Date(historico[0].enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    let tagClass = 'enviado', tagLabel = 'Recente';
    if (diasDesdeEnvio !== null && diasDesdeEnvio > 30) { tagClass = 'urgente'; tagLabel = diasDesdeEnvio + 'd atrás'; }
    else if (diasDesdeEnvio !== null && diasDesdeEnvio > 7) { tagClass = 'pendente'; tagLabel = diasDesdeEnvio + 'd atrás'; }

    return `
      <div class="followup-row">
        <div class="followup-row-accent ${tagClass}"></div>
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          ${renderAvatar(nome, lead.foto_url, 38, 11)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;margin-bottom:2px">${nome}</div>
            <div style="font-size:11px;color:var(--muted)">${tel}</div>
          </div>
        </div>
        <div style="min-width:140px">
          <div style="font-size:12px;color:var(--text2);font-weight:500">${servico}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Envio: ${ultimoEnvio}</div>
        </div>
        <div style="min-width:70px;text-align:center">
          <span class="followup-tag ${tagClass}">${tagLabel}</span>
        </div>
        <div style="min-width:60px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:var(--accent)">${historico.length}</div>
          <div style="font-size:10px;color:var(--muted)">envio${historico.length !== 1 ? 's' : ''}</div>
        </div>
        <div style="min-width:90px;display:flex;justify-content:flex-end">
          <button class="followup-btn-sm secondary" onclick="verHistoricoFollowup('${leadId}', '${nome.replace(/'/g, "\\'")}')">
            Histórico
          </button>
        </div>
      </div>`;
  }).join('');
}

async function verHistoricoFollowup(leadId, nome) {
  const { data: historico } = await sb
    .from('follow_ups')
    .select('*')
    .eq('lead_id', leadId)
    .order('enviado_em', { ascending: false });

  const items = historico || [];

  document.getElementById('modal-content').innerHTML = `
    <div style="margin-bottom:1.25rem">
      <div class="modal-name">Histórico de Follow-up</div>
      <div class="modal-phone">${nome}</div>
    </div>
    <div class="modal-section">Mensagens (${items.length})</div>
    <div style="margin-top:12px">
      ${items.length === 0
        ? '<div class="empty">Nenhum follow-up</div>'
        : items.map(f => `
            <div class="history-item">
              <div class="history-dot"></div>
              <div class="history-content">
                <div class="history-date">
                  ${new Date(f.enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="history-msg">"${f.mensagem}"</div>
              </div>
            </div>`).join('')
      }
    </div>`;

  document.getElementById('modal').classList.add('open');
}
