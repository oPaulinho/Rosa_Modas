// admin.js
// --------
// Painel administrativo compartilhado (Universo Rosa + Rosa Modas).
// - Login via POST /auth/login (credenciais em variáveis de ambiente)
// - CRUD de serviços, produtos, procedimentos e promoções
// - Agenda: lista pendentes, confirma/cancela com notificação via WhatsApp
// - Configurações da agenda e números de administrador
// - CMS: textos editáveis (hero, rodapé) por site

import { API_URL } from './api-config.js';

// =============================================================
// ENDEREÇO CENTRALIZADO — altere aqui para atualizar em todo o admin
// =============================================================
const ENDERECO_PRESENCIAL = 'Rua das Rosas, 123 — Bairro Exemplo, SP';

// Cache das configurações gerais (endereço/contatos) vindas da REST API
let siteConfigCache = null;

// Busca (e cacheia) as configurações gerais do estabelecimento
async function obterSiteConfig() {
    if (siteConfigCache) return siteConfigCache;
    try {
        const res = await fetch(`${API_URL}/site-config`);
        if (!res.ok) throw new Error();
        siteConfigCache = await res.json();
    } catch (error) {
        console.error('Erro ao carregar configurações gerais:', error);
        siteConfigCache = { endereco: ENDERECO_PRESENCIAL };
    }
    return siteConfigCache;
}

// Badge visual do site a que o registro pertence
function siteBadge(site) {
    const s = site || 'ROSA_MODAS';
    const ehUniversoRosa = s === 'UNIVERSO_ROSA';
    const label = ehUniversoRosa ? '💜 Universo Rosa' : '🌸 Rosa Modas';
    const cor = ehUniversoRosa ? '#7c3aed' : '#d81b60';
    return `<span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:999px;background:${cor}1a;color:${cor};font-weight:600;font-size:0.8rem;white-space:nowrap;">${label}</span>`;
}

// Ícone visual padrão para serviços e procedimentos (sem depender de imagem).
// Cada registro ganha um ícone diferente conforme o nome, mantendo o visual bonito.
function iconeVisual(nome) {
    const n = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapa = [
        ['cartas', '🃏'],
        ['consulta', '🔮'],
        ['orientacao', '✨'],
        ['energia', '💫'],
        ['vida', '🕊️'],
        ['mediunidade', '🕯️'],
        ['espiritual', '🕊️'],
        ['escova', '💇‍♀️'],
        ['botox', '💆‍♀️'],
        ['progressiva', '💁‍♀️'],
        ['hidratacao', '💧'],
        ['alisamento', '🧖‍♀️'],
        ['tintura', '🎨'],
        ['mechas', '✨'],
        ['luzes', '✨'],
        ['corte', '✂️'],
        ['manicure', '💅'],
        ['massagem', '💆'],
        ['limpeza', '🧴'],
        ['reconstrucao', '🔬']
    ];
    for (const [palavra, icone] of mapa) {
        if (n.includes(palavra)) return icone;
    }
    return '✦';
}

// Lê a mensagem de erro real retornada pela API (se existir)
async function lerErroResposta(response) {
    try {
        const data = await response.json();
        return (data && data.message) || null;
    } catch (e) {
        return null;
    }
}

// --- ELEMENTOS DO DOM ---
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const formLogin = document.getElementById('form-login');
const loginAlert = document.getElementById('login-alert');
const btnLogout = document.getElementById('btn-logout');

// Exibe/oculta o menu móvel em telas menores
window.toggleModulesMenu = function () {
    const mobileList = document.getElementById('mobile-module-list');
    if (mobileList) {
        mobileList.classList.toggle('open');
    }
};

// Alterna os painéis administrativos correspondentes
window.showPanel = function (panelKey, clickedLink) {
    const normalizedKey = panelKey === 'home' ? 'panel-home' : (panelKey.startsWith('panel-') ? panelKey : `panel-${panelKey}`);
    const targetPanel = document.getElementById(normalizedKey);

    const panelLabels = {
        'agendamentos': 'Agendamentos',
        'promocoes': 'Promoções',
        'produtos': 'Catálogo de Roupas',
        'procedimentos': 'Procedimentos',
        'espiritual': 'Espiritual',
        'conteudo': 'Conteúdo do Site',
        'config-agenda': 'Configurações da Agenda',
        'config-geral': 'Configurações Gerais',
        'home': 'Painel Administrativo'
    };

    document.querySelectorAll('.admin-panel').forEach((panel) => {
        panel.classList.remove('active');
    });

    document.querySelectorAll('.admin-nav a').forEach((link) => {
        link.classList.remove('active');
    });

    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    const linkToActivate = clickedLink && clickedLink.dataset?.panel
        ? document.querySelector(`.admin-nav a[data-panel="${clickedLink.dataset.panel}"]`)
        : document.querySelector(`.admin-nav a[data-panel="${panelKey}"]`);

    if (linkToActivate) {
        linkToActivate.classList.add('active');
    }

    const mobileList = document.getElementById('mobile-module-list');
    if (mobileList) {
        mobileList.classList.remove('open');
    }

    const panelHeader = document.getElementById('panel-header');
    const titleLabel = document.getElementById('mobile-current-module-label');
    const panelTitle = document.getElementById('panel-title');
    const label = panelLabels[panelKey] || panelLabels['home'];

    if (panelKey === 'home') {
        if (panelHeader) panelHeader.classList.add('hidden');
        if (titleLabel) titleLabel.textContent = 'Selecione um módulo';
    } else {
        if (panelHeader) panelHeader.classList.remove('hidden');
        if (titleLabel) titleLabel.textContent = label;
    }

    if (panelTitle) {
        panelTitle.textContent = label;
    }

    if (window.innerWidth <= 992) {
        const content = document.querySelector('.admin-content');
        if (content) {
            content.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.showPanel('home', null);
    });
} else {
    window.showPanel('home', null);
}

