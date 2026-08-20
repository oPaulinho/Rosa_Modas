// app.js
// -------
// Script do site público UNIVERSO ROSA (espaço espiritual).
// - Carrega os atendimentos espirituais da API (GET /servicos)
// - Agenda atendimentos (presencial/online) com validação de conflitos
// - Textos editáveis da hero e rodapé (CMS, GET/POST /conteudo)
// - Links cruzados com o Rosa Modas
// - Modo noturno (preferência salva no localStorage)

import { API_URL, ROSA_MODAS_URL } from './api-config.js';

// ============================================================
// MÁSCARA DE TELEFONE
// ============================================================

const telInput = document.getElementById('telefone');

if (telInput) {

    telInput.addEventListener('input', () => {

        let v = telInput.value.replace(/\D/g, '');

        if (v.length > 11) {
            v = v.slice(0, 11);
        }

        if (v.length > 6) {

            v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;

        } else if (v.length > 2) {

            v = `(${v.slice(0, 2)}) ${v.slice(2)}`;

        } else if (v.length > 0) {

            v = `(${v}`;

        }

        telInput.value = v;

    });

}

// ============================================================
// AGENDAMENTO
// ============================================================

const formAgendamento = document.getElementById('form-agendamento');
const alertAgendamento = document.getElementById('agendamento-alert');

if (formAgendamento) {

    formAgendamento.addEventListener('submit', async (e) => {

        e.preventDefault();

        const btnSubmit =
            document.getElementById('btn-submit-agendamento');

        // ----------------------------------------------------
        // COLETA DOS DADOS
        // ----------------------------------------------------

        // Este site é exclusivamente espiritual.
        // Não existe mais seleção de área para o cliente.
        const area = 'espiritual';

        const servico =
            document.getElementById('servico').value;

        const nome =
            document.getElementById('nome').value.trim();

        const telefone =
            document.getElementById('telefone').value.trim();

        const dataStr =
            document.getElementById('selected-date-time').value;

        const modalidade =
            document.querySelector('input[name="modalidade"]:checked')?.value || '';

        // ----------------------------------------------------
        // VALIDAÇÕES
        // ----------------------------------------------------

        if (!servico) {

            alertAgendamento.className = "alert error";

            alertAgendamento.textContent =
                "Por favor, selecione o atendimento espiritual desejado.";

            return;
        }

        if (!modalidade) {

            alertAgendamento.className = "alert error";

            alertAgendamento.textContent =
                "Por favor, selecione a modalidade: Presencial ou Online.";

            return;
        }

        if (!nome) {

            alertAgendamento.className = "alert error";

            alertAgendamento.textContent =
                "Por favor, informe seu nome completo.";

            return;
        }

        const telNumeros =
            telefone.replace(/\D/g, '');

        if (
            telNumeros.length < 10 ||
            telNumeros.length > 11
        ) {

            alertAgendamento.className = "alert error";

            alertAgendamento.textContent =
                "Informe um telefone válido com DDD (ex: (11) 99999-9999).";

            return;
        }

        if (!dataStr) {

            alertAgendamento.className = "alert error";

            alertAgendamento.textContent =
                "Por favor, escolha uma data e horário.";

            return;
        }

        // ----------------------------------------------------
        // BLOQUEIA O BOTÃO
        // ----------------------------------------------------

        btnSubmit.disabled = true;

        btnSubmit.textContent = "Aguarde...";

        try {

            // =================================================
            // VERIFICA AGENDAMENTOS DUPLICADOS
            // =================================================

            const responseDocs =
                await fetch(`${API_URL}/agendamentos`);

            const agendamentosExistentes =
                await responseDocs.json();

            const agora = new Date();

            const telefoneNormalizado =
                telNumeros;

            const temDuplicado =
                agendamentosExistentes.some(ag => {

                    const agTel =
                        (ag.telefone || '')
                            .replace(/\D/g, '');

                    if (agTel !== telefoneNormalizado) {
                        return false;
                    }

                    const agDataHora =
                        new Date(ag.dataHora);

                    const statusAtivo =
                        !ag.status ||
                        ag.status.toLowerCase() !== 'cancelado';

                    return (
                        statusAtivo &&
                        agDataHora > agora
                    );

                });

            if (temDuplicado) {

                alertAgendamento.className =
                    "alert error";

                alertAgendamento.textContent =
                    "⚠️ Já existe um agendamento ativo para este número de telefone. Aguarde a data/hora do seu agendamento anterior ou entre em contato conosco.";

                btnSubmit.disabled = false;

                btnSubmit.textContent =
                    "Confirmar Agendamento";

                return;
            }

            // =================================================
            // OBJETO DO AGENDAMENTO
            // =================================================

            const novoAgendamento = {

                // Sempre espiritual neste site
                area: 'espiritual',

                servico: servico,

                modalidade: modalidade,

                nomeCliente: nome,

                telefone: telefone,

                dataHora: dataStr,

                status: 'pendente'

            };

            // =================================================
            // ENVIA PARA O BACKEND
            // =================================================

            const saveRes =
                await fetch(`${API_URL}/agendamentos`, {

                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(novoAgendamento)

                });

            if (!saveRes.ok) {

                throw new Error(
                    "Erro ao salvar no servidor."
                );

            }

            // =================================================
            // SUCESSO
            // =================================================

            alertAgendamento.className =
                "alert success";

            alertAgendamento.textContent =
                "Agendamento pré-registrado com sucesso! Aguarde nossa confirmação.";

            formAgendamento.reset();

            // Mantém a área espiritual mesmo depois do reset
            const areaInput =
                document.getElementById('area');

            if (areaInput) {
                areaInput.value = 'espiritual';
            }

            // Limpa data e horário selecionados

            const selectedDateTime =
                document.getElementById(
                    'selected-date-time'
                );

            if (selectedDateTime) {
                selectedDateTime.value = '';
            }

            document
                .querySelectorAll('.date-card')
                .forEach(card => {

                    card.classList.remove('active');

                });

            const timeSlotsContainer =
                document.getElementById('time-slots');

            if (timeSlotsContainer) {

                timeSlotsContainer.innerHTML = `
                    <p style="color:#888; font-size:0.95rem;">
                        Por favor, selecione um dia acima para visualizar os horários.
                    </p>
                `;

            }

            // Atualiza os horários disponíveis

            inicializarAgenda();

            // Abre o modal

            const modal =
                document.getElementById('modal-aviso');

            if (modal) {

                modal.style.display = 'flex';

            }

        } catch (error) {

            console.error(
                "Erro ao agendar:",
                error
            );

            alertAgendamento.className =
                "alert error";

            alertAgendamento.textContent =
                "Erro ao realizar agendamento. Tente novamente mais tarde.";

        } finally {

            btnSubmit.disabled = false;

            btnSubmit.textContent =
                "Confirmar Agendamento";

        }

    });

}

