// admin.js — painel administrativo (Rosa Modas + Universo Rosa)
// Login, CRUD de produtos/serviços/promoções/procedimentos, agendamentos, agenda, CMS, configs

import { API_URL } from './api-config.js';

// --- Config do estabelecimento (endereço, contatos) ---
let siteConfigCache = null;
async function obterSiteConfig() {
    if (siteConfigCache) return siteConfigCache;
    try {
        const r = await fetch(`${API_URL}/site-config`);
        if (!r.ok) throw new Error('Erro ao carregar configuração geral.');
        siteConfigCache = await r.json();
    } catch (e) {
        console.error('Erro ao carregar config geral:', e);
        siteConfigCache = { endereco: 'Endereço não configurado' };
    }
    return siteConfigCache;
}

// Badge colorido pro site do registro
function siteBadge(site) {
    const s = site || 'ROSA_MODAS';
    const ur = s === 'UNIVERSO_ROSA';
    const label = ur ? '💜 Universo Rosa' : '🌸 Rosa Modas';
    const cor = ur ? '#7c3aed' : '#d81b60';
    return `<span style="display:inline-block;padding:.2rem .6rem;border-radius:999px;background:${cor}1a;color:${cor};font-weight:600;font-size:.8rem;white-space:nowrap">${label}</span>`;
}

// Ícone fallback pra serviços/procedimentos sem ícone customizado
function iconeVisual(nome) {
    const n = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapa = [
        ['cartas', '🃏'], ['consulta', '🔮'], ['orientacao', '✨'], ['energia', '💫'],
        ['vida', '🕊️'], ['mediunidade', '🕯️'], ['espiritual', '🕊️'],
        ['escova', '💇‍♀️'], ['botox', '💆‍♀️'], ['progressiva', '💁‍♀️'], ['hidratacao', '💧'],
        ['alisamento', '🧖‍♀️'], ['tintura', '🎨'], ['mechas', '✨'], ['luzes', '✨'],
        ['corte', '✂️'], ['manicure', '💅'], ['massagem', '💆'], ['limpeza', '🧴'], ['reconstrucao', '🔬']
    ];
    for (const [p, i] of mapa) if (n.includes(p)) return i;
    return '✦';
}

// Extrai mensagem de erro da resposta da API
async function lerErroResposta(r) {
    try { const d = await r.json(); return (d && d.message) || null; } catch { return null; }
}

// Escapa caracteres especiais para inserção segura em HTML
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// --- DOM ---
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const formLogin = document.getElementById('form-login');
const loginAlert = document.getElementById('login-alert');
const btnLogout = document.getElementById('btn-logout');

// Menu mobile
window.toggleModulesMenu = () => {
    const ml = document.getElementById('mobile-module-list');
    if (ml) ml.classList.toggle('open');
};

