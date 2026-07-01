# 📄 Documentação Completa do Projeto — Rosa Estética & Terapias

**Projeto Acadêmico:** Atividade Extensionista  
**Instituição:** Uninter — Análise e Desenvolvimento de Sistemas (ADS)  
**Desenvolvedor:** Aluno(a) do curso de ADS  
**Data de Criação:** Junho de 2026  

---

## 1. Visão Geral do Projeto

O **Rosa Estética & Terapias** é um sistema web completo desenvolvido para atender às necessidades reais de um comércio familiar localizado na comunidade de Inamar, Diadema – SP. O negócio atua em duas frentes:

- **Estética & Cabelo:** Procedimentos capilares como escova, progressiva, botox capilar, hidratação e coloração.
- **Espaço Espiritual:** Consultas espirituais, orientações, limpeza espiritual e leitura de tarot/cartas.

Além disso, o comércio também realiza a **venda de roupas femininas**, que são exibidas em um catálogo online dentro do próprio site.

O sistema foi projetado para ser **simples de usar** tanto para os clientes (que agendam serviços e visualizam produtos) quanto para as administradoras (mãe e irmã do desenvolvedor), que gerenciam tudo por um painel administrativo protegido por login.

---

## 2. Stack Tecnológica Utilizada

| Camada        | Tecnologia                        | Justificativa                                                                 |
|---------------|-----------------------------------|-------------------------------------------------------------------------------|
| **Estrutura** | HTML5 Semântico                   | Acessibilidade, SEO e organização clara do conteúdo                           |
| **Estilo**    | CSS3 Moderno (Vanilla CSS)        | CSS Variables para troca fácil de cores, Flexbox, Grid, Glassmorphism         |
| **Tipografia**| Google Fonts (Outfit)             | Fonte moderna, limpa e com múltiplos pesos para hierarquia visual             |
| **Lógica**    | JavaScript Puro (ES Modules)      | Sem frameworks; código leve, direto e fácil de manter                         |
| **Backend**   | Google Firebase (BaaS)            | Sem necessidade de servidor próprio; gratuito no plano Spark                  |
| **Banco**     | Cloud Firestore                   | Banco de dados NoSQL em tempo real, hospedado na nuvem do Google              |
| **Storage**   | Firebase Storage                  | Armazenamento de imagens de produtos (roupas) enviadas pelo admin             |
| **Auth**      | Firebase Authentication           | Login seguro por e-mail/senha para o painel administrativo                    |

### Por que Firebase?
O Firebase foi escolhido porque:
- É **100% gratuito** no plano Spark (suficiente para o tamanho do comércio).
- **Não requer** a manutenção de um servidor Node.js, PHP ou banco SQL.
- Toda a comunicação é feita diretamente do front-end via SDK JavaScript.
- É um produto do Google, garantindo estabilidade e disponibilidade.

---

## 3. Estrutura de Pastas e Arquivos

```
Universo_Rosa/
├── index.html              ← Página principal (vitrine do cliente)
├── admin.html              ← Painel administrativo (área restrita)
├── css/
│   └── style.css           ← Estilos globais do projeto
├── js/
│   ├── firebase-config.js  ← Configuração e inicialização do Firebase
│   ├── app.js              ← Lógica do site público (agendamento + catálogo)
│   └── admin.js            ← Lógica do painel admin (auth, CRUD de produtos, agendamentos)
└── img/
    ├── procedimento1.jpg   ← Foto de escova/finalização
    ├── procedimento2.jpg   ← Foto de botox capilar
    ├── procedimento3.jpg   ← Foto de progressiva
    ├── procedimento4.jpg   ← Foto de procedimento capilar
    ├── procedimento5.jpg   ← Foto de coloração
    ├── roupa.jpg            ← Foto de peça de roupa (body)
    ├── roupa2.jpg           ← Foto de peça de roupa (cropped)
    ├── roupa3.jpg           ← Foto de peça de roupa (short)
    ├── roupa4.jpg           ← Foto de peça de roupa (calça)
    ├── roupa5.jpg           ← Foto de peça de roupa (blusa)
    ├── atendimento_espiritual.png ← Imagem gerada por IA para seção espiritual
    ├── Logo.svg             ← Logotipo original Rosa Modas
    ├── Rosa Modas.svg       ← Logotipo escrito
    ├── whatsapp.png         ← Ícone WhatsApp
    └── (demais ícones e assets herdados do projeto anterior)
```