// ============================================================
// SERVIÇOS ESPIRITUAIS
// ============================================================
// Esta é agora a principal listagem do site.
//
// A mesma API:
//     GET /servicos
//
// alimenta:
// 1. Os cards de atendimentos espirituais
// 2. O campo "Atendimento desejado" do agendamento
//
// Assim, o administrador controla tudo.
// ============================================================

let servicosEspirituais = [];

// Formata o preço do serviço em Real (ex: R$ 200,00)
function formatarPreco(valor) {

    const num = Number(valor);

    if (isNaN(num) || num <= 0) {
        return null;
    }

    return num.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

}

// Converte a lista de modalidades ("PRESENCIAL,ONLINE")
// em um rótulo amigável (ex: 🏠 Presencial • 💻 Online)
function labelModalidades(modalidades) {

    const lista =
        (modalidades || '')
            .split(',')
            .map(m => m.trim().toLowerCase())
            .filter(Boolean);

    if (!lista.length) {
        return null;
    }

    const nomes = {
        presencial: '🏠 Presencial',
        online: '💻 Online'
    };

    return lista.map(
        m => nomes[m] || m
    ).join(' • ');

}

// Exibe apenas as modalidades permitidas do serviço selecionado.
// Se o serviço não define modalidades (campo vazio = configurável
// pelo administrador), as duas opções continuam disponíveis.
function atualizarModalidadesDoServico() {

    const selectServico =
        document.getElementById('servico');

    if (!selectServico) {
        return;
    }

    const servicoSelecionado =
        servicosEspirituais.find(
            s => s.nome === selectServico.value
        );

    const lista =
        servicoSelecionado &&
        servicoSelecionado.modalidades
            ? servicoSelecionado.modalidades
                .split(',')
                .map(m => m.trim().toLowerCase())
                .filter(Boolean)
            : [];

    document
        .querySelectorAll('.modalidade-label')
        .forEach(lbl => {

            const radio =
                lbl.querySelector(
                    'input[name="modalidade"]'
                );

            if (!radio) {
                return;
            }

            const permitido =
                !lista.length ||
                lista.includes(radio.value);

            lbl.style.display =
                permitido ? '' : 'none';

        });

    const checked =
        document.querySelector(
            'input[name="modalidade"]:checked'
        );

    if (
        checked &&
        checked.closest('.modalidade-label')
            .style.display === 'none'
    ) {

        checked.checked = false;

    }

}