// Troca painel ativo
window.showPanel = (key, link) => {
    const norm = key === 'home' ? 'panel-home' : (key.startsWith('panel-') ? key : `panel-${key}`);
    const target = document.getElementById(norm);
    const labels = {
        agendamentos: 'Agendamentos', promocoes: 'Promoções', produtos: 'Catálogo de Roupas',
        procedimentos: 'Procedimentos', espiritual: 'Espiritual', conteudo: 'Conteúdo do Site',
        'config-agenda': 'Configurações da Agenda', 'config-geral': 'Configurações Gerais', home: 'Painel'
    };
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    if (target) target.classList.add('active');
    const act = document.querySelector(`.admin-nav a[data-panel="${key}"]`);
    if (act) act.classList.add('active');
    const ml = document.getElementById('mobile-module-list');
    if (ml) ml.classList.remove('open');
    const ph = document.getElementById('panel-header');
    const tl = document.getElementById('mobile-current-module-label');
    const pt = document.getElementById('panel-title');
    const lb = labels[key] || labels.home;
    if (key === 'home') { if (ph) ph.classList.add('hidden'); if (tl) tl.textContent = 'Selecione um módulo'; }
    else { if (ph) ph.classList.remove('hidden'); if (tl) tl.textContent = lb; }
    if (pt) pt.textContent = lb;
    if (window.innerWidth <= 992) document.querySelector('.admin-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Inicializa painel home
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.showPanel('home', null));
else window.showPanel('home', null);

// --- Login ---
function verificarSessao() {
    const s = localStorage.getItem('admin_session');
    if (s) { loginSection.style.display = 'none'; adminDashboard.style.display = 'flex'; carregarAdminExtras(); }
    else { loginSection.style.display = 'flex'; adminDashboard.style.display = 'none'; }
}

if (formLogin) {
    formLogin.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const btn = document.getElementById('btn-login');
        btn.disabled = true; btn.textContent = 'Aguarde...';
        try {
            const r = await fetch(`${API_URL}/admin/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const d = await r.json();
            if (r.ok) {
                localStorage.setItem('admin_session', JSON.stringify(d));
                loginSection.style.display = 'none';
                adminDashboard.style.display = 'flex';
                carregarAdminExtras();
                formLogin.reset();
            } else {
                loginAlert.className = 'alert error';
                loginAlert.textContent = d.message || 'Email ou senha errados.';
            }
        } catch (e) {
            console.error(e);
            loginAlert.className = 'alert error';
            loginAlert.textContent = 'Erro ao conectar.';
        } finally { btn.disabled = false; btn.textContent = 'Entrar'; }
    });
}

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('admin_session');
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    });
}

// --- Agendamentos ---
async function carregarAgendamentos() {
    const tbody = document.getElementById('tabela-agendamentos');
    try {
        const r = await fetch(`${API_URL}/agendamentos`);
        if (!r.ok) throw new Error('Erro ao carregar agendamentos.');
        const ags = await r.json();
        ags.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

        if (!ags.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhum agendamento.</td></tr>'; return; }

        tbody.innerHTML = '';
        ags.forEach(ag => {
            const dt = ag.dataHora ? new Date(ag.dataHora).toLocaleString('pt-BR') : ag.dataHora;
            const st = ag.status || 'pendente';
            const badge = st === 'confirmado'
                ? '<span style="background:#e8f5e9;color:#2e7d32;padding:.3rem .7rem;border-radius:99px;font-size:.8rem;font-weight:700">✅ Confirmado</span>'
                : st === 'cancelado'
                ? '<span style="background:#ffebee;color:#c62828;padding:.3rem .7rem;border-radius:99px;font-size:.8rem;font-weight:700">❌ Cancelado</span>'
                : '<span style="background:#fff8e1;color:#f57f17;padding:.3rem .7rem;border-radius:99px;font-size:.8rem;font-weight:700">⏳ Pendente</span>';
            const mod = ag.modalidade === 'online' ? '💻 Online' : ag.modalidade === 'presencial' ? '🏠 Presencial' : '—';

            const btnConf = st !== 'confirmado'
                ? `<button onclick="window.confirmarAgendamento('${ag.id}','${(ag.telefone||'').replace(/\D/g,'')}','${(ag.nomeCliente||'').replace(/'/g,"\\'")}','${(ag.dataHora||'').replace(/'/g,"\\'")}','${(ag.servico||'').replace(/'/g,"\\'")}','${(ag.modalidade||'').replace(/'/g,"\\\\'")}')" style="background:#e8f5e9;color:#2e7d32;border:none;padding:.4rem .7rem;border-radius:5px;cursor:pointer;font-size:.8rem;margin-right:4px">✅ Confirmar</button>`
                : '';

            const btnCan = (st === 'pendente' || st === 'confirmado')
                ? `<button onclick="window.cancelarAgendamento('${ag.id}','${(ag.telefone||'').replace(/\D/g,'')}','${(ag.nomeCliente||'').replace(/'/g,"\\'")}','${(ag.dataHora||'').replace(/'/g,"\\'")}','${(ag.servico||'').replace(/'/g,"\\'")}','${(ag.modalidade||'').replace(/'/g,"\\\\'")}')" style="background:#fff3e0;color:#e65100;border:none;padding:.4rem .7rem;border-radius:5px;cursor:pointer;font-size:.8rem;margin-right:4px">❌ Cancelar</button>`
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dt}</td><td><strong>${escapeHtml(ag.nomeCliente)}</strong></td><td>${escapeHtml(ag.servico)}</td>
                <td>${mod}</td><td><a href="https://wa.me/55${(ag.telefone||'').replace(/\D/g,'')}" target="_blank" style="color:#25D366;font-weight:bold">${escapeHtml(ag.telefone)}</a></td>
                <td>${badge}</td><td style="white-space:nowrap">${btnConf}${btnCan}<button onclick="window.excluirAgendamento('${ag.id}')" style="background:#ffebee;color:#c62828;border:none;padding:.4rem .7rem;border-radius:5px;cursor:pointer;font-size:.8rem">🗑 Excluir</button></td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erro agendamentos:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="color:red;text-align:center">Erro ao carregar.</td></tr>';
    }
}

