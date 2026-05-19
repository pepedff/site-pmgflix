# 🎬 PMGFlix — Plataforma Premium de Streaming

Bem-vindo ao **PMGFlix**, uma plataforma premium e moderna de streaming inspirada nos maiores serviços do mercado (Netflix, Prime Video). O sistema é composto por um front-end estático elegante e dinâmico, um servidor back-end robusto em **Node.js** com banco de dados **SQLite**, integração via **JWT (JSON Web Token)** e suporte a bot do Discord.

---

## ✨ Recursos Principais

* **Interface Ultra Premium**: Design escuro e responsivo com efeitos de vidro (glassmorphism), animações de auroras flutuantes e transições suaves.
* **Banner Hero Dinâmico**: Destaque de conteúdos configurável diretamente pelo painel administrativo.
* **Painel Administrativo Completo**: Área restrita para administradores publicarem novos conteúdos (filmes, séries com temporadas/episódios), gerenciarem usuários e definirem planos de acesso.
* **Player customizado com rastreamento**: Player de vídeo premium que salva automaticamente o progresso do usuário no banco de dados e exibe a opção de "Próximo Episódio".
* **Controle de Acesso por Planos**: Separação de conteúdos por planos (`grátis`, `premium`, `ultra`) e proteção de acesso antecipado.
* **Engrenagem de Configuração de API ⚙️**: Permite acoplar dinamicamente qualquer endereço de API no front-end sem precisar alterar o código fonte.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* **Node.js** instalado (versão 16 ou superior).
* Gerenciador de pacotes **npm**.

### 1. Configurando o Back-end & Bot do Discord
1. Abra o terminal e navegue até a pasta do bot:
   ```bash
   cd bot-discord
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo chamado `.env` baseado nas suas chaves do Discord e JWT, preenchendo as variáveis necessárias:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   JWT_SECRET=sua_chave_secreta_jwt
   PORT=3000
   ```
4. Popule o banco de dados inicial (executando o seed):
   ```bash
   node seed.js
   ```
5. Inicie o servidor:
   ```bash
   npm start
   ```

### 2. Abrindo o Front-end
Como o front-end é estático e desacoplado, você pode simplesmente abrir o arquivo **`index.html`** da raiz em qualquer navegador ou usar uma extensão de servidor local (como Live Server no VS Code).

---

## 🌐 Hospedagem em Produção

### 🖥️ Front-end (GitHub Pages, Vercel ou Netlify)
O front-end está localizado na pasta raiz e pode ser hospedado em qualquer serviço de arquivos estáticos de sua preferência.
* Caso utilize o **GitHub Pages**, a URL será detectada automaticamente.
* Caso utilize **Vercel** ou **Netlify**, basta importar a pasta do repositório como um projeto estático.

### ⚙️ Conectando com a API
Ao abrir o site hospedado em produção pela primeira vez:
1. Vá até a tela de login.
2. Clique no ícone de **Engrenagem (⚙️)** no canto superior direito.
3. Insira a URL do seu servidor back-end hospedado (ex: Render, Railway, VPS).
4. Clique em **Salvar API**.
5. Pronto! Todo o catálogo, autenticação de usuários e player carregarão dinamicamente.
