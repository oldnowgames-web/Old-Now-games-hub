/* =========================================================
   OldNow Games — pwa.js
   - registra o service worker (sw.js)
   - avisa quando existe versão nova ("Nova versão disponível")
   - botão "📲 Instalar app" (só aparece quando dá pra instalar)
   ========================================================= */

(function pwa() {
    /* ---------- Aviso (toast) reaproveitado nas mensagens do app ---------- */

    function criarAviso(id, texto, botoes) {
        const antigo = document.getElementById(id);
        if (antigo) antigo.remove();

        const aviso = document.createElement("div");
        aviso.id = id;
        aviso.className = "aviso-app";
        aviso.setAttribute("role", "status");

        const span = document.createElement("span");
        span.textContent = texto;
        aviso.appendChild(span);

        botoes.forEach(b => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = b.classe;
            btn.textContent = b.texto;
            if (b.aria) btn.setAttribute("aria-label", b.aria);
            btn.addEventListener("click", () => b.acao(aviso));
            aviso.appendChild(btn);
        });

        document.body.appendChild(aviso);
        return aviso;
    }

    /* ---------- Service worker + aviso de atualização ---------- */

    if ("serviceWorker" in navigator) {
        // só recarrega por troca de versão se já havia um SW controlando (não na 1ª instalação)
        const jaTinhaController = !!navigator.serviceWorker.controller;
        let recarregando = false;

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!jaTinhaController || recarregando) return;
            recarregando = true;
            location.reload();
        });

        function avisarNovaVersao(reg) {
            criarAviso("avisoAtualizacao", "Nova versão disponível", [
                {
                    classe: "aviso-app-btn",
                    texto: "Atualizar",
                    acao: () => {
                        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
                        else location.reload();
                    }
                },
                {
                    classe: "aviso-app-fechar",
                    texto: "✕",
                    aria: "Dispensar",
                    acao: aviso => aviso.remove()
                }
            ]);
        }

        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js").then(reg => {
                if (reg.waiting && navigator.serviceWorker.controller) avisarNovaVersao(reg);

                reg.addEventListener("updatefound", () => {
                    const novo = reg.installing;
                    if (!novo) return;
                    novo.addEventListener("statechange", () => {
                        if (novo.state === "installed" && navigator.serviceWorker.controller) {
                            avisarNovaVersao(reg);
                        }
                    });
                });

                // confere se há versão nova sempre que o app volta pro primeiro plano
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState === "visible") reg.update().catch(() => {});
                });
            }).catch(() => {
                // sem HTTPS / navegador sem suporte: o site segue funcionando normalmente
            });
        });
    }

    /* ---------- Botão "Instalar app" ---------- */

    const itensInstalar = document.querySelectorAll("[data-instalar-app]");
    if (!itensInstalar.length) return;

    const jaInstalado = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true;
    const ehIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    let eventoInstalacao = null;

    function mostrarItens(mostrar) {
        itensInstalar.forEach(el => el.classList.toggle("d-none", !mostrar));
    }

    if (!jaInstalado) {
        // Android / Chrome / Edge: o navegador avisa quando o app é instalável
        window.addEventListener("beforeinstallprompt", e => {
            e.preventDefault();
            eventoInstalacao = e;
            mostrarItens(true);
        });
        // iPhone / iPad: não existe aviso automático, mostra o botão com a dica
        if (ehIOS) mostrarItens(true);
    }

    window.addEventListener("appinstalled", () => {
        eventoInstalacao = null;
        mostrarItens(false);
    });

    itensInstalar.forEach(item => {
        const link = item.querySelector("a") || item;
        link.addEventListener("click", async e => {
            e.preventDefault();

            // fecha o menu lateral do celular, se estiver aberto
            const menu = document.getElementById("menuMobileDireita");
            if (menu && window.bootstrap) {
                const instancia = bootstrap.Offcanvas.getInstance(menu);
                if (instancia) instancia.hide();
            }

            if (eventoInstalacao) {
                eventoInstalacao.prompt();
                try { await eventoInstalacao.userChoice; } catch (err) { /* ignora */ }
                eventoInstalacao = null;
                mostrarItens(false);
            } else if (ehIOS) {
                const aviso = criarAviso(
                    "avisoInstalarIOS",
                    "Para instalar: toque em Compartilhar e depois em “Adicionar à Tela de Início”.",
                    [{ classe: "aviso-app-fechar", texto: "✕", aria: "Fechar", acao: a => a.remove() }]
                );
                setTimeout(() => aviso.remove(), 9000);
            }
        });
    });
})();