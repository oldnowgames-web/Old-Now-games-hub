/* =========================================================
   OldNow Games — area.js
   "Minha área": o jogador escolhe quais jogos ficam nela e
   entra numa tela própria com as capas lado a lado (flex-wrap).

   Depende do script.js (GAMES, CATEGORIAS_INFO, lerJSON, salvarJSON,
   abrirJogoPeloId) — carregar DEPOIS dele.

   Dados (por sessão, no mesmo armazenamento dos favoritos):
     oldnow_area = {
        jogos: ["id1", "id2", ...],              // a ordem do array é a ordem das capas
        fundo: { tipo: "cor", valor: "#0b1b3a" } // ou { tipo: "imagem", valor: "data:image/jpeg;base64,...", escurecer: 35 }
        espaco: "compacto" | "normal" | "amplo", // espaçamento entre as capas
        criadaEm: 123
    }
   ========================================================= */
(function areaDoJogador() {
    "use strict";

    const CHAVE_AREA = "oldnow_area";

    const overlay = document.getElementById("areaOverlay");
    if (!overlay || typeof GAMES === "undefined") return;

    const $ = id => document.getElementById(id);
    const elTitulo = $("areaTitulo");
    const btnVoltar = $("areaVoltar");
    const btnEditar = $("areaEditar");
    const viewSelecao = $("areaSelecao");
    const viewArea = $("areaVisao");
    const elBusca = $("areaBusca");
    const elChips = $("areaChips");
    const elListaSel = $("areaLista");
    const elSemResultado = $("areaSemResultado");
    const elContagem = $("areaContagem");
    const btnCancelar = $("areaCancelar");
    const btnSalvar = $("areaSalvar");
    const elGrade = $("areaGrade");
    const btnPersonalizar = $("areaPersonalizar");
    const painel = $("areaPainel");
    const elCores = $("areaCores");
    const inputImagem = $("areaImagem");
    const btnFundoPadrao = $("areaFundoPadrao");
    const elEscurecerWrap = $("areaEscurecerWrap");
    const inputEscurecer = $("areaEscurecer");
    const elAviso = $("areaPainelAviso");
    const elEspacos = $("areaEspacos");

    let aberta = false;
    let escolhidos = [];        // ids marcados no modo seleção (ordem preservada)
    let filtroCategoria = "todos";

    /* ---------- Dados ---------- */

    function jogosDisponiveis() {
        return GAMES.filter(j => j.link && j.link !== "#");
    }

    // Lê a área salva ignorando ids repetidos ou de jogos que não existem mais
    function lerArea() {
        const salva = lerJSON(CHAVE_AREA, null);
        if (!salva || !Array.isArray(salva.jogos)) return null;
        const jogos = salva.jogos.filter((id, i) =>
            salva.jogos.indexOf(id) === i && GAMES.some(j => j.id === id)
        );
        return Object.assign({}, salva, { jogos: jogos });
    }

    // Devolve false se o navegador recusar (armazenamento cheio ou bloqueado)
    function salvarArea(area) {
        try {
            armazenamento().setItem(CHAVE_AREA, JSON.stringify(area));
            return true;
        } catch (e) {
            return false;
        }
    }

    const ESPACOS = ["compacto", "normal", "amplo"];
    const ESPACO_PADRAO = "amplo";

    function normalizar(txt) {
        return String(txt || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    /* ---------- Textos dos botões do hub ---------- */

    function atualizarRotulos() {
        const existe = !!lerArea();
        document.querySelectorAll("[data-area-rotulo]").forEach(el => {
            el.textContent = existe ? "Minha área" : "Criar minha área";
        });
    }

    function tituloDaArea() {
        const nome = window.OldNowSessao && window.OldNowSessao.nome();
        return nome ? "Área de " + nome : "Minha área";
    }

    /* ---------- Capas ---------- */

    function criarCapa(jogo, indice) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "area-card";
        btn.dataset.id = jogo.id;
        btn.style.setProperty("--i", Math.min(indice, 20));
        btn.setAttribute("aria-label", jogo.titulo);
        btn.title = jogo.titulo;

        const img = document.createElement("img");
        img.src = jogo.capa;
        img.alt = "";
        img.loading = "lazy";
        img.draggable = false;
        btn.appendChild(img);
        return btn;
    }

    /* ---------- Modo área (as capas lado a lado) ---------- */

    function mostrarArea(area) {
        elTitulo.textContent = tituloDaArea();
        btnEditar.hidden = false;
        btnPersonalizar.hidden = false;
        viewSelecao.hidden = true;
        viewArea.hidden = false;
        elGrade.dataset.espaco = ESPACOS.includes(area.espaco) ? area.espaco : ESPACO_PADRAO;
        aplicarFundo(area);

        elGrade.innerHTML = "";
        area.jogos
            .map(id => GAMES.find(j => j.id === id))
            .filter(Boolean)
            .forEach((jogo, i) => elGrade.appendChild(criarCapa(jogo, i)));

        viewArea.scrollTop = 0;
        const rolagem = viewArea.querySelector(".area-rolagem");
        if (rolagem) rolagem.scrollTop = 0;
    }

    elGrade.addEventListener("click", e => {
        const card = e.target.closest(".area-card");
        if (!card) return;
        // abre o modal do jogo por cima da área (o modal tem z-index maior)
        abrirJogoPeloId(card.dataset.id);
    });

    /* ---------- Modo seleção ---------- */

    function montarChips() {
        elChips.innerHTML = "";
        const opcoes = [{ id: "todos", titulo: "Todos" }].concat(CATEGORIAS_INFO);
        opcoes.forEach(op => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "area-chip" + (op.id === filtroCategoria ? " ativo" : "");
            b.dataset.cat = op.id;
            b.textContent = op.titulo;
            elChips.appendChild(b);
        });
    }

    elChips.addEventListener("click", e => {
        const chip = e.target.closest(".area-chip");
        if (!chip) return;
        filtroCategoria = chip.dataset.cat;
        elChips.querySelectorAll(".area-chip").forEach(c =>
            c.classList.toggle("ativo", c === chip)
        );
        renderSelecao();
    });

    function renderSelecao() {
        const termo = normalizar(elBusca.value);
        const lista = jogosDisponiveis()
            .filter(j => filtroCategoria === "todos" || j.categoria === filtroCategoria)
            .filter(j => !termo || normalizar(j.titulo).includes(termo));

        elListaSel.innerHTML = "";
        lista.forEach((jogo, i) => {
            const card = criarCapa(jogo, i);
            const marcado = escolhidos.includes(jogo.id);
            card.classList.toggle("escolhido", marcado);
            card.setAttribute("aria-pressed", String(marcado));

            const check = document.createElement("span");
            check.className = "area-check";
            check.textContent = "✓";
            check.setAttribute("aria-hidden", "true");
            card.appendChild(check);

            elListaSel.appendChild(card);
        });

        elSemResultado.hidden = lista.length > 0;
        atualizarContagem();
    }

    function atualizarContagem() {
        const n = escolhidos.length;
        elContagem.textContent = n === 0
            ? "Toque nos jogos para escolher"
            : n + (n === 1 ? " jogo escolhido" : " jogos escolhidos");
        btnSalvar.disabled = n === 0;
    }

    elListaSel.addEventListener("click", e => {
        const card = e.target.closest(".area-card");
        if (!card) return;
        const id = card.dataset.id;
        const i = escolhidos.indexOf(id);
        if (i >= 0) escolhidos.splice(i, 1);
        else escolhidos.push(id); // novos entram no fim, os antigos mantêm a posição

        const marcado = i < 0;
        card.classList.toggle("escolhido", marcado);
        card.setAttribute("aria-pressed", String(marcado));
        atualizarContagem();
    });

    elBusca.addEventListener("input", renderSelecao);

    function iniciarSelecao() {
        const area = lerArea();
        escolhidos = area ? area.jogos.slice() : [];
        filtroCategoria = "todos";
        elBusca.value = "";
        montarChips();

        elTitulo.textContent = area ? "Editar jogos da área" : "Crie sua área";
        btnSalvar.textContent = area ? "Salvar" : "Criar área";
        btnEditar.hidden = true;
        btnPersonalizar.hidden = true;
        fecharPainel();
        viewArea.hidden = true;
        viewSelecao.hidden = false;

        renderSelecao();
        const rolagem = viewSelecao.querySelector(".area-rolagem");
        if (rolagem) rolagem.scrollTop = 0;
    }

    btnSalvar.addEventListener("click", () => {
        if (!escolhidos.length) return;
        const area = lerArea() || { criadaEm: Date.now() };
        area.jogos = escolhidos.slice();
        if (!salvarArea(area)) {
            elContagem.textContent = "Não deu para salvar neste navegador (armazenamento bloqueado).";
            return;
        }
        atualizarRotulos();
        mostrarArea(area);
    });

    btnCancelar.addEventListener("click", () => {
        const area = lerArea();
        if (area) mostrarArea(area);
        else fecharOverlay();
    });

    btnEditar.addEventListener("click", iniciarSelecao);

    /* ---------- Personalizar: fundo (cor ou imagem) e espaçamento ---------- */

    const CORES_FUNDO = [
        "#0d0d0d", "#0b1b3a", "#2a0f3d", "#0f2b22", "#3d0f17", "#1f2937",
        "#007bff", "#6f42c1", "#e83e8c", "#fd7e14", "#20c997"
    ];
    const ESCURECER_PADRAO = 35;
    const LIMITE_IMAGEM = 1400000; // ~1,4 MB em texto: cabe folgado no armazenamento do navegador

    let botaoPadrao = null;
    let rotuloCorCustom = null;
    let inputCorCustom = null;
    const botoesCor = [];

    function corValida(cor) {
        return typeof cor === "string" && /^#[0-9a-f]{6}$/i.test(cor);
    }

    function imagemValida(valor) {
        return typeof valor === "string" && /^data:image\/(jpeg|png|webp|gif);base64,/i.test(valor);
    }

    // Pinta o fundo da tela. Sem fundo salvo, volta ao degradê padrão do CSS.
    function aplicarFundo(area) {
        const f = area && area.fundo;
        const s = overlay.style;
        s.background = "";

        if (f && f.tipo === "cor" && corValida(f.valor)) {
            // "none" é essencial: o degradê padrão do CSS é uma imagem e ficaria por cima da cor
            s.backgroundImage = "none";
            s.backgroundColor = f.valor;
        } else if (f && f.tipo === "imagem" && imagemValida(f.valor)) {
            const esc = Math.min(80, Math.max(0, Number.isFinite(f.escurecer) ? f.escurecer : ESCURECER_PADRAO)) / 100;
            s.backgroundColor = "#0d0d0d";
            s.backgroundImage = "linear-gradient(rgba(0,0,0," + esc + "), rgba(0,0,0," + esc + ")), url(\"" + f.valor + "\")";
            s.backgroundSize = "cover";
            s.backgroundPosition = "center";
            s.backgroundRepeat = "no-repeat";
        }
    }

    function mostrarAviso(texto) {
        elAviso.textContent = texto || "";
        elAviso.hidden = !texto;
    }

    // Altera a área salva; se o navegador recusar, volta ao que estava
    function alterarArea(mudar) {
        const area = lerArea();
        if (!area) return;
        mudar(area);
        if (!salvarArea(area)) {
            mostrarAviso("Não deu para salvar (armazenamento do navegador cheio ou bloqueado).");
            const antiga = lerArea();
            aplicarFundo(antiga);
            marcarPainel(antiga);
            return;
        }
        mostrarAviso("");
        aplicarFundo(area);
        elGrade.dataset.espaco = ESPACOS.includes(area.espaco) ? area.espaco : ESPACO_PADRAO;
        marcarPainel(area);
    }

    function montarCores() {
        elCores.innerHTML = "";

        botaoPadrao = document.createElement("button");
        botaoPadrao.type = "button";
        botaoPadrao.className = "area-cor area-cor-padrao";
        botaoPadrao.title = "Padrão";
        botaoPadrao.setAttribute("aria-label", "Fundo padrão");
        botaoPadrao.addEventListener("click", voltarAoPadrao);
        elCores.appendChild(botaoPadrao);

        CORES_FUNDO.forEach(cor => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "area-cor";
            b.style.backgroundColor = cor;
            b.dataset.cor = cor;
            b.title = cor;
            b.setAttribute("aria-label", "Cor " + cor);
            b.addEventListener("click", () => definirCor(cor));
            elCores.appendChild(b);
            botoesCor.push(b);
        });

        rotuloCorCustom = document.createElement("label");
        rotuloCorCustom.className = "area-cor area-cor-custom";
        rotuloCorCustom.title = "Escolher outra cor";
        inputCorCustom = document.createElement("input");
        inputCorCustom.type = "color";
        inputCorCustom.value = "#0b1b3a";
        inputCorCustom.setAttribute("aria-label", "Escolher outra cor");
        // enquanto arrasta só mostra; ao soltar, salva
        inputCorCustom.addEventListener("input", () => {
            const a = lerArea();
            if (a) aplicarFundo(Object.assign({}, a, { fundo: { tipo: "cor", valor: inputCorCustom.value } }));
        });
        inputCorCustom.addEventListener("change", () => definirCor(inputCorCustom.value));
        rotuloCorCustom.appendChild(inputCorCustom);
        elCores.appendChild(rotuloCorCustom);
    }

    function definirCor(cor) {
        if (!corValida(cor)) return;
        alterarArea(a => { a.fundo = { tipo: "cor", valor: cor.toLowerCase() }; });
    }

    function voltarAoPadrao() {
        alterarArea(a => { delete a.fundo; });
    }

    function definirEspaco(espaco) {
        if (!ESPACOS.includes(espaco)) return;
        alterarArea(a => { a.espaco = espaco; });
    }

    // Marca no painel o que está em uso
    function marcarPainel(area) {
        if (!area) return;
        const f = area.fundo;
        const cor = f && f.tipo === "cor" && corValida(f.valor) ? f.valor.toLowerCase() : null;
        const personalizada = cor && !CORES_FUNDO.includes(cor);
        const comImagem = !!(f && f.tipo === "imagem" && imagemValida(f.valor));

        botaoPadrao.classList.toggle("ativa", !f || (!cor && !comImagem));
        botoesCor.forEach(b => b.classList.toggle("ativa", b.dataset.cor === cor));
        rotuloCorCustom.classList.toggle("ativa", !!personalizada);
        rotuloCorCustom.style.backgroundColor = personalizada ? cor : "";
        if (personalizada) inputCorCustom.value = cor;

        elEscurecerWrap.hidden = !comImagem;
        if (comImagem) {
            inputEscurecer.value = Number.isFinite(f.escurecer) ? f.escurecer : ESCURECER_PADRAO;
        }

        const espaco = ESPACOS.includes(area.espaco) ? area.espaco : ESPACO_PADRAO;
        elEspacos.querySelectorAll("button").forEach(b =>
            b.classList.toggle("ativo", b.dataset.espaco === espaco)
        );
    }

    /* Imagem: reduz e comprime antes de guardar (o armazenamento do navegador é pequeno) */
    function prepararImagem(arquivo) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(arquivo);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                try {
                    let resultado = "";
                    for (const maxLado of [1600, 1280, 960]) {
                        const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
                        const canvas = document.createElement("canvas");
                        canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
                        canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
                        const ctx = canvas.getContext("2d");
                        ctx.fillStyle = "#000";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        for (const qualidade of [0.78, 0.6]) {
                            resultado = canvas.toDataURL("image/jpeg", qualidade);
                            if (resultado.length <= LIMITE_IMAGEM) return resolve(resultado);
                        }
                    }
                    resolve(resultado);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagem")); };
            img.src = url;
        });
    }

    inputImagem.addEventListener("change", () => {
        const arquivo = inputImagem.files && inputImagem.files[0];
        inputImagem.value = "";
        if (!arquivo) return;
        if (!/^image\//.test(arquivo.type)) {
            mostrarAviso("Escolha um arquivo de imagem (JPG, PNG, WebP...).");
            return;
        }
        mostrarAviso("Preparando imagem...");
        prepararImagem(arquivo)
            .then(dataUrl => {
                if (dataUrl.length > LIMITE_IMAGEM * 1.5) {
                    mostrarAviso("Essa imagem ficou grande demais. Tente uma menor.");
                    return;
                }
                alterarArea(a => {
                    const anterior = a.fundo && a.fundo.tipo === "imagem" ? a.fundo.escurecer : null;
                    a.fundo = {
                        tipo: "imagem",
                        valor: dataUrl,
                        escurecer: Number.isFinite(anterior) ? anterior : ESCURECER_PADRAO
                    };
                });
            })
            .catch(() => mostrarAviso("Não consegui abrir essa imagem. Tente outra (JPG ou PNG)."));
    });

    inputEscurecer.addEventListener("input", () => {
        const a = lerArea();
        if (!a || !a.fundo || a.fundo.tipo !== "imagem") return;
        aplicarFundo(Object.assign({}, a, { fundo: Object.assign({}, a.fundo, { escurecer: Number(inputEscurecer.value) }) }));
    });
    inputEscurecer.addEventListener("change", () => {
        alterarArea(a => {
            if (a.fundo && a.fundo.tipo === "imagem") a.fundo.escurecer = Number(inputEscurecer.value);
        });
    });

    btnFundoPadrao.addEventListener("click", voltarAoPadrao);

    elEspacos.addEventListener("click", e => {
        const b = e.target.closest("button[data-espaco]");
        if (b) definirEspaco(b.dataset.espaco);
    });

    function abrirPainel() {
        marcarPainel(lerArea());
        mostrarAviso("");
        painel.hidden = false;
        btnPersonalizar.setAttribute("aria-expanded", "true");
    }

    function fecharPainel() {
        painel.hidden = true;
        btnPersonalizar.setAttribute("aria-expanded", "false");
    }

    btnPersonalizar.addEventListener("click", e => {
        e.stopPropagation();
        painel.hidden ? abrirPainel() : fecharPainel();
    });

    // clicar fora do painel fecha
    overlay.addEventListener("click", e => {
        if (painel.hidden) return;
        if (painel.contains(e.target) || btnPersonalizar.contains(e.target)) return;
        fecharPainel();
    });

    montarCores();

    /* ---------- Abrir / fechar a tela ---------- */

    function abrirOverlay() {
        if (aberta) return;
        aberta = true;
        overlay.classList.remove("d-none");
        document.documentElement.classList.add("area-aberta");

        const area = lerArea();
        aplicarFundo(area);
        if (area) mostrarArea(area);
        else iniciarSelecao();

        // o botão "voltar" do celular fecha a área em vez de sair do site
        try {
            if (!(history.state && history.state.oldnowArea)) {
                history.pushState({ oldnowArea: true }, "");
            }
        } catch (e) { /* ignora */ }
    }

    function fecharOverlay(viaHistorico) {
        if (!aberta) return;
        aberta = false;
        fecharPainel();
        overlay.classList.add("d-none");
        document.documentElement.classList.remove("area-aberta");

        if (!viaHistorico) {
            try {
                if (history.state && history.state.oldnowArea) history.back();
            } catch (e) { /* ignora */ }
        }
    }

    window.addEventListener("popstate", () => {
        if (aberta && !(history.state && history.state.oldnowArea)) fecharOverlay(true);
    });

    btnVoltar.addEventListener("click", () => fecharOverlay());

    // Esc: volta/fecha a área — só se não houver modal, player, assistente ou entrada por cima.
    // (fase de captura: roda antes dos outros Esc, que fecham essas camadas)
    document.addEventListener("keydown", e => {
        if (e.key !== "Escape" || !aberta) return;
        if (document.querySelector(".modal.show")) return;
        const player = $("playerOverlay");
        if (player && !player.classList.contains("d-none")) return;
        const bot = $("botPainel");
        if (bot && !bot.classList.contains("d-none")) return;
        if (document.body.classList.contains("entrada-aberta")) return;

        if (!painel.hidden) { fecharPainel(); return; }
        if (!viewSelecao.hidden && lerArea()) mostrarArea(lerArea());
        else fecharOverlay();
    }, true);

    /* ---------- Botões do hub (menu PC, menu celular, atalho ao lado do "Me surpreenda") ---------- */

    function fecharMenuMobile() {
        const menu = document.getElementById("menuMobileDireita");
        if (menu && window.bootstrap) {
            const instancia = bootstrap.Offcanvas.getInstance(menu);
            if (instancia) instancia.hide();
        }
    }

    document.querySelectorAll("[data-area-abrir]").forEach(el => {
        el.addEventListener("click", e => {
            e.preventDefault();
            fecharMenuMobile();
            abrirOverlay();
        });
    });

    /* ---------- Troca de sessão: cada sessão tem a sua área ---------- */

    const atualizarOriginal = window.atualizarTelaPorSessao;
    window.atualizarTelaPorSessao = function () {
        if (typeof atualizarOriginal === "function") atualizarOriginal();
        fecharOverlay();
        atualizarRotulos();
    };

    atualizarRotulos();
})();