// Exclui agendamento (apaga do banco)
window.excluirAgendamento = async id => {
    if (!confirm('Excluir esta reserva? Horário volta a ficar livre.')) return;
    try {
        const r = await fetch(`${API_URL}/agendamentos/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Erro ao excluir agendamento.');
        alert('Excluído!');
        carregarAgendamentos();
    } catch (e) {
        console.error('Erro excluir:', e);
        alert('Erro ao excluir.');
    }
};

// Confirma agendamento + abre WhatsApp pro cliente
window.confirmarAgendamento = async (id, tel, nome, dh, serv, mod) => {
    if (!confirm(`Confirmar ${nome}?`)) return;
    try {
        // Evita confirmar se já tem outro ativo no mesmo horário
        const r = await fetch(`${API_URL}/agendamentos`);
        if (!r.ok) throw new Error('Erro ao verificar conflitos.');
        const todos = await r.json();
        const conflito = todos.some(a => String(a.id) !== String(id) && (a.status||'').toLowerCase() !== 'cancelado' && a.dataHora === dh);
        if (conflito) return alert(`⚠️ Já existe outro agendamento ativo pra ${new Date(dh).toLocaleString('pt-BR')}.`);

        // Atualiza status no backend
        const res = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmado', modalidade: mod })
        });

        // Verifica se a API respondeu com sucesso
        if (!res.ok) {
            throw new Error('Falha ao confirmar no servidor');
        }

        const fmt = new Date(dh).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const online = (mod || '').trim().toLowerCase() === 'online';
        const linhaMod = online
            ? `💻 Modalidade: *Online*\nAtendimento online. Orientações de acesso combinadas pelo WhatsApp.`
            : `🏠 Modalidade: *Presencial*\n📍 Endereço: *${(await obterSiteConfig()).endereco || 'Não configurado'}*`;

        const msg = encodeURIComponent(
            `✅ Olá ${nome}! Agendamento *CONFIRMADO*!\n📅 ${fmt}\n🔮 ${serv}\n${linhaMod}\nUniverso Rosa 💜`
        );
        if (tel.length >= 10) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
        alert('Confirmado! WhatsApp aberto pro cliente.');
        carregarAgendamentos();
    } catch (e) { console.error('Erro confirmar:', e); alert('Erro ao confirmar.'); }
};

// Cancela agendamento + abre WhatsApp pro cliente
window.cancelarAgendamento = async (id, tel, nome, dh, serv, mod) => {
    if (!confirm(`Cancelar ${nome}?`)) return;
    try {
        // Atualiza status no backend
        const res = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelado' })
        });

        // Verifica se a API respondeu com sucesso
        if (!res.ok) {
            throw new Error('Falha ao cancelar no servidor');
        }

        const fmt = new Date(dh).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const msg = encodeURIComponent(
            `Olá ${nome}.\nInfelizmente tivemos um imprevisto e não dá pra fazer seu agendamento de ${serv} dia ${fmt}.\n\nDesculpe o transtorno.\n\nChama a gente pra remarcar.\n\nObrigado pela compreensão.`
        );
        if (tel.length >= 10) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
        alert('Cancelado! WhatsApp aberto pro cliente.');
        carregarAgendamentos();
    } catch (e) {
        console.error('Erro cancelar:', e);
        alert('Erro ao cancelar.');
    }
};

// --- Produtos (só texto + emoji) ---
const formProduto = document.getElementById('form-produto');
const produtoAlert = document.getElementById('produto-alert');

if (formProduto) {
    formProduto.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-produto');
        const id = document.getElementById('prod-id').value;
        const edit = !!id;
        btn.disabled = true;
        btn.textContent = edit ? 'Atualizando...' : 'Salvando...';
        const nome = document.getElementById('prod-nome').value;
        const preco = document.getElementById('prod-preco').value;
        const icone = document.getElementById('prod-icone').value || '🌹';
        try {
            const u = edit ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;
            const r = await fetch(u, {
                method: edit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    preco: Number(preco),
                    icone,
                    status: 'Disponível',
                    site: document.getElementById('prod-site')?.value || 'ROSA_MODAS'
                })
            });
            if (!r.ok) throw new Error(edit ? 'Erro ao atualizar.' : 'Erro ao salvar.');
            produtoAlert.className = 'alert success';
            produtoAlert.textContent = edit ? 'Atualizado!' : 'Salvo!';
            formProduto.reset();
            document.getElementById('prod-id').value = '';
            btn.textContent = 'Salvar Produto';
            carregarProdutosAdmin();
        } catch (er) {
            console.error(er);
            produtoAlert.className = 'alert error';
            produtoAlert.textContent = er.message;
        } finally {
            btn.disabled = false;
            if (!edit) btn.textContent = 'Salvar Produto';
        }
    });
}

async function carregarProdutosAdmin() {
    const t = document.getElementById('tabela-produtos');
    try {
        const r = await fetch(`${API_URL}/produtos`);
        if (!r.ok) throw new Error('Erro ao carregar produtos.');
        const ps = await r.json();
        if (!ps.length) { t.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum produto.</td></tr>'; return; }
        t.innerHTML = '';
        ps.forEach(p => {
            const tr = document.createElement('tr');
            const preco = Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const ic = p.icone || '🌹';
            const sel = `<select onchange="window.alterarStatusProduto('${p.id}',this.value)" style="padding:.3rem;border-radius:5px"><option value="Disponível" ${p.status==='Disponível'?'selected':''}>Disponível</option><option value="Esgotado" ${p.status==='Esgotado'?'selected':''}>Esgotado</option></select>`;
            tr.innerHTML = `<td><span class="admin-icon" style="font-size:1.8rem">${ic}</span></td><td>${escapeHtml(p.nome)}</td><td>${preco}</td><td>${sel}</td><td>${siteBadge(p.site)}</td><td style="white-space:nowrap"><button onclick="window.editarProduto('${p.id}','${(p.nome||'').replace(/'/g,"\\'")}','${Number(p.preco)||0}','${p.icone||'🌹'}','${p.status||'Disponível'}','${p.site||'ROSA_MODAS'}')" style="background:#e3f2fd;color:#1565c0;border:none;padding:.5rem;border-radius:5px;cursor:pointer;margin-right:4px">✏️ Editar</button><button onclick="window.excluirProduto('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:.5rem;border-radius:5px;cursor:pointer">Excluir</button></td>`;
            t.appendChild(tr);
        });
    } catch (e) { console.error('Erro produtos:', e); }
}

