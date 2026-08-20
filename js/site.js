// site.js
// -------
// Script do site público ROSA MODAS (Hair & Fashion).
// Controlado pelo CMS (mesmo backend do Universo Rosa):
// - Conteúdo dinâmico do banner (hero) pelo painel
// - Promoções ativas (respeitando a validade) exibidas na home
// - Novidades (produtos disponíveis) na home
// - Carrosséis dinâmicos (procedimentos e produtos)
// - Endereço e contatos centralizados (Configurações Gerais)
// - Tema claro/escuro com identidade rosa
// - Links cruzados com o Universo Rosa e acesso administrativo

import { API_URL, UNIVERSO_ROSA_URL, ADMIN_URL } from './api-config.js';

document.addEventListener('DOMContentLoaded', () => {
    inicializarTema();
    aplicarLinksCruzados();
    carregarConteudoCMS();
    carregarPromocoes();
    carregarNovidades();
    carregarCarrossel('.swiper-hair', 'procedimentos', 'img/procedimento4.jpg');
    carregarCarrossel('.swiper-fashion', 'produtos', 'img/roupa.jpg');
    carregarContatos();
});

// ------------------------------------------------------------
// UTILITÁRIOS
// ------------------------------------------------------------

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

function hojeISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

function precoBRL(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ------------------------------------------------------------
// TEMA CLARO/ESCURO (rosa)
// ------------------------------------------------------------

function inicializarTema() {
    const btn = document.getElementById('btn-dark-mode');
    if (!btn) return;

    const tema = localStorage.getItem('temaRosaModas');
    if (tema === 'escuro') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️';
        btn.setAttribute('aria-label', 'Desativar modo escuro');
    }

    btn.addEventListener('click', () => {
        const escuro = document.body.classList.toggle('dark-mode');
        btn.textContent = escuro ? '☀️' : '🌙';
        btn.setAttribute('aria-label', escuro ? 'Desativar modo escuro' : 'Ativar modo escuro');
        localStorage.setItem('temaRosaModas', escuro ? 'escuro' : 'claro');
    });
}

// ------------------------------------------------------------
// LINKS CRUZADOS E ACESSO ADMINISTRATIVO
// ------------------------------------------------------------

function aplicarLinksCruzados() {
    document.querySelectorAll('#link-universo-rosa, #link-universo-rosa-mobile, #link-universo-rosa-footer').forEach(l => {
        if (l) l.href = UNIVERSO_ROSA_URL;
    });
    document.querySelectorAll('#link-area-admin').forEach(l => {
        if (l) l.href = ADMIN_URL;
    });
}

// ------------------------------------------------------------
// CONTEÚDO CMS (BANNER / HERO)
// ------------------------------------------------------------

async function carregarConteudoCMS() {
    // O banner hero dinâmico só existe na home (página com promoções/novidades)
    if (!document.getElementById('promo-destaques')) return;
    try {
        const c = await fetchJSON(`${API_URL}/conteudo?site=ROSA_MODAS`);
        const titulo = document.querySelector('.banner__titulo');
        const texto = document.querySelector('.banner__texto');
        if (titulo && c.heroTitulo) titulo.innerHTML = c.heroTitulo.replace(/\n/g, '<br>');
        if (texto && c.heroDescricao) texto.textContent = c.heroDescricao;
    } catch (e) {
        console.error('Erro ao carregar conteúdo CMS:', e);
    }
}

// ------------------------------------------------------------
// PROMOÇÕES ATIVAS (respeitando a validade)
// ------------------------------------------------------------

