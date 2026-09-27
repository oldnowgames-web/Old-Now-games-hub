/* ---------- Tela de Abertura (intro): deixa o navegador tocar o gif
   normalmente (leve, nativo) e, no momento certo, troca pra uma imagem
   estática real do último frame (img/inicio.png) — sem canvas, sem
   decodificação manual de frames, sem limitações de captura de gif
   animado via drawImage (que sempre pega o 1º frame em vários navegadores).
   Depois disso mostra a rodinha e some. ---------- */
(function telaDeAbertura() {
    const tela = document.getElementById("telaInicial");
    if (!tela) return;

    const imgGif = document.getElementById("telaInicialGif");
    const imgFrameFinal = document.getElementById("telaInicialFrameFinal");
    const spinner = document.getElementById("telaInicialSpinner");

    const DURACAO_GIF_MS = parseInt(tela.dataset.duracaoGif, 10) || 6000;
    const PAUSA_APOS_GIF_MS = 2000;
    const RODINHA_VISIVEL_MS = 1500;
    const FADE_MS = 600;

    document.body.style.overflow = "hidden";

    function trocarParaFrameFinal() {
        if (!imgGif || !imgFrameFinal) return;
        imgFrameFinal.classList.add("ativo");
        imgGif.classList.remove("ativo");
    }

    setTimeout(() => {
        trocarParaFrameFinal();

        setTimeout(() => {
            if (spinner) spinner.classList.add("visivel");
        }, PAUSA_APOS_GIF_MS);

        setTimeout(() => {
            tela.classList.add("escondida");
        }, PAUSA_APOS_GIF_MS + RODINHA_VISIVEL_MS);

        setTimeout(() => {
            tela.remove();
            document.body.style.overflow = "";
        }, PAUSA_APOS_GIF_MS + RODINHA_VISIVEL_MS + FADE_MS + 100);
    }, DURACAO_GIF_MS);
})();