window.alterarStatusProduto = async (id, st) => {
    try {
        const r = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: st })
        });
        if (!r.ok) throw new Error('Erro ao alterar status.');
        alert('Status: ' + st);
    } catch (e) {
        console.error('Erro status:', e);
        alert('Erro status.');
    }
};

window.excluirProduto = async id => {
    if (!confirm('Excluir esta peça?')) return;
    try {
        const r = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Erro ao excluir produto.');
        carregarProdutosAdmin();
    } catch (e) {
        console.error('Erro excluir produto:', e);
        alert('Erro excluir.');
    }
};

window.editarProduto = (id, nome, preco, icone, status, site) => {
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-nome').value = nome;
    document.getElementById('prod-preco').value = preco;
    if (icone) document.getElementById('prod-icone').value = icone;
    if (status) document.getElementById('prod-status').value = status;
    if (site) document.getElementById('prod-site').value = site;
    document.getElementById('btn-add-produto').textContent = 'Atualizar Produto';
    document.getElementById('btn-add-produto').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// --- Promoções (só texto + período) ---
const formPromocao = document.getElementById('form-promocao');
const promoAlert = document.getElementById('promo-alert');
const tabelaPromocoes = document.getElementById('tabela-promocoes');

async function carregarPromocoesAdmin() {
    if (!tabelaPromocoes) return;
    try {
        const r = await fetch(`${API_URL}/promocoes`);
        if (!r.ok) throw new Error('Erro ao carregar promoções.');
        const ps = await r.json();
        if (!ps.length) { tabelaPromocoes.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhuma promoção.</td></tr>'; return; }
        tabelaPromocoes.innerHTML = '';
        ps.forEach(p => {
            let per = '-';
            if (p.dataInicio && p.dataFim) {
                const [iy, im, id] = p.dataInicio.split('-').map(Number);
                const [fy, fm, fd] = p.dataFim.split('-').map(Number);
                per = `${String(id).padStart(2,'0')}/${String(im).padStart(2,'0')}/${iy} até ${String(fd).padStart(2,'0')}/${String(fm).padStart(2,'0')}/${fy}`;
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${escapeHtml(p.titulo)}</td><td>${per}</td><td>${p.status||'Inativa'}</td><td>${siteBadge(p.site)}</td><td><button onclick="window.excluirPromocao('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:.5rem;border-radius:5px;cursor:pointer">Excluir</button></td>`;
            tabelaPromocoes.appendChild(tr);
        });
    } catch (e) { console.error('Erro promoções:', e); }
}

if (formPromocao) {
    formPromocao.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-promocao');
        btn.disabled = true;
        btn.textContent = 'Salvando...';
        const nv = {
            titulo: document.getElementById('promo-titulo').value,
            descricao: document.getElementById('promo-descricao').value,
            status: document.getElementById('promo-status').value,
            dataInicio: document.getElementById('promo-data-inicio').value,
            dataFim: document.getElementById('promo-data-fim').value,
            site: document.getElementById('promo-site')?.value || 'ROSA_MODAS'
        };
        try {
            const r = await fetch(`${API_URL}/promocoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nv)
            });
            if (!r.ok) throw new Error('Erro ao salvar promoção.');
            promoAlert.className = 'alert success';
            promoAlert.textContent = 'Promoção salva!';
            formPromocao.reset();
            carregarPromocoesAdmin();
        } catch (e) {
            console.error('Erro promoção:', e);
            promoAlert.className = 'alert error';
            promoAlert.textContent = 'Erro ao salvar.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Promoção';
        }
    });
}

