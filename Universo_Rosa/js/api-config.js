// api-config.js — URL da API (Spring Boot)
// Local: http://localhost:8080/api
// Produção (Vercel): https://rosa-modas.onrender.com/api

const isLocal = typeof window !== 'undefined' && (
    location.protocol === 'file:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1'
);

export const API_URL = isLocal ? 'http://localhost:8080/api' : 'https://rosa-modas.onrender.com/api';

// Link pro site irmão (Rosa Modas)
export const ROSA_MODAS_URL = '../index.html';