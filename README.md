# 🌐 Rosa Modas & Universo Rosa — Projeto Extensionista (Uninter)

Projeto desenvolvido na **Atividade Extensionista** da Uninter com foco em **Tecnologia Aplicada à Inclusão Digital**, apoiando o **pequeno comércio familiar** com presença digital, agendamento online e gestão de conteúdo.

São **dois sites** que compartilham um **painel administrativo** e uma **API REST**:

- **🌸 Rosa Modas** — loja de moda & estética (catálogo, portfólio, contato).
- **💜 Universo Rosa** — espaço espiritual (atendimentos, agendamento online e WhatsApp).
- **🔐 Painel Administrativo** — gerencia serviços, produtos, promoções, agenda, configurações e textos do site (CMS).

## 🔗 Acesse o projeto

- Site Rosa Modas: https://rosa-modas.vercel.app
- Painel administrativo: `/Universo_Rosa/admin.html`

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES Modules), Google Fonts, Swiper.
- **Backend**: Java + Spring Boot (REST API), MySQL, upload de imagens.
- **Hospedagem**: Vercel (sites estáticos) + Render (API via Docker).
- **Notificações**: links `wa.me` (WhatsApp) — agendamentos pendentes → confirmação pelo admin.

## 📁 Estrutura

```
Rosa_Modas-main/
├── index.html, hair.html, fashion.html, about.html, contato.html  # Site Rosa Modas (raiz)
├── style/            # CSS por seção do Rosa Modas
├── js/               # JS do Rosa Modas (site.js, api-config.js)
├── img/              # Imagens do Rosa Modas
├── Universo_Rosa/
│   ├── index.html    # Site espiritual
│   ├── admin.html    # Painel administrativo (compartilhado)
│   ├── css/style.css # Estilos (tema espiritual)
│   ├── js/           # app.js (público), admin.js (painel), api-config.js
│   └── img/          # Imagens usadas pelo site espiritual
└── backend/          # API Spring Boot (Dockerfile incluído)
    ├── pom.xml
    └── src/main/java/... + src/main/resources/application.properties
```

> O `Rosa Modas` fica na **raiz** para o Vercel servi-lo diretamente. O backend Docker está em `backend/` — no painel do Render o caminho do Dockerfile é `backend/Dockerfile`.

## 🚀 Como rodar localmente

### Backend (Spring Boot)

1. Tenha **Java 17+** e **Maven** (ou use o wrapper `./mvnw`).
2. Configure as variáveis de ambiente (ou use os valores de desenvolvimento em `application.properties`):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` — conexão MySQL.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — credenciais do painel.
3. Rode:

```bash
cd backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`.

### Frontend

Os sites são estáticos (sem build). Para testar localmente, sirva a pasta com um servidor HTTP:

```bash
python -m http.server 3000
```

e acesse `http://localhost:3000`.

> Dica: abrir via `file://` pode bloquear os `ES Modules` no Chrome (erro de CORS). Use o servidor local.

## 🔌 Endpoints principais (API)

| Método | Rota                      | Descrição                          |
|--------|---------------------------|------------------------------------|
| GET    | `/servicos`               | Lista serviços (filtro por site)   |
| GET    | `/produtos`               | Lista produtos                     |
| GET    | `/procedimentos`          | Lista procedimentos                |
| GET    | `/promocoes`              | Lista promoções                    |
| GET    | `/agendamentos`           | Lista agendamentos                 |
| POST   | `/agendamentos`           | Cria agendamento (status pendente) |
| PUT    | `/agendamentos/{id}`      | Confirma/cancela agendamento       |
| GET    | `/config-agenda`          | Configurações da agenda            |
| GET    | `/conteudo?site=SITE`     | Textos do CMS                      |
| POST   | `/conteudo`               | Salva textos do CMS                |
| POST   | `/auth/login`             | Login do painel                    |
| POST   | `/upload`                 | Upload de imagem                   |

## 🔐 Acesso ao painel

- Login padrão (dev): `admin@admin.com` / `admin`.
- Em produção, defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente do Render.
- A senha é armazenada com hash (BCrypt) no banco.

## ✅ Funcionalidades

- **Agendamento online** com escolha de serviço, modalidade (presencial/online), data e horário; validação de conflitos; status *pendente → confirmado/cancelado*.
- **Notificações por WhatsApp**: o cliente recebe o link de confirmação após o admin aprovar; o admin recebe aviso de novos agendamentos (sem duplicar quando o número é o mesmo).
- **CMS**: títulos/textos da hero e rodapé editáveis por site.
- **Upload de imagens** para serviços, produtos e promoções.
- **Modo noturno** no site espiritual.
- Sites **responsivos** (mobile-first).

## 📚 Contexto acadêmico

Projeto realizado como atividade extensionista da **Uninter**, com aplicação prática no **comércio local da família**.