window.excluirPromocao = async id => {
    if (!confirm('Excluir promoção?')) return;
    try {
        const r = await fetch(`${API_URL}/promocoes/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Erro ao excluir promoção.');
        carregarPromocoesAdmin();
    } catch (e) {
        console.error('Erro excluir promoção:', e);
        alert('Erro excluir.');
    }
};

// --- Procedimentos ---
const formProcedimento = document.getElementById('form-procedimento');
const tabelaProcedimentos = document.getElementById('tabela-procedimentos');
const procAlert = document.getElementById('proc-alert');

async function carregarProcedimentosAdmin() {
    if (!tabelaProcedimentos) return;
    try {
        const r = await fetch(`${API_URL}/procedimentos`);
        if (!r.ok) throw new Error('Erro ao carregar procedimentos.');
        const ps = await r.json();
        if (!ps.length) { tabelaProcedimentos.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhum procedimento.</td></tr>'; return; }
        tabelaProcedimentos.innerHTML = '';
        ps.forEach(p => {
            const ic = p.icone || iconeVisual(p.nome);
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><span class="admin-icon">${ic}</span></td><td>${escapeHtml(p.nome)}</td><td>${p.status||'Disponível'}</td><td>${siteBadge(p.site)}</td><td style="white-space:nowrap"><button onclick="window.editarProcedimento('${p.id}','${(p.nome||'').replace(/'/g,"\\'")}','${(p.descricao||'').replace(/'/g,"\\'")}','${p.status||'Disponível'}','${p.icone||''}','${p.site||'ROSA_MODAS'}')" style="background:#e3f2fd;color:#1565c0;border:none;padding:.5rem;border-radius:5px;cursor:pointer;margin-right:4px">✏️ Editar</button><button onclick="window.excluirProcedimento('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:.5rem;border-radius:5px;cursor:pointer">🗑 Excluir</button></td>`;
            tabelaProcedimentos.appendChild(tr);
        });
    } catch (e) { console.error('Erro procedimentos:', e); }
}

if (formProcedimento) {
    formProcedimento.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-proc');
        const id = document.getElementById('proc-id').value;
        const edit = !!id;
        btn.disabled = true; btn.textContent = edit ? 'Atualizando...' : 'Salvando...';
        const payload = { nome: document.getElementById('proc-nome').value, descricao: document.getElementById('proc-descricao').value, status: document.getElementById('proc-status').value, icone: document.getElementById('proc-icone').value, site: document.getElementById('proc-site')?.value || 'ROSA_MODAS' };
        try {
            const u = edit ? `${API_URL}/procedimentos/${id}` : `${API_URL}/procedimentos`;
            const r = await fetch(u, { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const err = await lerErroResposta(r);
            if (!r.ok) throw new Error(err || (edit ? 'Erro ao atualizar.' : 'Erro ao salvar.'));
            procAlert.className = 'alert success'; procAlert.textContent = edit ? 'Atualizado!' : 'Salvo!';
            // Limpa o formulário e recarrega a lista
            formProcedimento.reset();
            document.getElementById('proc-id').value = '';
            btn.textContent = 'Salvar Procedimento';
            carregarProcedimentosAdmin();
        } catch (er) {
            console.error(er);
            procAlert.className = 'alert error';
            procAlert.textContent = er.message;
        } finally {
            btn.disabled = false;
            if (!edit) btn.textContent = 'Salvar Procedimento';
        }
    });
}

