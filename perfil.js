/* =========================================================
   OldNow Games — perfil.js
   - Tela de Perfil: avatar, tempo total, jogo mais jogado,
     categoria favorita, sequência (streak) e conquistas
   - Conquistas (selos) com barra de progresso
   - Desafio do dia: faixa no hub + selo na capa do jogo sorteado
   - Cartão de resultados (imagem em canvas) para baixar/compartilhar

   Tudo calculado com o que o hub já guarda (dados.js).
   Carregar DEPOIS de dados.js. Expõe window.OldNowPerfil.
   ========================================================= */
(function perfilDoJogador() {
    "use strict";

    const D = window.OldNowDados;
    if (!D || typeof GAMES === "undefined") return;

    const { el, icone, jogoPorId, fmtTempo, toast, dialogo } = D;
    const $ = id => document.getElementById(id);

    /* ---------- Tela ---------- */

    let secaoPendente = null;
    const tela = D.criarTela("perfil", "Perfil", {
        aoAbrir: () => {
            desenhar();
            if (secaoPendente) { const s = secaoPendente; secaoPendente = null; setTimeout(() => irPara(s), 80); }
        }
    });

    function irPara(secao) {
        const alvo = tela.corpo.querySelector("#perfil-" + secao);
        if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function nomeJogador() {
        return (window.OldNowSessao && window.OldNowSessao.nome && window.OldNowSessao.nome()) || null;
    }

    // avatar do hub (cor e inicial escolhidas na entrada)
    function dadosAvatar() {
        const av = $("sessaoAvatar");
        const nome = nomeJogador();
        if (av && !av.classList.contains("d-none") && nome) {
            return { letra: (av.textContent || nome[0] || "?").trim().slice(0, 2), cor: getComputedStyle(av).backgroundColor || "#2a7f9e" };
        }
        return { letra: "", cor: "#3a3f4a" };
    }

    function criarAvatar(grande) {
        const a = dadosAvatar();
        const e = el("span", "perfil-avatar" + (grande ? " grande" : ""));
        e.style.backgroundColor = a.cor;
        if (a.letra) e.textContent = a.letra; else e.innerHTML = icone("usuario", "icone-x");
        return e;
    }

    function statCard(rotulo, valor, sub, classe) {
        const c = el("div", "perfil-stat" + (classe ? " " + classe : ""));
        c.appendChild(el("span", "perfil-stat-valor", valor));
        c.appendChild(el("span", "perfil-stat-rotulo", rotulo));
        if (sub) c.appendChild(el("span", "perfil-stat-sub", sub));
        return c;
    }

    function desenhar() {
        const rolagem0 = tela.corpo.querySelector(".area-rolagem");
        const rolagemTopo = rolagem0 ? rolagem0.scrollTop : 0;

        const s = D.stats();
        const estado = D.conquistas();
        const nome = nomeJogador();

        tela.corpo.innerHTML = "";
        const rolagem = el("div", "area-rolagem perfil-rolagem");
        const pagina = el("div", "perfil-pagina");

        /* Cabeçalho */
        const topo = el("section", "perfil-topo");
        topo.appendChild(criarAvatar(true));
        const quem = el("div", "perfil-quem");
        quem.appendChild(el("h2", "", nome || "Jogador"));
        quem.appendChild(el("p", "", nome ? "Sessão salva neste aparelho" : "Sem sessão: seus dados somem ao fechar a página"));
        topo.appendChild(quem);

        const acoes = el("div", "perfil-acoes");
        const bCartao = el("button", "area-btn area-btn-principal");
        bCartao.type = "button";
        bCartao.innerHTML = icone("compartilhar", "icone-x") + "<span>Meu cartão</span>";
        bCartao.addEventListener("click", abrirCartao);
        acoes.appendChild(bCartao);
        const bSessao = el("button", "area-btn");
        bSessao.type = "button";
        bSessao.innerHTML = icone("usuario", "icone-x") + "<span>" + (nome ? "Trocar sessão" : "Iniciar sessão") + "</span>";
        bSessao.addEventListener("click", () => {
            if (window.OldNowSessao && window.OldNowSessao.abrirEntrada) window.OldNowSessao.abrirEntrada({ podeFechar: true });
        });
        acoes.appendChild(bSessao);
        topo.appendChild(acoes);
        pagina.appendChild(topo);

        /* Estatísticas */
        const grade = el("section", "perfil-stats");
        grade.id = "perfil-estatisticas";
        grade.appendChild(statCard("Tempo total", fmtTempo(s.totalMs), null, "destaque"));
        grade.appendChild(statCard("Jogos diferentes", String(s.distintos), "de " + D.jogaveis().length));
        grade.appendChild(statCard("Partidas", String(s.partidas)));
        grade.appendChild(statCard("Sequência", s.streak.atual + (s.streak.atual === 1 ? " dia" : " dias"), "melhor: " + s.streak.melhor));
        grade.appendChild(statCard("Favoritos", String(s.favoritos)));
        grade.appendChild(statCard("Avaliações", String(s.avaliacoes)));
        grade.appendChild(statCard("Conquistas", estado.filter(e => e.desbloqueada).length + "/" + estado.length));

        const cat = statCard("Categoria favorita", s.categoriaFavorita ? s.categoriaFavorita.titulo : "—",
            s.categoriaFavorita ? s.categoriaFavorita.vezes + " partidas" : "Jogue para descobrir", "larga");
        grade.appendChild(cat);

        const mj = s.maisJogado && jogoPorId(s.maisJogado.id);
        const cardMj = el("div", "perfil-stat larga com-capa");
        if (mj) {
            const img = document.createElement("img");
            img.src = mj.capa;
            img.alt = "";
            img.addEventListener("error", () => { img.style.visibility = "hidden"; });
            cardMj.appendChild(img);
        }
        const txt = el("div", "perfil-stat-texto");
        txt.appendChild(el("span", "perfil-stat-valor pequeno", mj ? mj.titulo : "—"));
        txt.appendChild(el("span", "perfil-stat-rotulo", "Jogo mais jogado"));
        txt.appendChild(el("span", "perfil-stat-sub", mj ? s.maisJogado.vezes + (s.maisJogado.vezes === 1 ? " partida" : " partidas") + (s.maisJogado.ms ? " · " + fmtTempo(s.maisJogado.ms) : "") : "Ainda sem partidas"));
        cardMj.appendChild(txt);
        if (mj) { cardMj.classList.add("clicavel"); cardMj.addEventListener("click", () => abrirJogoPeloId(mj.id)); }
        grade.appendChild(cardMj);
        pagina.appendChild(grade);

        /* Desafio do dia */
        pagina.appendChild(blocoDesafio());

        /* Conquistas */
        const feitas = estado.filter(e => e.desbloqueada);
        const sec = el("section", "perfil-conquistas");
        sec.id = "perfil-conquistas";
        const cab = el("div", "perfil-conq-cab");
        cab.appendChild(el("h3", "", "Conquistas"));
        cab.appendChild(el("span", "", feitas.length + " de " + estado.length));
        sec.appendChild(cab);
        const barra = el("div", "perfil-barra-geral");
        const preen = el("i");
        preen.style.width = Math.round((feitas.length / estado.length) * 100) + "%";
        barra.appendChild(preen);
        sec.appendChild(barra);

        const ordem = estado.slice().sort((a, b) => {
            if (a.desbloqueada !== b.desbloqueada) return a.desbloqueada ? -1 : 1;
            if (a.desbloqueada) return (b.quando || 0) - (a.quando || 0);
            return b.progresso - a.progresso;
        });
        const gradeC = el("div", "conq-grade");
        ordem.forEach(e => gradeC.appendChild(cartaoConquista(e)));
        sec.appendChild(gradeC);
        pagina.appendChild(sec);
        pagina.appendChild(blocoVersao());

        rolagem.appendChild(pagina);
        tela.corpo.appendChild(rolagem);
        rolagem.scrollTop = rolagemTopo;
    }


    /* ---------- Versão do hub e "Verificar atualização" ---------- */

    async function versaoGuardada() {
        try {
            const nomes = await caches.keys();
            const n = nomes.map(k => /^oldnow-shell-(v\d+)$/.exec(k)).filter(Boolean).map(m => m[1]).sort().pop();
            return n || null;
        } catch (e) { return null; }
    }

    // Apaga só os arquivos guardados do hub (os seus dados — favoritos, notas, coleções — ficam) e recarrega
    async function atualizarAgora(botao) {
        botao.disabled = true;
        botao.textContent = "Atualizando…";
        try {
            if ("serviceWorker" in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.update().catch(() => {})));
                regs.forEach(r => { if (r.waiting) r.waiting.postMessage({ type: "SKIP_WAITING" }); });
            }
        } catch (e) { /* segue */ }
        try {
            const nomes = await caches.keys();
            await Promise.all(nomes.filter(k => k.indexOf("oldnow-") === 0).map(k => caches.delete(k)));
        } catch (e) { /* segue */ }
        setTimeout(() => location.reload(), 300);
    }

    function blocoVersao() {
        const sec = el("section", "perfil-versao");
        const txt = el("span", "perfil-versao-txt", "Versão do hub: …");
        const b = el("button", "area-btn", "Verificar atualização");
        b.type = "button";
        b.addEventListener("click", () => atualizarAgora(b));
        sec.appendChild(txt);
        sec.appendChild(b);
        versaoGuardada().then(v => { txt.textContent = v ? "Versão do hub: " + v : "Versão do hub: sem cache neste navegador"; });
        return sec;
    }

    function cartaoConquista(e) {
        const c = el("div", "conq-card" + (e.desbloqueada ? " feita" : " bloqueada"));
        const medalha = el("span", "conq-medalha");
        medalha.innerHTML = icone(e.def.icone, "icone-x");
        if (!e.desbloqueada) {
            const cad = el("span", "conq-cadeado");
            cad.innerHTML = icone("cadeado", "icone-x");
            medalha.appendChild(cad);
        }
        c.appendChild(medalha);
        const info = el("div", "conq-info");
        info.appendChild(el("strong", "", e.def.titulo));
        info.appendChild(el("span", "conq-desc", e.def.desc));
        if (e.desbloqueada) {
            const d = e.quando ? new Date(e.quando).toLocaleDateString("pt-BR") : "";
            info.appendChild(el("span", "conq-quando", d ? "Desbloqueada em " + d : "Desbloqueada"));
        } else {
            const b = el("span", "conq-barra");
            const i = el("i");
            i.style.width = Math.round(e.progresso * 100) + "%";
            b.appendChild(i);
            info.appendChild(b);
            const f = e.def.formato || String;
            info.appendChild(el("span", "conq-prog", f(e.valor) + " / " + f(e.meta)));
        }
        c.appendChild(info);
        return c;
    }

    /* ---------- Desafio do dia ---------- */

    function textoStatusDesafio() {
        const s = D.streak();
        if (D.desafioCumprido()) {
            return "Cumprido! Sequência de " + s.atual + (s.atual === 1 ? " dia" : " dias");
        }
        if (s.atual > 0) {
            return s.jogouHoje ? "Jogue este para completar o desafio" : "Jogue hoje para manter sua sequência de " + s.atual + (s.atual === 1 ? " dia" : " dias");
        }
        return "Jogue hoje para começar sua sequência";
    }

    function blocoDesafio() {
        const j = D.desafioDoDia();
        const sec = el("section", "perfil-desafio");
        sec.id = "perfil-desafio";
        if (!j) return sec;
        const feito = D.desafioCumprido();
        const img = document.createElement("img");
        img.src = j.capa;
        img.alt = "";
        img.addEventListener("error", () => { img.style.visibility = "hidden"; });
        sec.appendChild(img);
        const t = el("div", "perfil-desafio-texto");
        const rot = el("span", "desafio-rotulo");
        rot.innerHTML = icone("alvo", "icone-x");
        rot.appendChild(document.createTextNode("Desafio de hoje"));
        t.appendChild(rot);
        t.appendChild(el("strong", "", j.titulo));
        t.appendChild(el("span", "desafio-status" + (feito ? " feito" : ""), textoStatusDesafio()));
        sec.appendChild(t);
        const b = el("button", "area-btn area-btn-principal", feito ? "Jogar de novo" : "Jogar");
        b.type = "button";
        b.addEventListener("click", () => abrirJogoPeloId(j.id));
        sec.appendChild(b);
        return sec;
    }

    /* Faixa no hub, logo abaixo dos botões */
    let faixa = null;
    let diaMostrado = null;

    function montarFaixa() {
        const ref = document.querySelector(".surpreenda-wrap");
        if (!ref || faixa) return;
        faixa = el("button", "desafio-hoje");
        faixa.type = "button";
        faixa.id = "desafioHoje";
        ref.insertAdjacentElement("afterend", faixa);
        faixa.addEventListener("click", () => {
            const j = D.desafioDoDia();
            if (j) abrirJogoPeloId(j.id);
        });
    }

    function atualizarFaixa() {
        if (!faixa) return;
        const j = D.desafioDoDia();
        if (!j) { faixa.hidden = true; return; }
        faixa.hidden = false;
        const feito = D.desafioCumprido();
        const s = D.streak();
        faixa.classList.toggle("feito", feito);
        faixa.innerHTML = "";
        const img = document.createElement("img");
        img.src = j.capa;
        img.alt = "";
        img.addEventListener("error", () => { img.style.visibility = "hidden"; });
        faixa.appendChild(img);

        const t = el("span", "desafio-hoje-texto");
        const rot = el("span", "desafio-rotulo");
        rot.innerHTML = icone("alvo", "icone-x");
        rot.appendChild(document.createTextNode("Desafio de hoje"));
        t.appendChild(rot);
        t.appendChild(el("strong", "", j.titulo));
        t.appendChild(el("span", "desafio-status" + (feito ? " feito" : ""), textoStatusDesafio()));
        faixa.appendChild(t);

        const chama = el("span", "desafio-chama" + (s.atual > 0 ? " ativa" : ""));
        chama.innerHTML = icone("chama", "icone-x");
        chama.appendChild(el("b", "", String(s.atual)));
        chama.title = "Sequência de dias jogando";
        faixa.appendChild(chama);
        diaMostrado = D.hoje();
    }

    // selo "Desafio de hoje" na capa do jogo sorteado
    const SELO = '<span class="badge-desafio" title="Desafio de hoje">' + icone("alvo", "icone-x") + "Desafio de hoje</span>";

    function decorarCapas() {
        document.querySelectorAll(".badge-desafio").forEach(b => b.remove());
        const j = D.desafioDoDia();
        if (!j) return;
        document.querySelectorAll('.bloco[data-id="' + j.id + '"]').forEach(card => {
            card.insertAdjacentHTML("beforeend", SELO);
        });
    }

    if (typeof window.criarCardHTML === "function") {
        const original = window.criarCardHTML;
        window.criarCardHTML = function (jogo) {
            const html = original.apply(this, arguments);
            const d = D.desafioDoDia();
            if (!d || d.id !== jogo.id) return html;
            return html.replace('<div class="bloco-img-wrap">', SELO + '<div class="bloco-img-wrap">');
        };
    }

    function atualizarTudo() {
        atualizarFaixa();
        decorarCapas();
        if (tela.aberta()) desenhar();
    }

    let agendado = null;
    document.addEventListener("oldnow:dados", () => {
        clearTimeout(agendado);
        agendado = setTimeout(atualizarTudo, 150);
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && diaMostrado && diaMostrado !== D.hoje()) atualizarTudo();
    });

    /* ---------- Cartão de resultados (canvas) ---------- */

    function carregarImagem(src) {
        return new Promise(ok => {
            const img = new Image();
            img.onload = () => ok(img);
            img.onerror = () => ok(null);
            img.src = src;
        });
    }

    function retanguloArredondado(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function cortar(ctx, texto, largura) {
        if (ctx.measureText(texto).width <= largura) return texto;
        let t = texto;
        while (t.length > 1 && ctx.measureText(t + "…").width > largura) t = t.slice(0, -1);
        return t.trimEnd() + "…";
    }

    async function gerarCartao() {
        const W = 1080;
        const H = 1350;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        const FONTE = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

        const s = D.stats();
        const estado = D.conquistas();
        const feitas = estado.filter(e => e.desbloqueada).length;
        const nome = nomeJogador() || "Jogador";

        // fundo
        const fundo = ctx.createLinearGradient(0, 0, W, H);
        fundo.addColorStop(0, "#0b1020");
        fundo.addColorStop(0.55, "#0d0d0d");
        fundo.addColorStop(1, "#1a0f2e");
        ctx.fillStyle = fundo;
        ctx.fillRect(0, 0, W, H);

        [[W * 0.9, 120, 380, "rgba(0,123,255,0.28)"], [90, H - 160, 420, "rgba(111,66,193,0.30)"]].forEach(([x, y, r, cor]) => {
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, cor);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        });

        // cabeçalho
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "alphabetic";
        ctx.font = "800 46px " + FONTE;
        ctx.textAlign = "left";
        ctx.fillText("OLDNOW GAMES", 70, 120);
        ctx.font = "500 30px " + FONTE;
        ctx.fillStyle = "#9aa4b2";
        ctx.fillText("Meu resumo de jogador", 70, 166);

        // avatar + nome
        const av = dadosAvatar();
        ctx.beginPath();
        ctx.arc(W - 150, 128, 58, 0, Math.PI * 2);
        ctx.fillStyle = av.cor;
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "800 54px " + FONTE;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(av.letra || nome[0].toUpperCase(), W - 150, 132);
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "right";
        ctx.font = "700 34px " + FONTE;
        ctx.fillText(cortar(ctx, nome, 330), W - 232, 140);

        // destaque: tempo total
        ctx.textAlign = "left";
        retanguloArredondado(ctx, 70, 230, W - 140, 250, 36);
        const caixa = ctx.createLinearGradient(70, 230, W - 70, 480);
        caixa.addColorStop(0, "rgba(0,123,255,0.30)");
        caixa.addColorStop(1, "rgba(111,66,193,0.30)");
        ctx.fillStyle = caixa;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#cfd8e6";
        ctx.font = "600 32px " + FONTE;
        ctx.fillText("Tempo jogado", 110, 300);
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 110px " + FONTE;
        ctx.fillText(fmtTempo(s.totalMs), 106, 410);

        // três números
        const caixas = [
            [String(s.distintos), "jogos diferentes"],
            [String(s.streak.atual), s.streak.atual === 1 ? "dia seguido" : "dias seguidos"],
            [feitas + "/" + estado.length, "conquistas"]
        ];
        const largC = (W - 140 - 2 * 24) / 3;
        caixas.forEach((c, i) => {
            const x = 70 + i * (largC + 24);
            retanguloArredondado(ctx, x, 510, largC, 190, 30);
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.fill();
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff";
            ctx.font = "800 72px " + FONTE;
            ctx.fillText(c[0], x + largC / 2, 610);
            ctx.fillStyle = "#9aa4b2";
            ctx.font = "500 27px " + FONTE;
            ctx.fillText(c[1], x + largC / 2, 664);
        });

        // top 3
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 40px " + FONTE;
        ctx.fillText("Meu top 3", 70, 790);

        const top = s.top.map(t => ({ jogo: jogoPorId(t.id), t: t })).filter(x => x.jogo);
        if (!top.length) {
            ctx.fillStyle = "#9aa4b2";
            ctx.font = "500 32px " + FONTE;
            ctx.fillText("Jogue alguns jogos para montar o seu top 3.", 70, 880);
        } else {
            const imgs = await Promise.all(top.map(x => carregarImagem(x.jogo.capa)));
            const largJ = (W - 140 - 2 * 28) / 3;
            const altJ = Math.round(largJ * 1.5);
            top.forEach((x, i) => {
                const px = 70 + i * (largJ + 28);
                const py = 818;
                ctx.save();
                retanguloArredondado(ctx, px, py, largJ, altJ, 26);
                ctx.clip();
                if (imgs[i]) {
                    // "cover": preenche cortando o excesso
                    const r = Math.max(largJ / imgs[i].width, altJ / imgs[i].height);
                    const w = imgs[i].width * r;
                    const h = imgs[i].height * r;
                    ctx.drawImage(imgs[i], px + (largJ - w) / 2, py + (altJ - h) / 2, w, h);
                } else {
                    ctx.fillStyle = "#1c2233";
                    ctx.fillRect(px, py, largJ, altJ);
                }
                const sombra = ctx.createLinearGradient(0, py + altJ * 0.6, 0, py + altJ);
                sombra.addColorStop(0, "rgba(0,0,0,0)");
                sombra.addColorStop(1, "rgba(0,0,0,0.85)");
                ctx.fillStyle = sombra;
                ctx.fillRect(px, py, largJ, altJ);
                ctx.restore();

                ctx.fillStyle = "#ffcf33";
                ctx.font = "800 44px " + FONTE;
                ctx.textAlign = "left";
                ctx.fillText(String(i + 1), px + 22, py + 56);
                ctx.fillStyle = "#fff";
                ctx.font = "700 27px " + FONTE;
                ctx.fillText(cortar(ctx, x.jogo.titulo, largJ - 36), px + 18, py + altJ - 52);
                ctx.fillStyle = "#cfd8e6";
                ctx.font = "500 24px " + FONTE;
                const sub = x.t.ms ? fmtTempo(x.t.ms) : x.t.vezes + (x.t.vezes === 1 ? " partida" : " partidas");
                ctx.fillText(sub, px + 18, py + altJ - 20);
            });
        }

        // rodapé
        ctx.textAlign = "center";
        ctx.fillStyle = "#9aa4b2";
        ctx.font = "500 28px " + FONTE;
        ctx.fillText("Venha jogar em " + location.host, W / 2, H - 34);
        return canvas;
    }

    async function abrirCartao() {
        const carregando = dialogo({
            titulo: "Meu cartão",
            texto: "Montando a imagem…",
            botoes: [{ texto: "Fechar" }]
        });
        let canvas;
        try { canvas = await gerarCartao(); } catch (e) { canvas = null; }
        carregando.fechar();
        if (!canvas) { toast("Não consegui montar o cartão agora."); return; }

        const previa = el("div", "cartao-previa");
        canvas.className = "cartao-canvas";
        previa.appendChild(canvas);

        const nomeArquivo = "oldnow-meu-cartao.png";
        function paraBlob() { return new Promise(ok => canvas.toBlob(ok, "image/png")); }

        dialogo({
            titulo: "Meu cartão",
            conteudo: previa,
            botoes: [
                { texto: "Fechar" },
                {
                    texto: "Baixar", acao: async () => {
                        const blob = await paraBlob();
                        if (!blob) { toast("Não consegui salvar a imagem."); return false; }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = nomeArquivo;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 4000);
                        toast("Imagem salva", "baixar");
                        return false;
                    }
                },
                {
                    texto: "Compartilhar", principal: true, acao: async () => {
                        const blob = await paraBlob();
                        if (!blob) return false;
                        const arquivo = new File([blob], nomeArquivo, { type: "image/png" });
                        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
                            try {
                                await navigator.share({ files: [arquivo], title: "OldNow Games", text: "Meu resumo na OldNow Games!" });
                                return;
                            } catch (e) {
                                if (e && e.name === "AbortError") return false;
                            }
                        }
                        toast("Seu navegador não compartilha imagens direto. Use “Baixar” e poste onde quiser.");
                        return false;
                    }
                }
            ]
        });
    }

    /* ---------- Pontos de entrada ---------- */

    function abrir(secao) {
        secaoPendente = secao || null;
        if (tela.aberta()) { desenhar(); if (secao) irPara(secao); secaoPendente = null; }
        else tela.abrir();
    }

    document.querySelectorAll("[data-perfil-abrir]").forEach(a => {
        a.addEventListener("click", e => { e.preventDefault(); abrir(); });
    });
    document.querySelectorAll("[data-conquistas-abrir]").forEach(a => {
        a.addEventListener("click", e => { e.preventDefault(); abrir("conquistas"); });
    });

    montarFaixa();
    atualizarFaixa();
    decorarCapas();

    window.OldNowPerfil = { abrir: abrir, cartao: abrirCartao, atualizar: atualizarTudo };
})();