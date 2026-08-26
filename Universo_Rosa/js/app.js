// app.js — site público do Universo Rosa
// Carrega serviços, agenda, CMS, links pro Rosa Modas e modo noturno

import { API_URL, ROSA_MODAS_URL } from './api-config.js';

// --- Máscara de telefone (formato (11) 99999-9999) ---
const telInput = document.getElementById('telefone');
if (telInput) {
    telInput.addEventListener('input', () => {
        let v = telInput.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        else if (v.length > 0) v = `(${v}`;
        telInput.value = v;
    });
}

// --- Agendamento ---
const formAgendamento = document.getElementById('form-agendamento');
const alertAgendamento = document.getElementById('agendamento-alert');

if (formAgendamento) {
    formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = document.getElementById('btn-submit-agendamento');

        // Pega dados do formulário
        const servico = document.getElementById('servico').value;
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const dataStr = document.getElementById('selected-date-time').value;
        const modalidade = document.querySelector('input[name="modalidade"]:checked')?.value || '';

        // Validações básicas
        if (!servico) return mostrarErro('Selecione o atendimento desejado.');
        if (!modalidade) return mostrarErro('Escolha Presencial ou Online.');
        if (!nome) return mostrarErro('Informe seu nome completo.');
        const telNumeros = telefone.replace(/\D/g, '');
        if (telNumeros.length < 10 || telNumeros.length > 11) return mostrarErro('Telefone inválido. Use DDD.');
        if (!dataStr) return mostrarErro('Escolha data e horário.');

        function mostrarErro(msg) {
            alertAgendamento.className = 'alert error';
            alertAgendamento.textContent = msg;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Aguarde...';

        try {
            // Evita agendamento duplicado pro mesmo telefone
            const resp = await fetch(`${API_URL}/agendamentos`);
            const existentes = await resp.json();
            const agora = new Date();

            const temDuplicado = existentes.some(ag => {
                const tel = (ag.telefone || '').replace(/\D/g, '');
                if (tel !== telNumeros) return false;
                const dataAg = new Date(ag.dataHora);
                const ativo = !ag.status || ag.status.toLowerCase() !== 'cancelado';
                return ativo && dataAg > agora;
            });

            if (temDuplicado) {
                mostrarErro('⚠️ Já existe agendamento ativo pra este telefone.');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Confirmar Agendamento';
                return;
            }

            // Envia agendamento pro backend
            const novo = { servico, modalidade, nomeCliente: nome, telefone, dataHora: dataStr, status: 'pendente' };
            const saveRes = await fetch(`${API_URL}/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novo)
            });

            if (!saveRes.ok) throw new Error('Erro ao salvar.');

            // Sucesso — limpa form e recarrega agenda
            alertAgendamento.className = 'alert success';
            alertAgendamento.textContent = 'Agendamento enviado! Aguarde confirmação.';
            formAgendamento.reset();
            document.getElementById('selected-date-time').value = '';
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
            const slots = document.getElementById('time-slots');
            if (slots) slots.innerHTML = '<p style="color:#888;font-size:.95rem">Selecione um dia acima para ver horários.</p>';
            inicializarAgenda();
            document.getElementById('modal-aviso').style.display = 'flex';

        } catch (err) {
            console.error('Erro ao agendar:', err);
            mostrarErro('Erro ao agendar. Tente novamente.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Confirmar Agendamento';
        }
    });
}

// --- Serviços espirituais ---
let servicosEspirituais = [];

// Formata preço pra Real
function formatarPreco(v) {
    const n = Number(v);
    if (isNaN(n) || n <= 0) return null;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte "PRESENCIAL,ONLINE" pra "🏠 Presencial • 💻 Online"
function labelModalidades(m) {
    const lista = (m || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    if (!lista.length) return null;
    const nomes = { presencial: '🏠 Presencial', online: '💻 Online' };
    return lista.map(x => nomes[x] || x).join(' • ');
}

// Ícone do serviço: usa o do admin ou detecta pelo nome
function iconeServico(s) {
    if (s.icone?.trim()) return s.icone;
    const n = (s.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapa = [
        ['cartas', '🃏'], ['consulta', '🔮'], ['orientacao', '✨'],
        ['energia', '💫'], ['vida', '🕊️'], ['mediunidade', '🕯️'],
        ['espiritual', '🕊️'], ['acolhimento', '🤲'], ['oracao', '🙏'], ['reiki', '🖐️']
    ];
    for (const [p, i] of mapa) if (n.includes(p)) return i;
    return '✦';
}

// Mostra/oculta modalidades conforme serviço escolhido
function atualizarModalidadesDoServico() {
    const sel = document.getElementById('servico');
    if (!sel) return;
    const s = servicosEspirituais.find(x => x.nome === sel.value);
    const permitidas = s?.modalidades?.split(',').map(x => x.trim().toLowerCase()).filter(Boolean) || [];
    document.querySelectorAll('.modalidade-label').forEach(lbl => {
        const radio = lbl.querySelector('input[name="modalidade"]');
        if (!radio) return;
        const ok = !permitidas.length || permitidas.includes(radio.value);
        lbl.style.display = ok ? '' : 'none';
    });
    const checked = document.querySelector('input[name="modalidade"]:checked');
    if (checked && checked.closest('.modalidade-label').style.display === 'none') checked.checked = false;
}

// Carrega serviços da API e monta cards + select
async function carregarServicos() {
    try {
        const resp = await fetch(`${API_URL}/servicos?site=UNIVERSO_ROSA`);
        if (!resp.ok) throw new Error('Falha ao buscar serviços.');
        servicosEspirituais = await resp.json();

        // Só mostra "Disponível"
        servicosEspirituais = servicosEspirituais.filter(s => {
            const st = (s.status || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return !st || st === 'disponivel';
        });

        const container = document.getElementById('servicos-container');
        if (!container) return;

        if (!servicosEspirituais.length) {
            container.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1">Nenhum atendimento cadastrado.</p>';
        } else {
            container.innerHTML = '';
            servicosEspirituais.forEach(s => {
                const card = document.createElement('div');
                card.className = 'product-card';
                const preco = formatarPreco(s.preco);
                const mods = labelModalidades(s.modalidades);
                card.innerHTML = `
                    <div class="product-icon" aria-hidden="true">${iconeServico(s)}</div>
                    <div class="product-info">
                        <h3 class="product-title">${s.nome}</h3>
                        <p class="product-desc">${s.descricao || 'Atendimento espiritual disponível.'}</p>
                        ${preco ? `<p class="product-price">${preco}</p>` : ''}
                        ${mods ? `<p class="product-modalities">${mods}</p>` : ''}
                        <a href="#agendamento" class="hero-btn btn-spiritual" style="padding:.6rem 1.5rem;font-size:.95rem" data-servico="${s.nome}">Agendar</a>
                    </div>`;
                card.querySelector('[data-servico]').addEventListener('click', () => selecionarServicoEspiritual(s.nome));
                container.appendChild(card);
            });
        }
        carregarServicosNoAgendamento();
    } catch (err) {
        console.error('Erro ao carregar serviços:', err);
        const c = document.getElementById('servicos-container');
        if (c) c.innerHTML = '<p style="text-align:center;color:#c62828">Erro ao carregar. Tente depois.</p>';
    }
}

// Preenche select do agendamento
function carregarServicosNoAgendamento() {
    const sel = document.getElementById('servico');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o atendimento</option>';
    if (!servicosEspirituais.length) {
        sel.innerHTML = '<option value="">Nenhum disponível</option>';
        return;
    }
    servicosEspirituais.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.nome;
        opt.textContent = s.nome;
        sel.appendChild(opt);
    });
    atualizarModalidadesDoServico();
    if (!sel.dataset.modalListener) {
        sel.dataset.modalListener = '1';
        sel.addEventListener('change', atualizarModalidadesDoServico);
    }
}

// Quando clica em "Agendar" no card
function selecionarServicoEspiritual(nome) {
    const sel = document.getElementById('servico');
    if (!sel) return;
    sel.value = nome;
    atualizarModalidadesDoServico();
}
window.selecionarServicoEspiritual = selecionarServicoEspiritual;

// --- Config da agenda (intervalo, horários, dias, bloqueios) ---
let agendaConfig = { intervalo: 60, horaInicio: '09:00', horaFim: '18:00', diasSemana: [1,2,3,4,5,6], datasBloqueadas: [] };

// Inicializa carrossel de datas e carrega horários
async function inicializarAgenda() {
    const carousel = document.getElementById('date-carousel');
    if (!carousel) return;

    try {
        // Config
        const cfgResp = await fetch(`${API_URL}/config-agenda`);
        const cfg = await cfgResp.json();
        if (cfg) {
            agendaConfig.intervalo = parseInt(cfg.intervalo || '60');
            agendaConfig.horaInicio = cfg.horaInicio || '09:00';
            agendaConfig.horaFim = cfg.horaFim || '18:00';
            agendaConfig.diasSemana = (cfg.diasSemana || '1,2,3,4,5,6').split(',').map(Number);
            agendaConfig.datasBloqueadas = cfg.datasBloqueadas ? cfg.datasBloqueadas.split(',') : [];
        }

        // Agendamentos existentes
        const agResp = await fetch(`${API_URL}/agendamentos`);
        const agendamentos = await agResp.json();

        carousel.innerHTML = '';
        const hoje = new Date();
        let gerados = 0, dia = new Date(hoje);

        // Próximos 14 dias úteis (até 30 dias à frente)
        for (let i = 0; i < 30 && gerados < 14; i++) {
            const ds = dia.getDay();
            const dataStr = dia.toISOString().split('T')[0];
            const trabalhado = agendaConfig.diasSemana.includes(ds);
            const bloqueado = agendaConfig.datasBloqueadas.includes(dataStr);
            let valido = true;

            if (i === 0) {
                const [fh, fm] = agendaConfig.horaFim.split(':').map(Number);
                const limite = new Date(hoje);
                limite.setHours(fh, fm, 0, 0);
                if (hoje >= limite) valido = false;
            }

            if (trabalhado && !bloqueado && valido) {
                const card = document.createElement('div');
                card.className = 'date-card';
                card.dataset.date = dataStr;
                card.innerHTML = `<span class="day-name">${dia.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</span><span class="day-num">${dia.getDate()}</span>`;
                card.addEventListener('click', () => {
                    document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    carregarHorariosDoDia(dataStr, agendamentos);
                });
                carousel.appendChild(card);
                gerados++;
            }
            dia.setDate(dia.getDate() + 1);
        }

        if (!gerados) carousel.innerHTML = '<p style="color:#c62828">Sem dias disponíveis no momento.</p>';
    } catch (err) {
        console.error('Erro ao iniciar agenda:', err);
    }
}

// Gera grade de horários pro dia selecionado
function carregarHorariosDoDia(dataStr, agendamentos) {
    const container = document.getElementById('time-slots');
    if (!container) return;
    container.innerHTML = '';

    const [sh, sm] = agendaConfig.horaInicio.split(':').map(Number);
    const [eh, em] = agendaConfig.horaFim.split(':').map(Number);
    const hoje = new Date();
    const ehHoje = dataStr === hoje.toISOString().split('T')[0];

    let slot = new Date(); slot.setHours(sh, sm, 0, 0);
    const fim = new Date(); fim.setHours(eh, em, 0, 0);
    let count = 0;

    while (slot < fim) {
        const hora = slot.toTimeString().split(' ')[0].slice(0, 5);
        const dt = `${dataStr}T${hora}`;
        let passou = false;
        if (ehHoje) {
            const completo = new Date(dt);
            if (hoje >= completo) passou = true;
        }

        const ocupado = agendamentos.some(a => a.dataHora === dt && (a.status || '').toLowerCase() !== 'cancelado');

        if (!passou) {
            const btn = document.createElement('div');
            btn.className = 'time-slot';
            if (ocupado) {
                btn.className += ' booked';
                btn.innerHTML = `${hora}<span style="font-size:.7rem;display:block">Ocupado</span>`;
            } else {
                btn.textContent = hora;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('selected-date-time').value = dt;
                });
            }
            container.appendChild(btn);
            count++;
        }
        slot.setMinutes(slot.getMinutes() + agendaConfig.intervalo);
    }
    if (!count) container.innerHTML = '<p style="color:#c62828">Sem horários hoje.</p>';
}

// --- CMS (textos editáveis pelo painel) ---
async function carregarConteudoCMS() {
    try {
        const resp = await fetch(`${API_URL}/conteudo?site=UNIVERSO_ROSA`);
        const c = await resp.json();
        if (!c) return;
        const ht = document.querySelector('.hero-spiritual-only .hero-title');
        const hd = document.querySelector('.hero-spiritual-only .hero-description');
        if (ht && c.heroTitulo) ht.textContent = c.heroTitulo;
        if (hd && c.heroDescricao) hd.textContent = c.heroDescricao;
        const fs = document.querySelector('footer p:nth-of-type(1)');
        if (fs && c.footerSlogan) fs.textContent = c.footerSlogan;
    } catch (e) {
        console.error('Erro CMS:', e);
    }
}

// Links pro Rosa Modas
function aplicarLinksRosaModas() {
    document.querySelectorAll('#link-rosa-modas, #link-rosa-modas-footer').forEach(l => { if (l) l.href = ROSA_MODAS_URL; });
}

// --- Inicialização ---
window.addEventListener('DOMContentLoaded', () => {
    carregarServicos();
    carregarConteudoCMS();
    aplicarLinksRosaModas();
    inicializarAgenda();
    inicializarModoNoturno();
});

// --- Modo noturno ---
function inicializarModoNoturno() {
    const btn = document.getElementById('btn-dark-mode');
    if (!btn) return;
    const pref = localStorage.getItem('modoNoturno');
    if (pref === 'ativo') { document.body.classList.add('dark-mode'); btn.textContent = '☀️'; btn.setAttribute('aria-label', 'Desativar modo noturno'); }
    btn.addEventListener('click', () => {
        const on = document.body.classList.toggle('dark-mode');
        btn.textContent = on ? '☀️' : '🌙';
        btn.setAttribute('aria-label', on ? 'Desativar modo noturno' : 'Ativar modo noturno');
        localStorage.setItem('modoNoturno', on ? 'ativo' : 'inativo');
    });
}