window.editarProcedimento = (id, nome, desc, status, icone, site) => {
    document.getElementById('proc-id').value = id;
    document.getElementById('proc-nome').value = nome;
    document.getElementById('proc-descricao').value = desc;
    document.getElementById('proc-status').value = status;
    if (icone) document.getElementById('proc-icone').value = icone;
    if (site) document.getElementById('proc-site').value = site;
    document.getElementById('btn-add-proc').textContent = 'Atualizar Procedimento';
    document.getElementById('btn-add-proc').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.excluirProcedimento = async id => {
    if (!confirm('Excluir?')) return;
    try {
        const r = await fetch(`${API_URL}/procedimentos/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Erro ao excluir procedimento.');
        carregarProcedimentosAdmin();
    } catch (e) {
        console.error('Erro excluir procedimento:', e);
        alert('Erro excluir.');
    }
};

// --- Serviços Espirituais ---
const formServico = document.getElementById('form-servico');
const tabelaServicos = document.getElementById('tabela-servicos');
const servAlert = document.getElementById('serv-alert');

async function carregarServicosAdmin() {
    if (!tabelaServicos) return;
    try {
        const r = await fetch(`${API_URL}/servicos`);
        if (!r.ok) throw new Error('Erro ao carregar serviços.');
        const ss = await r.json();
        if (!ss.length) { tabelaServicos.innerHTML = '<tr><td colspan="7" style="text-align:center">Nenhum serviço.</td></tr>'; return; }
        tabelaServicos.innerHTML = '';
        ss.forEach(s => {
            const preco = Number(s.preco) > 0 ? Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
            const mods = (s.modalidades || '').split(',').map(m => m.trim()).filter(Boolean);
            const modsFmt = mods.length ? mods.map(m => m.toUpperCase() === 'PRESENCIAL' ? '🏠 Presencial' : m.toUpperCase() === 'ONLINE' ? '💻 Online' : m).join(' • ') : 'Configurável';
            const ic = s.icone || iconeVisual(s.nome);
            const ms = s.modalidades || '';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><span class="admin-icon">${ic}</span></td><td>${escapeHtml(s.nome)}</td><td>${preco}</td><td>${modsFmt}</td><td>${s.status||'Disponível'}</td><td>${siteBadge(s.site)}</td><td style="white-space:nowrap"><button onclick="window.editarServico('${s.id}','${(s.nome||'').replace(/'/g,"\\'")}','${Number(s.preco)||0}','${(s.descricao||'').replace(/'/g,"\\'")}','${s.status||'Disponível'}','${ms}','${s.icone||''}')" style="background:#e3f2fd;color:#1565c0;border:none;padding:.5rem;border-radius:5px;cursor:pointer;margin-right:4px">✏️ Editar</button><button onclick="window.excluirServico('${s.id}')" style="background:#ffebee;color:#c62828;border:none;padding:.5rem;border-radius:5px;cursor:pointer">Excluir</button></td>`;
            tabelaServicos.appendChild(tr);
        });
    } catch (e) { console.error('Erro serviços:', e); }
}

if (formServico) {
    formServico.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-serv');
        const id = document.getElementById('serv-id').value;
        const edit = !!id;
        btn.disabled = true; btn.textContent = edit ? 'Atualizando...' : 'Salvando...';
        const mods = [];
        if (document.getElementById('serv-modal-presencial')?.checked) mods.push('PRESENCIAL');
        if (document.getElementById('serv-modal-online')?.checked) mods.push('ONLINE');
        const payload = { nome: document.getElementById('serv-nome').value, preco: Number(document.getElementById('serv-preco').value), descricao: document.getElementById('serv-descricao').value, status: document.getElementById('serv-status').value, modalidades: mods.join(','), icone: document.getElementById('serv-icone').value, site: document.getElementById('serv-site')?.value || 'UNIVERSO_ROSA' };
        try {
            const u = edit ? `${API_URL}/servicos/${id}` : `${API_URL}/servicos`;
            const r = await fetch(u, { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const err = await lerErroResposta(r);
            if (!r.ok) throw new Error(err || (edit ? 'Erro ao atualizar.' : 'Erro ao salvar.'));
            servAlert.className = 'alert success'; servAlert.textContent = edit ? 'Atualizado!' : 'Salvo!';
            // Limpa o formulário e recarrega a lista
            formServico.reset();
            document.getElementById('serv-id').value = '';
            btn.textContent = 'Salvar Serviço';
            carregarServicosAdmin();
        } catch (er) {
            console.error(er);
            servAlert.className = 'alert error';
            servAlert.textContent = er.message;
        } finally {
            btn.disabled = false;
            if (!edit) btn.textContent = 'Salvar Serviço';
        }
    });
}

