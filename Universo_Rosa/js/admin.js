import { auth, db, storage, isMock } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const formLogin = document.getElementById('form-login');
const loginAlert = document.getElementById('login-alert');
const btnLogout = document.getElementById('btn-logout');

window.toggleModulesMenu = function() {
    const mobileList = document.getElementById('mobile-module-list');
    if (mobileList) {
        mobileList.classList.toggle('open');
    }
};

window.showPanel = function(panelKey, clickedLink) {
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

// --- AUTENTICAÇÃO ---

// Verifica se o usuário já está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'flex';
        carregarAdminExtras();
    } else {
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
});

// Fazer Login
if(formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const btnLogin = document.getElementById('btn-login');

        // BYPASS TEMPORÁRIO PARA TESTES
        if (email === 'admin@admin.com' && senha === 'admin') {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'flex';
            carregarAdminExtras();
            formLogin.reset();
            return;
        }

        btnLogin.disabled = true;
        btnLogin.textContent = "Aguarde...";

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            formLogin.reset();
        } catch (error) {
            console.error(error);
            loginAlert.className = "alert error";
            loginAlert.textContent = "E-mail ou senha incorretos.";
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        }
    });
}

// Fazer Logout
if(btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (isMock) {
            loginSection.style.display = 'flex';
            adminDashboard.style.display = 'none';
        } else {
            await signOut(auth);
        }
    });
}

// --- AGENDAMENTOS ---