async function carregarPromocoes() {
    const section = document.getElementById('promo-destaques');
    const grid = section && section.querySelector('.promo-destaques__grid');
    if (!section || !grid) return;

    try {
        const promos = await fetchJSON(`${API_URL}/promocoes?site=ROSA_MODAS`);
        const hoje = hojeISO();
        const ativas = promos.filter(p =>
            p.status === 'Ativa' &&
            (!p.dataInicio || p.dataInicio <= hoje) &&
            (!p.dataFim || p.dataFim >= hoje)
        );

        if (!ativas.length) {
            section.style.display = 'none';
            return;
        }

        grid.innerHTML = '';
        ativas.forEach(p => {
            const card = document.createElement('article');
            card.className = 'promo-destaques__card';
            card.innerHTML = `
                ${p.imagemUrl ? `<img src="${p.imagemUrl}" alt="${p.titulo}" onerror="this.style.display='none'">` : ''}
                <div class="promo-destaques__info">
                    <h3>${p.titulo}</h3>
                    <p>${p.descricao || ''}</p>
                </div>`;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error('Erro ao carregar promoções:', e);
        section.style.display = 'none';
    }
}

// ------------------------------------------------------------
// NOVIDADES (produtos disponíveis)
// ------------------------------------------------------------

async function carregarNovidades() {
    const section = document.getElementById('novidades');
    const grid = section && section.querySelector('.novidades__grid');
    if (!section || !grid) return;

    try {
        const produtos = await fetchJSON(`${API_URL}/produtos?site=ROSA_MODAS`);
        const disponiveis = produtos.filter(p => p.status === 'Disponível');

        if (!disponiveis.length) {
            section.style.display = 'none';
            return;
        }

        grid.innerHTML = '';
        disponiveis.forEach(p => {
            const card = document.createElement('article');
            card.className = 'novidades__card';
            card.innerHTML = `
                <img src="${p.imagemUrl || 'img/roupa.jpg'}" alt="${p.nome}" onerror="this.src='img/roupa.jpg'">
                <div class="novidades__info">
                    <h3>${p.nome}</h3>
                    <span class="novidades__preco">${precoBRL(p.preco)}</span>
                </div>`;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error('Erro ao carregar novidades:', e);
        section.style.display = 'none';
    }
}

// ------------------------------------------------------------
// CARROSSÉIS DINÂMICOS (procedimentos e produtos)
// ------------------------------------------------------------

async function carregarCarrossel(selector, tipo, fallbackImg) {
    const swiper = document.querySelector(selector);
    if (!swiper) return;
    const wrapper = swiper.querySelector('.swiper-wrapper');
    if (!wrapper) return;

    try {
        const url = tipo === 'procedimentos'
            ? `${API_URL}/procedimentos?site=ROSA_MODAS`
            : `${API_URL}/produtos?site=ROSA_MODAS`;
        const itens = await fetchJSON(url);
        const disponiveis = itens.filter(i => !i.status || i.status === 'Disponível');
        if (!disponiveis.length) return;

        wrapper.innerHTML = '';
        disponiveis.forEach(i => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `
                <img src="${i.imagemUrl || fallbackImg}" alt="${i.nome}" onerror="this.src='${fallbackImg}'">
                <div class="slide-caption">${i.nome}</div>`;
            wrapper.appendChild(slide);
        });

        reiniciarSwiper(swiper);
    } catch (e) {
        console.error(`Erro ao carregar carrossel ${selector}:`, e);
    }
}

function reiniciarSwiper(swiper) {
    if (swiper.swiper) swiper.swiper.destroy(true, true);
    if (typeof Swiper !== 'undefined') {
        new Swiper(swiper, {
            slidesPerView: 1.3,
            spaceBetween: 16,
            breakpoints: {
                768: { slidesPerView: 2, spaceBetween: 24 },
                1200: { slidesPerView: 3, spaceBetween: 28 }
            },
            pagination: { el: swiper.querySelector('.swiper-pagination'), type: 'bullets' },
            navigation: {
                nextEl: swiper.querySelector('.swiper-button-next'),
                prevEl: swiper.querySelector('.swiper-button-prev')
            }
        });
    }
}

// ------------------------------------------------------------
// ENDEREÇO E CONTATOS CENTRALIZADOS (Configurações Gerais)
// ------------------------------------------------------------

async function carregarContatos() {
    try {
        const cfg = await fetchJSON(`${API_URL}/site-config`);
        const wpp = (cfg.whatsapp || '5511958723409').replace(/\D/g, '');
        const ig = cfg.instagram || 'bela_rosasalao';
        const email = cfg.email || 'roseaneamarasilvaa@gmail.com';

        // Links da coluna Contato no rodapé
        const footerContato = document.querySelector('footer .lista-rodape:nth-of-type(1)');
        if (footerContato) {
            const links = footerContato.querySelectorAll('.lista-rodape__link');
            if (links[0]) links[0].href = `https://wa.me/${wpp}`;
            if (links[1]) links[1].href = `https://instagram.com/${ig}`;
            if (links[2]) links[2].href = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;
        }

        // Coluna Endereço no rodapé
        const footerEndereco = document.querySelector('footer .lista-rodape:nth-of-type(3) .lista-rodape__item');
        if (footerEndereco && cfg.endereco) {
            const partes = cfg.endereco.split('-').map(p => p.trim()).filter(Boolean);
            footerEndereco.innerHTML = partes.join('<br>');
        }

        // Botão de contato da home (Acompanhe-nos no WhatsApp)
        const contatoEmail = document.querySelector('.contato__email');
        if (contatoEmail && wpp) {
            contatoEmail.href = `https://api.whatsapp.com/send/?phone=${wpp}&text&type=phone_number&app_absent=0`;
        }

        // Botão flutuante do WhatsApp
        document.querySelectorAll('.whatsapp-fixo').forEach(a => {
            if (a) a.href = `https://wa.me/${wpp}`;
        });
    } catch (e) {
        console.error('Erro ao carregar contatos:', e);
    }
}