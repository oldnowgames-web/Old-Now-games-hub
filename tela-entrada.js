/* =========================================================
   OldNow Games — tela-entrada.js

   Tela de entrada (depois da intro) + sessão do jogador.

   - Sem sessão salva:  [Iniciar uma sessão] [Entrar sem sessão]
   - Com sessão salva:  [Continuar como Nome] [Criar nova sessão] [Jogar sem sessão]
   - Com sessão, o hub mostra um avatar (inicial do nome ou a foto escolhida) na navbar.
   - "Criar nova sessão" apaga favoritos, recentes, avaliações e jogadas.
   - "Sem sessão" guarda os dados só durante a visita (sessionStorage).

   Carregar ANTES do script.js (ele pergunta aqui onde guardar os dados).
   ========================================================= */
(function sessaoDoJogador() {
    "use strict";

    const CHAVE_SESSAO = "oldnow_sessao";   // localStorage: { nome, criadaEm }
    const CHAVE_MODO = "oldnow_modo";       // sessionStorage: "sessao" | "convidado"
    // Dados que pertencem à sessão (mesmas chaves do script.js)
    const CHAVES_DADOS = [
        "oldnow_favoritos",
        "oldnow_recentes",
        "oldnow_avaliacoes",
        "oldnow_jogadas",
        "oldnow_area"
    ];
    const NOME_MAX = 20;
    const FADE_MS = 350;

    /* ---------- Sessão salva e modo da visita ---------- */

    function lerSessao() {
        try {
            const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
            return s && typeof s.nome === "string" && s.nome ? s : null;
        } catch (e) {
            return null;
        }
    }

    function salvarSessao(nome) {
        try {
            localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ nome: nome, criadaEm: Date.now() }));
            return !!lerSessao();
        } catch (e) {
            return false;
        }
    }

    function lerModo() {
        try { return sessionStorage.getItem(CHAVE_MODO); } catch (e) { return null; }
    }

    function definirModo(modo) {
        try { sessionStorage.setItem(CHAVE_MODO, modo); } catch (e) { /* ignora */ }
    }

    // Modo válido desta visita, ou null se ainda falta escolher na tela de entrada
    function modoAtual() {
        const modo = lerModo();
        if (modo === "convidado") return "convidado";
        if (modo === "sessao" && lerSessao()) return "sessao";
        return null;
    }

    // Onde o script.js deve guardar favoritos, recentes etc.
    function storage() {
        return modoAtual() === "convidado" ? window.sessionStorage : window.localStorage;
    }

    function apagarDadosDaSessao() {
        CHAVES_DADOS.forEach(chave => {
            try { localStorage.removeItem(chave); } catch (e) { /* ignora */ }
        });
    }

    /* ---------- Nome e avatar ---------- */

    function limparNome(texto) {
        const limpo = String(texto || "")
            .replace(/[<>&"'`\\]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return Array.from(limpo).slice(0, NOME_MAX).join("").trim();
    }

    function inicialDoNome(nome) {
        return (Array.from(nome)[0] || "?").toLocaleUpperCase("pt-BR");
    }

    // Cada nome ganha sempre a mesma cor
    function corDoNome(nome) {
        let h = 0;
        for (const c of nome) h = (h * 31 + c.codePointAt(0)) % 360;
        return "hsl(" + h + ", 60%, 42%)";
    }

    // Cores que a pessoa pode escolher para o ícone (além da automática e da personalizada)
    const CORES_AVATAR = [
        "#007bff", "#6f42c1", "#e83e8c", "#dc3545", "#fd7e14",
        "#ffc107", "#28a745", "#20c997", "#17a2b8", "#6c757d"
    ];

    function corValida(cor) {
        return typeof cor === "string" && /^#[0-9a-f]{6}$/i.test(cor);
    }

    // Cor do avatar: a escolhida pela pessoa ou, se não escolheu, a automática do nome
    function corDaSessao(sessao) {
        return corValida(sessao.cor) ? sessao.cor : corDoNome(sessao.nome);
    }

    // Letra branca ou escura, conforme o brilho do fundo (ex.: amarelo pede letra escura)
    function corDoTextoSobre(corHex) {
        if (!corValida(corHex)) return "#fff";
        const r = parseInt(corHex.slice(1, 3), 16);
        const g = parseInt(corHex.slice(3, 5), 16);
        const b = parseInt(corHex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111" : "#fff";
    }

    // Guarda a cor dentro da própria sessão (cor = null volta para a automática)
    function salvarCor(cor) {
        const sessao = lerSessao();
        if (!sessao) return;
        if (corValida(cor)) sessao.cor = cor.toLowerCase();
        else delete sessao.cor;
        try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao)); } catch (e) { /* ignora */ }
    }

    /* ---------- Foto do perfil (guardada dentro da própria sessão) ---------- */

    const FOTO_LADO = 256;                    // a foto vira um quadrado 256x256 (leve para o localStorage)
    const FOTO_MAX_ARQUIVO = 15 * 1024 * 1024;

    function fotoValida(f) {
        return typeof f === "string" && f.length < 400000
            && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+\/=]+$/i.test(f);
    }

    function fotoDaSessao(sessao) {
        return sessao && fotoValida(sessao.foto) ? sessao.foto : null;
    }

    // foto = data URL (ou null para remover). Devolve false se o navegador não deixou salvar.
    function salvarFoto(foto) {
        const sessao = lerSessao();
        if (!sessao) return false;
        if (fotoValida(foto)) sessao.foto = foto;
        else delete sessao.foto;
        try {
            localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
            return true;
        } catch (e) {
            return false;
        }
    }

    // Recorta o centro da imagem em quadrado e reduz (JPEG)
    function reduzirImagem(arquivo) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(arquivo);
            const img = new Image();
            img.onload = () => {
                try {
                    const lado = Math.min(img.naturalWidth, img.naturalHeight);
                    if (!lado) throw new Error("imagem vazia");
                    const c = document.createElement("canvas");
                    c.width = c.height = FOTO_LADO;
                    const ctx = c.getContext("2d");
                    ctx.fillStyle = "#111";
                    ctx.fillRect(0, 0, FOTO_LADO, FOTO_LADO);
                    const sx = (img.naturalWidth - lado) / 2;
                    const sy = (img.naturalHeight - lado) / 2;
                    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, FOTO_LADO, FOTO_LADO);
                    resolve(c.toDataURL("image/jpeg", 0.85));
                } catch (e) {
                    reject(e);
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("não abriu")); };
            img.src = url;
        });
    }

    /* ---------- Elementos ---------- */

    const tela = document.getElementById("telaEntrada");
    if (!tela) return;

    const $ = id => document.getElementById(id);
    const views = {};
    tela.querySelectorAll("[data-view]").forEach(el => { views[el.dataset.view] = el; });

    const elTitulo = $("entradaTitulo");
    const elSub = $("entradaSub");
    const elNomeSalvo = $("entradaNomeSalvo");
    const elInput = $("entradaNome");
    const elAviso = $("entradaAviso");
    const elErro = $("entradaErro");
    const btnFechar = $("entradaFechar");

    const avatar = $("sessaoAvatar");
    const avatarInicial = $("sessaoInicial");
    const btnEntrar = $("sessaoEntrar");
    const menu = $("sessaoMenu");
    const menuNome = $("sessaoMenuNome");
    const elCores = $("sessaoCores");

    const TEXTOS = {
        nova: ["Bem-vindo ao OldNow Games", "Crie uma sessão para guardar seus favoritos e jogos recentes, ou entre sem sessão."],
        retorno: ["Que bom te ver de novo!", "Como você quer entrar?"],
        nome: ["Como quer ser chamado?", "Escolha o nome que vai aparecer no hub."]
    };

    let podeFechar = false;       // só quando aberta pelo hub (Trocar de sessão / Entrar)
    let apagarAoCriar = false;    // "Criar nova sessão" com sessão existente
    let voltarPara = "nova";

    /* ---------- Telas internas ---------- */

    function mostrarView(nome) {
        Object.keys(views).forEach(k => { views[k].hidden = (k !== nome); });
        elTitulo.textContent = TEXTOS[nome][0];
        elSub.textContent = TEXTOS[nome][1];
    }

    function mostrarEscolha() {
        const sessao = lerSessao();
        if (sessao) {
            elNomeSalvo.textContent = sessao.nome;
            voltarPara = "retorno";
        } else {
            voltarPara = "nova";
        }
        mostrarView(voltarPara);
    }

    function mostrarNome(apagar) {
        apagarAoCriar = apagar;
        elErro.hidden = true;
        elInput.value = "";

        const sessao = lerSessao();
        if (apagar && sessao) {
            elAviso.textContent = "Isso apaga os favoritos, os jogos recentes e a área de " + sessao.nome + ".";
            elAviso.hidden = false;
            $("entradaConfirmar").textContent = "Apagar e criar sessão";
        } else {
            elAviso.hidden = true;
            $("entradaConfirmar").textContent = "Começar";
        }
        mostrarView("nome");
        setTimeout(() => elInput.focus(), 60);
    }

    /* ---------- Abrir / fechar ---------- */

    function abrirEntrada(opcoes) {
        const aPartirDoHub = !!(opcoes && opcoes.podeFechar);
        podeFechar = aPartirDoHub;
        btnFechar.classList.toggle("d-none", !aPartirDoHub);
        fecharMenu();
        mostrarEscolha();

        tela.classList.remove("d-none");
        document.body.classList.add("entrada-aberta");
        // 1º frame sem "visivel" para o fade-in funcionar quando aberta pelo hub
        requestAnimationFrame(() => tela.classList.add("visivel"));

        if (aPartirDoHub) {
            const primeiro = tela.querySelector(".entrada-view:not([hidden]) button");
            if (primeiro) setTimeout(() => primeiro.focus(), 60);
        }
    }

    function fecharEntrada() {
        tela.classList.remove("visivel");
        document.body.classList.remove("entrada-aberta");
        setTimeout(() => tela.classList.add("d-none"), FADE_MS);
    }

    /* ---------- Boas-vindas: "Bem-vindo, nome" com rodinha de carregando ---------- */

    const BOAS_VINDAS_MS = 2400;   // quanto tempo fica na tela
    const BOAS_VINDAS_FADE_MS = 500;

    function mostrarBoasVindas(nome) {
        if (!nome) return;
        const antiga = document.getElementById("boasVindas");
        if (antiga) antiga.remove();

        const caixa = document.createElement("div");
        caixa.id = "boasVindas";
        caixa.className = "boas-vindas";
        caixa.setAttribute("role", "status");
        caixa.setAttribute("aria-live", "polite");

        const conteudo = document.createElement("div");
        conteudo.className = "boas-vindas-conteudo";

        const titulo = document.createElement("p");
        titulo.className = "boas-vindas-titulo";
        titulo.appendChild(document.createTextNode("Bem-vindo, "));
        const spanNome = document.createElement("span");
        spanNome.className = "boas-vindas-nome";
        spanNome.textContent = nome;
        titulo.appendChild(spanNome);

        const rodinha = document.createElement("div");
        rodinha.className = "boas-vindas-rodinha";
        rodinha.setAttribute("aria-hidden", "true");

        conteudo.appendChild(titulo);
        conteudo.appendChild(rodinha);
        caixa.appendChild(conteudo);
        document.body.appendChild(caixa);

        let encerrado = false;
        function encerrar() {
            if (encerrado) return;
            encerrado = true;
            caixa.classList.remove("visivel");
            setTimeout(() => caixa.remove(), BOAS_VINDAS_FADE_MS + 50);
        }

        // 1º frame sem "visivel" para o fade-in funcionar
        requestAnimationFrame(() => caixa.classList.add("visivel"));
        setTimeout(encerrar, BOAS_VINDAS_MS);
        caixa.addEventListener("click", encerrar); // tocar na tela pula
    }

    /* ---------- Aplicar a escolha ---------- */

    function atualizarAvatar() {
        const modo = modoAtual();
        const sessao = modo === "sessao" ? lerSessao() : null;

        avatar.classList.toggle("d-none", !sessao);
        btnEntrar.classList.toggle("d-none", !!sessao);

        if (sessao) {
            avatarInicial.textContent = inicialDoNome(sessao.nome);
            const cor = corDaSessao(sessao);
            avatar.style.backgroundColor = cor;
            avatar.style.color = corDoTextoSobre(cor);
            const foto = fotoDaSessao(sessao);
            avatar.classList.toggle("com-foto", !!foto);
            avatar.style.backgroundImage = foto ? 'url("' + foto + '")' : "";
            if (btnRemoverFoto) btnRemoverFoto.classList.toggle("d-none", !foto);
            marcarCorAtiva(sessao);
            avatar.title = sessao.nome;
            menuNome.textContent = "Olá, " + sessao.nome;
        } else {
            fecharMenu();
        }
    }

    function aplicarEscolha() {
        atualizarAvatar();
        // redesenha favoritos, recentes etc. com os dados do modo escolhido
        if (typeof window.atualizarTelaPorSessao === "function") window.atualizarTelaPorSessao();
        fecharEntrada();
    }

    function entrarComoConvidado() {
        definirModo("convidado");
        aplicarEscolha();
    }

    function continuarSessao() {
        const sessao = lerSessao();
        definirModo("sessao");
        if (sessao) mostrarBoasVindas(sessao.nome); // antes de fechar a entrada, para cobrir o fade
        aplicarEscolha();
    }

    function confirmarNome(evento) {
        evento.preventDefault();
        const nome = limparNome(elInput.value);
        if (!nome) {
            elErro.textContent = "Digite um nome para continuar.";
            elErro.hidden = false;
            elInput.focus();
            return;
        }

        // salva primeiro: se o navegador bloquear, nada é apagado
        if (!salvarSessao(nome)) {
            elErro.textContent = "Não deu para salvar a sessão neste navegador (armazenamento bloqueado). Você ainda pode entrar sem sessão.";
            elErro.hidden = false;
            return;
        }
        if (apagarAoCriar) apagarDadosDaSessao();

        definirModo("sessao");
        mostrarBoasVindas(nome);
        aplicarEscolha();
    }

    /* ---------- Seletor de cor do ícone ---------- */

    let botaoAuto = null;
    let inputCorCustom = null;
    let rotuloCorCustom = null;
    const botoesCor = [];

    function criarSeletorDeCor() {
        // 1) automática (a cor muda conforme o nome)
        botaoAuto = document.createElement("button");
        botaoAuto.type = "button";
        botaoAuto.className = "sessao-cor sessao-cor-auto";
        botaoAuto.title = "Automática";
        botaoAuto.setAttribute("aria-label", "Cor automática");
        botaoAuto.addEventListener("click", () => escolherCor(null));
        elCores.appendChild(botaoAuto);

        // 2) cores prontas
        CORES_AVATAR.forEach(cor => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "sessao-cor";
            b.style.backgroundColor = cor;
            b.dataset.cor = cor;
            b.title = cor;
            b.setAttribute("aria-label", "Cor " + cor);
            b.addEventListener("click", () => escolherCor(cor));
            elCores.appendChild(b);
            botoesCor.push(b);
        });

        // 3) cor personalizada (seletor nativo do aparelho)
        rotuloCorCustom = document.createElement("label");
        rotuloCorCustom.className = "sessao-cor sessao-cor-custom";
        rotuloCorCustom.title = "Escolher outra cor";
        inputCorCustom = document.createElement("input");
        inputCorCustom.type = "color";
        inputCorCustom.value = "#007bff";
        inputCorCustom.setAttribute("aria-label", "Escolher outra cor");
        inputCorCustom.addEventListener("input", () => pintarAvatar(inputCorCustom.value));
        inputCorCustom.addEventListener("change", () => escolherCor(inputCorCustom.value));
        rotuloCorCustom.appendChild(inputCorCustom);
        elCores.appendChild(rotuloCorCustom);
    }

    // Só pinta o avatar (prévia enquanto a pessoa arrasta no seletor)
    function pintarAvatar(cor) {
        avatar.style.backgroundColor = cor;
        avatar.style.color = corDoTextoSobre(cor);
    }

    function escolherCor(cor) {
        salvarCor(cor);
        const sessao = lerSessao();
        if (!sessao) return;
        pintarAvatar(corDaSessao(sessao));
        marcarCorAtiva(sessao);
    }

    // Destaca a opção em uso (sem recriar os botões, para o menu não fechar)
    function marcarCorAtiva(sessao) {
        const atual = corValida(sessao.cor) ? sessao.cor.toLowerCase() : null;
        const personalizada = atual && !CORES_AVATAR.includes(atual);

        botaoAuto.classList.toggle("ativa", !atual);
        botaoAuto.setAttribute("aria-pressed", String(!atual));
        botoesCor.forEach(b => {
            const ativa = b.dataset.cor === atual;
            b.classList.toggle("ativa", ativa);
            b.setAttribute("aria-pressed", String(ativa));
        });
        rotuloCorCustom.classList.toggle("ativa", !!personalizada);
        if (personalizada) {
            inputCorCustom.value = atual;
            rotuloCorCustom.style.backgroundColor = atual;
        } else {
            rotuloCorCustom.style.backgroundColor = "";
        }
    }

    /* ---------- Escolher / remover a foto do perfil ---------- */

    let btnRemoverFoto = null;
    let msgFoto = null;

    function avisoFoto(texto) {
        if (!msgFoto) return;
        msgFoto.textContent = texto || "";
        msgFoto.classList.toggle("d-none", !texto);
    }

    function criarSeletorDeFoto() {
        const bloco = document.createElement("div");
        bloco.className = "sessao-foto";

        const rotulo = document.createElement("p");
        rotulo.className = "sessao-menu-rotulo";
        rotulo.textContent = "Foto do perfil";
        bloco.appendChild(rotulo);

        const acoes = document.createElement("div");
        acoes.className = "sessao-foto-acoes";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.className = "sessao-foto-input";
        input.setAttribute("aria-label", "Escolher foto do perfil");

        const btnEscolher = document.createElement("button");
        btnEscolher.type = "button";
        btnEscolher.className = "sessao-foto-btn";
        btnEscolher.textContent = "Escolher foto";
        btnEscolher.addEventListener("click", () => input.click());

        btnRemoverFoto = document.createElement("button");
        btnRemoverFoto.type = "button";
        btnRemoverFoto.className = "sessao-foto-btn d-none";
        btnRemoverFoto.textContent = "Remover";
        btnRemoverFoto.addEventListener("click", () => {
            avisoFoto("");
            salvarFoto(null);
            atualizarAvatar();
        });

        input.addEventListener("change", async () => {
            const arquivo = input.files && input.files[0];
            input.value = "";
            if (!arquivo) return;
            if (!/^image\//.test(arquivo.type)) { avisoFoto("Escolha um arquivo de imagem."); return; }
            if (arquivo.size > FOTO_MAX_ARQUIVO) { avisoFoto("Imagem muito grande (máx. 15 MB)."); return; }
            try {
                const foto = await reduzirImagem(arquivo);
                if (!salvarFoto(foto)) { avisoFoto("Não deu para salvar a foto neste navegador."); return; }
                avisoFoto("");
                atualizarAvatar();
            } catch (e) {
                avisoFoto("Não consegui abrir essa imagem. Tente JPG ou PNG.");
            }
        });

        acoes.appendChild(btnEscolher);
        acoes.appendChild(btnRemoverFoto);
        bloco.appendChild(acoes);

        msgFoto = document.createElement("p");
        msgFoto.className = "sessao-foto-msg d-none";
        msgFoto.setAttribute("role", "alert");
        bloco.appendChild(msgFoto);
        bloco.appendChild(input);

        menuNome.insertAdjacentElement("afterend", bloco);
    }

    /* ---------- Menu do avatar ---------- */

    function fecharMenu() {
        menu.classList.add("d-none");
        avatar.setAttribute("aria-expanded", "false");
    }

    function alternarMenu() {
        const abrir = menu.classList.contains("d-none");
        menu.classList.toggle("d-none", !abrir);
        avatar.setAttribute("aria-expanded", abrir ? "true" : "false");
    }

    /* ---------- Eventos ---------- */

    tela.addEventListener("click", e => {
        const botao = e.target.closest("[data-acao]");
        if (!botao) return;
        const acao = botao.dataset.acao;

        if (acao === "iniciar") mostrarNome(false);
        else if (acao === "nova") mostrarNome(true);
        else if (acao === "continuar") continuarSessao();
        else if (acao === "convidado") entrarComoConvidado();
        else if (acao === "voltar") mostrarEscolha();
    });

    $("entradaForm").addEventListener("submit", confirmarNome);
    btnFechar.addEventListener("click", fecharEntrada);

    avatar.addEventListener("click", e => { e.stopPropagation(); alternarMenu(); });
    btnEntrar.addEventListener("click", () => abrirEntrada({ podeFechar: true }));
    $("sessaoTrocar").addEventListener("click", () => abrirEntrada({ podeFechar: true }));
    $("sessaoSair").addEventListener("click", () => { fecharMenu(); entrarComoConvidado(); });

    document.addEventListener("click", e => {
        if (!menu.contains(e.target)) fecharMenu();
    });

    document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;
        fecharMenu();
        if (podeFechar && !tela.classList.contains("d-none")) fecharEntrada();
    });

    /* ---------- API usada pelo script.js ---------- */

    window.OldNowSessao = {
        storage: storage,
        nome: () => { const s = modoAtual() === "sessao" ? lerSessao() : null; return s ? s.nome : null; },
        abrirEntrada: abrirEntrada,
        foto: () => { const s = modoAtual() === "sessao" ? lerSessao() : null; return fotoDaSessao(s); }
    };

    criarSeletorDeCor();
    criarSeletorDeFoto();

    /* ---------- Início ---------- */

    if (modoAtual() === null) {
        // Nova visita: a tela de entrada já fica pronta por baixo da intro
        // (z-index menor) e aparece quando a intro esmaece.
        podeFechar = false;
        btnFechar.classList.add("d-none");
        mostrarEscolha();
        tela.classList.remove("d-none");
        tela.classList.add("visivel");
        document.body.classList.add("entrada-aberta");
    } else {
        // Mesma visita (ex.: recarregou após atualizar o app): não pergunta de novo
        atualizarAvatar();
    }
})();