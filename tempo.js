/* =========================================================
   OldNow Games — tempo.js
   Mostra o tempo jogado em cada jogo.

   Como conta:
   - começa quando o player interno abre um jogo e para quando ele fecha
   - só conta com a aba visível (aba em segundo plano não soma)
   - soma a cada 5 s e salva junto com os outros dados da sessão
     (sem sessão = some ao fechar a página, igual favoritos e notas)

   Onde aparece:
   - etiqueta "⏱ 1h 20min" na capa do jogo
   - linha "Tempo jogado" no modal do jogo
   - o bot responde "quanto tempo joguei?"

   Carregar DEPOIS do script.js. Não precisa mexer no script.js.
   ========================================================= */
(function tempoJogado() {
    "use strict";

    if (typeof GAMES === "undefined" || typeof lerJSON !== "function"
        || typeof salvarJSON !== "function" || typeof LS_KEYS === "undefined") return;

    LS_KEYS.tempo = "oldnow_tempo";

    const TICK_MS = 5000;                       // de quanto em quanto tempo soma e salva
    const MAX_SALTO_MS = 15000;                 // se o PC dormir/travar, não soma mais que isso por vez
    const MAX_ABERTURA_MS = 3 * 60 * 60 * 1000; // player esquecido aberto: para de contar após 3 h
    const MIN_MOSTRAR_MS = 10000;               // abriu e fechou na hora? não aparece nada

    /* ---------- Dados ---------- */

    function getTempos() { return lerJSON(LS_KEYS.tempo, {}); }
    function tempoDe(id) { return getTempos()[id] || 0; }
    function tempoTotal() {
        return Object.values(getTempos()).reduce((a, b) => a + (Number(b) || 0), 0);
    }

    // 0 -> "" | 30 s -> "menos de 1 min" | 45 min -> "45 min" | 80 min -> "1h 20min" | 2 h -> "2h"
    function formatarTempo(ms) {
        if (!ms || ms < MIN_MOSTRAR_MS) return "";
        const min = Math.floor(ms / 60000);
        if (min < 1) return "menos de 1 min";
        if (min < 60) return min + " min";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m ? `${h}h ${m}min` : `${h}h`;
    }

    window.getTempos = getTempos;
    window.tempoDe = tempoDe;
    window.tempoTotal = tempoTotal;
    window.formatarTempo = formatarTempo;

    /* ---------- Contagem ---------- */

    const contagem = { id: null, ultimo: 0, aberturaMs: 0, timer: null };

    function somar(forcar) {
        if (!contagem.id) return;
        const agora = Date.now();
        const visivel = document.visibilityState === "visible";
        if ((visivel || forcar) && contagem.aberturaMs < MAX_ABERTURA_MS) {
            const delta = Math.min(agora - contagem.ultimo, MAX_SALTO_MS);
            if (delta > 0) {
                contagem.aberturaMs += delta;
                const tempos = getTempos();
                tempos[contagem.id] = (tempos[contagem.id] || 0) + delta;
                salvarJSON(LS_KEYS.tempo, tempos);
            }
        }
        contagem.ultimo = agora;
    }

    function iniciar(id) {
        parar();
        contagem.id = id;
        contagem.ultimo = Date.now();
        contagem.aberturaMs = 0;
        contagem.timer = setInterval(() => somar(false), TICK_MS);
    }

    function parar() {
        if (!contagem.id) return;
        somar(false);
        clearInterval(contagem.timer);
        contagem.timer = null;
        contagem.id = null;
        atualizarBadges();
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") somar(true);     // fecha o trecho que estava visível
        else if (contagem.id) contagem.ultimo = Date.now();         // voltou: recomeça sem somar o tempo escondido
    });
    window.addEventListener("pagehide", () => somar(true));

    /* ---------- Descobre quando o player abre/fecha (funciona com qualquer botão) ---------- */

    const overlay = document.getElementById("playerOverlay");
    const iframe = document.getElementById("playerIframe");

    function jogoDoPlayer() {
        if (!iframe) return null;
        const src = iframe.getAttribute("src") || "";
        if (!src) return null;
        return GAMES.find(j => j.link && j.link !== "#" && (src === j.link || iframe.src === j.link || src.indexOf(j.link) === 0)) || null;
    }

    function sincronizarPlayer() {
        if (!overlay) return;
        const aberto = !overlay.classList.contains("d-none");
        if (aberto) {
            const jogo = jogoDoPlayer();
            if (jogo && contagem.id !== jogo.id) iniciar(jogo.id);
        } else {
            parar();
        }
    }

    if (overlay) {
        new MutationObserver(sincronizarPlayer).observe(overlay, { attributes: true, attributeFilter: ["class"] });
        sincronizarPlayer();
    }

    /* ---------- Etiqueta na capa ---------- */

    function atualizarBadges() {
        const tempos = getTempos();
        document.querySelectorAll(".bloco[data-id]").forEach(card => {
            const txt = formatarTempo(tempos[card.dataset.id] || 0);
            let badge = card.querySelector(".badge-tempo");
            if (!txt) { if (badge) badge.remove(); return; }
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "badge-tempo";
                badge.title = "Tempo jogado";
                card.appendChild(badge);
            }
            badge.textContent = "⏱ " + txt;
        });
    }

    // cards criados depois (favoritar, trocar de sessão...) já nascem com a etiqueta
    if (typeof window.criarCardHTML === "function") {
        const criarOriginal = window.criarCardHTML;
        window.criarCardHTML = function (jogo) {
            const html = criarOriginal.apply(this, arguments);
            const txt = formatarTempo(tempoDe(jogo.id));
            if (!txt) return html;
            const badge = `<span class="badge-tempo" title="Tempo jogado">⏱ ${txt}</span>`;
            return html.replace('<div class="bloco-img-wrap">', badge + '<div class="bloco-img-wrap">');
        };
    }

    /* ---------- Linha no modal ---------- */

    const estrelas = document.getElementById("modalEstrelas");
    let linhaModal = document.getElementById("modalTempo");
    if (estrelas && !linhaModal) {
        linhaModal = document.createElement("p");
        linhaModal.id = "modalTempo";
        linhaModal.className = "modal-tempo d-none";
        estrelas.insertAdjacentElement("afterend", linhaModal);
    }

    function atualizarModal() {
        if (!linhaModal) return;
        const modal = document.getElementById("modalJogo");
        const id = modal && modal.dataset.jogoAtual;
        const txt = id ? formatarTempo(tempoDe(id)) : "";
        linhaModal.textContent = txt ? "⏱ Tempo jogado: " + txt : "";
        linhaModal.classList.toggle("d-none", !txt);
    }

    const modalJogo = document.getElementById("modalJogo");
    if (modalJogo) modalJogo.addEventListener("show.bs.modal", () => setTimeout(atualizarModal, 0));

    /* ---------- Estilos ---------- */

    const estilo = document.createElement("style");
    estilo.id = "tempo-estilos";
    estilo.textContent =
        ".badge-tempo{position:absolute;left:8px;bottom:8px;z-index:3;pointer-events:none;" +
        "background:rgba(0,0,0,.72);color:#fff;font-size:.68rem;padding:3px 9px;border-radius:20px;" +
        "-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}" +
        ".modal-tempo{text-align:center;color:#9aa4b2;font-size:.85rem;margin:2px 0 10px}";
    document.head.appendChild(estilo);

    atualizarBadges();

    // para testes e manutenção
    window.OldNowTempo = { iniciar, parar, somar, atualizarBadges, tempoTotal };
})();