async function carregarServicos() {

    try {

        const response =
            await fetch(`${API_URL}/servicos`);

        if (!response.ok) {

            throw new Error(
                'Erro ao buscar serviços espirituais.'
            );

        }

        servicosEspirituais =
            await response.json();

        // ----------------------------------------------------
        // SOMENTE SERVIÇOS "DISPONÍVEL" NO SITE PÚBLICO
        // ----------------------------------------------------
        // O administrador controla o status no painel.
        // Se um serviço for marcado como "Indisponível",
        // ele deixa de aparecer nos cards e no agendamento.
        // ----------------------------------------------------

        servicosEspirituais =
            servicosEspirituais.filter(serv => {

                const status =
                    (serv.status || '')
                        .trim()
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '');

                return (
                    !status ||
                    status === 'disponivel'
                );

            });

        // ----------------------------------------------------
        // CARDS DOS SERVIÇOS
        // ----------------------------------------------------

        const container =
            document.getElementById(
                'servicos-container'
            );

        if (container) {

            if (!servicosEspirituais.length) {

                container.innerHTML = `

                    <p
                        style="
                            text-align:center;
                            width:100%;
                            grid-column:1/-1;
                        "
                    >
                        Nenhum atendimento espiritual
                        cadastrado no momento.
                    </p>

                `;

            } else {

                container.innerHTML = '';

                servicosEspirituais.forEach(serv => {

                    const card =
                        document.createElement('div');

                    card.className =
                        'product-card';

                    const precoFmt =
                        formatarPreco(serv.preco);

                    const modalidadesFmt =
                        labelModalidades(serv.modalidades);

                    card.innerHTML = `

                        <img
                            src="${serv.imagemUrl || 'img/atendimento_espiritual.png'}"
                            alt="${serv.nome}"
                            class="product-img"
                        >

                        <div class="product-info">

                            <h3 class="product-title">
                                ${serv.nome}
                            </h3>

                            <p
                                class="product-desc"
                            >
                                ${serv.descricao ||
                                'Atendimento espiritual disponível.'}
                            </p>

                            ${
                                precoFmt
                                ? `<p class="product-price">${precoFmt}</p>`
                                : ''
                            }

                            ${
                                modalidadesFmt
                                ? `<p class="product-modalities">${modalidadesFmt}</p>`
                                : ''
                            }

                            <a
                                href="#agendamento"
                                class="hero-btn btn-spiritual"
                                style="
                                    padding:0.6rem 1.5rem;
                                    font-size:0.95rem;
                                "
                                data-servico="${serv.nome}"
                            >
                                Agendar
                            </a>

                        </div>

                    `;

                    // Botão Agendar
                    const botao =
                        card.querySelector(
                            '[data-servico]'
                        );

                    if (botao) {

                        botao.addEventListener(
                            'click',
                            () => {

                                selecionarServicoEspiritual(
                                    serv.nome
                                );

                            }
                        );

                    }

                    container.appendChild(card);

                });

            }

        }

        // ----------------------------------------------------
        // SELECT DO AGENDAMENTO
        // ----------------------------------------------------

        carregarServicosNoAgendamento();

    } catch (error) {

        console.error(
            'Erro ao carregar serviços espirituais:',
            error
        );

        const container =
            document.getElementById(
                'servicos-container'
            );

        if (container) {

            container.innerHTML = `

                <p
                    style="
                        text-align:center;
                        width:100%;
                        grid-column:1/-1;
                        color:#c62828;
                    "
                >
                    Erro ao carregar os atendimentos.
                    Tente novamente mais tarde.
                </p>

            `;

        }

    }

}

