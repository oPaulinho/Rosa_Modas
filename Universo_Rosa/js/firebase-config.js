// Importe as funções que você precisa dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// TODO: Substitua esse objeto 'firebaseConfig' pelas chaves do seu projeto Firebase!
// Você pega essas chaves no Console do Firebase em: Configurações do Projeto > Geral > Seus aplicativos
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços para usarmos nos outros arquivos JS
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Flag para sabermos se estamos no modo de testes locais (offline)
export const isMock = firebaseConfig.apiKey === "SUA_API_KEY_AQUI";

