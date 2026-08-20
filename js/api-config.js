// api-config.js
// --------------
// Configuração central da URL da REST API (Spring Boot).
//
// Funcionamento automático:
// - Abrindo o site localmente (file:// ou http://localhost/127.0.0.1)
//   → usa a API local (http://localhost:8080/api)
// - Publicado (produção)
//   → usa a API hospedada no Render (https://rosa-modas.onrender.com/api)
//
// Assim é possível rodar o backend local para testes SEM derrubar o Render.

const isLocal =
    typeof window !== 'undefined' &&
    (
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

export const API_URL = isLocal
    ? 'http://localhost:8080/api'
    : 'https://rosa-modas.onrender.com/api';

// URL do site irmão UNIVERSO ROSA (links cruzados entre os dois sites).
export const UNIVERSO_ROSA_URL = 'Universo_Rosa/index.html';

// URL do painel administrativo (mesmo CMS que controla os dois sites).
export const ADMIN_URL = 'Universo_Rosa/admin.html';