---

## 4. Descrição Detalhada de Cada Arquivo

### 4.1. `index.html` — Página Principal (Vitrine do Cliente)

**Localização:** `Universo_Rosa/index.html`  
**Linhas de código:** ~227  

Esta é a página que o cliente acessa. Ela é dividida nas seguintes seções:

#### Seção Hero
- A abertura está focada em **Estética** com mensagem de boas-vindas e chamada para ação direcionada aos procedimentos capilares.
- O componente prioriza o visual e a autoestima, sem trazer o atendimento espiritual como primeira impressão.
- **Efeito interativo:** A seção utiliza um visual amplo e chamativo para que o visitante comece pela estética.

#### Seção de Procedimentos Estéticos
- Exibe 3 cards com imagens reais dos procedimentos capilares (Escova, Botox, Progressiva).
- Cada card possui um botão **"Agendar"** que, ao ser clicado:
  1. Rola a página suavemente até o formulário de agendamento.
  2. Auto-seleciona a área "Estética & Cabelo" no campo do formulário.
  3. Auto-seleciona o serviço específico no dropdown.

#### Seção de Vantagens para a Mente
- Apresenta benefícios emocionais e de autoestima que acompanham os serviços estéticos.
- Mostra como os cuidados de beleza também impactam positivamente o bem-estar mental.

#### Seção de Agendamento
- Formulário com os campos:
  - **Área de Atendimento** (Estética ou Espiritual) — `<select>`
  - **Serviço Desejado** — `<select>` dinâmico que muda conforme a área selecionada
  - **Nome Completo** — `<input type="text">`
  - **WhatsApp/Telefone** — `<input type="tel">`
  - **Data e Hora** — `<input type="datetime-local">`
- Ao enviar, os dados são salvos no Firestore (ou LocalStorage no modo teste).
- Exibe mensagem de sucesso ou erro via alert estilizado.

#### Seção de Atendimentos Espirituais
- A seção espiritual foi movida para o final da página, mantendo o foco inicial na estética.
- Cada serviço espiritual tem sua própria imagem: `Consulta Espiritual` e `Leitura de Tarot`.
- As ações de agendamento continuam apontando para o formulário, com seleção automática de área e serviço.

#### Seção Catálogo de Roupas
- Grid responsivo que carrega os produtos dinamicamente via JavaScript.
- Cada card exibe: foto, nome, preço formatado em R$ e status (Disponível/Esgotado).
- Os dados vêm do **Firestore** (em produção) ou do **LocalStorage** (em modo de teste).

#### Footer
- Nome do projeto, slogan e link discreto para o painel administrativo.

---

### 4.2. `admin.html` — Painel Administrativo

**Localização:** `Universo_Rosa/admin.html`  
**Linhas de código:** ~144  

Página restrita para as administradoras do negócio.

#### Tela de Login
- Formulário simples com campos de e-mail e senha.
- Autenticação via **Firebase Authentication** (e-mail/senha).
- **Credenciais de teste temporárias:** `admin@admin.com` / `admin` (bypass local para testes sem Firebase configurado).
- Link para voltar ao site principal.

#### Dashboard Administrativo
- Layout com **sidebar** (menu lateral escuro) e **área de conteúdo principal**.
- Dois painéis navegáveis via clique no menu:

##### Painel "Agendamentos"
- Tabela com colunas: Data/Hora, Cliente, Área, Serviço, Telefone.
- O telefone é um link clicável que abre o WhatsApp direto com o número do cliente.
- Dados ordenados pela data mais recente primeiro.