window.excluirServico = async id => {
    if (!confirm('Excluir serviço?')) return;
    try {
        const r = await fetch(`${API_URL}/servicos/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('Erro ao excluir serviço.');
        carregarServicosAdmin();
    } catch (e) {
        console.error('Erro excluir serviço:', e);
        alert('Erro excluir.');
    }
};

window.editarServico = (id, nome, preco, desc, status, modalidades, icone) => {
    document.getElementById('serv-id').value = id;
    document.getElementById('serv-nome').value = nome;
    document.getElementById('serv-preco').value = preco;
    document.getElementById('serv-descricao').value = desc;
    document.getElementById('serv-status').value = status;
    if (modalidades) {
        const ms = modalidades.split(',');
        document.getElementById('serv-modal-presencial').checked = ms.includes('PRESENCIAL');
        document.getElementById('serv-modal-online').checked = ms.includes('ONLINE');
    }
    if (icone) document.getElementById('serv-icone').value = icone;
    document.getElementById('btn-add-serv').textContent = 'Atualizar Serviço';
    document.getElementById('btn-add-serv').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// --- CMS ---
const formConteudo = document.getElementById('form-conteudo');
const conteudoAlert = document.getElementById('conteudo-alert');

window.carregarConteudoCMS = async () => {
    try {
        const site = document.getElementById('cms-site')?.value || 'UNIVERSO_ROSA';
        const r = await fetch(`${API_URL}/conteudo?site=${site}`);
        if (!r.ok) throw new Error('Erro ao carregar conteúdo.');
        const c = await r.json();
        if (c) {
        document.getElementById('cms-hero-titulo').value = c.heroTitulo || '';
        document.getElementById('cms-hero-descricao').value = c.heroDescricao || '';
        document.getElementById('cms-footer-slogan').value = c.footerSlogan || '';
    }
    } catch (e) { console.error('Erro CMS:', e); if (conteudoAlert) { conteudoAlert.className = 'alert error'; conteudoAlert.textContent = 'Erro ao carregar conteúdo.'; } }
};

if (formConteudo) {
    formConteudo.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-conteudo');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const p = { site: document.getElementById('cms-site')?.value || 'UNIVERSO_ROSA', heroTitulo: document.getElementById('cms-hero-titulo').value, heroDescricao: document.getElementById('cms-hero-descricao').value, footerSlogan: document.getElementById('cms-footer-slogan').value };
        try {
            const r = await fetch(`${API_URL}/conteudo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
            if (!r.ok) throw new Error('Erro ao salvar conteúdo.');
            conteudoAlert.className = 'alert success';
            conteudoAlert.textContent = 'Conteúdo salvo!';
        } catch (e) {
            console.error('Erro conteúdo:', e);
            conteudoAlert.className = 'alert error';
            conteudoAlert.textContent = 'Erro ao salvar.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Conteúdo';
        }
    });
}

// --- Config Agenda ---
const formConfigGeral = document.getElementById('form-config-agenda-geral');
const configAlert = document.getElementById('config-agenda-alert');
let agendaConfigCache = null;