// ============================================================
// SERVIÇOS NO SELECT DO AGENDAMENTO
// ============================================================

function carregarServicosNoAgendamento() {

    const selectServico =
        document.getElementById('servico');

    if (!selectServico) {
        return;
    }

    selectServico.innerHTML = `

        <option value="">
            Selecione o atendimento
        </option>

    `;

    if (!servicosEspirituais.length) {

        selectServico.innerHTML = `

            <option value="">
                Nenhum atendimento disponível
            </option>

        `;

        return;

    }

    servicosEspirituais.forEach(servico => {

        const option =
            document.createElement('option');

        option.value =
            servico.nome;

        option.textContent =
            servico.nome;

        selectServico.appendChild(option);

    });

    // Filtra as modalidades conforme o serviço escolhido
    atualizarModalidadesDoServico();

    if (!selectServico.dataset.modalListener) {

        selectServico.dataset.modalListener = '1';

        selectServico.addEventListener(
            'change',
            atualizarModalidadesDoServico
        );

    }

}

// ============================================================
// SELECIONAR SERVIÇO A PARTIR DO CARD
// ============================================================

function selecionarServicoEspiritual(nomeServico) {

    const selectServico =
        document.getElementById('servico');

    if (!selectServico) {
        return;
    }

    selectServico.value =
        nomeServico;

    // Garante que a área seja espiritual

    const areaInput =
        document.getElementById('area');

    if (areaInput) {
        areaInput.value = 'espiritual';
    }

    // Filtra as modalidades conforme o serviço escolhido

    atualizarModalidadesDoServico();

}

// Disponibiliza caso alguma parte antiga do site precise

window.selecionarServicoEspiritual =
    selecionarServicoEspiritual;

// ============================================================
// CONFIGURAÇÃO DA AGENDA
// ============================================================

let agendaConfig = {

    intervalo: 60,

    horaInicio: "09:00",

    horaFim: "18:00",

    diasSemana: [
        1, 2, 3, 4, 5, 6
    ],

    datasBloqueadas: []

};

// ============================================================
// INICIALIZAÇÃO DA AGENDA
// ============================================================

