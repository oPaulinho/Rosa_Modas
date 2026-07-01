# ATIVIDADES EXTENSIONISTAS - RESUMO DO PROJETO

## 1. INFORMAÇÕES BÁSICAS DO FORMULÁRIO

### Curso
**CST em Análise e Desenvolvimento de Sistemas**

### Disciplina
**Atividade Extensionista II: Tecnologia Aplicada à Inclusão Digital – Projeto**

### Etapa
**Trabalho Final**

---

## 2. TÍTULO DO PROJETO
**Desenvolvimento de Plataforma Web Dinâmica para Gestão de Serviços de Estética e Terapias com Painel Administrativo**

---

## 3. SETOR DE APLICAÇÃO
**Setor de Serviços - Estética e Bem-estar | Comunidade Local de Blumenau, Santa Catarina - SC**

A aplicação é voltada para pequenos negócios de estética e terapias que necessitam de uma solução web prática e acessível para gerenciar seus serviços, produtos e agendamentos. Impacta diretamente empreendedoras e empreendedores que buscam modernizar suas operações utilizando tecnologia web.

---

## 4. OBJETIVOS DE DESENVOLVIMENTO SUSTENTÁVEL (ODS)
- **(05) Igualdade de Gênero** – Empoderando mulheres empreendedoras através da tecnologia
- **(08) Trabalho Decente e Crescimento Econômico** – Facilitando a gestão eficiente de negócios e criação de oportunidades
- **(09) Indústria, Inovação e Infraestrutura** – Desenvolvendo solução tecnológica inovadora e acessível

---

## 5. OBJETIVOS ESPECÍFICOS DO PROJETO

1. **Implementar um sistema web responsivo** utilizando **HTML5, CSS3 e JavaScript** que permita a exibição dinâmica de procedimentos, produtos, serviços espirituais e promoções.

2. **Desenvolver um painel administrativo completo** com autenticação segura, permitindo que proprietários gerenciem (CRUD - Criar, Ler, Atualizar, Deletar) procedimentos, produtos, promoções e agendamentos em tempo real.

3. **Integrar o Firebase (Firestore, Authentication e Storage)** como backend para armazenamento seguro de dados, autenticação de usuários administradores e hospedagem de imagens de produtos e procedimentos.

4. **Criar funcionalidades dinâmicas avançadas** como: validação automática de períodos de promoção, carregamento assíncrono de conteúdo, agendamento de serviços com sincronização de dados e interface adaptativa para diferentes tipos de conteúdo.

5. **Melhorar a experiência do usuário** através de design moderno, navegação intuitiva, seções bem organizadas (procedimentos, catálogo, serviços espirituais, espiritual) e interface admin clara com tema visual leve.

---

## 6. METODOLOGIA

### Arquitetura do Projeto
```
Rosa_Modas/
├── Páginas Frontend (HTML)
│   ├── index.html (Página principal com seções dinâmicas)
│   ├── about.html (Sobre o negócio)
│   ├── contato.html (Contato)
│   └── Universo_Rosa/admin.html (Painel administrativo)
│
├── Estilos (CSS)
│   ├── style.css (Estilos client + admin)
│   ├── header.css, rodape.css, banner.css, carrossel.css
│   └── Tema visual moderno com paleta rosa/roxa
│
├── Backend (JavaScript + Firebase)
│   ├── app.js (Lógica frontend - carregamento dinâmico)
│   ├── admin.js (Lógica admin - CRUD e autenticação)
│   └── firebase-config.js (Configuração Firebase + fallback localStorage)
│
└── Recursos (Imagens)
    └── img/ (Fotos de produtos, procedimentos)
```

### Fluxo de Desenvolvimento

**FASE 1 - Análise e Planejamento:**
- Definição das funcionalidades principais (CRUD, autenticação, dinâmica)
- Estudo do Firebase e suas APIs
- Prototipagem do layout client + admin

**FASE 2 - Desenvolvimento Frontend:**
- Criação da estrutura HTML (seções, containers dinâmicos)
- Implementação de CSS responsivo com variáveis CSS
- Desenvolvimento de JavaScript para carregamento dinâmico

**FASE 3 - Integração Backend (Firebase):**
- Configuração do Firebase (Firestore, Auth, Storage)
- Desenvolvimento de funções CRUD (Create, Read, Update, Delete)
- Implementação de autenticação segura com login/logout

**FASE 4 - Desenvolvimento Admin:**
- Criação do painel com múltiplos painéis (Agendamentos, Promoções, Produtos, Procedimentos, Espiritual)
- Implementação de formulários dinâmicos
- Validação de datas e períodos para promoções

**FASE 5 - Testes e Otimização:**
- Testes de responsividade em dispositivos
- Validação de regras de negócio
- Otimização de performance e UX

### Tecnologias Utilizadas