async function obterConfigAgenda() {
    const r = await fetch(`${API_URL}/config-agenda`);
    if (!r.ok) throw new Error('Erro ao carregar configuração da agenda.');
    const c = await r.json();
    agendaConfigCache = c; return c;
}
async function salvarConfigAgenda(p) {
    const r = await fetch(`${API_URL}/config-agenda`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    if (!r.ok) throw new Error('Erro ao salvar configuração da agenda.');
    agendaConfigCache = p;
}
function renderDatasBloqueadas(d) {
    const t = document.getElementById('tabela-datas-bloqueadas');
    if (!t) return;
    const ds = (d || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!ds.length) { t.innerHTML = '<tr><td colspan="2" style="text-align:center">Nenhuma data bloqueada.</td></tr>'; return; }
    t.innerHTML = '';
    ds.forEach(dta => {
        const [a, m, di] = dta.split('-');
        const fmt = `${di}/${m}/${a}`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${fmt}</td><td><button onclick="window.desbloquearData('${dta}')" style="background:#ffebee;color:#c62828;border:none;padding:.4rem .7rem;border-radius:5px;cursor:pointer;font-size:.8rem">Desbloquear</button></td>`;
        t.appendChild(tr);
    });
}
async function carregarConfigAgenda() {
    try {
        const c = await obterConfigAgenda();
        if (c) {
            document.getElementById('cfg-intervalo').value = c.intervalo || '60';
            document.getElementById('cfg-inicio').value = c.horaInicio || '09:00';
            document.getElementById('cfg-fim').value = c.horaFim || '18:00';
            const ds = (c.diasSemana || '1,2,3,4,5,6').split(',');
            for (let i = 0; i <= 6; i++) {
                const cb = document.getElementById(`cfg-dia-${i}`);
                if (cb) cb.checked = ds.includes(String(i));
            }
            renderDatasBloqueadas(c.datasBloqueadas);
        }
    } catch (e) { console.error('Erro config agenda:', e); if (configAlert) { configAlert.className = 'alert error'; configAlert.textContent = 'Erro ao carregar configurações da agenda.'; } }
}
if (formConfigGeral) {
    formConfigGeral.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-cfg-geral');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const sel = [];
        for (let i = 0; i <= 6; i++) {
            const cb = document.getElementById(`cfg-dia-${i}`);
            if (cb && cb.checked) sel.push(String(i));
        }
        try {
            const c = await obterConfigAgenda();
            await salvarConfigAgenda({ ...c, intervalo: parseInt(document.getElementById('cfg-intervalo').value), horaInicio: document.getElementById('cfg-inicio').value, horaFim: document.getElementById('cfg-fim').value, diasSemana: sel.join(',') });
            if (configAlert) { configAlert.className = 'alert success'; configAlert.textContent = 'Configurações salvas!'; }
        } catch { if (configAlert) { configAlert.className = 'alert error'; configAlert.textContent = 'Erro ao salvar.'; } } finally { btn.disabled = false; btn.textContent = 'Salvar Configurações'; }
    });
}
const formBloquearData = document.getElementById('form-bloquear-data');
if (formBloquearData) {
    formBloquearData.addEventListener('submit', async e => {
        e.preventDefault();
        const inp = document.getElementById('cfg-bloquear-data');
        const d = inp?.value; if (!d) return;
        try {
            const c = await obterConfigAgenda();
            const ds = (c.datasBloqueadas || '').split(',').map(x => x.trim()).filter(Boolean);
            if (!ds.includes(d)) ds.push(d);
            await salvarConfigAgenda({ ...c, datasBloqueadas: ds.join(',') });
            renderDatasBloqueadas(ds.join(',')); inp.value = '';
            if (configAlert) { configAlert.className = 'alert success'; configAlert.textContent = 'Data bloqueada!'; }
        } catch (e) { console.error('Erro bloquear data:', e); if (configAlert) { configAlert.className = 'alert error'; configAlert.textContent = 'Erro ao bloquear.'; } }
    });
}
window.desbloquearData = async d => {
    try {
        const c = await obterConfigAgenda();
        const ds = (c.datasBloqueadas || '').split(',').map(x => x.trim()).filter(Boolean).filter(x => x !== d);
        await salvarConfigAgenda({ ...c, datasBloqueadas: ds.join(',') });
        renderDatasBloqueadas(ds.join(','));
    } catch (e) { console.error('Erro desbloquear:', e); alert('Erro ao desbloquear data.'); }
};

// --- Config Geral (endereço/contatos) ---
const formSiteConfig = document.getElementById('form-config-geral');
const configGeralAlert = document.getElementById('config-geral-alert');

async function carregarConfigGeral() {
    try {
        const c = await obterSiteConfig();
        if (!c) return;

        // Função auxiliar para preencher campos do formulário
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v || '';
        };

        set('cfg-endereco', c.endereco);
        set('cfg-telefone', c.telefone);
        set('cfg-email', c.email);
        set('cfg-instagram', c.instagram);
    } catch (e) { console.error('Erro config geral:', e); if (configGeralAlert) { configGeralAlert.className = 'alert error'; configGeralAlert.textContent = 'Erro ao carregar configurações.'; } }
}
if (formSiteConfig) {
    formSiteConfig.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-config-geral');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const p = {
            id: 'main',
            endereco: document.getElementById('cfg-endereco').value,
            telefone: document.getElementById('cfg-telefone').value,
            email: document.getElementById('cfg-email').value,
            instagram: document.getElementById('cfg-instagram').value
        };
        try {
            const r = await fetch(`${API_URL}/site-config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
            if (!r.ok) throw new Error('Erro ao salvar configurações gerais.');
            siteConfigCache = p;
            configGeralAlert.className = 'alert success';
            configGeralAlert.textContent = 'Configurações salvas!';
        } catch (e) {
            console.error('Erro config geral:', e);
            configGeralAlert.className = 'alert error';
            configGeralAlert.textContent = 'Erro ao salvar.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Configurações';
        }
    });
}

// Carrega tudo depois do login
function carregarAdminExtras() {
    carregarAgendamentos();
    carregarProdutosAdmin();
    carregarPromocoesAdmin();
    carregarProcedimentosAdmin();
    carregarServicosAdmin();
    carregarConteudoCMS();
    carregarConfigAgenda();
    carregarConfigGeral();
}
verificarSessao();