async function inicializarAgenda() {

    const dateCarousel =
        document.getElementById(
            'date-carousel'
        );

    if (!dateCarousel) {
        return;
    }

    try {

        // ----------------------------------------------------
        // CONFIGURAÇÃO
        // ----------------------------------------------------

        const resConfig =
            await fetch(
                `${API_URL}/config-agenda`
            );

        const config =
            await resConfig.json();

        if (config) {

            agendaConfig.intervalo =
                parseInt(
                    config.intervalo || "60"
                );

            agendaConfig.horaInicio =
                config.horaInicio ||
                "09:00";

            agendaConfig.horaFim =
                config.horaFim ||
                "18:00";

            agendaConfig.diasSemana =
                (
                    config.diasSemana ||
                    "1,2,3,4,5,6"
                )
                    .split(',')
                    .map(d => parseInt(d));

            agendaConfig.datasBloqueadas =
                config.datasBloqueadas
                    ? config.datasBloqueadas.split(',')
                    : [];

        }

        // ----------------------------------------------------
        // AGENDAMENTOS EXISTENTES
        // ----------------------------------------------------

        const resAg =
            await fetch(
                `${API_URL}/agendamentos`
            );

        const agendamentos =
            await resAg.json();

        // ----------------------------------------------------
        // LIMPA A AGENDA
        // ----------------------------------------------------

        dateCarousel.innerHTML = '';

        const hoje =
            new Date();

        let diasGerados = 0;

        let diaCorrente =
            new Date(hoje);

        // ----------------------------------------------------
        // GERA OS PRÓXIMOS DIAS
        // ----------------------------------------------------

        for (
            let i = 0;
            i < 30 && diasGerados < 14;
            i++
        ) {

            const diaSemana =
                diaCorrente.getDay();

            const dataStr =
                diaCorrente
                    .toISOString()
                    .split('T')[0];

            const diaTrabalhado =
                agendaConfig.diasSemana
                    .includes(diaSemana);

            const diaBloqueado =
                agendaConfig.datasBloqueadas
                    .includes(dataStr);

            let hojeValido = true;

            if (i === 0) {

                const [fimH, fimM] =
                    agendaConfig.horaFim
                        .split(':')
                        .map(Number);

                const limiteHoje =
                    new Date(hoje);

                limiteHoje.setHours(
                    fimH,
                    fimM,
                    0,
                    0
                );

                if (hoje >= limiteHoje) {

                    hojeValido = false;

                }

            }

            if (
                diaTrabalhado &&
                !diaBloqueado &&
                hojeValido
            ) {

                const dayNum =
                    diaCorrente.getDate();

                const dayName =
                    diaCorrente
                        .toLocaleDateString(
                            'pt-BR',
                            {
                                weekday: 'short'
                            }
                        )
                        .replace('.', '');

                const card =
                    document.createElement(
                        'div'
                    );

                card.className =
                    'date-card';

                card.dataset.date =
                    dataStr;

                card.innerHTML = `

                    <span class="day-name">
                        ${dayName}
                    </span>

                    <span class="day-num">
                        ${dayNum}
                    </span>

                `;

                card.addEventListener(
                    'click',
                    () => {

                        document
                            .querySelectorAll(
                                '.date-card'
                            )
                            .forEach(c =>
                                c.classList
                                    .remove('active')
                            );

                        card.classList.add(
                            'active'
                        );

                        carregarHorariosDoDia(
                            dataStr,
                            agendamentos
                        );

                    }
                );

                dateCarousel.appendChild(
                    card
                );

                diasGerados++;

            }

            diaCorrente.setDate(
                diaCorrente.getDate() + 1
            );

        }

        if (diasGerados === 0) {

            dateCarousel.innerHTML = `

                <p style="color:#c62828;">
                    Sem dias de atendimento disponíveis no momento.
                </p>

            `;

        }

    } catch (error) {

        console.error(
            "Erro ao inicializar agenda:",
            error
        );

    }

}

// ============================================================
// HORÁRIOS DISPONÍVEIS
// ============================================================

function carregarHorariosDoDia(
    dataStr,
    agendamentos
) {

    const timeSlotsContainer =
        document.getElementById(
            'time-slots'
        );

    if (!timeSlotsContainer) {
        return;
    }

    timeSlotsContainer.innerHTML = '';

    const [startH, startM] =
        agendaConfig.horaInicio
            .split(':')
            .map(Number);

    const [endH, endM] =
        agendaConfig.horaFim
            .split(':')
            .map(Number);

    const dataAtual =
        new Date();

    const selecionadaHoje =
        (
            dataStr ===
            dataAtual
                .toISOString()
                .split('T')[0]
        );

    let slot =
        new Date();

    slot.setHours(
        startH,
        startM,
        0,
        0
    );

    const limiteFim =
        new Date();

    limiteFim.setHours(
        endH,
        endM,
        0,
        0
    );

    let slotsCount = 0;

    // --------------------------------------------------------
    // GERA OS HORÁRIOS
    // --------------------------------------------------------

    while (slot < limiteFim) {

        const horaStr =
            slot
                .toTimeString()
                .split(' ')[0]
                .substring(0, 5);

        const dateTimeString =
            `${dataStr}T${horaStr}`;

        let horarioPassou = false;

        if (selecionadaHoje) {

            const slotCompleto =
                new Date(
                    `${dataStr}T${horaStr}`
                );

            if (
                dataAtual >= slotCompleto
            ) {

                horarioPassou = true;

            }

        }

        // ----------------------------------------------------
        // VERIFICA SE ESTÁ OCUPADO
        // ----------------------------------------------------

        const isBooked =
            agendamentos.some(ag => {

                const status =
                    (
                        ag.status ||
                        ''
                    ).toLowerCase();

                return (
                    ag.dataHora ===
                    dateTimeString &&
                    status !== 'cancelado'
                );

            });

        if (!horarioPassou) {

            const btnSlot =
                document.createElement(
                    'div'
                );

            btnSlot.className =
                'time-slot';

            if (isBooked) {

                btnSlot.className +=
                    ' booked';

                btnSlot.innerHTML = `

                    ${horaStr}

                    <span
                        style="
                            font-size:0.7rem;
                            display:block;
                        "
                    >
                        Ocupado
                    </span>

                `;

            } else {

                btnSlot.textContent =
                    horaStr;

                btnSlot.addEventListener(
                    'click',
                    () => {

                        document
                            .querySelectorAll(
                                '.time-slot'
                            )
                            .forEach(s =>
                                s.classList
                                    .remove('active')
                            );

                        btnSlot.classList.add(
                            'active'
                        );

                        const input =
                            document.getElementById(
                                'selected-date-time'
                            );

                        if (input) {

                            input.value =
                                dateTimeString;

                        }

                    }
                );

            }

            timeSlotsContainer.appendChild(
                btnSlot
            );

            slotsCount++;

        }

        slot.setMinutes(
            slot.getMinutes() +
            agendaConfig.intervalo
        );

    }

    if (slotsCount === 0) {

        timeSlotsContainer.innerHTML = `

            <p style="color:#c62828;">
                Não há horários disponíveis para hoje.
            </p>

        `;

    }

}

