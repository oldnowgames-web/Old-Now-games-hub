/* =========================================================
   OldNow Games — social.js
   Abre/fecha a janelinha do Instagram (imagem + link embaixo).
   Qualquer elemento com [data-social-abrir] abre a janelinha.
   ========================================================= */
(function redesSociais() {
    "use strict";

    const overlay = document.getElementById("socialOverlay");
    if (!overlay) return;

    const fechar = document.getElementById("socialFechar");
    const imagem = document.getElementById("socialImagem");
    const semImagem = document.getElementById("socialSemImagem");
    let ultimoGatilho = null;

    // Se a imagem não existir ainda (ou falhar), mostra um aviso no lugar
    if (imagem) {
        imagem.addEventListener("error", () => {
            imagem.hidden = true;
            if (semImagem) semImagem.hidden = false;
        });
        imagem.addEventListener("load", () => {
            imagem.hidden = false;
            if (semImagem) semImagem.hidden = true;
        });
    }

    function abrir(gatilho) {
        ultimoGatilho = gatilho || null;

        // fecha o menu lateral do celular, se estiver aberto
        const menu = document.getElementById("menuMobileDireita");
        if (menu && window.bootstrap) {
            const inst = bootstrap.Offcanvas.getInstance(menu);
            if (inst) inst.hide();
        }

        overlay.hidden = false;
        document.documentElement.classList.add("social-aberto");
        setTimeout(() => fechar && fechar.focus(), 50);
    }

    function fecharJanela() {
        overlay.hidden = true;
        document.documentElement.classList.remove("social-aberto");
        if (ultimoGatilho && ultimoGatilho.focus) ultimoGatilho.focus();
    }

    document.querySelectorAll("[data-social-abrir]").forEach(el => {
        el.addEventListener("click", e => {
            e.preventDefault();
            abrir(el);
        });
    });

    fechar.addEventListener("click", fecharJanela);

    // clicar fora da caixa fecha
    overlay.addEventListener("click", e => {
        if (e.target === overlay) fecharJanela();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !overlay.hidden) fecharJanela();
    });
})();