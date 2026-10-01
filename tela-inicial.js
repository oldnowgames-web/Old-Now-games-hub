/* ---------- Tela de Abertura (intro): o gif toca normalmente por metade
   do tempo total (padrão: 3s) e, na outra metade (3s), a rodinha de
   carregamento aparece por cima enquanto o gif segue rodando.
   Ao fim do tempo total a tela some com fade. ---------- */
(function telaDeAbertura() {
    const tela = document.getElementById("telaInicial");
    if (!tela) return;

    const spinner = document.getElementById("telaInicialSpinner");

    // Tempo total da intro (data-duracao-gif no HTML). Metade só gif, metade com rodinha.
    const DURACAO_TOTAL_MS = parseInt(tela.dataset.duracaoGif, 10) || 6000;
    const METADE_MS = DURACAO_TOTAL_MS / 2;
    const FADE_MS = 600;

    document.body.style.overflow = "hidden";

    // 1ª metade: só o gif. Na 2ª metade: aparece a rodinha.
    setTimeout(() => {
        if (spinner) spinner.classList.add("visivel");
    }, METADE_MS);

    // Fim: esmaece a tela
    setTimeout(() => {
        tela.classList.add("escondida");
    }, DURACAO_TOTAL_MS);

    // Remove do DOM depois do fade
    setTimeout(() => {
        tela.remove();
        document.body.style.overflow = "";
    }, DURACAO_TOTAL_MS + FADE_MS + 100);
})();