// ============================================================
// CONTEÚDO CMS (TEXTOS EDITÁVEIS PELO PAINEL ADMINISTRATIVO)
// ============================================================

async function carregarConteudoCMS() {
    try {
        const response = await fetch(`${API_URL}/conteudo?site=UNIVERSO_ROSA`);
        const content = await response.json();
        if (!content) return;

        // Aplica os textos dinâmicos na Hero Section
        const heroTitle = document.querySelector('.hero-spiritual-only .hero-title');
        const heroDesc = document.querySelector('.hero-spiritual-only .hero-description');
        if (heroTitle && content.heroTitulo) heroTitle.textContent = content.heroTitulo;
        if (heroDesc && content.heroDescricao) heroDesc.textContent = content.heroDescricao;

        // Aplica o slogan editável no Rodapé do site
        const footerSlogan = document.querySelector('footer p:nth-of-type(1)');
        if (footerSlogan && content.footerSlogan) footerSlogan.textContent = content.footerSlogan;
    } catch (error) {
        console.error("Erro ao carregar conteúdo CMS do site:", error);
    }
}

// Aplica os links cruzados entre os dois sites (Universo Rosa ↔ Rosa Modas)
function aplicarLinksRosaModas() {
    const links = document.querySelectorAll('#link-rosa-modas, #link-rosa-modas-footer');
    links.forEach(link => { if (link) link.href = ROSA_MODAS_URL; });
}

// ============================================================
// INICIALIZAÇÃO DO SITE
// ============================================================

window.addEventListener(
    'DOMContentLoaded',
    () => {

        // PRINCIPAL:
        // Carrega os serviços espirituais
        // e preenche também o agendamento.
        carregarServicos();

        // Textos editáveis (hero e rodapé) pelo painel
        carregarConteudoCMS();

        // Links cruzados entre os dois sites
        aplicarLinksRosaModas();

        // Inicializa a agenda.
        inicializarAgenda();

        // MODO NOTURNO
        inicializarModoNoturno();

    }
);

// ============================================================
// MODO NOTURNO
// ============================================================

function inicializarModoNoturno() {

    const btn = document.getElementById('btn-dark-mode');
    if (!btn) return;

    // Restaura preferência salva
    const preferencia = localStorage.getItem('modoNoturno');
    if (preferencia === 'ativo') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️';
        btn.setAttribute('aria-label', 'Desativar modo noturno');
    }

    btn.addEventListener('click', () => {

        const ativo = document.body.classList.toggle('dark-mode');

        if (ativo) {
            btn.textContent = '☀️';
            btn.setAttribute('aria-label', 'Desativar modo noturno');
            localStorage.setItem('modoNoturno', 'ativo');
        } else {
            btn.textContent = '🌙';
            btn.setAttribute('aria-label', 'Ativar modo noturno');
            localStorage.setItem('modoNoturno', 'inativo');
        }

    });

}