##### Painel "Catálogo de Roupas"
- **Formulário de cadastro** com campos: Nome da Peça, Preço (R$) e Upload de Foto.
- Ao salvar, a imagem é enviada para o **Firebase Storage** (ou convertida em Base64 e salva no LocalStorage no modo teste).
- **Tabela de produtos** com colunas: Foto (miniatura), Nome, Preço, Status e Ação.
- O campo **Status** é um `<select>` inline que permite trocar entre "Disponível" e "Esgotado" instantaneamente.
- Botão **Excluir** com confirmação (`confirm()`) antes de deletar.

---

### 4.3. `css/style.css` — Estilos Globais

**Localização:** `Universo_Rosa/css/style.css`  
**Linhas de código:** ~407  

#### Design System (CSS Variables)
Todas as cores do projeto são controladas por variáveis CSS no `:root`, permitindo troca rápida de paleta sem tocar em nenhum componente:

```css
:root {
  --color-aesthetics-primary: #f48fb1;    /* Rosa */
  --color-aesthetics-secondary: #ffb74d;  /* Dourado */
  --color-spiritual-primary: #9575cd;     /* Roxo */
  --color-spiritual-secondary: #b0bec5;   /* Prata */
}
```

#### Principais Componentes Estilizados
| Componente          | Técnica CSS Utilizada                                    |
|---------------------|----------------------------------------------------------|
| Header              | `position: sticky`, `backdrop-filter: blur()`, glassmorphism |
| Logo                | `background: linear-gradient()` + `-webkit-background-clip: text` |
| Hero Section        | `display: flex` dividido ao meio, transição de `flex` no hover |
| Botões              | Gradientes, `box-shadow` dinâmico, `transform: translateY` no hover |
| Cards de Produto    | `border-radius: 20px`, sombra suave, elevação no hover   |
| Formulários         | Inputs com bordas arredondadas, foco com cor rosa         |
| Grid do Catálogo    | `display: grid` + `auto-fill` + `minmax(280px, 1fr)`     |
| Admin Sidebar       | Fundo escuro, links com transição de cor                  |
| Tabelas             | Bordas inferiores suaves, cabeçalho com fundo cinza claro |
| Responsividade      | `@media (max-width: 768px)` — hero empilha verticalmente |

---

### 4.4. `js/firebase-config.js` — Configuração do Firebase

**Localização:** `Universo_Rosa/js/firebase-config.js`  
**Linhas de código:** ~29  

Este arquivo é o **ponto central de conexão** com o Firebase. Ele:

1. Importa os módulos do Firebase via CDN (versão 10.9.0, módulos ES).
2. Define o objeto `firebaseConfig` com as chaves do projeto (que o desenvolvedor deve substituir pelas suas).
3. Inicializa o app Firebase e exporta 3 serviços:
   - `db` — instância do Firestore (banco de dados)
   - `storage` — instância do Firebase Storage (upload de imagens)
   - `auth` — instância do Firebase Auth (autenticação)
4. Exporta a flag `isMock` — que detecta automaticamente se as chaves são as de exemplo (`"SUA_API_KEY_AQUI"`) e ativa o modo de teste local.

---

### 4.5. `js/app.js` — Lógica do Site Público

**Localização:** `Universo_Rosa/js/app.js`  
**Linhas de código:** ~130  

Responsável por duas funcionalidades:

#### Agendamento
- Captura o `submit` do formulário.
- Monta um objeto com: área, serviço, nome, telefone, data/hora e timestamp de criação.
- **Modo Firebase:** Salva como documento na coleção `agendamentos` do Firestore.
- **Modo Mock (teste):** Salva no `localStorage` do navegador.
- Exibe feedback visual (sucesso/erro) e limpa o formulário.

#### Catálogo de Roupas
- Função `carregarCatalogo()` executada no evento `DOMContentLoaded`.
- **Modo Firebase:** Busca todos os documentos da coleção `produtos` no Firestore.
- **Modo Mock (teste):** Lê do `localStorage`. Se estiver vazio, popula automaticamente com 3 produtos padrão usando as imagens originais do projeto (`roupa.jpg`, `roupa2.jpg`, `roupa3.jpg`).
- Gera cards HTML dinamicamente para cada produto com foto, nome, preço e status.

