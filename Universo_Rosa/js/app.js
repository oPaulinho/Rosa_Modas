import { db, isMock } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// --- MÁSCARA DE TELEFONE ---
const telInput = document.getElementById('telefone');
if (telInput) {
    telInput.addEventListener('input', () => {
        let v = telInput.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 0) v = `(${v}`;
        telInput.value = v;
    });
}

// --- LÓGICA DE AGENDAMENTO ---
const formAgendamento = document.getElementById('form-agendamento');
const alertAgendamento = document.getElementById('agendamento-alert');

if(formAgendamento) {
    formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = document.getElementById('btn-submit-agendamento');
        
        const area = document.getElementById('area').value;
        const servico = document.getElementById('servico').value;
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const dataStr = document.getElementById('selected-date-time').value; // Formato YYYY-MM-DDTHH:MM

        // Validação: campos obrigatórios
        if (!nome) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Por favor, informe seu nome completo.";
            return;
        }

        const telNumeros = telefone.replace(/\D/g, '');
        if (telNumeros.length < 10 || telNumeros.length > 11) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Informe um telefone válido com DDD (ex: (11) 99999-9999).";
            return;
        }

        if (!dataStr) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Por favor, escolha uma data e horário.";
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Aguarde...";

        try {
            // --- BLOQUEIO DE DUPLICADOS ---
            let agendamentosExistentes = [];
            if (isMock) {
                agendamentosExistentes = JSON.parse(localStorage.getItem('agendamentos') || '[]');
            } else {
                const qs = await getDocs(collection(db, "agendamentos"));
                qs.forEach(d => agendamentosExistentes.push(d.data()));
            }

            const agora = new Date();
            const telefoneNormalizado = telNumeros;
            const temDuplicado = agendamentosExistentes.some(ag => {
                const agTel = (ag.telefone || '').replace(/\D/g, '');
                if (agTel !== telefoneNormalizado) return false;
                const agDataHora = new Date(ag.data_hora);
                const statusAtivo = !ag.status || ag.status.toLowerCase() !== 'cancelado';
                return statusAtivo && agDataHora > agora;
            });

            if (temDuplicado) {
                alertAgendamento.className = "alert error";
                alertAgendamento.textContent = "⚠️ Já existe um agendamento ativo para este número de telefone. Aguarde a data/hora do seu agendamento anterior ou entre em contato conosco.";
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Confirmar Agendamento";
                return;
            }

            const novoAgendamento = {
                area: area,
                servico: servico,
                nome_cliente: nome,
                telefone: telefone,
                data_hora: dataStr,
                status: 'pendente',
                criado_em: new Date().toISOString()
            };

            if (isMock) {
                const agendamentosLocais = JSON.parse(localStorage.getItem('agendamentos') || '[]');
                novoAgendamento.id = 'local_' + Date.now();
                agendamentosLocais.push(novoAgendamento);
                localStorage.setItem('agendamentos', JSON.stringify(agendamentosLocais));
            } else {
                await addDoc(collection(db, "agendamentos"), novoAgendamento);
            }

            alertAgendamento.className = "alert success";
            alertAgendamento.textContent = "Agendamento pré-registrado com sucesso! Aguarde nossa confirmação.";
            formAgendamento.reset();
            
            // Limpar seleções da agenda
            document.getElementById('selected-date-time').value = '';
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
            const timeSlotsContainer = document.getElementById('time-slots');
            if (timeSlotsContainer) {
                timeSlotsContainer.innerHTML = '<p style="color: #888; font-size: 0.95rem;">Por favor, selecione um dia acima para visualizar os horários.</p>';
            }

            // Recarregar os horários disponíveis (para o dia selecionado/geral)
            inicializarAgenda();

            // Abrir Modal de Aviso
            const modal = document.getElementById('modal-aviso');
            if (modal) {
                modal.style.display = 'flex';
            }

        } catch (error) {
            console.error("Erro ao agendar: ", error);
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Erro ao realizar agendamento. Tente novamente mais tarde.";
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Agendamento";
        }
    });
}


// --- PROMOÇÕES COM CARROSSEL MAGALU-STYLE ---
let promoAtualIdx = 0;
let promoAtivas = [];