| Aspecto | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ |
| **Backend** | Firebase (Firestore, Authentication, Storage) |
| **Armazenamento** | Firestore (banco de dados) + Firebase Storage (imagens) |
| **Autenticação** | Firebase Authentication (email/senha) |
| **Deployment** | Firebase Hosting |
| **Versionamento** | Git/GitHub |

---

## 7. RESULTADOS ESPERADOS/OBTIDOS

### Resultados Implementados ✓

1. **Sistema Frontend Dinâmico Funcional**
   - Página inicial com seções bem organizadas (banner, procedimentos, catálogo, agendamento, espiritual)
   - Carregamento dinâmico de conteúdo via JavaScript e Firestore
   - Design responsivo e moderno com tema visual coerente

2. **Painel Administrativo Completo**
   - Autenticação segura com email/senha
   - 5 painéis de gerenciamento:
     - **Agendamentos**: visualização de reservas do sistema
     - **Promoções**: CRUD com validação de período ativo
     - **Produtos**: CRUD de catálogo de roupas com upload de imagem
     - **Procedimentos**: CRUD com descrição e imagem
     - **Espiritual**: CRUD de serviços espirituais
   
3. **Integração Firebase**
   - Autenticação de usuários admin
   - Armazenamento de dados em Firestore
   - Hospedagem de imagens no Storage
   - Fallback com localStorage para ambiente de desenvolvimento

4. **Funcionalidades Avançadas**
   - Validação automática de datas para ativação/desativação de promoções
   - Sincronização em tempo real de dados entre client e admin
   - Upload e visualização de imagens de produtos
   - Interface responsiva que adapta a diferentes tipos de conteúdo

5. **Código Estruturado e Documentado**
   - Separação clara de responsabilidades (HTML, CSS, JS)
   - Funções bem nomeadas e comentadas
   - Componentes reutilizáveis

### Evidências de Implementação
- **GitHub**: [Link do repositório com código-fonte completo]
- **Vídeo de Demonstração**: [Link com no máximo 5 minutos mostrando:]
  - Navegação pela página principal
  - Acesso ao painel admin (login)
  - Criação de uma promoção
  - Adição de um produto
  - Adição de um procedimento
  - Sincronização automática na página principal

---

## 8. CONSIDERAÇÕES FINAIS

### Aprendizados Obtidos

1. **Integração de Backend com Firebase**
   - Aprendemos na prática como configurar e utilizar Firestore, Authentication e Storage do Firebase
   - Compreendemos autenticação segura, regras de segurança e operações CRUD em tempo real
   - Ganho significativo em conhecimento sobre arquitetura cliente-servidor moderna

2. **Design Responsivo e User Experience (UX)**
   - Desenvolvemos habilidades em CSS avançado (variáveis, flexbox, grid)
   - Compreendemos a importância de interfaces intuitivas e acessíveis
   - Aprendemos a pensar em experiência do usuário tanto para cliente quanto para administrador

3. **Desenvolvimento Full-Stack com JavaScript**
   - Consolidamos conhecimentos de JavaScript ES6+ no frontend
   - Entendemos manipulação do DOM, eventos assíncrono e Promises
   - Percebemos como JavaScript conecta camadas de apresentação e dados

4. **Gestão de Requisitos de Negócio**
   - Compreendemos que tecnologia deve servir necessidades reais (proprietários de estética precisam gerenciar conteúdo)
   - Aprendemos a traduzir requisitos de negócio em funcionalidades técnicas
   - Valorizado o impacto social da tecnologia em pequenos negócios

### Desafios Encontrados e Soluções

1. **Sincronização de Dados em Tempo Real**
   - Desafio: Garantir que mudanças no admin apareçam imediatamente no site
   - Solução: Implementamos event listeners do Firestore que atualizam a UI automaticamente

2. **Segurança e Controle de Acesso**
   - Desafio: Proteger dados e permitir apenas admin gerenciar conteúdo
   - Solução: Implementamos autenticação Firebase com regras de segurança no Firestore

3. **Performance de Carregamento de Imagens**
   - Desafio: Imagens grandes prejudicavam performance
   - Solução: Otimizamos dimensões de imagem no CSS e compressão no upload

4. **Responsividade em Múltiplos Dispositivos**
   - Desafio: Fazer interface funcionar perfeitamente em mobile, tablet e desktop
   - Solução: Utilizamos CSS Grid/Flexbox e media queries com testes contínuos

### Impacto Social

Este projeto **capacita empreendedoras e pequenos negócios de estética e bem-estar** a:
- Modernizar suas operações através da tecnologia
- Alcançar mais clientes com presença web profissional
- Gerenciar eficientemente seus serviços e produtos
- Economizar tempo em tarefas administrativas

---

## 9. REPOSITÓRIO E DEMONSTRAÇÃO

- **GitHub**: [Adicionar link do repositório]
- **Link do Projeto**: [Adicionar link de hospedagem Firebase]
- **Vídeo de Demonstração**: [Adicionar link do vídeo (máx. 5 min)]

---

**Data de Conclusão**: 30 de junho de 2026
