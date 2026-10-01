

(function assistenteOldNow() {
    "use strict";

    const toggle = document.getElementById("botToggle");
    const painel = document.getElementById("botPainel");
    const fechar = document.getElementById("botFechar");
    const mensagens = document.getElementById("botMensagens");
    const form = document.getElementById("botForm");
    const input = document.getElementById("botInput");
    if (!toggle || !painel || !form) return;

    /* ---------- Utilidades ---------- */

    function normalizar(txt) {
        return String(txt || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function aleatorio(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /* ---------- Sinônimos de categoria (o "dicionário" do bot) ---------- */

    const SINONIMOS_CAT = {
        "aventura-acao": ["aventura", "acao", "luta", "tiro", "nave", "espaco", "espacial", "guerra", "batalha", "horda"],
        "simulacao-estrategia": ["simulacao", "estrategia", "construir", "cidade", "fazenda", "farm", "clicker", "gerenciar", "minerar", "mineracao"],
        "esporte-racing": ["esporte", "corrida", "racing", "futebol", "basquete", "golfe", "golf", "carro", "moto", "correr"],
        "puzzle": ["puzzle", "quebra cabeca", "quebracabeca", "logica", "raciocinio", "memoria", "encaixe", "labirinto"],
        "arcade": ["arcade", "retro", "classico", "fliperama", "pong", "space"],
        "tabuleiro": ["tabuleiro", "xadrez", "damas", "velha", "tic tac"]
    };

    function detectarCategoria(t) {
        for (const [catId, palavras] of Object.entries(SINONIMOS_CAT)) {
            if (palavras.some(p => t.includes(p))) return catId;
        }
        return null;
    }

    function detectarJogoPorNome(t) {
        let melhor = null;
        let melhorScore = 0;
        for (const jogo of GAMES) {
            const tituloNorm = normalizar(jogo.titulo);
            if (t.includes(tituloNorm)) return jogo;

            const palavras = tituloNorm.split(" ").filter(p => p.length > 3);
            const matches = palavras.filter(p => t.includes(p)).length;
            if (matches > melhorScore) {
                melhorScore = matches;
                melhor = jogo;
            }
        }
        return melhorScore >= 1 ? melhor : null;
    }

    /* ---------- Ações (o que o bot sabe fazer) ---------- */

    const acoes = {
        recomendarAleatorio() {
            const disponiveis = GAMES.filter(j => j.link && j.link !== "#");
            const jogo = aleatorio(disponiveis);
            return {
                texto: `Que tal **${jogo.titulo}**? ${jogo.descricao}`,
                chips: [
                    { texto: "🎮 Abrir", acao: () => abrirJogo(jogo.id) },
                    { texto: "🎲 Outro", acao: () => responder(acoes.recomendarAleatorio()) }
                ]
            };
        },

        recomendarPorCategoria(catId) {
            const jogos = GAMES.filter(j => j.categoria === catId && j.link && j.link !== "#");
            const catInfo = CATEGORIAS_INFO.find(c => c.id === catId);
            if (!jogos.length) return { texto: "Ainda não tenho jogos nessa categoria." };
            const jogo = aleatorio(jogos);
            return {
                texto: `Separei um de **${catInfo.titulo}**: **${jogo.titulo}**. ${jogo.descricao}`,
                chips: [
                    { texto: "🎮 Abrir", acao: () => abrirJogo(jogo.id) },
                    { texto: "Ver todos", acao: () => irPara(catId) },
                    { texto: "🎲 Outro", acao: () => responder(acoes.recomendarPorCategoria(catId)) }
                ]
            };
        },

        listarFavoritos() {
            const jogos = getFavoritos()
                .map(id => GAMES.find(j => j.id === id))
                .filter(Boolean);
            if (!jogos.length) return { texto: "Você ainda não favoritou nenhum jogo. Clique no ♡ de um card pra salvar aqui." };
            const lista = jogos.slice(0, 5).map(j => `• ${j.titulo}`).join("\n");
            return {
                texto: `Seus favoritos (${jogos.length}):\n${lista}`,
                chips: [{ texto: "Ver seção", acao: () => irPara("favoritos") }]
            };
        },

        listarRecentes() {
            const jogos = lerJSON(LS_KEYS.recentes, [])
                .map(id => GAMES.find(j => j.id === id))
                .filter(Boolean);
            if (!jogos.length) return { texto: "Você ainda não jogou nada por aqui. Quer uma recomendação?" };
            const lista = jogos.slice(0, 5).map(j => `• ${j.titulo}`).join("\n");
            return {
                texto: `Continue de onde parou:\n${lista}`,
                chips: [{ texto: "Ver seção", acao: () => irPara("continuar-jogando") }]
            };
        },

        maisJogados() {
            const jogadas = getJogadas();
            const jogos = [...GAMES]
                .filter(j => jogadas[j.id])
                .sort((a, b) => (jogadas[b.id] || 0) - (jogadas[a.id] || 0))
                .slice(0, 5);
            if (!jogos.length) return { texto: "Você ainda não tem estatísticas. Joga algum jogo pra eu começar a rastrear!" };
            const lista = jogos.map((j, i) => `${i + 1}. ${j.titulo} (${jogadas[j.id]}x)`).join("\n");
            return { texto: `Seus mais jogados:\n${lista}` };
        },

        novidades() {
            const novos = GAMES.filter(j => j.novo);
            if (!novos.length) return { texto: "Sem novidades agora — fica de olho!" };
            const lista = novos.slice(0, 5).map(j => `• ${j.titulo}`).join("\n");
            return {
                texto: `Novidades no hub:\n${lista}`,
                chips: novos.slice(0, 3).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }))
            };
        },

        buscarPorNome(t) {
            const jogo = detectarJogoPorNome(t);
            if (jogo) {
                return {
                    texto: `Encontrei: **${jogo.titulo}**. ${jogo.descricao}`,
                    chips: [{ texto: "🎮 Abrir", acao: () => abrirJogo(jogo.id) }]
                };
            }
            const matches = GAMES.filter(j => normalizar(j.titulo).includes(t));
            if (matches.length) {
                return {
                    texto: `Encontrei ${matches.length} jogo(s):`,
                    chips: matches.slice(0, 5).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }))
                };
            }
            return { texto: `Não achei nenhum jogo com "${t}". Tente outro nome ou peça uma recomendação.` };
        },

        ajuda() {
            return {
                texto: "Posso te ajudar com:\n• Recomendar um jogo (por categoria ou aleatório)\n• Mostrar favoritos, recentes e mais jogados\n• Listar novidades\n• Abrir um jogo pelo nome\n• Navegar pelas seções",
                chips: [
                    { texto: "🎲 Recomende um jogo", acao: () => responder(acoes.recomendarAleatorio()) },
                    { texto: "❤️ Meus favoritos", acao: () => responder(acoes.listarFavoritos()) },
                    { texto: "✨ Novidades", acao: () => responder(acoes.novidades()) }
                ]
            };
        },

        sobre() {
            return {
                texto: "A OldNow Games é um hub de jogos grátis de navegador. Começou em 2025 na ETEC Pedro Ferreira Alves e hoje reúne dezenas de jogos — sem baixar nada.",
                chips: [{ texto: "Ver \"Quem somos\"", acao: () => irPara("quem-somos") }]
            };
        }
    };

    /* ---------- Integração com o hub ---------- */

    function abrirJogo(id) {
        fecharPainel();
        if (typeof abrirJogoPeloId === "function") abrirJogoPeloId(id);
    }

    function irPara(secaoId) {
        const el = document.getElementById(secaoId);
        if (el) {
            fecharPainel();
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* ---------- Motor de intenções ---------- */

    const INTENCOES = [
        {
            testar: t => /\b(oi|ola|eai|e ai|hey|bom dia|boa tarde|boa noite|tudo bem)\b/.test(t),
            responder: () => ({
                texto: aleatorio([
                    "Olá! 👋 Quer que eu te ajude a escolher um jogo?",
                    "Oi! Pronto pra jogar? Posso recomendar algo.",
                    "E aí! Me diz o que você curte ou pede uma recomendação."
                ]),
                chips: [
                    { texto: "🎲 Recomende um jogo", acao: () => responder(acoes.recomendarAleatorio()) },
                    { texto: "✨ Novidades", acao: () => responder(acoes.novidades()) }
                ]
            })
        },
        { testar: t => /\b(ajuda|help|o que voce faz|o que vc faz|comandos)\b/.test(t),
          responder: () => acoes.ajuda() },
        { testar: t => /\b(quem e voce|quem e vc|sobre o site|sobre a oldnow|o que e o hub)\b/.test(t),
          responder: () => acoes.sobre() },
        { testar: t => /\b(favoritos?|curtidos)\b/.test(t),
          responder: () => acoes.listarFavoritos() },
        { testar: t => /\b(recentes?|continuar|ultimo jogo|historico)\b/.test(t),
          responder: () => acoes.listarRecentes() },
        { testar: t => /\b(mais jogado|mais jogados|top jogos|ranking|estatistica|stats)\b/.test(t),
          responder: () => acoes.maisJogados() },
        { testar: t => /\b(novidade|novidades|novo|novos|lancamento|atualizacao)\b/.test(t),
          responder: () => acoes.novidades() },
        { testar: t => /\b(surpreenda|aleatorio|qualquer|nao sei|indeciso|sorteia|dado)\b/.test(t),
          responder: () => acoes.recomendarAleatorio() },
        { testar: t => !!detectarCategoria(t) && /\b(recomend|sugere|sugestao|indica|quero|jogo de|tipo)\b/.test(t),
          responder: t => acoes.recomendarPorCategoria(detectarCategoria(t)) },
        { testar: t => !!detectarCategoria(t),
          responder: t => acoes.recomendarPorCategoria(detectarCategoria(t)) },
        { testar: t => !!detectarJogoPorNome(t),
          responder: t => acoes.buscarPorNome(t) }
    ];

    function interpretar(texto) {
        const norm = normalizar(texto);
        for (const i of INTENCOES) {
            try { if (i.testar(norm)) return i.responder(norm); } catch (e) {}
        }
        return {
            texto: "Não entendi muito bem. Reformule ou escolha uma opção:",
            chips: [
                { texto: "🎲 Recomende um jogo", acao: () => responder(acoes.recomendarAleatorio()) },
                { texto: "❤️ Meus favoritos", acao: () => responder(acoes.listarFavoritos()) },
                { texto: "❓ Ajuda", acao: () => responder(acoes.ajuda()) }
            ]
        };
    }

    /* ---------- Interface ---------- */

    function addMensagem(texto, tipo) {
        const div = document.createElement("div");
        div.className = "bot-msg " + tipo;
        div.innerHTML = texto
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
        mensagens.appendChild(div);
        mensagens.scrollTop = mensagens.scrollHeight;
    }

    function addChips(chips) {
        if (!chips || !chips.length) return;
        const wrap = document.createElement("div");
        wrap.className = "bot-chips";
        chips.forEach(c => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "bot-chip";
            b.textContent = c.texto;
            b.addEventListener("click", () => {
                wrap.remove();
                addMensagem(c.texto, "user");
                setTimeout(() => c.acao(), 150);
            });
            wrap.appendChild(b);
        });
        mensagens.appendChild(wrap);
        mensagens.scrollTop = mensagens.scrollHeight;
    }

    function responder(resp) {
        if (typeof resp === "string") { addMensagem(resp, "bot"); return; }
        if (resp.texto) addMensagem(resp.texto, "bot");
        if (resp.chips) addChips(resp.chips);
    }

    function processar(texto) {
        addMensagem(texto, "user");
        setTimeout(() => responder(interpretar(texto)), 220);
    }

    /* ---------- Abrir / fechar ---------- */

    function abrirPainel() {
        painel.classList.remove("d-none");
        setTimeout(() => input.focus(), 60);
        setTimeout(() => {
            if (mensagens.children.length) return;
            responder({
                texto: "Oi! Sou o assistente da OldNow. Posso recomendar jogos, mostrar favoritos ou novidades. Como quer começar?",
                chips: [
                    { texto: "🎲 Recomende um jogo", acao: () => responder(acoes.recomendarAleatorio()) },
                    { texto: "✨ Novidades", acao: () => responder(acoes.novidades()) },
                    { texto: "❓ O que você faz?", acao: () => responder(acoes.ajuda()) }
                ]
            });
        }, 200);
    }

    function fecharPainel() { painel.classList.add("d-none"); }

    toggle.addEventListener("click", () => {
        painel.classList.contains("d-none") ? abrirPainel() : fecharPainel();
    });
    fechar.addEventListener("click", fecharPainel);

    form.addEventListener("submit", e => {
        e.preventDefault();
        const txt = input.value.trim();
        if (!txt) return;
        input.value = "";
        processar(txt);
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !painel.classList.contains("d-none")) fecharPainel();
    });
})();