function renderizarCarrossel() {
    const banner = document.getElementById('promo-banner');
    const slidesContainer = document.getElementById('promo-slides');
    const dotsContainer = document.getElementById('promo-dots');
    const prevBtn = document.getElementById('promo-prev-btn');
    const nextBtn = document.getElementById('promo-next-btn');
    if (!banner || !slidesContainer) return;

    if (promoAtivas.length === 0) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'block';
    slidesContainer.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    promoAtivas.forEach((p, idx) => {
        const [iY, iM, iD] = p.data_inicio.split('-').map(Number);
        const [fY, fM, fD] = p.data_fim.split('-').map(Number);
        const dtInicioFmt = `${String(iD).padStart(2,'0')}/${String(iM).padStart(2,'0')}/${iY}`;
        const dtFimFmt = `${String(fD).padStart(2,'0')}/${String(fM).padStart(2,'0')}/${fY}`;
        const imageSrc = p.imagem_url || 'img/Rosa.png';

        const slide = document.createElement('div');
        slide.className = 'promo-slide';
        slide.innerHTML = `
            <div class="promo-slide-header">
                <span class="promo-badge">🌟 Promoção</span>
                <h2 class="promo-slide-title">${p.titulo || 'Promoção Especial'}</h2>
            </div>
            <img class="promo-slide-img" src="${imageSrc}" alt="${p.titulo || 'Promoção'}" onerror="this.src='img/Rosa.png'">
            <div class="promo-slide-body">
                <p class="promo-slide-desc">${p.descricao || ''}</p>
                <p class="promo-slide-validade">📅 Válido de ${dtInicioFmt} até ${dtFimFmt}</p>
            </div>
        `;
        slidesContainer.appendChild(slide);

        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = 'promo-dot' + (idx === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Promoção ${idx + 1}`);
            dot.addEventListener('click', () => irParaSlide(idx));
            dotsContainer.appendChild(dot);
        }
    });

    // Mostrar/ocultar setas
    const multiSlide = promoAtivas.length > 1;
    if (prevBtn) prevBtn.style.display = multiSlide ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = multiSlide ? 'flex' : 'none';
    if (dotsContainer) dotsContainer.style.display = multiSlide ? 'flex' : 'none';

    // Autoplay se houver mais de uma promo
    if (multiSlide) {
        setInterval(() => window.mudarPromoSlide(1), 6000);
    }

    irParaSlide(0);

    // Swipe touch
    const container = document.querySelector('.promo-carousel-container');
    if (container) {
        let touchStartX = 0;
        container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        container.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) window.mudarPromoSlide(diff > 0 ? 1 : -1);
        }, { passive: true });
    }
}

function irParaSlide(idx) {
    promoAtualIdx = (idx + promoAtivas.length) % promoAtivas.length;
    const slidesContainer = document.getElementById('promo-slides');
    if (slidesContainer) slidesContainer.style.transform = `translateX(-${promoAtualIdx * 100}%)`;
    document.querySelectorAll('.promo-dot').forEach((d, i) => {
        d.classList.toggle('active', i === promoAtualIdx);
    });
}

window.mudarPromoSlide = function(direction) {
    irParaSlide(promoAtualIdx + direction);
};

async function carregarPromocao() {
    try {
        let todas = [];
        if (isMock) {
            const saved = localStorage.getItem('promocoes');
            if (saved) todas = JSON.parse(saved);
        } else {
            const querySnapshot = await getDocs(collection(db, 'promocoes'));
            querySnapshot.forEach(doc => todas.push({ id: doc.id, ...doc.data() }));
        }

        const agora = new Date();
        promoAtivas = todas.filter(p => {
            if (!p.data_inicio || !p.data_fim) return false;
            try {
                const [iY, iM, iD] = p.data_inicio.split('-').map(Number);
                const [fY, fM, fD] = p.data_fim.split('-').map(Number);
                const inicio = new Date(iY, iM - 1, iD, 0, 0, 0);
                const fim = new Date(fY, fM - 1, fD, 23, 59, 59);
                const statusMatch = p.status && p.status.trim().toLowerCase() === 'ativa';
                return statusMatch && agora >= inicio && agora <= fim;
            } catch { return false; }
        });

        renderizarCarrossel();
    } catch (error) {
        console.error('Erro ao carregar promoções:', error);
    }
}

// --- PROCEDIMENTOS ---
async function carregarProcedimentos() {
    const container = document.getElementById('procedimentos-container');
    if (!container) return;

    try {
        let procedimentos = [];

        if (isMock) {
            const saved = localStorage.getItem('procedimentos');
            procedimentos = saved ? JSON.parse(saved) : [
                { id: 'local_p1', nome: 'Escova & Finalização', descricao: 'Modelagem impecável e brilho extraordinário para o dia a dia.', imagem_url: 'img/escova_cabelo.png', status: 'Disponível' },
                { id: 'local_p2', nome: 'Botox Capilar', descricao: 'Redução do frizz e hidratação profunda.', imagem_url: 'img/botox_capilar.png', status: 'Disponível' },
                { id: 'local_p3', nome: 'Escova Progressiva', descricao: 'Alinhamento perfeito e brilho duradouro.', imagem_url: 'img/procedimento4.jpg', status: 'Disponível' }
            ];
            if (!saved) localStorage.setItem('procedimentos', JSON.stringify(procedimentos));
        } else {
            const querySnapshot = await getDocs(collection(db, 'procedimentos'));
            querySnapshot.forEach(doc => procedimentos.push({ id: doc.id, ...doc.data() }));
        }

        if (!procedimentos.length) {
            container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1;">Nenhum procedimento cadastrado.</p>';
            return;
        }

        container.innerHTML = '';
        procedimentos.forEach(proc => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${proc.imagem_url || 'img/procedimento4.jpg'}" alt="${proc.nome}" class="product-img">
                <div class="product-info">
                    <h3 class="product-title">${proc.nome}</h3>
                    <p style="font-size:0.95rem; color:#555; margin-bottom:1rem;">${proc.descricao || 'Procedimento disponível.'}</p>
                    <a href="#agendamento" class="hero-btn btn-aesthetics" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;" onclick="selecionarArea('estetica', '${proc.nome}')">Agendar</a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar procedimentos:', error);
    }
}

// --- SERVIÇOS ESPIRITUAIS ---
async function carregarServicos() {
    const container = document.getElementById('servicos-container');
    if (!container) return;

    try {
        let servicos = [];

        if (isMock) {
            const saved = localStorage.getItem('servicos');
            servicos = saved ? JSON.parse(saved) : [
                { id: 'local_s1', nome: 'Consulta Espiritual', descricao: 'Orientação para desafios pessoais e espirituais.', imagem_url: 'img/atendimento_espiritual.png', status: 'Disponível' },
                { id: 'local_s2', nome: 'Leitura de Tarot', descricao: 'Respostas sensíveis sobre amor, trabalho e vida.', imagem_url: 'img/tarot_cartas.png', status: 'Disponível' }
            ];
            if (!saved) localStorage.setItem('servicos', JSON.stringify(servicos));
        } else {
            const querySnapshot = await getDocs(collection(db, 'servicos'));
            querySnapshot.forEach(doc => servicos.push({ id: doc.id, ...doc.data() }));
        }

        if (!servicos.length) {
            container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1;">Nenhum serviço espiritual cadastrado.</p>';
            return;
        }

        container.innerHTML = '';
        servicos.forEach(serv => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${serv.imagem_url || 'img/atendimento_espiritual.png'}" alt="${serv.nome}" class="product-img">
                <div class="product-info">
                    <h3 class="product-title">${serv.nome}</h3>
                    <p style="font-size:0.95rem; color:#555; margin-bottom:1rem;">${serv.descricao || 'Serviço espiritual disponível.'}</p>
                    <a href="#agendamento" class="hero-btn btn-spiritual" style="padding: 0.6rem 1.5rem; font-size: 0.95rem;" onclick="selecionarArea('espiritual', '${serv.nome}')">Agendar</a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar serviços espirituais:', error);
    }
}

// --- CATÁLOGO DE ROUPAS ---
async function carregarCatalogo() {
    const catalogContainer = document.getElementById('catalog-container');
    if(!catalogContainer) return;

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
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                produtos.push({
                    id: doc.id,
                    ...data
                });
            });
        }
        
        if (produtos.length === 0) {
            catalogContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">Nenhum produto cadastrado ainda.</p>';
            return;
        }

        catalogContainer.innerHTML = '';

        produtos.forEach((produto) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const statusClass = produto.status === 'Disponível' ? 'status-disponivel' : 'status-esgotado';
            const precoFormatado = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            card.innerHTML = `
                <img src="${produto.imagem_url || 'https://via.placeholder.com/300x400?text=Sem+Foto'}" alt="${produto.nome}" class="product-img">
                <div class="product-info">
                    <h3 class="product-title">${produto.nome}</h3>
                    <p class="product-price">${precoFormatado}</p>
                    <span class="product-status ${statusClass}">${produto.status || 'Disponível'}</span>
                </div>
            `;
            catalogContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar produtos: ", error);
        catalogContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: red;">Erro ao carregar os produtos. Verifique se as chaves do Firebase estão corretas.</p>';
    }
}

// --- CARREGAR CONTEÚDO CMS DINAMICAMENTE ---
async function carregarConteudoCMS() {
    try {
        let content = null;
        if (isMock) {
            content = JSON.parse(localStorage.getItem('site_conteudo') || 'null');
        } else {
            const docSnap = await getDoc(doc(db, "site_content", "main"));
            if (docSnap.exists()) content = docSnap.data();
        }

        if (content) {
            // Hero
            const heroTitle = document.querySelector('.hero-aesthetics .hero-title');
            const heroDesc = document.querySelector('.hero-aesthetics p');
            if (heroTitle) heroTitle.textContent = content.hero_titulo;
            if (heroDesc) heroDesc.textContent = content.hero_descricao;

            // Vantagens
            const vantTitle = document.querySelector('#vantagens .section-title');
            const vantDesc = document.querySelector('#vantagens > p');
            if (vantTitle) vantTitle.textContent = content.vantagens_titulo;
            if (vantDesc) vantDesc.textContent = content.vantagens_descricao;

            const cards = document.querySelectorAll('#vantagens .catalog-grid .product-card');
            if (cards.length >= 3) {
                // Card 1
                const c1T = cards[0].querySelector('h3');
                const c1D = cards[0].querySelector('p');
                if (c1T) c1T.textContent = content.v1_titulo;
                if (c1D) c1D.textContent = content.v1_desc;

                // Card 2
                const c2T = cards[1].querySelector('h3');
                const c2D = cards[1].querySelector('p');
                if (c2T) c2T.textContent = content.v2_titulo;
                if (c2D) c2D.textContent = content.v2_desc;

                // Card 3
                const c3T = cards[2].querySelector('h3');
                const c3D = cards[2].querySelector('p');
                if (c3T) c3T.textContent = content.v3_titulo;
                if (c3D) c3D.textContent = content.v3_desc;
            }

            // Footer Slogan
            const footerSlogan = document.querySelector('footer p:nth-of-type(1)');
            if (footerSlogan) footerSlogan.textContent = content.footer_slogan;
        }
    } catch (error) {
        console.error("Erro ao carregar conteúdo CMS do site:", error);
    }
}

// --- SISTEMA DE AGENDA E HORÁRIOS INTERATIVO ---
let agendaConfig = {
    intervalo: 60, // em minutos
    hora_inicio: "09:00",
    hora_fim: "18:00",
    dias_semana: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
    datas_bloqueadas: []
};

async function inicializarAgenda() {
    const dateCarousel = document.getElementById('date-carousel');
    if (!dateCarousel) return;

    try {
        // Carregar configurações
        let config = null;
        if (isMock) {
            config = JSON.parse(localStorage.getItem('agenda_config') || 'null');
        } else {
            const docSnap = await getDoc(doc(db, "config_agenda", "settings"));
            if (docSnap.exists()) {
                config = docSnap.data();
            }
        }

        if (config) {
            agendaConfig.intervalo = parseInt(config.intervalo || "60");
            agendaConfig.hora_inicio = config.hora_inicio || "09:00";
            agendaConfig.hora_fim = config.hora_fim || "18:00";
            agendaConfig.dias_semana = (config.dias_semana || []).map(d => parseInt(d));
            agendaConfig.datas_bloqueadas = config.datas_bloqueadas || [];
        }

        // Carregar todos os agendamentos existentes para filtrar ocupados
        let agendamentos = [];
        if (isMock) {
            agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
        } else {
            const querySnapshot = await getDocs(collection(db, "agendamentos"));
            querySnapshot.forEach(doc => {
                agendamentos.push(doc.data());
            });
        }

        // Gerar próximos 14 dias
        dateCarousel.innerHTML = '';
        const hoje = new Date();
        let diasGerados = 0;
        let diaCorrente = new Date(hoje);

        // Limite de busca de 30 dias para preencher 14 dias de atendimento válidos
        for (let i = 0; i < 30 && diasGerados < 14; i++) {
            const diaSemana = diaCorrente.getDay(); // 0 = Domingo, 1 = Segunda...
            const dataStr = diaCorrente.toISOString().split('T')[0]; // YYYY-MM-DD

            // Verificar se o dia da semana é trabalhado E se não está bloqueado
            const diaTrabalhado = agendaConfig.dias_semana.includes(diaSemana);
            const diaBloqueado = agendaConfig.datas_bloqueadas.includes(dataStr);
            
            // Se hoje, verificar se ainda dá tempo de agendar (se já passou do expediente fim)
            let hojeValido = true;
            if (i === 0) {
                const [fimH, fimM] = agendaConfig.hora_fim.split(':').map(Number);
                const limiteHoje = new Date(hoje);
                limiteHoje.setHours(fimH, fimM, 0, 0);
                if (hoje >= limiteHoje) {
                    hojeValido = false;
                }
            }

            if (diaTrabalhado && !diaBloqueado && hojeValido) {
                const dayNum = diaCorrente.getDate();
                const dayName = diaCorrente.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                
                const card = document.createElement('div');
                card.className = 'date-card';
                card.dataset.date = dataStr;
                card.innerHTML = `
                    <span class="day-name">${dayName}</span>
                    <span class="day-num">${dayNum}</span>
                `;

                card.addEventListener('click', () => {
                    document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    carregarHorariosDoDia(dataStr, agendamentos);
                });

                dateCarousel.appendChild(card);
                diasGerados++;
            }
            diaCorrente.setDate(diaCorrente.getDate() + 1);
        }

        if (diasGerados === 0) {
            dateCarousel.innerHTML = '<p style="color:#c62828;">Sem dias de atendimento disponíveis no momento.</p>';
        }

    } catch (error) {
        console.error("Erro ao inicializar agenda:", error);
    }
}

function carregarHorariosDoDia(dataStr, agendamentos) {
    const timeSlotsContainer = document.getElementById('time-slots');
    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = '';
    
    const [startH, startM] = agendaConfig.hora_inicio.split(':').map(Number);
    const [endH, endM] = agendaConfig.hora_fim.split(':').map(Number);

    const dataAtual = new Date();
    const selecionadaHoje = (dataStr === dataAtual.toISOString().split('T')[0]);

    let slot = new Date();
    slot.setHours(startH, startM, 0, 0);

    const limiteFim = new Date();
    limiteFim.setHours(endH, endM, 0, 0);

    let slotsCount = 0;

    while (slot < limiteFim) {
        const horaStr = slot.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        const dateTimeString = `${dataStr}T${horaStr}`; // YYYY-MM-DDTHH:MM

        let horarioPassou = false;
        if (selecionadaHoje) {
            const slotCompleto = new Date(dataStr + 'T' + horaStr);
            if (dataAtual >= slotCompleto) {
                horarioPassou = true;
            }
        }

        // Os agendamentos capilares e espirituais compartilham e consomem a mesma agenda
        const isBooked = agendamentos.some(ag => ag.data_hora === dateTimeString);

        if (!horarioPassou) {
            const btnSlot = document.createElement('div');
            btnSlot.className = 'time-slot';
            if (isBooked) {
                btnSlot.className += ' booked';
                btnSlot.innerHTML = `${horaStr} <span style="font-size:0.7rem; display:block;">Ocupado</span>`;
            } else {
                btnSlot.textContent = horaStr;
                btnSlot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                    btnSlot.classList.add('active');
                    document.getElementById('selected-date-time').value = dateTimeString;
                });
            }
            timeSlotsContainer.appendChild(btnSlot);
            slotsCount++;
        }

        slot.setMinutes(slot.getMinutes() + agendaConfig.intervalo);
    }

    if (slotsCount === 0) {
        timeSlotsContainer.innerHTML = '<p style="color:#c62828;">Não há horários disponíveis para hoje.</p>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    carregarConteudoCMS();
    carregarPromocao();
    carregarCatalogo();
    carregarProcedimentos();
    carregarServicos();
    inicializarAgenda();
});