---

### 4.6. `js/admin.js` — Lógica do Painel Administrativo

**Localização:** `Universo_Rosa/js/admin.js`  
**Linhas de código:** ~310  

O arquivo mais complexo do projeto. Gerencia:

#### Autenticação
- `onAuthStateChanged()` — Verifica se o usuário já está logado ao abrir a página.
- Login via `signInWithEmailAndPassword()` do Firebase Auth.
- **Bypass temporário:** Se e-mail = `admin@admin.com` e senha = `admin`, pula a autenticação Firebase e abre o dashboard diretamente (para testes locais).
- Logout via `signOut()` (Firebase) ou escondendo o dashboard (modo mock).

#### Carregamento de Agendamentos
- Função `carregarAgendamentos()`.
- **Firebase:** Query com `orderBy("data_hora", "desc")` para exibir os mais recentes primeiro.
- **Mock:** Lê do `localStorage` e ordena manualmente.
- Gera linhas `<tr>` na tabela com link direto para WhatsApp do cliente.

#### CRUD de Produtos (Roupas)
- **Criar (Create):**
  - Upload da imagem para Firebase Storage → obtém URL pública → salva no Firestore.
  - No modo mock: converte a imagem para Base64 via `FileReader` e salva no `localStorage`.
- **Ler (Read):**
  - Função `carregarProdutosAdmin()` que busca e exibe todos os produtos em uma tabela.
  - No modo mock, popula com 3 itens padrão se o `localStorage` estiver vazio.
- **Atualizar (Update):**
  - `window.alterarStatusProduto(id, novoStatus)` — Atualiza o campo `status` do documento no Firestore (ou no `localStorage`).
- **Deletar (Delete):**
  - `window.excluirProduto(id)` — Remove o documento do Firestore (ou filtra do array no `localStorage`).
  - Pede confirmação antes de excluir.

---

## 5. Estrutura do Banco de Dados (Firestore)

### Coleção: `agendamentos`
| Campo          | Tipo      | Exemplo                         |
|----------------|-----------|----------------------------------|
| `area`         | String    | `"estetica"` ou `"espiritual"`   |
| `servico`      | String    | `"Progressiva"`                  |
| `nome_cliente` | String    | `"Maria Silva"`                  |
| `telefone`     | String    | `"(11) 99999-9999"`              |
| `data_hora`    | String    | `"2026-07-15T14:30"`             |
| `criado_em`    | String    | `"2026-06-23T03:00:00.000Z"`     |

### Coleção: `produtos`
| Campo         | Tipo      | Exemplo                                |
|---------------|-----------|----------------------------------------|
| `nome`        | String    | `"Cropped Floral"`                     |
| `preco`       | Number    | `39.90`                                |
| `imagem_url`  | String    | `"https://firebasestorage.googleapis.com/..."` |
| `status`      | String    | `"Disponível"` ou `"Esgotado"`         |
| `criado_em`   | String    | `"2026-06-23T03:00:00.000Z"`           |

---

## 6. Modo de Teste Local (Mock Mode)

Para permitir que o projeto funcione **sem** configurar o Firebase, foi implementado um sistema de detecção automática:

1. O arquivo `firebase-config.js` exporta a flag `isMock = true` quando detecta que a `apiKey` ainda é `"SUA_API_KEY_AQUI"`.
2. Todos os arquivos JS (`app.js` e `admin.js`) verificam essa flag antes de qualquer operação.
3. No modo mock:
   - Dados são lidos/gravados no `localStorage` do navegador.
   - Imagens de upload são convertidas em Base64.
   - O login funciona com as credenciais fixas `admin@admin.com` / `admin`.
   - 3 produtos padrão são carregados automaticamente na primeira execução.

**Quando as chaves reais do Firebase são inseridas**, o `isMock` se torna `false` automaticamente e toda a comunicação passa a ser feita com a nuvem do Google.

---

## 7. Paleta de Cores e Identidade Visual