async function carregarAgendamentos() {
    const tabelaAgendamentos = document.getElementById('tabela-agendamentos');
    try {
        let agendamentos = [];

        if (isMock) {
            // Modo Teste Local
            agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            // Garantir que agendamentos locais tenham um ID temporário se não tiverem
            agendamentos.forEach((ag, idx) => {
                if (!ag.id) ag.id = ag.criado_em || 'local_' + idx;
            });
            // Ordenar por data decrescente
            agendamentos.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
        } else {
            // Modo Firebase Real
            const q = query(collection(db, "agendamentos"), orderBy("data_hora", "desc"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                agendamentos.push({ id: doc.id, ...doc.data() });
            });
        }
        
        if (agendamentos.length === 0) {
            tabelaAgendamentos.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        tabelaAgendamentos.innerHTML = '';
        
        agendamentos.forEach((ag) => {
            let dataFormatada = ag.data_hora;
            if(ag.data_hora) {
                const dateObj = new Date(ag.data_hora);
                dataFormatada = dateObj.toLocaleString('pt-BR');
            }

            const statusAtual = ag.status || 'pendente';
            const statusBadge = statusAtual === 'confirmado'
                ? '<span style="background:#e8f5e9;color:#2e7d32;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">✅ Confirmado</span>'
                : statusAtual === 'cancelado'
                    ? '<span style="background:#ffebee;color:#c62828;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">❌ Cancelado</span>'
                    : '<span style="background:#fff8e1;color:#f57f17;padding:0.3rem 0.7rem;border-radius:99px;font-size:0.8rem;font-weight:700;">⏳ Pendente</span>';

            const btnConfirmar = statusAtual !== 'confirmado'
                ? `<button onclick="window.confirmarAgendamento('${ag.id}', '${(ag.telefone||'').replace(/\D/g,'')}', '${(ag.nome_cliente||'').replace(/'/g,"\\'")}', '${(ag.data_hora||'').replace(/'/g,"\\'")}', '${(ag.servico||'').replace(/'/g,"\\'")}' )" style="background:#e8f5e9;color:#2e7d32;border:none;padding:0.4rem 0.7rem;border-radius:5px;cursor:pointer;font-size:0.8rem;margin-right:4px;">✅ Confirmar</button>`
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td><strong>${ag.nome_cliente}</strong></td>
                <td><span style="text-transform: capitalize;">${ag.area}</span></td>
                <td>${ag.servico}</td>
                <td><a href="https://wa.me/55${(ag.telefone||'').replace(/\D/g,'')}" target="_blank" style="color: #25D366; font-weight: bold;">${ag.telefone}</a></td>
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
        tabelaAgendamentos.innerHTML = '<tr><td colspan="6" style="color:red;">Erro ao carregar os dados.</td></tr>';
    }
}

window.excluirAgendamento = async function(id) {
    if (!confirm('Deseja excluir esta reserva? O horário voltará a ficar disponível.')) return;
    try {
        if (isMock) {
            const lista = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const filtrado = lista.filter(ag => ag.id !== id && ag.criado_em !== id);
            localStorage.setItem('agendamentos', JSON.stringify(filtrado));
        } else {
            await deleteDoc(doc(db, 'agendamentos', id));
        }
        alert('Agendamento excluído com sucesso!');
        carregarAgendamentos();
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        alert('Erro ao excluir agendamento.');
    }
}

window.confirmarAgendamento = async function(id, telCliente, nomeCliente, dataHora, servico) {
    if (!confirm(`Confirmar agendamento de ${nomeCliente}?`)) return;
    try {
        if (isMock) {
            const lista = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            const idx = lista.findIndex(ag => ag.id === id || ag.criado_em === id);
            if (idx !== -1) {
                lista[idx].status = 'confirmado';
                localStorage.setItem('agendamentos', JSON.stringify(lista));
            }
        } else {
            await updateDoc(doc(db, 'agendamentos', id), { status: 'confirmado' });
        }

        // Formatar data/hora para a mensagem
        let dataFmt = dataHora;
        try {
            const d = new Date(dataHora);
            dataFmt = d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch {}

        const mensagemCliente = encodeURIComponent(
            `✅ Olá ${nomeCliente}! Seu agendamento foi *CONFIRMADO*!\n` +
            `📅 Data e hora: *${dataFmt}*\n` +
            `✂️ Serviço: *${servico}*\n` +
            `📍 Universo Rosa — te esperamos! 💜`
        );

        // Abrir WhatsApp do cliente
        if (telCliente && telCliente.length >= 10) {
            window.open(`https://wa.me/55${telCliente}?text=${mensagemCliente}`, '_blank');
        }

        // Notificar números do administrador
        let config = null;
        if (isMock) {
            config = JSON.parse(localStorage.getItem('agenda_config') || '{}');
        }
        const numerosAdmin = (config && config.numeros_admin)
            ? config.numeros_admin.split(',').map(n => n.trim().replace(/\D/g, '')).filter(n => n.length >= 10)
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

const formProduto = document.getElementById('form-produto');
const produtoAlert = document.getElementById('produto-alert');

// Adicionar novo produto com Upload de Imagem
if(formProduto) {
    formProduto.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnAdd = document.getElementById('btn-add-produto');
        btnAdd.disabled = true;
        btnAdd.textContent = "Fazendo Upload...";

        const nome = document.getElementById('prod-nome').value;
        const preco = document.getElementById('prod-preco').value;
        const fileInput = document.getElementById('prod-imagem');
        const file = fileInput.files[0];

        if(!file) {
            produtoAlert.className = "alert error";
            produtoAlert.textContent = "Selecione uma imagem.";
            btnAdd.disabled = false;
            btnAdd.textContent = "Salvar Produto";
            return;
        }

        try {
            let downloadURL = '';

            if (isMock) {
                // Modo Teste Local (Converter imagem em Base64 para persistir no LocalStorage)
                downloadURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });

                const produtosLocais = JSON.parse(localStorage.getItem('produtos') || '[]');
                const novoProduto = {
                    id: 'local_' + Date.now(),
                    nome: nome,
                    preco: Number(preco),
                    imagem_url: downloadURL,
                    status: "Disponível",
                    criado_em: new Date().toISOString()
                };
                produtosLocais.push(novoProduto);
                localStorage.setItem('produtos', JSON.stringify(produtosLocais));
            } else {
                // Modo Firebase Real
                const storageRef = ref(storage, 'produtos/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(snapshot.ref);

                await addDoc(collection(db, "produtos"), {
                    nome: nome,
                    preco: Number(preco),
                    imagem_url: downloadURL,
                    status: "Disponível",
                    criado_em: new Date().toISOString()
                });
            }

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

// Carregar e listar produtos no Admin
async function carregarProdutosAdmin() {
    const tabelaProdutos = document.getElementById('tabela-produtos');
    try {
        let produtos = [];

        if (isMock) {
            let localProds = localStorage.getItem('produtos');
            if (!localProds) {
                const defaultProds = [
                    { id: 'local_1', nome: 'Body Feminino Moderno', preco: 59.90, imagem_url: 'img/roupa.jpg', status: 'Disponível', criado_em: new Date().toISOString() },
                    { id: 'local_2', nome: 'Cropped Style', preco: 39.90, imagem_url: 'img/roupa2.jpg', status: 'Disponível', criado_em: new Date().toISOString() },
                    { id: 'local_3', nome: 'Short Casual Verão', preco: 49.90, imagem_url: 'img/roupa3.jpg', status: 'Esgotado', criado_em: new Date().toISOString() }
                ];
                localStorage.setItem('produtos', JSON.stringify(defaultProds));
                produtos = defaultProds;
            } else {
                produtos = JSON.parse(localProds);
            }
        } else {
            const querySnapshot = await getDocs(collection(db, "produtos"));
            querySnapshot.forEach((documento) => {
                produtos.push({
                    id: documento.id,
                    ...documento.data()
                });
            });
        }
        
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
                <td><img src="${prod.imagem_url}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
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

// Funções globais

window.alterarStatusProduto = async function(id, novoStatus) {
    try {
        if (isMock) {
            const produtosLocais = JSON.parse(localStorage.getItem('produtos') || '[]');
            const index = produtosLocais.findIndex(p => p.id === id);
            if (index !== -1) {
                produtosLocais[index].status = novoStatus;
                localStorage.setItem('produtos', JSON.stringify(produtosLocais));
            }
        } else {
            const docRef = doc(db, "produtos", id);
            await updateDoc(docRef, {
                status: novoStatus
            });
        }
        alert("Status atualizado para: " + novoStatus);
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao atualizar status.");
    }
}

window.excluirProduto = async function(id) {
    if(confirm("Tem certeza que deseja excluir esta peça?")) {
        try {
            if (isMock) {
                const produtosLocais = JSON.parse(localStorage.getItem('produtos') || '[]');
                const filtrados = produtosLocais.filter(p => p.id !== id);
                localStorage.setItem('produtos', JSON.stringify(filtrados));
            } else {
                await deleteDoc(doc(db, "produtos", id));
            }
            carregarProdutosAdmin();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir produto.");
        }
    }
}

function carregarAdminExtras() {
    carregarAgendamentos();
    carregarProdutosAdmin();
    carregarPromocoesAdmin();
    carregarProcedimentosAdmin();
    carregarServicosAdmin();
    carregarConteudoCMS();
    carregarConfigAgenda();
}

// --- PROMOÇÕES ---
const formPromocao = document.getElementById('form-promocao');
const promoAlert = document.getElementById('promo-alert');
const tabelaPromocoes = document.getElementById('tabela-promocoes');

async function carregarPromocoesAdmin() {
    if (!tabelaPromocoes) return;
    try {
        let promocoes = [];
        if (isMock) {
            promocoes = JSON.parse(localStorage.getItem('promocoes') || '[]');
        } else {
            const querySnapshot = await getDocs(collection(db, 'promocoes'));
            querySnapshot.forEach(doc => promocoes.push({ id: doc.id, ...doc.data() }));
        }

        if (!promocoes.length) {
            tabelaPromocoes.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma promoção cadastrada.</td></tr>';
            return;
        }

        tabelaPromocoes.innerHTML = '';
        promocoes.forEach(p => {
            let periodo = '-';
            if (p.data_inicio && p.data_fim) {
                const [iY, iM, iD] = p.data_inicio.split('-').map(Number);
                const [fY, fM, fD] = p.data_fim.split('-').map(Number);
                periodo = `${String(iD).padStart(2,'0')}/${String(iM).padStart(2,'0')}/${iY} até ${String(fD).padStart(2,'0')}/${String(fM).padStart(2,'0')}/${fY}`;
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
            if (isMock && file) {
                imagemURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            } else if (!isMock && file) {
                const storageRef = ref(storage, 'promocoes/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytes(storageRef, file);
                imagemURL = await getDownloadURL(snapshot.ref);
            }

            const novo = {
                titulo,
                descricao,
                status,
                data_inicio: dataInicio,
                data_fim: dataFim,
                imagem_url: imagemURL,
                criado_em: new Date().toISOString()
            };

            if (isMock) {
                const promocoesLocais = JSON.parse(localStorage.getItem('promocoes') || '[]');
                promocoesLocais.push({ id: 'local_pr_' + Date.now(), ...novo });
                localStorage.setItem('promocoes', JSON.stringify(promocoesLocais));
            } else {
                await addDoc(collection(db, 'promocoes'), novo);
            }

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

window.excluirPromocao = async function(id) {
    if (!confirm('Excluir esta promoção?')) return;
    try {
        if (isMock) {
            const lista = JSON.parse(localStorage.getItem('promocoes') || '[]');
            const filtrado = lista.filter(p => p.id !== id);
            localStorage.setItem('promocoes', JSON.stringify(filtrado));
        } else {
            await deleteDoc(doc(db, 'promocoes', id));
        }
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

async function carregarProcedimentosAdmin() {
    if (!tabelaProcedimentos) return;
    try {
        let procedimentos = [];
        if (isMock) {
            procedimentos = JSON.parse(localStorage.getItem('procedimentos') || '[]');
        } else {
            const querySnapshot = await getDocs(collection(db, 'procedimentos'));
            querySnapshot.forEach(doc => procedimentos.push({ id: doc.id, ...doc.data() }));
        }
        if (!procedimentos.length) {
            tabelaProcedimentos.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum procedimento cadastrado.</td></tr>';
            return;
        }
        tabelaProcedimentos.innerHTML = '';
        procedimentos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.imagem_url || 'img/procedimento4.jpg'}" alt="${p.nome}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;"></td>
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
            if (isMock && file) {
                imagemURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            } else if (!isMock && file) {
                const storageRef = ref(storage, 'procedimentos/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytes(storageRef, file);
                imagemURL = await getDownloadURL(snapshot.ref);
            }

            const novo = {
                nome,
                descricao,
                status,
                imagem_url: imagemURL,
                criado_em: new Date().toISOString()
            };

            if (isMock) {
                const lista = JSON.parse(localStorage.getItem('procedimentos') || '[]');
                lista.push({ id: 'local_proc_' + Date.now(), ...novo });
                localStorage.setItem('procedimentos', JSON.stringify(lista));
            } else {
                await addDoc(collection(db, 'procedimentos'), novo);
            }

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

window.excluirProcedimento = async function(id) {
    if (!confirm('Excluir este procedimento?')) return;
    try {
        if (isMock) {
            const lista = JSON.parse(localStorage.getItem('procedimentos') || '[]');
            const filtrado = lista.filter(p => p.id !== id);
            localStorage.setItem('procedimentos', JSON.stringify(filtrado));
        } else {
            await deleteDoc(doc(db, 'procedimentos', id));
        }
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

async function carregarServicosAdmin() {
    if (!tabelaServicos) return;
    try {
        let servicos = [];
        if (isMock) {
            servicos = JSON.parse(localStorage.getItem('servicos') || '[]');
        } else {
            const querySnapshot = await getDocs(collection(db, 'servicos'));
            querySnapshot.forEach(doc => servicos.push({ id: doc.id, ...doc.data() }));
        }
        if (!servicos.length) {
            tabelaServicos.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum serviço cadastrado.</td></tr>';
            return;
        }
        tabelaServicos.innerHTML = '';
        servicos.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${s.imagem_url || 'img/atendimento_espiritual.png'}" alt="${s.nome}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;"></td>
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
            if (isMock && file) {
                imagemURL = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            } else if (!isMock && file) {
                const storageRef = ref(storage, 'servicos/' + Date.now() + '_' + file.name);
                const snapshot = await uploadBytes(storageRef, file);
                imagemURL = await getDownloadURL(snapshot.ref);
            }

            const novo = {
                nome,
                descricao,
                status,
                imagem_url: imagemURL,
                criado_em: new Date().toISOString()
            };

            if (isMock) {
                const lista = JSON.parse(localStorage.getItem('servicos') || '[]');
                lista.push({ id: 'local_serv_' + Date.now(), ...novo });
                localStorage.setItem('servicos', JSON.stringify(lista));
            } else {
                await addDoc(collection(db, 'servicos'), novo);
            }

            servAlert.className = 'alert success';
            servAlert.textContent = 'Serviço salvo com sucesso!';
            formServico.reset();
            carregarServicosAdmin();
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            servAlert.className = 'alert error';
            servAlert.textContent = 'Erro ao salvar serviço.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Serviço';
        }
    });
}

window.excluirServico = async function(id) {
    if (!confirm('Excluir este serviço?')) return;
    try {
        if (isMock) {
            const lista = JSON.parse(localStorage.getItem('servicos') || '[]');
            const filtrado = lista.filter(s => s.id !== id);
            localStorage.setItem('servicos', JSON.stringify(filtrado));
        } else {
            await deleteDoc(doc(db, 'servicos', id));
        }
        carregarServicosAdmin();
    } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        alert('Erro ao excluir serviço.');
    }
}

// --- CMS CONTEÚDO DO SITE ---
const formConteudo = document.getElementById('form-conteudo');
const conteudoAlert = document.getElementById('conteudo-alert');

async function carregarConteudoCMS() {
    if (!formConteudo) return;
    try {
        let content = null;
        if (isMock) {
            content = JSON.parse(localStorage.getItem('site_conteudo') || 'null');
        } else {
            const docSnap = await getDoc(doc(db, "site_content", "main"));
            if (docSnap.exists()) {
                content = docSnap.data();
            }
        }

        // Se não houver conteúdo salvo, usar os padrões do HTML do site
        if (!content) {
            content = {
                hero_titulo: "Beleza, Confiança e Autoestima",
                hero_descricao: "Transforme seu visual com procedimentos capilares modernos, atendimento acolhedor e resultados que realçam sua autoestima.",
                vantagens_titulo: "Vantagens para Corpo e Mente",
                vantagens_descricao: "Além dos resultados visíveis no cabelo, nossos serviços também trazem bem-estar, autoconfiança e tranquilidade para o seu dia a dia.",
                v1_titulo: "Bem-estar emocional",
                v1_desc: "Mais que beleza, oferecemos um momento dedicado a você, para renovar sua energia e autoestima.",
                v2_titulo: "Confiança renovada",
                v2_desc: "Transformações que impactam sua imagem e ajudam você a se sentir mais segura e radiante.",
                v3_titulo: "Equilíbrio e suporte",
                v3_desc: "Cuidamos dos detalhes do seu visual, para que você possa também encontrar mais equilíbrio no seu dia.",
                footer_slogan: "Da comunidade para o mundo, com força, beleza e espiritualidade."
            };
        }

        document.getElementById('cms-hero-titulo').value = content.hero_titulo || "";
        document.getElementById('cms-hero-descricao').value = content.hero_descricao || "";
        document.getElementById('cms-vantagens-titulo').value = content.vantagens_titulo || "";
        document.getElementById('cms-vantagens-descricao').value = content.vantagens_descricao || "";
        document.getElementById('cms-v1-titulo').value = content.v1_titulo || "";
        document.getElementById('cms-v1-desc').value = content.v1_desc || "";
        document.getElementById('cms-v2-titulo').value = content.v2_titulo || "";
        document.getElementById('cms-v2-desc').value = content.v2_desc || "";
        document.getElementById('cms-v3-titulo').value = content.v3_titulo || "";
        document.getElementById('cms-v3-desc').value = content.v3_desc || "";
        document.getElementById('cms-footer-slogan').value = content.footer_slogan || "";

    } catch (error) {
        console.error("Erro ao carregar CMS:", error);
    }
}

if (formConteudo) {
    formConteudo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-conteudo');
        btn.disabled = true;
        btn.textContent = "Salvando...";

        const content = {
            hero_titulo: document.getElementById('cms-hero-titulo').value,
            hero_descricao: document.getElementById('cms-hero-descricao').value,
            vantagens_titulo: document.getElementById('cms-vantagens-titulo').value,
            vantagens_descricao: document.getElementById('cms-vantagens-descricao').value,
            v1_titulo: document.getElementById('cms-v1-titulo').value,
            v1_desc: document.getElementById('cms-v1-desc').value,
            v2_titulo: document.getElementById('cms-v2-titulo').value,
            v2_desc: document.getElementById('cms-v2-desc').value,
            v3_titulo: document.getElementById('cms-v3-titulo').value,
            v3_desc: document.getElementById('cms-v3-desc').value,
            footer_slogan: document.getElementById('cms-footer-slogan').value,
            atualizado_em: new Date().toISOString()
        };

        try {
            if (isMock) {
                localStorage.setItem('site_conteudo', JSON.stringify(content));
            } else {
                await setDoc(doc(db, "site_content", "main"), content);
            }
            conteudoAlert.className = "alert success";
            conteudoAlert.textContent = "Conteúdo do site atualizado com sucesso!";
        } catch (error) {
            console.error("Erro ao salvar CMS:", error);
            conteudoAlert.className = "alert error";
            conteudoAlert.textContent = "Erro ao salvar conteúdo do site.";
        } finally {
            btn.disabled = false;
            btn.textContent = "Salvar Alterações de Conteúdo";
            setTimeout(() => { conteudoAlert.style.display = 'none'; }, 3000);
        }
    });
}


// --- CONFIGURAÇÕES DA AGENDA ---
const formConfigGeral = document.getElementById('form-config-agenda-geral');
const formBloquearData = document.getElementById('form-bloquear-data');
const configAgendaAlert = document.getElementById('config-agenda-alert');
const tabelaDatasBloqueadas = document.getElementById('tabela-datas-bloqueadas');

async function carregarConfigAgenda() {
    if (!formConfigGeral) return;
    try {
        let config = null;
        if (isMock) {
            config = JSON.parse(localStorage.getItem('agenda_config') || 'null');
        } else {
            const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
            if (docSnap.exists()) {
                config = docSnap.data();
            }
        }

        // Padrões se não existirem
        if (!config) {
            config = {
                intervalo: "60",
                hora_inicio: "09:00",
                hora_fim: "18:00",
                dias_semana: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
                datas_bloqueadas: []
            };
        }

        document.getElementById('cfg-intervalo').value = config.intervalo || "60";
        document.getElementById('cfg-inicio').value = config.hora_inicio || "09:00";
        document.getElementById('cfg-fim').value = config.hora_fim || "18:00";

        // Checkboxes
        for (let i = 0; i <= 6; i++) {
            const cb = document.getElementById('cfg-dia-' + i);
            if (cb) {
                cb.checked = (config.dias_semana || []).includes(i) || (config.dias_semana || []).includes(String(i));
            }
        }

        // Tabela de datas bloqueadas
        renderizarDatasBloqueadas(config.datas_bloqueadas || []);

    } catch (error) {
        console.error("Erro ao carregar configurações da agenda:", error);
    }
}

function renderizarDatasBloqueadas(datas) {
    if (!tabelaDatasBloqueadas) return;
    if (datas.length === 0) {
        tabelaDatasBloqueadas.innerHTML = '<tr><td colspan="2" style="text-align: center;">Nenhuma data bloqueada.</td></tr>';
        return;
    }
    // Ordenar datas
    datas.sort();
    tabelaDatasBloqueadas.innerHTML = '';
    datas.forEach(dt => {
        const partes = dt.split('-');
        const dataExibicao = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dt;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataExibicao}</td>
            <td><button onclick="window.desbloquearData('${dt}')" style="background:#ffebee;color:#c62828;border:none;padding:0.4rem;border-radius:5px;cursor:pointer;font-size:0.85rem;">Desbloquear</button></td>
        `;
        tabelaDatasBloqueadas.appendChild(tr);
    });
}

if (formConfigGeral) {
    formConfigGeral.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-cfg-geral');
        btn.disabled = true;
        btn.textContent = "Salvando...";

        const intervalo = document.getElementById('cfg-intervalo').value;
        const hora_inicio = document.getElementById('cfg-inicio').value;
        const hora_fim = document.getElementById('cfg-fim').value;

        const dias_semana = [];
        for (let i = 0; i <= 6; i++) {
            const cb = document.getElementById('cfg-dia-' + i);
            if (cb && cb.checked) {
                dias_semana.push(i);
            }
        }

        try {
            // Obter a config atual para não perder as datas bloqueadas
            let configAtual = null;
            if (isMock) {
                configAtual = JSON.parse(localStorage.getItem('agenda_config') || 'null');
            } else {
                const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
                if (docSnap.exists()) configAtual = docSnap.data();
            }

            const datas_bloqueadas = configAtual ? (configAtual.datas_bloqueadas || []) : [];

            const novaConfig = {
                intervalo,
                hora_inicio,
                hora_fim,
                dias_semana,
                datas_bloqueadas
            };

            if (isMock) {
                localStorage.setItem('agenda_config', JSON.stringify(novaConfig));
            } else {
                await setDoc(doc(db, "config_agenda", "settings"), novaConfig);
            }

            configAgendaAlert.className = "alert success";
            configAgendaAlert.textContent = "Configurações gerais salvas!";
        } catch (error) {
            console.error("Erro ao salvar config geral:", error);
            configAgendaAlert.className = "alert error";
            configAgendaAlert.textContent = "Erro ao salvar configurações.";
        } finally {
            btn.disabled = false;
            btn.textContent = "Salvar Configurações Gerais";
            setTimeout(() => { configAgendaAlert.style.display = 'none'; }, 3000);
        }
    });
}

if (formBloquearData) {
    formBloquearData.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputData = document.getElementById('cfg-bloquear-data');
        const novaData = inputData.value; // YYYY-MM-DD
        if (!novaData) return;

        try {
            let config = null;
            if (isMock) {
                config = JSON.parse(localStorage.getItem('agenda_config') || 'null');
            } else {
                const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
                if (docSnap.exists()) config = docSnap.data();
            }

            if (!config) {
                config = { intervalo: "60", hora_inicio: "09:00", hora_fim: "18:00", dias_semana: [1, 2, 3, 4, 5, 6], datas_bloqueadas: [] };
            }

            if (!config.datas_bloqueadas) config.datas_bloqueadas = [];
            
            if (config.datas_bloqueadas.includes(novaData)) {
                alert("Esta data já está bloqueada.");
                return;
            }

            config.datas_bloqueadas.push(novaData);

            if (isMock) {
                localStorage.setItem('agenda_config', JSON.stringify(config));
            } else {
                await setDoc(doc(db, "config_agenda", "settings"), config);
            }

            inputData.value = '';
            renderizarDatasBloqueadas(config.datas_bloqueadas);
            configAgendaAlert.className = "alert success";
            configAgendaAlert.textContent = "Data bloqueada com sucesso!";
            setTimeout(() => { configAgendaAlert.style.display = 'none'; }, 2000);
        } catch (error) {
            console.error("Erro ao bloquear data:", error);
            alert("Erro ao bloquear data.");
        }
    });
}

window.desbloquearData = async function(dataStr) {
    if (!confirm(`Deseja desbloquear a data ${dataStr.split('-').reverse().join('/')}?`)) return;
    try {
        let config = null;
        if (isMock) {
            config = JSON.parse(localStorage.getItem('agenda_config') || 'null');
        } else {
            const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
            if (docSnap.exists()) config = docSnap.data();
        }

        if (config && config.datas_bloqueadas) {
            config.datas_bloqueadas = config.datas_bloqueadas.filter(d => d !== dataStr);

            if (isMock) {
                localStorage.setItem('agenda_config', JSON.stringify(config));
            } else {
                await setDoc(doc(db, "config_agenda", "settings"), config);
            }

            renderizarDatasBloqueadas(config.datas_bloqueadas);
            configAgendaAlert.className = "alert success";
            configAgendaAlert.textContent = "Data desbloqueada!";
            setTimeout(() => { configAgendaAlert.style.display = 'none'; }, 2000);
        }
    } catch (error) {
        console.error("Erro ao desbloquear data:", error);
        alert("Erro ao desbloquear data.");
    }
}

// --- NÚMEROS WHATSAPP DO ADMINISTRADOR ---
async function carregarNumerosAdmin() {
    const input = document.getElementById('cfg-numeros-admin');
    if (!input) return;
    try {
        if (isMock) {
            const config = JSON.parse(localStorage.getItem('agenda_config') || '{}');
            input.value = config.numeros_admin || '';
        } else {
            const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
            if (docSnap.exists()) {
                input.value = docSnap.data().numeros_admin || '';
            }
        }
    } catch (err) {
        console.error("Erro ao carregar números do admin:", err);
    }
}

window.salvarNumerosAdmin = async function() {
    const input = document.getElementById('cfg-numeros-admin');
    const alertDiv = document.getElementById('numeros-admin-alert');
    const btn = document.getElementById('btn-save-numeros-admin');
    if (!input) return;

    btn.disabled = true;
    btn.textContent = "Salvando...";

    const numeros = input.value.trim();

    try {
        if (isMock) {
            let config = JSON.parse(localStorage.getItem('agenda_config') || '{}');
            config.numeros_admin = numeros;
            localStorage.setItem('agenda_config', JSON.stringify(config));
        } else {
            const docRef = doc(db, "config_agenda", "settings");
            const docSnap = await getDoc(docRef);
            const existing = docSnap.exists() ? docSnap.data() : {};
            await setDoc(docRef, { ...existing, numeros_admin: numeros });
        }
        alertDiv.className = "alert success";
        alertDiv.textContent = "Números salvos com sucesso!";
        alertDiv.style.display = 'block';
        setTimeout(() => { alertDiv.style.display = 'none'; }, 3000);
    } catch (err) {
        console.error("Erro ao salvar números do admin:", err);
        alertDiv.className = "alert error";
        alertDiv.textContent = "Erro ao salvar. Tente novamente.";
        alertDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = "Salvar Números";
    }
};
