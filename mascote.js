/* =========================================================
   OldNow Games — mascote.js
   O Old Bot (mascote) vive no botão do assistente:
   - fica "respirando" no canto da tela (animação em loop)
   - acena quando o chat abre e reage às respostas do assistente
     (animado ao recomendar, triste quando não acha, etc.)
   - com o chat fechado, faz um emote de vez em quando, com
     uma fala no balãozinho
   As animações são folhas de imagens (mascote/*.webp) geradas
   do modelo 3D do mascote, com fundo transparente. Cada folha só
   é baixada quando o emote é usado. Se algo falhar, o botão
   volta a mostrar a imagem antiga (img/oldbot.png).

   Respeita "reduzir movimento" do sistema.
   Carregar DEPOIS de bot.js. Expõe window.OldNowMascote.
   ========================================================= */
(function mascoteOldBot() {
    "use strict";

    const toggle = document.getElementById("botToggle");
    const painel = document.getElementById("botPainel");
    const mensagens = document.getElementById("botMensagens");
    if (!toggle || !painel || !mensagens) return;

    const DADOS = {"w": 192, "h": 230, "emotes": {"idle": {"frames": 48, "cols": 8, "fps": 12, "dur": 4.0}, "wave": {"frames": 70, "cols": 8, "fps": 20, "dur": 3.5, "say": ["Oi! Eu sou o Old Bot!", "E aí, jogador!"], "nome": "Acenar"}, "dance": {"frames": 94, "cols": 8, "fps": 20, "dur": 4.7, "say": ["♪ la la lá ♪", "Dança comigo!"], "nome": "Dançar"}, "look": {"frames": 78, "cols": 8, "fps": 20, "dur": 3.9, "say": ["Hmm... procurando a Antena.", "Quem tá aí?"], "nome": "Olhar"}, "stretch": {"frames": 66, "cols": 8, "fps": 20, "dur": 3.3, "say": ["Aaahh... zero bugs hoje."], "nome": "Espreguiçar"}, "spin": {"frames": 36, "cols": 8, "fps": 20, "dur": 1.8, "say": ["Wheee!"], "nome": "Girar"}, "cheer": {"frames": 70, "cols": 8, "fps": 20, "dur": 3.5, "say": ["Uhuuul!", "Foi moleza! (foi nada)"], "nome": "Comemorar"}, "excited": {"frames": 66, "cols": 8, "fps": 20, "dur": 3.3, "say": ["Eu voto no hambúrguer!", "Bora jogar!"], "nome": "Animado"}, "think": {"frames": 74, "cols": 8, "fps": 20, "dur": 3.7, "say": ["Será que o Núcleo tem Wi-Fi?", "Hmm... interessante."], "nome": "Pensar"}, "surprised": {"frames": 58, "cols": 8, "fps": 20, "dur": 2.9, "say": ["Opa! Isso é um bug?!"], "nome": "Surpresa"}, "shock": {"frames": 54, "cols": 8, "fps": 20, "dur": 2.7, "say": ["Meus parafusos!!"], "nome": "Susto"}, "point": {"frames": 58, "cols": 8, "fps": 20, "dur": 2.9, "say": ["A jogatina começa ali!", "Olha só!"], "nome": "Apontar"}, "determined": {"frames": 62, "cols": 8, "fps": 20, "dur": 3.1, "say": ["Old Bot em missão!", "Eu consigo!"], "nome": "Determinado"}, "sad": {"frames": 66, "cols": 8, "fps": 20, "dur": 3.3, "say": ["Caí de novo...", "Ai, meus parafusos!"], "nome": "Triste"}, "run": {"frames": 74, "cols": 8, "fps": 20, "dur": 3.7, "say": ["Correndo no lugar!"], "nome": "Correr"}, "jump": {"frames": 30, "cols": 8, "fps": 20, "dur": 1.5, "say": ["Hup!"], "nome": "Pular"}, "flip": {"frames": 33, "cols": 8, "fps": 20, "dur": 1.65, "say": ["Olha a cambalhota!", "Tcharam!"], "nome": "Cambalhota"}}};
    const DIR = "mascote/";
    const W = DADOS.w;
    const H = DADOS.h;
    const reduzMov = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.className = "bot-mascote";
    canvas.setAttribute("aria-hidden", "true");
    const c2d = canvas.getContext("2d");
    if (!c2d) return;

    const balao = document.createElement("div");
    balao.className = "bot-balao";
    balao.setAttribute("aria-hidden", "true");

    // quadro anterior (para a troca suave entre emotes)
    const snap = document.createElement("canvas");
    snap.width = W;
    snap.height = H;
    const sctx = snap.getContext("2d");

    /* ---------- Carregar as folhas (só quando precisa) ---------- */

    const cache = new Map();   // nome -> Promise<Image>
    const falhou = new Map();  // nome -> até quando não tentar de novo

    function carregar(nome) {
        if (cache.has(nome)) return cache.get(nome);
        if (falhou.has(nome) && Date.now() < falhou.get(nome)) return Promise.reject(new Error("indisponível"));
        const p = new Promise((ok, erro) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => ok(img);
            img.onerror = () => { cache.delete(nome); falhou.set(nome, Date.now() + 60000); erro(new Error("falha")); };
            img.src = DIR + nome + ".webp";
        });
        cache.set(nome, p);
        return p;
    }

    const espera = ms => new Promise((_, erro) => setTimeout(() => erro(new Error("demorou")), ms));

    /* ---------- Reprodução ---------- */

    const est = { nome: "idle", img: null, meta: null, inicio: 0, loop: true, prio: 0, fim: 0, ultimoIdx: -1 };
    let raf = 0;
    let fade = 0; // até quando dura a troca suave
    let pronto = false;

    function desenhar(img, meta, idx) {
        const col = idx % meta.cols;
        const lin = Math.floor(idx / meta.cols);
        c2d.clearRect(0, 0, W, H);
        c2d.drawImage(img, col * W, lin * H, W, H, 0, 0, W, H);
    }

    function comecar(nome, img, meta, prio, loop) {
        // guarda o último quadro para misturar com o novo (evita "pulo" entre poses)
        if (pronto && !reduzMov) {
            sctx.clearRect(0, 0, W, H);
            sctx.drawImage(canvas, 0, 0);
            fade = performance.now() + 160;
        }
        est.nome = nome;
        est.img = img;
        est.meta = meta;
        est.inicio = performance.now();
        est.loop = loop;
        est.prio = prio;
        est.fim = loop ? Infinity : est.inicio + meta.dur * 1000;
        est.ultimoIdx = -1;
        acordar();
    }

    function visivel() {
        return document.visibilityState === "visible" && toggle.getClientRects().length > 0;
    }

    function quadro(agora) {
        raf = 0;
        if (!visivel()) return; // parado: volta quando ficar visível (acordar)
        const meta = est.meta;
        if (!meta || !est.img) return;
        const dt = (agora - est.inicio) / 1000;
        let idx = Math.floor(dt * meta.fps);
        if (est.loop) idx %= meta.frames;
        else if (idx >= meta.frames) { voltarIdle(); return; }

        const emFade = agora < fade;
        if (idx !== est.ultimoIdx || emFade) {
            est.ultimoIdx = idx;
            desenhar(est.img, meta, idx);
            if (emFade) {
                const p = 1 - (fade - agora) / 160; // 0 -> 1
                c2d.globalAlpha = 1 - p;
                c2d.drawImage(snap, 0, 0);
                c2d.globalAlpha = 1;
            }
        }
        raf = requestAnimationFrame(quadro);
    }

    function acordar() {
        if (reduzMov) { desenharEstatico(); return; }
        if (!raf && visivel()) raf = requestAnimationFrame(quadro);
    }

    function desenharEstatico() {
        if (!est.img || !est.meta) return;
        desenhar(est.img, est.meta, est.nome === "idle" ? 0 : Math.floor(est.meta.frames * 0.35));
    }

    let timerEstatico = 0;
    function voltarIdle() {
        const meta = DADOS.emotes.idle;
        carregar("idle").then(img => {
            est.nome = "idle"; est.img = img; est.meta = meta; est.inicio = performance.now();
            est.loop = true; est.prio = 0; est.fim = 0; est.ultimoIdx = -1;
            fade = reduzMov ? 0 : performance.now() + 160;
            if (!reduzMov) { sctx.clearRect(0, 0, W, H); sctx.drawImage(canvas, 0, 0); }
            acordar();
        }).catch(() => {});
    }

    let seq = 0;

    // prio: 1 = ambiente, 2 = reação / abrir o chat, 3 = apresentação
    async function tocar(nome, op) {
        op = op || {};
        const prio = op.prio || 2;
        const meta = DADOS.emotes[nome];
        if (!pronto || !meta || nome === "idle") return false;
        if (est.nome !== "idle" && performance.now() < est.fim && prio < est.prio) return false;

        const meu = ++seq;
        let img;
        try { img = await Promise.race([carregar(nome), espera(op.espera || 1600)]); } catch (e) { return false; }
        if (meu !== seq) return false;
        if (est.nome !== "idle" && performance.now() < est.fim && prio < est.prio) return false;

        if (reduzMov) {
            // sem movimento: mostra uma pose por um instante e volta
            comecar(nome, img, meta, prio, false);
            desenharEstatico();
            clearTimeout(timerEstatico);
            timerEstatico = setTimeout(voltarIdle, 1400);
        } else {
            comecar(nome, img, meta, prio, false);
        }
        if (op.fala) falar(op.fala === true ? sortear(meta.say) : op.fala, op.falaMs);
        return true;
    }

    function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

    /* ---------- Balãozinho ---------- */

    let timerBalao = 0;
    function falar(texto, ms) {
        if (!texto) return;
        balao.textContent = texto;
        balao.classList.add("visivel");
        clearTimeout(timerBalao);
        timerBalao = setTimeout(() => balao.classList.remove("visivel"), ms || 3600);
    }
    function calar() {
        clearTimeout(timerBalao);
        balao.classList.remove("visivel");
    }

    const painelAberto = () => !painel.classList.contains("d-none");

    /* ---------- Reações às conversas do assistente ---------- */

    function norm(t) {
        return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    // devolve o emote que combina com o que o assistente disse (ou null)
    function emoteDaResposta(texto, temCard) {
        const t = norm(texto);
        if (/\b[123]\/3\s*[—-]/.test(texto || "")) return "think";                                       // perguntas do quiz
        if (/\bops\b|me atrapalhei|deu erro|nao deu certo/.test(t)) return "shock";
        if (/nao (achei|encontrei|tenho nada|achei nada)|nada por aqui|nao existe/.test(t)) return "sad";
        if (/nao entendi|nao sei (bem )?o que|pode reformular/.test(t)) return "think";
        if (/ainda nao esta disponivel|nao esta disponivel|nao consegui/.test(t)) return "sad";
        if (/desafio aceito|desafio de hoje|me desafia/.test(t)) return "determined";
        if (/conquista|medalha|parabens/.test(t)) return "cheer";
        if (/de nada|fico feliz|que bom que|disponha/.test(t)) return "cheer";
        if (/\b(abrindo|abri o|abri a|abri as)\b/.test(t)) return "point";
        if (/pronto!|coloquei|criei|guardei|tirei|deixei|favoritei|salvei|removi|sorteei/.test(t)) return "excited";
        if (/(^|\s)(oi|ola|e ai)\b|sou o old bot/.test(t)) return "wave";
        if (temCard) return "excited";
        return null;
    }

    let ultimaReacao = 0;
    function reagirAoChat(texto, temCard) {
        const emote = emoteDaResposta(texto, temCard);
        if (!emote) return;
        // logo depois de abrir o chat o "aceno" já está tocando: não atropela
        if (emote === "wave" && performance.now() - ultimaReacao < 3500) return;
        ultimaReacao = performance.now();
        tocar(emote, { prio: 2 });
    }

    new MutationObserver(muts => {
        let texto = null;
        let card = false;
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (!(n instanceof HTMLElement)) return;
            if (n.classList.contains("bot-card")) card = true;
            else if (n.classList.contains("bot-msg") && n.classList.contains("bot") && !n.classList.contains("bot-digitando")) texto = n.textContent;
        }));
        if (texto !== null || card) reagirAoChat(texto || "", card);
    }).observe(mensagens, { childList: true });

    // abrir o chat: acena
    let estavaAberto = painelAberto();
    new MutationObserver(() => {
        const aberto = painelAberto();
        if (aberto === estavaAberto) return;
        estavaAberto = aberto;
        if (aberto) {
            calar();
            ultimaReacao = performance.now();
            tocar("wave", { prio: 2 });
        }
    }).observe(painel, { attributes: true, attributeFilter: ["class"] });

    /* ---------- Vida própria (com o chat fechado) ---------- */

    const AMBIENTE = ["look", "stretch", "think", "dance", "spin", "point", "jump", "flip", "wave", "determined", "excited"];

    function podeAparecer() {
        const h = document.documentElement.classList;
        return visivel() && !painelAberto() && !reduzMov
            && !h.contains("camada-aberta") && !h.contains("extra-aberta") && !h.contains("area-aberta")
            && !document.querySelector(".modal.show")
            && !(document.getElementById("playerOverlay") && !document.getElementById("playerOverlay").classList.contains("d-none"))
            && !document.getElementById("telaInicial")
            && !document.body.classList.contains("entrada-aberta");
    }

    function proximoMomento() {
        setTimeout(() => {
            if (podeAparecer()) {
                const nome = sortear(AMBIENTE);
                tocar(nome, { prio: 1, fala: Math.random() < 0.45 });
            }
            proximoMomento();
        }, 45000 + Math.random() * 45000);
    }

    // primeira visita da sessão: se apresenta
    function apresentar() {
        let jaFoi = false;
        try { jaFoi = sessionStorage.getItem("oldnow_mascote_oi") === "1"; } catch (e) { /* ignora */ }
        if (jaFoi) return;
        let tentativas = 0;
        const espia = setInterval(() => {
            tentativas++;
            if (podeAparecer()) {
                clearInterval(espia);
                try { sessionStorage.setItem("oldnow_mascote_oi", "1"); } catch (e) { /* ignora */ }
                tocar("wave", { prio: 3, fala: "Oi! Eu sou o Old Bot! Toca em mim se precisar de ajuda.", falaMs: 5200 });
            } else if (tentativas > 120) clearInterval(espia);
        }, 1000);
    }

    /* ---------- Baixar o resto aos poucos (só em conexão boa) ---------- */

    function preaquecer() {
        const con = navigator.connection || {};
        if (con.saveData || (con.effectiveType && con.effectiveType !== "4g")) return;
        const fila = ["wave", "excited", "think", "sad", "cheer", "point", "shock", "determined"];
        let i = 0;
        const proximo = () => {
            if (i >= fila.length) return;
            const nome = fila[i++];
            carregar(nome).catch(() => {}).then(() => setTimeout(proximo, 2500));
        };
        const iniciar = () => setTimeout(proximo, 3000);
        if ("requestIdleCallback" in window) requestIdleCallback(iniciar, { timeout: 8000 }); else iniciar();
    }

    /* ---------- Início ---------- */

    document.addEventListener("visibilitychange", acordar);
    new MutationObserver(acordar).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    toggle.appendChild(canvas);
    toggle.appendChild(balao);

    carregar("idle").then(img => {
        est.img = img;
        est.meta = DADOS.emotes.idle;
        est.inicio = performance.now();
        pronto = true;
        desenhar(img, est.meta, 0);
        toggle.classList.add("com-mascote");
        document.documentElement.classList.add("mascote-ativo");
        acordar();
        apresentar();
        proximoMomento();
        preaquecer();
    }).catch(() => {
        // sem as imagens: o botão antigo continua como estava
        canvas.remove();
        balao.remove();
    });

    /* ---------- Para o resto do hub usar ---------- */

    const REACOES = {
        ola: "wave", conquista: "cheer", desafio: "flip", sequencia: "run", favorito: "excited",
        erro: "shock", vazio: "sad", surpresa: "spin", pausa: "stretch", pensar: "think",
        apontar: "point", animo: "determined", danca: "dance", pular: "jump"
    };

    window.OldNowMascote = {
        tocar: (nome, op) => tocar(nome, op),
        reagir: (tipo, fala) => tocar(REACOES[tipo] || tipo, { prio: 2, fala: fala || false }),
        falar: falar,
        calar: calar,
        emotes: () => Object.keys(DADOS.emotes).filter(n => n !== "idle"),
        estado: () => est.nome
    };
})();