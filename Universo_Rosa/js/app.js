import { API_URL } from './api-config.js';

// --- MÁSCARA DE TELEFONE ---
// Captura o campo de entrada do telefone/WhatsApp no formulário
const telInput = document.getElementById('telefone');
if (telInput) {
    // Escuta quando o usuário digita no campo
    telInput.addEventListener('input', () => {
        // Remove qualquer caractere que não seja número
        let v = telInput.value.replace(/\D/g, '');
        // Limita o tamanho máximo a 11 dígitos (DDD + 9 dígitos)
        if (v.length > 11) v = v.slice(0, 11);
        // Formata como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX dependendo do tamanho
        if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
        else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
        else if (v.length > 0) v = `(${v}`;
        telInput.value = v; // Aplica o valor formatado de volta no campo
    });
}

// --- LÓGICA DE AGENDAMENTO ---
// Captura o formulário e o contêiner de mensagens de sucesso/erro
const formAgendamento = document.getElementById('form-agendamento');
const alertAgendamento = document.getElementById('agendamento-alert');

if(formAgendamento) {
    // Escuta o envio (submit) do formulário
    formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que a página recarregue
        
        const btnSubmit = document.getElementById('btn-submit-agendamento');
        
        // Coleta os dados preenchidos no formulário
        const area = document.getElementById('area').value;
        const servico = document.getElementById('servico').value;
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const dataStr = document.getElementById('selected-date-time').value; // Formato YYYY-MM-DDTHH:MM

        // Validação simples: nome deve ser preenchido
        if (!nome) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Por favor, informe seu nome completo.";
            return;
        }

        // Validação simples: o telefone formatado deve conter 10 ou 11 dígitos numéricos
        const telNumeros = telefone.replace(/\D/g, '');
        if (telNumeros.length < 10 || telNumeros.length > 11) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Informe um telefone válido com DDD (ex: (11) 99999-9999).";
            return;
        }

        // Validação simples: data e hora selecionadas
        if (!dataStr) {
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Por favor, escolha uma data e horário.";
            return;
        }

        // Desabilita o botão para evitar múltiplos cliques acidentais
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Aguarde...";

        try {
            // --- BLOQUEIO DE DUPLICADOS ---
            // Buscamos os agendamentos existentes na nossa API para verificar duplicados
            const responseDocs = await fetch(`${API_URL}/agendamentos`);
            const agendamentosExistentes = await responseDocs.json();

            const agora = new Date();
            const telefoneNormalizado = telNumeros;
            
            // Verifica se este mesmo número de celular já possui algum agendamento futuro ativo
            const temDuplicado = agendamentosExistentes.some(ag => {
                const agTel = (ag.telefone || '').replace(/\D/g, '');
                if (agTel !== telefoneNormalizado) return false;
                const agDataHora = new Date(ag.dataHora);
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

            // Prepara o objeto JSON que será enviado à nossa API REST no Spring Boot
            const novoAgendamento = {
                area: area,
                servico: servico,
                nomeCliente: nome, // correspondente a 'nomeCliente' do backend
                telefone: telefone,
                dataHora: dataStr,
                status: 'pendente'
            };

            // Faz a requisição POST para persistir o agendamento no MySQL
            const saveRes = await fetch(`${API_URL}/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoAgendamento)
            });

            if (!saveRes.ok) throw new Error("Erro ao salvar no servidor.");

            // Exibe mensagem de sucesso para o cliente
            alertAgendamento.className = "alert success";
            alertAgendamento.textContent = "Agendamento pré-registrado com sucesso! Aguarde nossa confirmação.";
            formAgendamento.reset(); // Limpa os campos do formulário
            
            // Limpa as seleções visuais de data e hora
            document.getElementById('selected-date-time').value = '';
            document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
            const timeSlotsContainer = document.getElementById('time-slots');
            if (timeSlotsContainer) {
                timeSlotsContainer.innerHTML = '<p style="color: #888; font-size: 0.95rem;">Por favor, selecione um dia acima para visualizar os horários.</p>';
            }

            // Atualiza os horários disponíveis recarregando a agenda
            inicializarAgenda();

            // Abre o modal informativo de regras e política de cancelamento
            const modal = document.getElementById('modal-aviso');
            if (modal) {
                modal.style.display = 'flex';
            }

        } catch (error) {
            console.error("Erro ao agendar: ", error);
            alertAgendamento.className = "alert error";
            alertAgendamento.textContent = "Erro ao realizar agendamento. Tente novamente mais tarde.";
        } finally {
            // Reabilita o botão de agendar
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Agendamento";
        }
    });
}


// --- PROMOÇÕES COM CARROSSEL DINÂMICO ---
let promoAtualIdx = 0;
let promoAtivas = [];

// Função que renderiza os slides do carrossel na tela
function renderizarCarrossel() {
    const banner = document.getElementById('promo-banner');
    const slidesContainer = document.getElementById('promo-slides');
    const dotsContainer = document.getElementById('promo-dots');
    const prevBtn = document.getElementById('promo-prev-btn');
    const nextBtn = document.getElementById('promo-next-btn');
    if (!banner || !slidesContainer) return;

    // Oculta o banner se não existirem promoções ativas cadastradas
    if (promoAtivas.length === 0) {
        banner.style.display = 'none';
        return;
    }

    banner.style.display = 'block';
    slidesContainer.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    // Cria as tags HTML de cada slide de promoção
    promoAtivas.forEach((p, idx) => {
        const [iY, iM, iD] = p.dataInicio.split('-').map(Number);
        const [fY, fM, fD] = p.dataFim.split('-').map(Number);
        const dtInicioFmt = `${String(iD).padStart(2,'0')}/${String(iM).padStart(2,'0')}/${iY}`;
        const dtFimFmt = `${String(fD).padStart(2,'0')}/${String(fM).padStart(2,'0')}/${fY}`;
        const imageSrc = p.imagemUrl || 'img/Rosa.png';

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

        // Cria os pontos de navegação (indicadores circulares) do carrossel
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = 'promo-dot' + (idx === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Promoção ${idx + 1}`);
            dot.addEventListener('click', () => irParaSlide(idx));
            dotsContainer.appendChild(dot);
        }
    });

    const multiSlide = promoAtivas.length > 1;
    if (prevBtn) prevBtn.style.display = multiSlide ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = multiSlide ? 'flex' : 'none';
    if (dotsContainer) dotsContainer.style.display = multiSlide ? 'flex' : 'none';

    // Transição automática a cada 6 segundos
    if (multiSlide) {
        setInterval(() => window.mudarPromoSlide(1), 6000);
    }

    irParaSlide(0);
}