| Área        | Cor Primária            | Cor Secundária           | Uso                          |
|-------------|-------------------------|--------------------------|------------------------------|
| Estética    | `#f48fb1` (Rosa)        | `#ffb74d` (Dourado)      | Botões, títulos, gradientes  |
| Espiritual  | `#9575cd` (Roxo)        | `#b0bec5` (Prata)        | Botões, títulos, gradientes  |
| Texto       | `#333` (Escuro)         | `#fff` (Claro)           | Corpo e áreas escuras        |
| Fundo       | `#fffcfd` (Rosa claro)  | `#f8f8fc` (Lilás claro)  | Seções alternadas            |
| Admin       | `#1e1e1e` (Quase preto) | `#f4f6f8` (Cinza claro)  | Sidebar e área de conteúdo   |

---

## 8. Como Configurar o Firebase (Passo a Passo)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2. Clique em **"Adicionar projeto"** → Nome: `Rosa Estetica Terapias` → Criar.
3. No painel, clique no ícone **Web `</>`** → Apelido: `site` → Registrar.
4. **Copie o objeto `firebaseConfig`** que o Firebase exibir.
5. Abra o arquivo `js/firebase-config.js` e **substitua** o objeto de exemplo pelas suas chaves reais.
6. No menu lateral do Firebase Console:
   - **Authentication** → Vamos começar → Ativar provedor **E-mail/senha**.
   - **Firestore Database** → Criar banco de dados → Modo de teste → Criar.
   - **Storage** → Vamos começar → Modo de teste → Criar.
7. Em **Authentication > Users**, clique em **Adicionar usuário** e cadastre o e-mail e senha das administradoras.

---

## 9. Serviços Cadastrados no Sistema

### Estética & Cabelo
- Corte de Cabelo
- Escova
- Progressiva
- Botox Capilar
- Hidratação
- Coloração

### Atendimento Espiritual
- Consulta Espiritual
- Orientação
- Limpeza Espiritual
- Tarot / Cartas

---

## 10. Histórico de Evolução do Projeto

| Data       | Alteração Realizada                                                                 |
|------------|--------------------------------------------------------------------------------------|
| 22/06/2026 | Criação inicial da estrutura de pastas e arquivos dentro de `Universo_Rosa/`         |
| 22/06/2026 | Implementação do `index.html` com Hero dividido, formulário de agendamento e catálogo |
| 22/06/2026 | Implementação do `admin.html` com login, dashboard, CRUD de produtos e agendamentos  |
| 22/06/2026 | Implementação do `style.css` com Design System baseado em CSS Variables              |
| 22/06/2026 | Implementação do `firebase-config.js`, `app.js` e `admin.js` com integração Firebase |
| 23/06/2026 | Adição de login temporário de teste (`admin@admin.com` / `admin`)                    |
| 23/06/2026 | Implementação do modo Mock (LocalStorage) para testes offline                        |
| 23/06/2026 | Cópia das imagens originais do projeto anterior para a pasta `img/`                  |
| 23/06/2026 | Geração de imagem por IA para seção espiritual (`atendimento_espiritual.png`)        |
| 23/06/2026 | Reestruturação visual: seções de serviços antes do formulário de agendamento         |
| 23/06/2026 | Auto-seleção de serviço no formulário ao clicar "Agendar" em cada card               |
| 23/06/2026 | Pré-carregamento de 3 produtos padrão no modo mock para catálogo não ficar vazio     |
| 23/06/2026 | Renomeação do projeto de "Universo Rosa" para "Rosa Estética & Terapias"             |
| 25/06/2026 | Criação desta documentação técnica completa                                          |

---

## 11. Considerações Finais

Este projeto foi desenvolvido como parte de uma **Atividade Extensionista**, com o objetivo de aplicar conhecimentos adquiridos no curso de Análise e Desenvolvimento de Sistemas em um cenário real da comunidade. O sistema atende às necessidades do comércio familiar, oferecendo uma vitrine digital profissional, um sistema de agendamento funcional e um painel administrativo intuitivo — tudo isso utilizando tecnologias modernas, gratuitas e de fácil manutenção.