// --- AUTENTICAÇÃO / LOGIN ---

// Verifica se existe sessão salva no localStorage ao iniciar a página
function verificarSessao() {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'flex';
        carregarAdminExtras();
    } else {
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

// Tenta realizar o Login chamando o endpoint de login da nossa API REST
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const btnLogin = document.getElementById('btn-login');

        btnLogin.disabled = true;
        btnLogin.textContent = "Aguarde...";

        try {
            const res = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (res.ok) {
                // Guarda a sessão de login localmente
                localStorage.setItem('admin_session', JSON.stringify(data));
                loginSection.style.display = 'none';
                adminDashboard.style.display = 'flex';
                carregarAdminExtras();
                formLogin.reset();
            } else {
                loginAlert.className = "alert error";
                loginAlert.textContent = data.message || "E-mail ou senha incorretos.";
            }
        } catch (error) {
            console.error(error);
            loginAlert.className = "alert error";
            loginAlert.textContent = "Erro ao conectar ao servidor.";
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        }
    });
}

// Realiza o Logout limpando a sessão
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('admin_session');
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    });
}

// --- AGENDAMENTOS ---

// Carrega os agendamentos registrados para gerenciar no painel administrativo
async function carregarAgendamentos() {
    const tabelaAgendamentos = document.getElementById('tabela-agendamentos');
    try {
        const response = await fetch(`${API_URL}/agendamentos`);
        const agendamentos = await response.json();

        // Ordena por data mais recente primeiro
        agendamentos.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

        if (agendamentos.length === 0) {
            tabelaAgendamentos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        tabelaAgendamentos.innerHTML = '';

        agendamentos.forEach((ag) => {
            let dataFormatada = ag.dataHora;
            if (ag.dataHora) {
                const dateObj = new Date(ag.dataHora);
                dataFormatada = dateObj.toLocaleString('pt-BR');
            }

            const statusAtual = ag.status || 'pendente';
            const statusBadge = statusAtual === 'confirmado'
                ? '<span style="background:#e8f5e9;color:#2e7d32;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">✅ Confirmado</span>'
                : statusAtual === 'cancelado'
                    ? '<span style="background:#ffebee;color:#c62828;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">❌ Cancelado</span>'
                    : '<span style="background:#fff8e1;color:#f57f17;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">⏳ Pendente</span>';

            const modalidadeLabel = ag.modalidade === 'online'
                ? '💻 Online'
                : ag.modalidade === 'presencial'
                    ? '🏠 Presencial'
                    : '—';

            const btnConfirmar = statusAtual !== 'confirmado'
                ? `<button onclick="window.confirmarAgendamento('${ag.id}', '${(ag.telefone || '').replace(/\D/g, '')}', '${(ag.nomeCliente || '').replace(/'/g, "\\'")}', '${(ag.dataHora || '').replace(/'/g, "\\'")}', '${(ag.servico || '').replace(/'/g, "\\'")}', '${(ag.modalidade || '').replace(/'/g, "\\\\'")}')" style="background:#e8f5e9;color:#2e7d32;border:none;padding:0.4rem 0.7rem;border-radius:5px;cursor:pointer;font-size:0.8rem;margin-right:4px;">✅ Confirmar</button>`
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td><strong>${ag.nomeCliente}</strong></td>
                <td><span style="text-transform: capitalize;">${ag.area}</span></td>
                <td>${ag.servico}</td>
                <td>${modalidadeLabel}</td>
                <td><a href="https://wa.me/55${(ag.telefone || '').replace(/\D/g, '')}" target="_blank" style="color: #25D366; font-weight: bold;">${ag.telefone}</a></td>
                <td>${statusBadge}</td>
                <td style="white-space:nowrap;">
                    ${btnConfirmar}
                    <button onclick="window.excluirAgendamento('${ag.id}')" style="background: #ffebee; color: #c62828; border: none; padding: 0.4rem 0.7rem; border-radius: 5px; cursor: pointer; font-size:0.8rem;">🗑 Excluir</button>
                </td>
            `;
            tabelaAgendamentos.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao buscar agendamentos: ", error);
        tabelaAgendamentos.innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">Erro ao carregar os dados.</td></tr>';
    }
}

// Exclui fisicamente um agendamento do banco MySQL
window.excluirAgendamento = async function (id) {
    if (!confirm('Deseja excluir esta reserva? O horário voltará a ficar disponível.')) return;
    try {
        const res = await fetch(`${API_URL}/agendamentos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        alert('Agendamento excluído com sucesso!');
        carregarAgendamentos();
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        alert('Erro ao excluir agendamento.');
    }
}

// Altera o status do agendamento para confirmado e dispara notificação via WhatsApp
window.confirmarAgendamento = async function (id, telCliente, nomeCliente, dataHora, servico, modalidade) {
    if (!confirm(`Confirmar agendamento de ${nomeCliente}?`)) return;
    try {
        const res = await fetch(`${API_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmado', modalidade: modalidade })
        });
        if (!res.ok) throw new Error();

        let dataFmt = dataHora;
        try {
            const d = new Date(dataHora);
            dataFmt = d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch { }

        // --------------------------------------------------------
        // MENSAGEM PERSONALIZADA POR MODALIDADE
        // --------------------------------------------------------
        const ehOnline = (modalidade || '').trim().toLowerCase() === 'online';

        const linhaModalidade = ehOnline
            ? `💻 Modalidade: *Online*\nO atendimento será realizado de forma online. As orientações para acesso serão combinadas pelo WhatsApp.`
            : `🏠 Modalidade: *Presencial*\n📍 Endereço: *${(await obterSiteConfig()).endereco || ENDERECO_PRESENCIAL}*`;

        const mensagemCliente = encodeURIComponent(
            `✅ Olá ${nomeCliente}! Seu agendamento foi *CONFIRMADO*!\n` +
            `📅 Data e hora: *${dataFmt}*\n` +
            `🔮 Serviço: *${servico}*\n` +
            `${linhaModalidade}\n` +
            `Universo Rosa 💜 — estamos te esperando!`
        );

        if (telCliente && telCliente.length >= 10) {
            window.open(`https://wa.me/55${telCliente}?text=${mensagemCliente}`, '_blank');
        }

        // Envia notificação adicional para os administradores configurados
        const resConfig = await fetch(`${API_URL}/config-agenda`);
        const config = await resConfig.json();

        const numerosAdmin = (config && config.numerosAdmin)
            ? config.numerosAdmin.split(',').map(n => n.trim().replace(/\D/g, '')).filter(n => n.length >= 10)
            : [];

        // Se o próprio cliente também estiver cadastrado como administrador,
        // não reenvia a notificação de confirmação para evitar mensagem duplicada.
        const telClienteLimpo = (telCliente || '').replace(/\D/g, '');
        const numerosAdminAlvo = numerosAdmin.filter(num => num !== telClienteLimpo);

        const mensagemAdmin = encodeURIComponent(
            `🔔 Novo agendamento confirmado!\n` +
            `👤 Cliente: *${nomeCliente}*\n` +
            `📞 Telefone: *${telCliente}*\n` +
            `📅 Data/hora: *${dataFmt}*\n` +
            `✂️ Serviço: *${servico}*`
        );

        numerosAdminAlvo.forEach((num, i) => {
            setTimeout(() => {
                window.open(`https://wa.me/55${num}?text=${mensagemAdmin}`, '_blank');
            }, (i + 1) * 800);
        });

        alert('Agendamento confirmado! Mensagem de WhatsApp aberta para o cliente.');
        carregarAgendamentos();
    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        alert('Erro ao confirmar agendamento.');
    }
};

// --- PRODUTOS ---
const formProduto = document.getElementById('form-produto');
const produtoAlert = document.getElementById('produto-alert');

// Trata o envio de novas roupas realizando primeiro o upload da imagem e depois salvando no MySQL
if (formProduto) {
    formProduto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnAdd = document.getElementById('btn-add-produto');
        btnAdd.disabled = true;
        btnAdd.textContent = "Fazendo Upload...";

        const nome = document.getElementById('prod-nome').value;
        const preco = document.getElementById('prod-preco').value;
        const fileInput = document.getElementById('prod-imagem');
        const file = fileInput.files[0];

        if (!file) {
            produtoAlert.className = "alert error";
            produtoAlert.textContent = "Selecione uma imagem.";
            btnAdd.disabled = false;
            btnAdd.textContent = "Salvar Produto";
            return;
        }

        try {
            // 1. Faz upload físico da imagem no Spring Boot local
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error("Erro no upload da imagem.");
            const uploadData = await uploadRes.json();
            const downloadURL = uploadData.url; // Caminho completo da imagem servido pelo Spring Boot

            // 2. Envia os dados do produto com o link da imagem local
            const saveRes = await fetch(`${API_URL}/produtos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome,
                    preco: Number(preco),
                    imagemUrl: downloadURL,
                    status: "Disponível",
                    site: document.getElementById('prod-site') ? document.getElementById('prod-site').value : 'ROSA_MODAS'
                })
            });

            if (!saveRes.ok) throw new Error("Erro ao salvar produto.");

            produtoAlert.className = "alert success";
            produtoAlert.textContent = "Produto adicionado com sucesso!";
            formProduto.reset();
            carregarProdutosAdmin();

        } catch (error) {
            console.error(error);
            produtoAlert.className = "alert error";
            produtoAlert.textContent = "Erro ao adicionar produto: " + error.message;
        } finally {
            btnAdd.disabled = false;
            btnAdd.textContent = "Salvar Produto";
        }
    });
}

// Carrega as roupas cadastradas no admin
async function carregarProdutosAdmin() {
    const tabelaProdutos = document.getElementById('tabela-produtos');
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();

        if (produtos.length === 0) {
            tabelaProdutos.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        tabelaProdutos.innerHTML = '';

        produtos.forEach((prod) => {
            const tr = document.createElement('tr');
            const precoFmt = Number(prod.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const selectStatus = `
                <select onchange="window.alterarStatusProduto('${prod.id}', this.value)" style="padding: 0.3rem; border-radius: 5px;">
                    <option value="Disponível" ${prod.status === 'Disponível' ? 'selected' : ''}>Disponível</option>
                    <option value="Esgotado" ${prod.status === 'Esgotado' ? 'selected' : ''}>Esgotado</option>
                </select>
            `;

            tr.innerHTML = `
                <td><img src="${prod.imagemUrl}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${prod.nome}</td>
                <td>${precoFmt}</td>
                <td>${selectStatus}</td>
                <td>${siteBadge(prod.site)}</td>
                <td><button onclick="window.excluirProduto('${prod.id}')" style="background: #ffebee; color: #c62828; border: none; padding: 0.5rem; border-radius: 5px; cursor: pointer;">Excluir</button></td>
            `;
            tabelaProdutos.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao buscar produtos admin: ", error);
    }
}

// Altera o status (Disponível/Esgotado) da roupa
window.alterarStatusProduto = async function (id, novoStatus) {
    try {
        const res = await fetch(`${API_URL}/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        if (!res.ok) throw new Error();
        alert("Status atualizado para: " + novoStatus);
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status.");
    }
}

// Exclui uma roupa do catálogo
window.excluirProduto = async function (id) {
    if (confirm("Tem certeza que deseja excluir esta peça?")) {
        try {
            const res = await fetch(`${API_URL}/produtos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            carregarProdutosAdmin();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir produto.");
        }
    }
}

// --- PROMOÇÕES ---
const formPromocao = document.getElementById('form-promocao');
const promoAlert = document.getElementById('promo-alert');
const tabelaPromocoes = document.getElementById('tabela-promocoes');

// Carrega as promoções no admin
async function carregarPromocoesAdmin() {
    if (!tabelaPromocoes) return;
    try {
        const response = await fetch(`${API_URL}/promocoes`);
        const promocoes = await response.json();

        if (!promocoes.length) {
            tabelaPromocoes.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma promoção cadastrada.</td></tr>';
            return;
        }

        tabelaPromocoes.innerHTML = '';
        promocoes.forEach(p => {
            let periodo = '-';
            if (p.dataInicio && p.dataFim) {
                const [iY, iM, iD] = p.dataInicio.split('-').map(Number);
                const [fY, fM, fD] = p.dataFim.split('-').map(Number);
                periodo = `${String(iD).padStart(2, '0')}/${String(iM).padStart(2, '0')}/${iY} até ${String(fD).padStart(2, '0')}/${String(fM).padStart(2, '0')}/${fY}`;
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.titulo}</td>
                <td>${periodo}</td>
                <td>${p.status || 'Inativa'}</td>
                <td>${siteBadge(p.site)}</td>
                <td><button onclick="window.excluirPromocao('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;">Excluir</button></td>
            `;
            tabelaPromocoes.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar promoções:', error);
    }
}

// Trata a inserção de promoções com upload local de imagens
if (formPromocao) {
    formPromocao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-promocao');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const titulo = document.getElementById('promo-titulo').value;
        const descricao = document.getElementById('promo-descricao').value;
        const status = document.getElementById('promo-status').value;
        const dataInicio = document.getElementById('promo-data-inicio').value;
        const dataFim = document.getElementById('promo-data-fim').value;
        const fileInput = document.getElementById('promo-imagem');
        const file = fileInput.files[0];

        try {
            let imagemURL = '';
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                imagemURL = uploadData.url;
            }

            const novo = {
                titulo,
                descricao,
                status,
                dataInicio,
                dataFim,
                imagemUrl: imagemURL,
                site: document.getElementById('promo-site') ? document.getElementById('promo-site').value : 'ROSA_MODAS'
            };

            const saveRes = await fetch(`${API_URL}/promocoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novo)
            });
            if (!saveRes.ok) throw new Error();

            promoAlert.className = 'alert success';
            promoAlert.textContent = 'Promoção salva com sucesso!';
            formPromocao.reset();
            carregarPromocoesAdmin();
        } catch (error) {
            console.error('Erro ao salvar promoção:', error);
            promoAlert.className = 'alert error';
            promoAlert.textContent = 'Erro ao salvar promoção.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Promoção';
        }
    });
}

// Exclui uma promoção
window.excluirPromocao = async function (id) {
    if (!confirm('Excluir esta promoção?')) return;
    try {
        const res = await fetch(`${API_URL}/promocoes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        carregarPromocoesAdmin();
    } catch (error) {
        console.error('Erro ao excluir promoção:', error);
        alert('Erro ao excluir promoção.');
    }
}

// --- PROCEDIMENTOS ---
const formProcedimento = document.getElementById('form-procedimento');
const tabelaProcedimentos = document.getElementById('tabela-procedimentos');
const procAlert = document.getElementById('proc-alert');

// Carrega os procedimentos capilares no admin
async function carregarProcedimentosAdmin() {
    if (!tabelaProcedimentos) return;
    try {
        const response = await fetch(`${API_URL}/procedimentos`);
        const procedimentos = await response.json();

        if (!procedimentos.length) {
            tabelaProcedimentos.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum procedimento cadastrado.</td></tr>';
            return;
        }
        tabelaProcedimentos.innerHTML = '';
        procedimentos.forEach(p => {
            const tr = document.createElement('tr');
            const icone = p.icone || iconeVisual(p.nome);
tr.innerHTML = `
                <td><span class="admin-icon">${icone}</span></td>
                <td>${p.nome}</td>
                <td>${p.status || 'Disponível'}</td>
                <td>${siteBadge(p.site)}</td>
                <td style="white-space:nowrap;">
                    <button onclick="window.editarProcedimento('${p.id}', '${(p.nome || '').replace(/'/g, "\\'")}', '${(p.descricao || '').replace(/'/g, "\\'")}', '${p.status || 'Disponível'}', '${p.icone || ''}', '${p.site || 'ROSA_MODAS'}')" style="background:#e3f2fd;color:#1565c0;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;margin-right:4px;">✏️ Editar</button>
                    <button onclick="window.excluirProcedimento('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;">🗑 Excluir</button>
                </td>
            `;
            tabelaProcedimentos.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar procedimentos admin:', error);
    }
}

// Adiciona/edita procedimento capilar (sem upload de imagem)
if (formProcedimento) {
    formProcedimento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-proc');
        const procId = document.getElementById('proc-id').value; // hidden field for edit
        const isEdit = !!procId;

        btn.disabled = true;
        btn.textContent = isEdit ? 'Atualizando...' : 'Salvando...';

        const nome = document.getElementById('proc-nome').value;
        const descricao = document.getElementById('proc-descricao').value;
        const status = document.getElementById('proc-status').value;
        const icone = document.getElementById('proc-icone').value;

        try {
            const payload = { nome, descricao, status, icone, site: document.getElementById('proc-site') ? document.getElementById('proc-site').value : 'ROSA_MODAS' };

            const url = isEdit ? `${API_URL}/procedimentos/${procId}` : `${API_URL}/procedimentos`;
            const method = isEdit ? 'PUT' : 'POST';

            const saveRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const errorMsg = await lerErroResposta(saveRes);
            if (!saveRes.ok) throw new Error(errorMsg || (isEdit ? 'Erro ao atualizar procedimento.' : 'Erro ao salvar procedimento.'));

            procAlert.className = 'alert success';
            procAlert.textContent = isEdit ? 'Procedimento atualizado com sucesso!' : 'Procedimento salvo com sucesso!';
            formProcedimento.reset();
            document.getElementById('proc-id').value = '';
            btn.textContent = 'Salvar Procedimento';
            carregarProcedimentosAdmin();
        } catch (error) {
            console.error('Erro ao salvar/atualizar procedimento:', error);
            procAlert.className = 'alert error';
            procAlert.textContent = error.message || (isEdit ? 'Erro ao atualizar procedimento.' : 'Erro ao salvar procedimento.');
        } finally {
            btn.disabled = false;
            if (!isEdit) btn.textContent = 'Salvar Procedimento';
        }
    });
}

// Preenche o formulário para edição de procedimento
window.editarProcedimento = function (id, nome, descricao, status, icone, site) {
    document.getElementById('proc-id').value = id;
    document.getElementById('proc-nome').value = nome;
    document.getElementById('proc-descricao').value = descricao;
    document.getElementById('proc-status').value = status;
    if (icone) document.getElementById('proc-icone').value = icone;
    if (site) document.getElementById('proc-site').value = site;
    const btn = document.getElementById('btn-add-proc');
    btn.textContent = 'Atualizar Procedimento';
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Exclui um procedimento capilar
window.excluirProcedimento = async function (id) {
    if (!confirm('Excluir este procedimento?')) return;
    try {
        const res = await fetch(`${API_URL}/procedimentos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        carregarProcedimentosAdmin();
    } catch (error) {
        console.error('Erro ao excluir procedimento:', error);
        alert('Erro ao excluir procedimento.');
    }
}

// --- SERVIÇOS ESPIRITUAIS ---
const formServico = document.getElementById('form-servico');
const tabelaServicos = document.getElementById('tabela-servicos');
const servAlert = document.getElementById('serv-alert');

// Carrega os serviços espirituais no admin
async function carregarServicosAdmin() {
    if (!tabelaServicos) return;
    try {
        const response = await fetch(`${API_URL}/servicos`);
        const servicos = await response.json();

        if (!servicos.length) {
            tabelaServicos.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum serviço cadastrado.</td></tr>';
            return;
        }
        tabelaServicos.innerHTML = '';
        servicos.forEach(s => {
            const tr = document.createElement('tr');
            const precoFmt = Number(s.preco) > 0
                ? Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '—';
            const modalidades = (s.modalidades || '').split(',').map(m => m.trim()).filter(Boolean);
            const modalidadesFmt = modalidades.length
                ? modalidades.map(m => m.toUpperCase() === 'PRESENCIAL' ? '🏠 Presencial' : m.toUpperCase() === 'ONLINE' ? '💻 Online' : m).join(' • ')
                : 'Configurável';
            const icone = s.icone || iconeVisual(s.nome);
            const modalidadesStr = s.modalidades || '';
            tr.innerHTML = `
                <td><span class="admin-icon">${icone}</span></td>
                <td>${s.nome}</td>
                <td>${precoFmt}</td>
                <td>${modalidadesFmt}</td>
                <td>${s.status || 'Disponível'}</td>
                <td>${siteBadge(s.site)}</td>
                <td style="white-space:nowrap;">
                    <button onclick="window.editarServico('${s.id}', '${(s.nome || '').replace(/'/g, "\\'")}', '${Number(s.preco) || 0}', '${(s.descricao || '').replace(/'/g, "\\'")}', '${s.status || 'Disponível'}', '${modalidadesStr}', '${s.icone || ''}')" style="background:#e3f2fd;color:#1565c0;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;margin-right:4px;">✏️ Editar</button>
                    <button onclick="window.excluirServico('${s.id}')" style="background:#ffebee;color:#c62828;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;">Excluir</button>
                </td>
            `;
            tabelaServicos.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços admin:', error);
    }
}

// Adiciona/edita serviço espiritual (sem upload de imagem)
if (formServico) {
    formServico.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-serv');
        const servId = document.getElementById('serv-id').value;
        const isEdit = !!servId;

        btn.disabled = true;
        btn.textContent = isEdit ? 'Atualizando...' : 'Salvando...';

        const nome = document.getElementById('serv-nome').value;
        const preco = document.getElementById('serv-preco').value;
        const descricao = document.getElementById('serv-descricao').value;
        const status = document.getElementById('serv-status').value;
        const icone = document.getElementById('serv-icone').value;
        const modalidadesSelecionadas = [];
        const cbPresencial = document.getElementById('serv-modal-presencial');
        const cbOnline = document.getElementById('serv-modal-online');
        if (cbPresencial && cbPresencial.checked) modalidadesSelecionadas.push(cbPresencial.value);
        if (cbOnline && cbOnline.checked) modalidadesSelecionadas.push(cbOnline.value);

        try {
            const payload = {
                nome,
                preco: Number(preco),
                descricao,
                status,
                modalidades: modalidadesSelecionadas.join(','),
                icone,
                site: document.getElementById('serv-site') ? document.getElementById('serv-site').value : 'UNIVERSO_ROSA'
            };

            const url = isEdit ? `${API_URL}/servicos/${servId}` : `${API_URL}/servicos`;
            const method = isEdit ? 'PUT' : 'POST';

            const saveRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const errorMsg = await lerErroResposta(saveRes);
            if (!saveRes.ok) throw new Error(errorMsg || (isEdit ? 'Erro ao atualizar serviço.' : 'Erro ao salvar serviço.'));

            servAlert.className = 'alert success';
            servAlert.textContent = isEdit ? 'Serviço atualizado com sucesso!' : 'Serviço salvo com sucesso!';
            formServico.reset();
            document.getElementById('serv-id').value = '';
            btn.textContent = 'Salvar Serviço';
            carregarServicosAdmin();
        } catch (error) {
            console.error('Erro ao salvar/atualizar serviço:', error);
            servAlert.className = 'alert error';
            servAlert.textContent = error.message || (isEdit ? 'Erro ao atualizar serviço.' : 'Erro ao salvar serviço.');
        } finally {
            btn.disabled = false;
            if (!isEdit) btn.textContent = 'Salvar Serviço';
        }
    });
}

// Exclui um serviço espiritual
window.excluirServico = async function (id) {
    if (!confirm('Excluir este serviço?')) return;
    try {
        const res = await fetch(`${API_URL}/servicos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        carregarServicosAdmin();
    } catch (error) {
        console.error('Erro ao excluir serviço espiritual:', error);
        alert('Erro ao excluir serviço.');
    }
}

// Preenche o formulário para edição de serviço
window.editarServico = function (id, nome, preco, descricao, status, modalidades, icone) {
    document.getElementById('serv-id').value = id;
    document.getElementById('serv-nome').value = nome;
    document.getElementById('serv-preco').value = preco;
    document.getElementById('serv-descricao').value = descricao;
    document.getElementById('serv-status').value = status;
    if (modalidades) {
        const mods = modalidades.split(',');
        const cbPresencial = document.getElementById('serv-modal-presencial');
        const cbOnline = document.getElementById('serv-modal-online');
        if (cbPresencial) cbPresencial.checked = mods.includes('PRESENCIAL');
        if (cbOnline) cbOnline.checked = mods.includes('ONLINE');
    }
    if (icone) document.getElementById('serv-icone').value = icone;
    const btn = document.getElementById('btn-add-serv');
    btn.textContent = 'Atualizar Serviço';
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// --- CONTEÚDO CMS (TÍTULOS E TEXTOS DO SITE) ---
const formConteudo = document.getElementById('form-conteudo');
const conteudoAlert = document.getElementById('conteudo-alert');

// Carrega os textos salvos no CMS para edição
window.carregarConteudoCMS = async function () {
    try {
        const site = document.getElementById('cms-site') ? document.getElementById('cms-site').value : 'UNIVERSO_ROSA';
        const res = await fetch(`${API_URL}/conteudo?site=${site}`);
        const content = await res.json();

        if (content) {
            document.getElementById('cms-hero-titulo').value = content.heroTitulo || '';
            document.getElementById('cms-hero-descricao').value = content.heroDescricao || '';
            document.getElementById('cms-footer-slogan').value = content.footerSlogan || '';
        }
    } catch (error) {
        console.error("Erro ao carregar conteúdo CMS:", error);
    }
}

// Salva as edições do CMS na REST API
if (formConteudo) {
    formConteudo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-conteudo');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const payload = {
            site: document.getElementById('cms-site') ? document.getElementById('cms-site').value : 'UNIVERSO_ROSA',
            heroTitulo: document.getElementById('cms-hero-titulo').value,
            heroDescricao: document.getElementById('cms-hero-descricao').value,
            footerSlogan: document.getElementById('cms-footer-slogan').value
        };

        try {
            const res = await fetch(`${API_URL}/conteudo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();

            conteudoAlert.className = 'alert success';
            conteudoAlert.textContent = 'Conteúdo do site atualizado com sucesso!';
        } catch (error) {
            console.error(error);
            conteudoAlert.className = 'alert error';
            conteudoAlert.textContent = 'Erro ao atualizar conteúdo.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Conteúdo';
        }
    });
}

// --- CONFIGURAÇÃO DE AGENDA (HORÁRIOS / DIAS BLOQUEADOS / NÚMEROS ADMIN) ---
const formConfigGeral = document.getElementById('form-config-agenda-geral');
const configAlert = document.getElementById('config-agenda-alert');
const numerosAdminAlert = document.getElementById('numeros-admin-alert');

// Cache local da configuração atual para evitar múltiplas requisições
let agendaConfigCache = null;

// Busca (e cacheia) a configuração atual da agenda na REST API
async function obterConfigAgenda() {
    const res = await fetch(`${API_URL}/config-agenda`);
    const config = await res.json();
    agendaConfigCache = config;
    return config;
}

// Salva a configuração completa na REST API
async function salvarConfigAgenda(payload) {
    const res = await fetch(`${API_URL}/config-agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();
    agendaConfigCache = payload;
}

// Renderiza a lista de datas bloqueadas na tabela do painel
function renderDatasBloqueadas(datasBloqueadas) {
    const tabela = document.getElementById('tabela-datas-bloqueadas');
    if (!tabela) return;

    const datas = (datasBloqueadas || '').split(',').map(d => d.trim()).filter(Boolean);

    if (!datas.length) {
        tabela.innerHTML = '<tr><td colspan="2" style="text-align:center;">Nenhuma data bloqueada.</td></tr>';
        return;
    }

    tabela.innerHTML = '';
    datas.forEach(data => {
        const [ano, mes, dia] = data.split('-');
        const dataFmt = `${dia}/${mes}/${ano}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataFmt}</td>
            <td><button onclick="window.desbloquearData('${data}')" style="background:#ffebee;color:#c62828;border:none;padding:0.4rem 0.7rem;border-radius:5px;cursor:pointer;font-size:0.8rem;">Desbloquear</button></td>
        `;
        tabela.appendChild(tr);
    });
}

// Carrega as configurações da agenda para edição
async function carregarConfigAgenda() {
    try {
        const config = await obterConfigAgenda();

        if (config) {
            document.getElementById('cfg-intervalo').value = config.intervalo || '60';
            document.getElementById('cfg-inicio').value = config.horaInicio || '09:00';
            document.getElementById('cfg-fim').value = config.horaFim || '18:00';
            document.getElementById('cfg-numeros-admin').value = config.numerosAdmin || '';

            const diasList = (config.diasSemana || "1,2,3,4,5,6").split(',');
            for (let i = 0; i <= 6; i++) {
                const cb = document.getElementById(`cfg-dia-${i}`);
                if (cb) cb.checked = diasList.includes(String(i));
            }

            renderDatasBloqueadas(config.datasBloqueadas);
        }
    } catch (error) {
        console.error("Erro ao carregar configurações da agenda:", error);
    }
}

// Salva as configurações gerais (intervalo, expediente e dias de atendimento)
if (formConfigGeral) {
    formConfigGeral.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-cfg-geral');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const diasSelecionados = [];
        for (let i = 0; i <= 6; i++) {
            const cb = document.getElementById(`cfg-dia-${i}`);
            if (cb && cb.checked) diasSelecionados.push(String(i));
        }

        try {
            const config = await obterConfigAgenda();
            const payload = {
                ...config,
                intervalo: parseInt(document.getElementById('cfg-intervalo').value),
                horaInicio: document.getElementById('cfg-inicio').value,
                horaFim: document.getElementById('cfg-fim').value,
                diasSemana: diasSelecionados.join(',')
            };

            await salvarConfigAgenda(payload);

            if (configAlert) {
                configAlert.className = 'alert success';
                configAlert.textContent = 'Configurações de agenda salvas com sucesso!';
            }
        } catch (error) {
            console.error(error);
            if (configAlert) {
                configAlert.className = 'alert error';
                configAlert.textContent = 'Erro ao salvar configurações.';
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Configurações Gerais';
        }
    });
}

// Bloqueia uma data (feriado/folga)
const formBloquearData = document.getElementById('form-bloquear-data');
if (formBloquearData) {
    formBloquearData.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('cfg-bloquear-data');
        const data = input ? input.value : '';
        if (!data) return;

        try {
            const config = await obterConfigAgenda();
            const datas = (config.datasBloqueadas || '').split(',').map(d => d.trim()).filter(Boolean);
            if (!datas.includes(data)) {
                datas.push(data);
            }

            await salvarConfigAgenda({ ...config, datasBloqueadas: datas.join(',') });
            renderDatasBloqueadas(datas.join(','));
            if (input) input.value = '';

            if (configAlert) {
                configAlert.className = 'alert success';
                configAlert.textContent = 'Data bloqueada com sucesso!';
            }
        } catch (error) {
            console.error('Erro ao bloquear data:', error);
            if (configAlert) {
                configAlert.className = 'alert error';
                configAlert.textContent = 'Erro ao bloquear a data.';
            }
        }
    });
}

// Desbloqueia uma data previamente bloqueada
window.desbloquearData = async function (data) {
    try {
        const config = await obterConfigAgenda();
        const datas = (config.datasBloqueadas || '').split(',').map(d => d.trim()).filter(Boolean)
            .filter(d => d !== data);

        await salvarConfigAgenda({ ...config, datasBloqueadas: datas.join(',') });
        renderDatasBloqueadas(datas.join(','));
    } catch (error) {
        console.error('Erro ao desbloquear data:', error);
    }
};

// Salva os números de WhatsApp do administrador
window.salvarNumerosAdmin = async function () {
    const input = document.getElementById('cfg-numeros-admin');
    const numeros = input ? input.value : '';

    try {
        const config = await obterConfigAgenda();
        await salvarConfigAgenda({ ...config, numerosAdmin: numeros });

        if (numerosAdminAlert) {
            numerosAdminAlert.className = 'alert success';
            numerosAdminAlert.textContent = 'Números de WhatsApp salvos com sucesso!';
            numerosAdminAlert.style.display = 'block';
            setTimeout(() => {
                numerosAdminAlert.style.display = 'none';
            }, 4000);
        }
    } catch (error) {
        console.error('Erro ao salvar números:', error);
        if (numerosAdminAlert) {
            numerosAdminAlert.className = 'alert error';
            numerosAdminAlert.textContent = 'Erro ao salvar os números.';
            numerosAdminAlert.style.display = 'block';
        }
    }
};

// --- CONFIGURAÇÕES GERAIS (ENDEREÇO E CONTATOS) ---
const formSiteConfig = document.getElementById('form-config-geral');
const configGeralAlert = document.getElementById('config-geral-alert');

// Carrega as configurações gerais para edição
async function carregarConfigGeral() {
    try {
        const cfg = await obterSiteConfig();
        if (!cfg) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        set('cfg-endereco', cfg.endereco);
        set('cfg-telefone', cfg.telefone);
        set('cfg-whatsapp', cfg.whatsapp);
        set('cfg-email', cfg.email);
        set('cfg-instagram', cfg.instagram);
    } catch (error) {
        console.error('Erro ao carregar configurações gerais:', error);
    }
}

// Salva as configurações gerais na REST API
if (formSiteConfig) {
    formSiteConfig.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-config-geral');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const payload = {
            id: 'main',
            endereco: document.getElementById('cfg-endereco').value,
            telefone: document.getElementById('cfg-telefone').value,
            whatsapp: document.getElementById('cfg-whatsapp').value,
            email: document.getElementById('cfg-email').value,
            instagram: document.getElementById('cfg-instagram').value
        };

        try {
            const res = await fetch(`${API_URL}/site-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            siteConfigCache = payload;
            configGeralAlert.className = 'alert success';
            configGeralAlert.textContent = 'Configurações gerais salvas com sucesso!';
        } catch (error) {
            console.error(error);
            configGeralAlert.className = 'alert error';
            configGeralAlert.textContent = 'Erro ao salvar configurações gerais.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Configurações Gerais';
        }
    });
}

// Executado ao se autenticar com sucesso para carregar as informações do admin
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

// Inicia checando a sessão
verificarSessao();