// Direciona o carrossel para um slide específico
function irParaSlide(idx) {
    promoAtualIdx = (idx + promoAtivas.length) % promoAtivas.length;
    const slidesContainer = document.getElementById('promo-slides');
    if (slidesContainer) slidesContainer.style.transform = `translateX(-${promoAtualIdx * 100}%)`;
    document.querySelectorAll('.promo-dot').forEach((d, i) => {
        d.classList.toggle('active', i === promoAtualIdx);
    });
}

// Expõe a função globalmente para os botões anteriores e próximos
window.mudarPromoSlide = function(direction) {
    irParaSlide(promoAtualIdx + direction);
};

// Carrega as promoções da nossa REST API
async function carregarPromocao() {
    try {
        const response = await fetch(`${API_URL}/promocoes`);
        const todas = await response.json();

        const agora = new Date();
        // Filtra para exibir apenas promoções ativas e dentro da validade
        promoAtivas = todas.filter(p => {
            if (!p.dataInicio || !p.dataFim) return false;
            try {
                const [iY, iM, iD] = p.dataInicio.split('-').map(Number);
                const [fY, fM, fD] = p.dataFim.split('-').map(Number);
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


// --- PROCEDIMENTOS CAPILARES ---
// Carrega os procedimentos cadastrados da nossa REST API
async function carregarProcedimentos() {
    const container = document.getElementById('procedimentos-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/procedimentos`);
        const procedimentos = await response.json();

        if (!procedimentos.length) {
            container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1;">Nenhum procedimento cadastrado.</p>';
            return;
        }

        container.innerHTML = '';
        procedimentos.forEach(proc => {
            // Cria os cards HTML de cada procedimento
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${proc.imagemUrl || 'img/procedimento4.jpg'}" alt="${proc.nome}" class="product-img">
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
// Carrega os serviços espirituais da nossa REST API
async function carregarServicos() {
    const container = document.getElementById('servicos-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_URL}/servicos`);
        const servicos = await response.json();

        if (!servicos.length) {
            container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1;">Nenhum serviço espiritual cadastrado.</p>';
            return;
        }

        container.innerHTML = '';
        servicos.forEach(serv => {
            // Cria os cards HTML de cada serviço espiritual
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${serv.imagemUrl || 'img/atendimento_espiritual.png'}" alt="${serv.nome}" class="product-img">
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
// Carrega as peças de roupas do catálogo da nossa REST API
async function carregarCatalogo() {
    const catalogContainer = document.getElementById('catalog-container');
    if(!catalogContainer) return;

    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();
        
        if (produtos.length === 0) {
            catalogContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1;">Nenhum produto cadastrado ainda.</p>';
            return;
        }

        catalogContainer.innerHTML = '';

        produtos.forEach((produto) => {
            // Cria os cards HTML com a imagem, nome e preço formatados
            const card = document.createElement('div');
            card.className = 'product-card';
            const statusClass = produto.status === 'Disponível' ? 'status-disponivel' : 'status-esgotado';
            const precoFormatado = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            card.innerHTML = `
                <img src="${produto.imagemUrl || 'https://via.placeholder.com/300x400?text=Sem+Foto'}" alt="${produto.nome}" class="product-img">
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
        catalogContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: red;">Erro ao carregar os produtos. Verifique se o servidor está rodando.</p>';
    }
}


// --- CONTEÚDO EDITÁVEL CMS ---
// Carrega os slogans e títulos editáveis da página principal a partir da REST API
async function carregarConteudoCMS() {
    try {
        const response = await fetch(`${API_URL}/conteudo`);
        const content = await response.json();

        if (content) {
            // Aplica os textos dinâmicos na Hero Section
            const heroTitle = document.querySelector('.hero-aesthetics .hero-title');
            const heroDesc = document.querySelector('.hero-aesthetics p');
            if (heroTitle) heroTitle.textContent = content.heroTitulo;
            if (heroDesc) heroDesc.textContent = content.heroDescricao;

            // Aplica os textos dinâmicos na seção de Vantagens
            const vantTitle = document.querySelector('#vantagens .section-title');
            const vantDesc = document.querySelector('#vantagens > p');
            if (vantTitle) vantTitle.textContent = content.vantagensTitulo;
            if (vantDesc) vantDesc.textContent = content.vantagensDescricao;

            const cards = document.querySelectorAll('#vantagens .catalog-grid .product-card');
            if (cards.length >= 3) {
                // Card 1
                const c1T = cards[0].querySelector('h3');
                const c1D = cards[0].querySelector('p');
                if (c1T) c1T.textContent = content.v1Titulo;
                if (c1D) c1D.textContent = content.v1Desc;

                // Card 2
                const c2T = cards[1].querySelector('h3');
                const c2D = cards[1].querySelector('p');
                if (c2T) c2T.textContent = content.v2Titulo;
                if (c2D) c2D.textContent = content.v2Desc;

                // Card 3
                const c3T = cards[2].querySelector('h3');
                const c3D = cards[2].querySelector('p');
                if (c3T) c3T.textContent = content.v3Titulo;
                if (c3D) c3D.textContent = content.v3Desc;
            }

            // Aplica o slogan editável no Rodapé do site
            const footerSlogan = document.querySelector('footer p:nth-of-type(1)');
            if (footerSlogan) footerSlogan.textContent = content.footerSlogan;
        }
    } catch (error) {
        console.error("Erro ao carregar conteúdo CMS do site:", error);
    }
}


// --- CONFIGURAÇÃO DA AGENDA E DIAS DISPONÍVEIS ---
let agendaConfig = {
    intervalo: 60,
    horaInicio: "09:00",
    horaFim: "18:00",
    diasSemana: [1, 2, 3, 4, 5, 6],
    datasBloqueadas: []
};

// Função que monta a agenda e exibe os próximos 14 dias de atendimento ativos
async function inicializarAgenda() {
    const dateCarousel = document.getElementById('date-carousel');
    if (!dateCarousel) return;

    try {
        // Carrega configurações gerais da agenda salvas pelo administrador
        const resConfig = await fetch(`${API_URL}/config-agenda`);
        const config = await resConfig.json();

        if (config) {
            agendaConfig.intervalo = parseInt(config.intervalo || "60");
            agendaConfig.horaInicio = config.horaInicio || "09:00";
            agendaConfig.horaFim = config.horaFim || "18:00";
            agendaConfig.diasSemana = (config.diasSemana || "1,2,3,4,5,6").split(',').map(d => parseInt(d));
            agendaConfig.datasBloqueadas = config.datasBloqueadas ? config.datasBloqueadas.split(',') : [];
        }

        // Carrega todos os agendamentos ativos para fazer o filtro de horários ocupados
        const resAg = await fetch(`${API_URL}/agendamentos`);
        const agendamentos = await resAg.json();

        // Limpa o carrossel antes de desenhar
        dateCarousel.innerHTML = '';
        const hoje = new Date();
        let diasGerados = 0;
        let diaCorrente = new Date(hoje);

        // Varre os próximos 30 dias para extrair 14 dias úteis que a clínica/salão trabalhe
        for (let i = 0; i < 30 && diasGerados < 14; i++) {
            const diaSemana = diaCorrente.getDay();
            const dataStr = diaCorrente.toISOString().split('T')[0];

            const diaTrabalhado = agendaConfig.diasSemana.includes(diaSemana);
            const diaBloqueado = agendaConfig.datasBloqueadas.includes(dataStr);
            
            let hojeValido = true;
            if (i === 0) {
                // Se for hoje, confere se a hora atual já passou do expediente de fechamento
                const [fimH, fimM] = agendaConfig.horaFim.split(':').map(Number);
                const limiteHoje = new Date(hoje);
                limiteHoje.setHours(fimH, fimM, 0, 0);
                if (hoje >= limiteHoje) hojeValido = false;
            }

            // Adiciona o card apenas se for um dia trabalhado, não bloqueado e ainda válido
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

                // Escuta o clique no card de data para carregar os horários disponíveis daquele dia
                card.addEventListener('click', () => {
                    document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    carregarHorariosDoDia(dataStr, agendamentos);
                });

                dateCarousel.appendChild(card);
                diasGerados++;
            }
            diaCorrente.setDate(diaCorrente.getDate() + 1); // Avança um dia
        }

        if (diasGerados === 0) {
            dateCarousel.innerHTML = '<p style="color:#c62828;">Sem dias de atendimento disponíveis no momento.</p>';
        }

    } catch (error) {
        console.error("Erro ao inicializar agenda:", error);
    }
}

// Carrega os slots de horários do dia selecionado
function carregarHorariosDoDia(dataStr, agendamentos) {
    const timeSlotsContainer = document.getElementById('time-slots');
    if (!timeSlotsContainer) return;

    timeSlotsContainer.innerHTML = '';
    
    const [startH, startM] = agendaConfig.horaInicio.split(':').map(Number);
    const [endH, endM] = agendaConfig.horaFim.split(':').map(Number);

    const dataAtual = new Date();
    const selecionadaHoje = (dataStr === dataAtual.toISOString().split('T')[0]);

    let slot = new Date();
    slot.setHours(startH, startM, 0, 0);

    const limiteFim = new Date();
    limiteFim.setHours(endH, endM, 0, 0);

    let slotsCount = 0;

    // Gera os slots baseados no intervalo parametrizado
    while (slot < limiteFim) {
        const horaStr = slot.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
        const dateTimeString = `${dataStr}T${horaStr}`; // Formato final YYYY-MM-DDTHH:MM

        let horarioPassou = false;
        if (selecionadaHoje) {
            const slotCompleto = new Date(dataStr + 'T' + horaStr);
            if (dataAtual >= slotCompleto) horarioPassou = true;
        }

        // Filtra para checar se este horário específico do dia já foi agendado
        const isBooked = agendamentos.some(ag => ag.dataHora === dateTimeString && ag.status.toLowerCase() !== 'cancelado');

        if (!horarioPassou) {
            const btnSlot = document.createElement('div');
            btnSlot.className = 'time-slot';
            if (isBooked) {
                // Desenha o botão desativado e vermelho se ocupado
                btnSlot.className += ' booked';
                btnSlot.innerHTML = `${horaStr} <span style="font-size:0.7rem; display:block;">Ocupado</span>`;
            } else {
                // Habilita seleção de horário
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

        slot.setMinutes(slot.getMinutes() + agendaConfig.intervalo); // Avança para o próximo slot
    }

    if (slotsCount === 0) {
        timeSlotsContainer.innerHTML = '<p style="color:#c62828;">Não há horários disponíveis para hoje.</p>';
    }
}

// Inicializa todas as listagens dinâmicas na página assim que o documento HTML carrega
window.addEventListener('DOMContentLoaded', () => {
    carregarConteudoCMS();
    carregarPromocao();
    carregarCatalogo();
    carregarProcedimentos();
    carregarServicos();
    inicializarAgenda();
});
