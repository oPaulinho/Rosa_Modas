import { API_URL } from './api-config.js';

// =============================================================
// ENDEREÇO CENTRALIZADO — altere aqui para atualizar em todo o admin
// =============================================================
const ENDERECO_PRESENCIAL = 'Rua das Rosas, 123 — Bairro Exemplo, SP';

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
            tabelaAgendamentos.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum agendamento encontrado.</td></tr>';
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
                ? `<button onclick="window.confirmarAgendamento('${ag.id}', '${(ag.telefone || '').replace(/\D/g, '')}', '${(ag.nomeCliente || '').replace(/'/g, "\\'")}',' ${(ag.dataHora || '').replace(/'/g, "\\'")}', '${(ag.servico || '').replace(/'/g, "\\'")}',' ${(ag.modalidade || '').replace(/'/g, "\\'")}')" style="background:#e8f5e9;color:#2e7d32;border:none;padding:0.4rem 0.7rem;border-radius:5px;cursor:pointer;font-size:0.8rem;margin-right:4px;">✅ Confirmar</button>`
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
        tabelaAgendamentos.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Erro ao carregar os dados.</td></tr>';
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
            body: JSON.stringify({ status: 'confirmado' })
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
            ? `💻 Modalidade: *Online*\nVocê receberá as instruções de acesso pelo WhatsApp.`
            : `🏠 Modalidade: *Presencial*\n📍 Endereço: *${ENDERECO_PRESENCIAL}*`;

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

        const mensagemAdmin = encodeURIComponent(
            `🔔 Novo agendamento confirmado!\n` +
            `👤 Cliente: *${nomeCliente}*\n` +
            `📞 Telefone: *${telCliente}*\n` +
            `📅 Data/hora: *${dataFmt}*\n` +
            `✂️ Serviço: *${servico}*`
        );

        numerosAdmin.forEach((num, i) => {
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
                    status: "Disponível"
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
            tabelaProdutos.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
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
            tabelaPromocoes.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma promoção cadastrada.</td></tr>';
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
                imagemUrl: imagemURL
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
            tabelaProcedimentos.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum procedimento cadastrado.</td></tr>';
            return;
        }
        tabelaProcedimentos.innerHTML = '';
        procedimentos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.imagemUrl || 'img/procedimento4.jpg'}" alt="${p.nome}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;"></td>
                <td>${p.nome}</td>
                <td>${p.status || 'Disponível'}</td>
                <td><button onclick="window.excluirProcedimento('${p.id}')" style="background:#ffebee;color:#c62828;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;">Excluir</button></td>
            `;
            tabelaProcedimentos.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar procedimentos admin:', error);
    }
}

// Adiciona novo procedimento capilar com upload físico da foto
if (formProcedimento) {
    formProcedimento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-proc');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const nome = document.getElementById('proc-nome').value;
        const descricao = document.getElementById('proc-descricao').value;
        const status = document.getElementById('proc-status').value;
        const fileInput = document.getElementById('proc-imagem');
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
                nome,
                descricao,
                status,
                imagemUrl: imagemURL
            };

            const saveRes = await fetch(`${API_URL}/procedimentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novo)
            });
            if (!saveRes.ok) throw new Error();

            procAlert.className = 'alert success';
            procAlert.textContent = 'Procedimento salvo com sucesso!';
            formProcedimento.reset();
            carregarProcedimentosAdmin();
        } catch (error) {
            console.error('Erro ao salvar procedimento:', error);
            procAlert.className = 'alert error';
            procAlert.textContent = 'Erro ao salvar procedimento.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Procedimento';
        }
    });
}

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
            tabelaServicos.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum serviço cadastrado.</td></tr>';
            return;
        }
        tabelaServicos.innerHTML = '';
        servicos.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${s.imagemUrl || 'img/atendimento_espiritual.png'}" alt="${s.nome}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;"></td>
                <td>${s.nome}</td>
                <td>${s.status || 'Disponível'}</td>
                <td><button onclick="window.excluirServico('${s.id}')" style="background:#ffebee;color:#c62828;border:none;padding:0.5rem;border-radius:5px;cursor:pointer;">Excluir</button></td>
            `;
            tabelaServicos.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços admin:', error);
    }
}

// Adiciona novo serviço espiritual com upload físico de imagem
if (formServico) {
    formServico.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-add-serv');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const nome = document.getElementById('serv-nome').value;
        const descricao = document.getElementById('serv-descricao').value;
        const status = document.getElementById('serv-status').value;
        const fileInput = document.getElementById('serv-imagem');
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
                nome,
                descricao,
                status,
                imagemUrl: imagemURL
            };

            const saveRes = await fetch(`${API_URL}/servicos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novo)
            });
            if (!saveRes.ok) throw new Error();

            servAlert.className = 'alert success';
            servAlert.textContent = 'Serviço salvo com sucesso!';
            formServico.reset();
            carregarServicosAdmin();
        } catch (error) {
            console.error('Erro ao salvar serviço espiritual:', error);
            servAlert.className = 'alert error';
            servAlert.textContent = 'Erro ao salvar serviço.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Serviço';
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

// --- CONTEÚDO CMS (TÍTULOS E TEXTOS DO SITE) ---
const formConteudo = document.getElementById('form-conteudo');
const conteudoAlert = document.getElementById('conteudo-alert');

// Carrega os textos salvos no CMS para edição
async function carregarConteudoCMS() {
    try {
        const res = await fetch(`${API_URL}/conteudo`);
        const content = await res.json();

        if (content) {
            document.getElementById('cms-hero-titulo').value = content.heroTitulo || '';
            document.getElementById('cms-hero-desc').value = content.heroDescricao || '';
            document.getElementById('cms-vant-titulo').value = content.vantagensTitulo || '';
            document.getElementById('cms-vant-desc').value = content.vantagensDescricao || '';
            document.getElementById('cms-v1-titulo').value = content.v1Titulo || '';
            document.getElementById('cms-v1-desc').value = content.v1Desc || '';
            document.getElementById('cms-v2-titulo').value = content.v2Titulo || '';
            document.getElementById('cms-v2-desc').value = content.v2Desc || '';
            document.getElementById('cms-v3-titulo').value = content.v3Titulo || '';
            document.getElementById('cms-v3-desc').value = content.v3Desc || '';
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
            heroTitulo: document.getElementById('cms-hero-titulo').value,
            heroDescricao: document.getElementById('cms-hero-desc').value,
            vantagensTitulo: document.getElementById('cms-vant-titulo').value,
            vantagensDescricao: document.getElementById('cms-vant-desc').value,
            v1Titulo: document.getElementById('cms-v1-titulo').value,
            v1Desc: document.getElementById('cms-v1-desc').value,
            v2Titulo: document.getElementById('cms-v2-titulo').value,
            v2Desc: document.getElementById('cms-v2-desc').value,
            v3Titulo: document.getElementById('cms-v3-titulo').value,
            v3Desc: document.getElementById('cms-v3-desc').value,
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

// --- CONFIGURAÇÃO DE AGENDA (HORÁRIOS / DIAS BLOQUEADOS) ---
const formConfig = document.getElementById('form-config-agenda');
const configAlert = document.getElementById('config-alert');

// Carrega as configurações da agenda para edição
async function carregarConfigAgenda() {
    try {
        const res = await fetch(`${API_URL}/config-agenda`);
        const config = await res.json();

        if (config) {
            document.getElementById('agenda-intervalo').value = config.intervalo || '60';
            document.getElementById('agenda-hora-inicio').value = config.horaInicio || '09:00';
            document.getElementById('agenda-hora-fim').value = config.horaFim || '18:00';
            document.getElementById('agenda-nums-admin').value = config.numerosAdmin || '';
            document.getElementById('agenda-datas-bloqueadas').value = config.datasBloqueadas || '';

            const diasList = (config.diasSemana || "1,2,3,4,5,6").split(',');
            document.querySelectorAll('input[name="dias_semana"]').forEach(cb => {
                cb.checked = diasList.includes(cb.value);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar configurações da agenda:", error);
    }
}

// Salva as alterações da agenda na REST API
if (formConfig) {
    formConfig.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-config');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const diasSelecionados = [];
        document.querySelectorAll('input[name="dias_semana"]:checked').forEach(cb => {
            diasSelecionados.push(cb.value);
        });

        const payload = {
            intervalo: parseInt(document.getElementById('agenda-intervalo').value),
            horaInicio: document.getElementById('agenda-hora-inicio').value,
            horaFim: document.getElementById('agenda-hora-fim').value,
            diasSemana: diasSelecionados.join(','),
            numerosAdmin: document.getElementById('agenda-nums-admin').value,
            datasBloqueadas: document.getElementById('agenda-datas-bloqueadas').value
        };

        try {
            const res = await fetch(`${API_URL}/config-agenda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();

            configAlert.className = 'alert success';
            configAlert.textContent = 'Configurações de agenda salvas com sucesso!';
        } catch (error) {
            console.error(error);
            configAlert.className = 'alert error';
            configAlert.textContent = 'Erro ao salvar configurações.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Configurações';
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
}

// Inicia checando a sessão
verificarSessao();
