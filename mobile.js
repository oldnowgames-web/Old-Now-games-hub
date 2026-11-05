/* =========================================================
   OldNow Games — mobile.js
   Experiência "de app" no celular. Não mexe no script.js:
   usa as funções globais dele (GAMES, CATEGORIAS_INFO, lerJSON,
   abrirPlayer, abrirJogoPeloId, toggleFavorito...).

   O que faz:
   - barra inferior (Início, Categorias, Área, Buscar, Perfil)
   - busca em tela cheia (recentes, mais jogados, categorias, resultados)
   - sheet de categorias e menu de toque longo na capa
   - player em tela cheia: botão flutuante (arrastável)
   - ícones nos chips de categoria e nota (★) nas capas
   - botão "voltar" do celular fecha a busca/sheet aberto, em vez de sair do site

   Carregar DEPOIS de script.js, tempo.js e area.js.
   ========================================================= */
(function appMobile() {
    "use strict";

    if (typeof GAMES === "undefined" || typeof CATEGORIAS_INFO === "undefined"
        || typeof lerJSON !== "function" || typeof LS_KEYS === "undefined") return;

    const CHAVE_AREA = "oldnow_area";
    const $ = (sel, raiz) => (raiz || document).querySelector(sel);
    const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
    const mqMobile = window.matchMedia("(max-width: 991px)");
    const ehMobile = () => mqMobile.matches;

    /* ---------- Utilidades ---------- */

    function norm(txt) {
        return String(txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto != null) e.textContent = texto;
        return e;
    }

    const ICONES = {
        play: '<path d="M7 4.5v15l12-7.5z"/>',
        coracao: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
        area: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
        menos: '<path d="M5 12h14"/>',
        seta: '<path d="m9 6 6 6-6 6"/>'
    };

    function svgIcone(nome, classe) {
        return '<svg class="' + (classe || "icone-nav") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nome] + "</svg>";
    }

    function tituloDaCategoria(id) {
        const c = CATEGORIAS_INFO.find(x => x.id === id);
        return c ? c.titulo : "";
    }

    // ícone da categoria: reaproveita o SVG que já está no título da seção
    function iconeDaCategoria(id) {
        const svg = $("#" + id + " .secao-titulo svg.icone-cat");
        return svg ? svg.outerHTML : "";
    }

    let toastAtual = null;
    function toast(texto) {
        if (toastAtual) toastAtual.remove();
        toastAtual = el("div", "toast-mob", texto);
        toastAtual.setAttribute("role", "status");
        document.body.appendChild(toastAtual);
        const t = toastAtual;
        setTimeout(() => { if (t.parentNode) t.remove(); }, 2500);
    }

    function vibrar(ms) {
        try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignora */ }
    }

    /* ---------- Medidas da navbar e dos chips (CSS usa as variáveis) ---------- */

    const navbar = $(".navbar-custom");
    const chips = $(".categories");

    function medir() {
        const raiz = document.documentElement.style;
        if (navbar && ehMobile()) raiz.setProperty("--navbar-h", Math.ceil(navbar.getBoundingClientRect().height) + "px");
        if (chips && ehMobile()) raiz.setProperty("--chips-h", Math.ceil(chips.getBoundingClientRect().height) + "px");
    }
    medir();
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(medir);
        if (navbar) ro.observe(navbar);
        if (chips) ro.observe(chips);
    }
    window.addEventListener("resize", medir);
    window.addEventListener("load", medir);

    /* ---------- Camadas + botão "voltar" do celular ---------- */

    const camadas = []; // { nome, fechar }
    let reaproveitarEstado = false;

    // com busca/sheet aberto, o bot e o "voltar ao topo" saem da frente (CSS: html.camada-aberta)
    function sincronizarCamadas() {
        document.documentElement.classList.toggle("camada-aberta", camadas.length > 0);
    }

    function abrirCamada(nome, fechar) {
        try {
            // se acabamos de fechar outra camada, troca o estado em vez de empilhar mais um
            if (reaproveitarEstado && history.state && history.state.oldnowCamada) {
                history.replaceState({ oldnowCamada: nome }, "");
            } else {
                history.pushState({ oldnowCamada: nome }, "");
            }
        } catch (e) { /* ignora */ }
        reaproveitarEstado = false;
        camadas.push({ nome: nome, fechar: fechar });
        sincronizarCamadas();
    }

    // fecha tudo na hora (sem esperar o histórico); devolve true se sobrou um estado nosso no histórico
    function limparCamadas() {
        const tinhaEstado = camadas.length > 0 && !!(history.state && history.state.oldnowCamada);
        while (camadas.length) camadas.pop().fechar();
        sincronizarCamadas();
        return tinhaEstado;
    }

    // antes de abrir uma camada nova por cima de outra
    function prepararNova() {
        reaproveitarEstado = limparCamadas();
    }

    // fecha a camada do topo; "depois" roda quando o histórico já assentou
    function fecharCamada(nome, depois) {
        const topo = camadas[camadas.length - 1];
        if (!topo || topo.nome !== nome) { if (depois) depois(); return; }

        if (history.state && history.state.oldnowCamada === nome) {
            if (depois) {
                let feito = false;
                let timer = null;
                const rodar = () => {
                    if (feito) return;
                    feito = true;
                    clearTimeout(timer);
                    window.removeEventListener("popstate", rodar);
                    depois();
                };
                window.addEventListener("popstate", rodar); // registrado depois do principal: roda depois dele
                timer = setTimeout(rodar, 500);
            }
            history.back(); // o popstate fecha de verdade
        } else {
            camadas.pop();
            topo.fechar();
            sincronizarCamadas();
            if (depois) depois();
        }
    }

    window.addEventListener("popstate", () => {
        const topo = camadas[camadas.length - 1];
        if (topo && !(history.state && history.state.oldnowCamada === topo.nome)) {
            camadas.pop();
            topo.fechar();
            sincronizarCamadas();
        }
    });

    /* ---------- Chips de categoria: ícone + centraliza o chip ativo ---------- */

    if (chips) {
        $$("a", chips).forEach(a => {
            const id = (a.getAttribute("href") || "").replace("#", "");
            const icone = iconeDaCategoria(id);
            if (icone && !$(".icone-cat", a)) a.insertAdjacentHTML("afterbegin", icone);
        });

        const centralizar = a => {
            if (!ehMobile()) return;
            const alvo = a.offsetLeft - (chips.clientWidth - a.offsetWidth) / 2;
            chips.scrollTo({ left: Math.max(0, alvo), behavior: "smooth" });
        };
        new MutationObserver(muts => {
            muts.forEach(m => {
                if (m.target.classList.contains("active")) centralizar(m.target);
            });
        }).observe(chips, { subtree: true, attributes: true, attributeFilter: ["class"] });
    }

    /* ---------- Nota (★) na capa ---------- */

    function colocarNota(card, nota) {
        let badge = $(".badge-nota", card);
        if (!nota) { if (badge) badge.remove(); return; }
        if (!badge) {
            badge = el("span", "badge-nota");
            badge.title = "Sua avaliação";
            card.appendChild(badge);
        }
        badge.textContent = "★ " + nota;
    }

    function atualizarNotas(idEspecifico) {
        const notas = typeof getAvaliacoes === "function" ? getAvaliacoes() : {};
        $$(".bloco[data-id]").forEach(card => {
            if (idEspecifico && card.dataset.id !== idEspecifico) return;
            colocarNota(card, notas[card.dataset.id]);
        });
    }

    // cards criados depois (favoritar, trocar de sessão...) já nascem com a nota
    if (typeof window.criarCardHTML === "function") {
        const criarOriginal = window.criarCardHTML;
        window.criarCardHTML = function (jogo) {
            const html = criarOriginal.apply(this, arguments);
            const nota = (typeof getAvaliacoes === "function" ? getAvaliacoes() : {})[jogo.id];
            if (!nota) return html;
            return html.replace('<div class="bloco-img-wrap">', '<span class="badge-nota" title="Sua avaliação">★ ' + nota + '</span><div class="bloco-img-wrap">');
        };
    }
    if (typeof window.avaliarJogo === "function") {
        const avaliarOriginal = window.avaliarJogo;
        window.avaliarJogo = function (id) {
            const r = avaliarOriginal.apply(this, arguments);
            atualizarNotas(id);
            return r;
        };
    }
    atualizarNotas();

    /* ---------- Minha área: adicionar / remover direto da capa ---------- */

    function lerAreaSalva() {
        const a = lerJSON(CHAVE_AREA, null);
        return a && Array.isArray(a.jogos) ? a : null;
    }

    function estaNaArea(id) {
        const a = lerAreaSalva();
        return !!a && a.jogos.includes(id);
    }

    function atualizarRotulosArea() {
        const existe = !!lerAreaSalva();
        $$("[data-area-rotulo]").forEach(e => { e.textContent = existe ? "Minha área" : "Criar minha área"; });
    }

    function alternarNaArea(id) {
        let area = lerAreaSalva();
        let mensagem;
        try {
            if (area && area.jogos.includes(id)) {
                area.jogos = area.jogos.filter(j => j !== id);
                if (area.jogos.length) armazenamento().setItem(CHAVE_AREA, JSON.stringify(area));
                else armazenamento().removeItem(CHAVE_AREA); // área vazia deixa de existir
                mensagem = "Removido da sua área";
            } else {
                if (!area) area = { criadaEm: Date.now(), jogos: [] };
                area.jogos.push(id);
                armazenamento().setItem(CHAVE_AREA, JSON.stringify(area));
                mensagem = "Adicionado à sua área";
            }
        } catch (e) {
            mensagem = "Não deu para salvar neste navegador";
        }
        atualizarRotulosArea();
        toast(mensagem);
    }

    /* ---------- Sheets ---------- */

    function criarSheet(nome) {
        const fundo = el("div", "sheet-fundo");
        const sheet = el("div", "sheet");
        sheet.setAttribute("role", "dialog");
        sheet.setAttribute("aria-modal", "true");
        fundo.appendChild(sheet);
        document.body.appendChild(fundo);
        requestAnimationFrame(() => requestAnimationFrame(() => fundo.classList.add("aberto")));

        const remover = () => {
            fundo.classList.remove("aberto");
            setTimeout(() => fundo.remove(), 260);
        };
        fundo.addEventListener("click", e => { if (e.target === fundo) fecharCamada(nome); });
        return { fundo: fundo, sheet: sheet, remover: remover };
    }

    /* Sheet de categorias */
    function abrirCategorias() {
        prepararNova();
        const s = criarSheet("categorias");
        s.sheet.appendChild(el("p", "sheet-titulo", "Categorias"));

        const itens = [{ id: "favoritos", titulo: "Meus favoritos", icone: svgIcone("coracao", "icone-nav") }]
            .concat(CATEGORIAS_INFO.map(c => ({ id: c.id, titulo: c.titulo, icone: iconeDaCategoria(c.id) })));

        itens.forEach(item => {
            const b = el("button", "sheet-acao");
            b.type = "button";
            b.innerHTML = item.icone;
            b.appendChild(document.createTextNode(item.titulo));
            if (item.id !== "favoritos") {
                const qtd = GAMES.filter(j => jogoEstaNaCategoria(j, item.id)).length;
                b.appendChild(el("small", "", qtd + (qtd === 1 ? " jogo" : " jogos")));
            }
            b.addEventListener("click", () => {
                fecharCamada("categorias", () => {
                    const alvo = document.getElementById(item.id);
                    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            });
            s.sheet.appendChild(b);
        });

        marcarAba("categorias");
        abrirCamada("categorias", () => { s.remover(); marcarAba("inicio"); });
    }

    /* Menu de toque longo na capa */
    function abrirMenuJogo(id) {
        const jogo = GAMES.find(j => j.id === id);
        if (!jogo) return;
        prepararNova();

        const temLink = jogo.link && jogo.link !== "#";
        const s = criarSheet("menu-jogo");

        const cabeca = el("div", "sheet-cabeca");
        const img = document.createElement("img");
        img.src = jogo.capa;
        img.alt = "";
        const info = el("div");
        info.appendChild(el("strong", "", jogo.titulo));
        info.appendChild(el("small", "", tituloDaCategoria(jogo.categoria)));
        cabeca.appendChild(img);
        cabeca.appendChild(info);
        s.sheet.appendChild(cabeca);

        function acao(icone, texto, classe, fn) {
            const b = el("button", "sheet-acao" + (classe ? " " + classe : ""));
            b.type = "button";
            b.innerHTML = icone;
            b.appendChild(document.createTextNode(texto));
            b.addEventListener("click", () => fecharCamada("menu-jogo", fn));
            s.sheet.appendChild(b);
        }

        if (temLink) {
            acao(svgIcone("play"), "Jogar agora", "principal", () => {
                registrarJogada(jogo.id);
                abrirPlayer(jogo.link, jogo.titulo);
            });
        }
        const fav = isFavorito(jogo.id);
        acao(svgIcone("coracao"), fav ? "Remover dos favoritos" : "Favoritar", "", () => toggleFavorito(jogo.id));
        if (temLink) {
            const naArea = estaNaArea(jogo.id);
            acao(svgIcone(naArea ? "menos" : "mais"), naArea ? "Remover da minha área" : "Adicionar à minha área", "", () => alternarNaArea(jogo.id));
        }
        acao(svgIcone("info"), "Ver detalhes", "", () => abrirJogoPeloId(jogo.id));

        abrirCamada("menu-jogo", s.remover);
    }

    /* Toque longo: segura ~0,45 s na capa */
    (function toqueLongo() {
        const TEMPO = 450;
        const TOLERANCIA = 10;
        let lp = null;
        let suprimirAte = 0;

        document.addEventListener("touchstart", e => {
            if (!ehMobile() || e.touches.length !== 1) return;
            const card = e.target.closest ? e.target.closest(".bloco[data-id]") : null;
            if (!card) return;
            const t = e.touches[0];
            lp = { x: t.clientX, y: t.clientY, disparou: false, id: card.dataset.id, timer: null };
            lp.timer = setTimeout(() => {
                if (!lp) return;
                lp.disparou = true;
                vibrar(18);
                abrirMenuJogo(lp.id);
            }, TEMPO);
        }, { passive: true });

        document.addEventListener("touchmove", e => {
            if (!lp || lp.disparou) return;
            const t = e.touches[0];
            if (Math.abs(t.clientX - lp.x) > TOLERANCIA || Math.abs(t.clientY - lp.y) > TOLERANCIA) {
                clearTimeout(lp.timer);
                lp = null;
            }
        }, { passive: true });

        function terminar() {
            if (!lp) return;
            clearTimeout(lp.timer);
            if (lp.disparou) suprimirAte = Date.now() + 600;
            lp = null;
        }
        document.addEventListener("touchend", terminar, { passive: true });
        document.addEventListener("touchcancel", terminar, { passive: true });

        // depois do toque longo o navegador ainda manda um "click": engole, senão abriria o modal
        document.addEventListener("click", e => {
            // (também o fundo do sheet que acabou de abrir: o "click" do dedo levantando cai nele)
            if (Date.now() < suprimirAte && e.target.closest && e.target.closest(".bloco, .sheet-fundo")) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // sem o menu "salvar imagem" do Android no toque longo
        document.addEventListener("contextmenu", e => {
            if (e.target.closest && e.target.closest(".bloco") && window.matchMedia("(pointer: coarse)").matches) {
                e.preventDefault();
            }
        });
    })();

    /* ---------- Busca em tela cheia ---------- */

    const buscaOverlay = document.getElementById("buscaOverlay");
    const buscaInput = document.getElementById("buscaInput");
    const buscaCorpo = document.getElementById("buscaCorpo");
    const buscaLimpar = document.getElementById("buscaLimpar");
    const buscaVoltar = document.getElementById("buscaVoltar");

    function abrirJogoDaBusca(id) {
        if (buscaInput) buscaInput.blur();
        abrirJogoPeloId(id);
    }

    function miniCapa(jogo) {
        const b = el("button", "busca-mini");
        b.type = "button";
        const img = document.createElement("img");
        img.src = jogo.capa;
        img.alt = "";
        img.loading = "lazy";
        b.appendChild(img);
        b.appendChild(el("span", "", jogo.titulo));
        b.addEventListener("click", () => abrirJogoDaBusca(jogo.id));
        return b;
    }

    function blocoFila(titulo, jogos) {
        if (!jogos.length) return null;
        const bloco = el("div", "busca-bloco");
        bloco.appendChild(el("p", "busca-titulo", titulo));
        const fila = el("div", "busca-fila");
        jogos.forEach(j => fila.appendChild(miniCapa(j)));
        bloco.appendChild(fila);
        return bloco;
    }

    function embaralhar(lista) {
        const c = lista.slice();
        for (let i = c.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [c[i], c[j]] = [c[j], c[i]];
        }
        return c;
    }

    function sugestoes() {
        const jogaveis = GAMES.filter(j => j.link && j.link !== "#");
        const novos = jogaveis.filter(j => j.novo);
        const resto = embaralhar(jogaveis.filter(j => !j.novo));
        return novos.concat(resto).slice(0, 10);
    }

    function desenharInicio() {
        buscaCorpo.textContent = "";

        const recentes = lerJSON(LS_KEYS.recentes, [])
            .map(id => GAMES.find(j => j.id === id)).filter(Boolean).slice(0, 10);
        const r = blocoFila("Jogados recentemente", recentes);
        if (r) buscaCorpo.appendChild(r);

        const jogadas = typeof getJogadas === "function" ? getJogadas() : {};
        const maisJogados = GAMES.filter(j => jogadas[j.id])
            .sort((a, b) => jogadas[b.id] - jogadas[a.id]).slice(0, 10);
        const m = maisJogados.length
            ? blocoFila("Seus mais jogados", maisJogados)
            : blocoFila("Sugestões para você", sugestoes());
        if (m) buscaCorpo.appendChild(m);

        const cats = el("div", "busca-bloco");
        cats.appendChild(el("p", "busca-titulo", "Categorias"));
        const lista = el("div", "busca-cats");
        CATEGORIAS_INFO.forEach(c => {
            const b = el("button");
            b.type = "button";
            b.innerHTML = iconeDaCategoria(c.id);
            b.appendChild(document.createTextNode(c.titulo));
            b.addEventListener("click", () => {
                fecharCamada("busca", () => {
                    const alvo = document.getElementById(c.id);
                    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            });
            lista.appendChild(b);
        });
        cats.appendChild(lista);
        buscaCorpo.appendChild(cats);
    }

    function pontuar(jogo, q) {
        const titulo = norm(jogo.titulo);
        if (titulo.startsWith(q)) return 0;
        if (titulo.split(/[\s:&\-]+/).some(p => p.startsWith(q))) return 1;
        if (titulo.includes(q)) return 2;
        if (norm(tituloDaCategoria(jogo.categoria)).includes(q)
            || (Array.isArray(jogo.categorias) && jogo.categorias.some(c => norm(tituloDaCategoria(c)).includes(q)))) return 3;
        if (norm(jogo.descricao).includes(q)) return 4;
        return -1;
    }

    function desenharResultados(termo) {
        const q = norm(termo);
        const achados = GAMES
            .map(j => ({ j: j, p: pontuar(j, q) }))
            .filter(x => x.p >= 0)
            .sort((a, b) => a.p - b.p || a.j.titulo.localeCompare(b.j.titulo, "pt-BR"))
            .map(x => x.j);

        buscaCorpo.textContent = "";

        if (!achados.length) {
            const vazio = el("div", "busca-vazio");
            vazio.appendChild(el("strong", "", "Nenhum jogo encontrado"));
            vazio.appendChild(el("span", "", "Tente outro nome ou veja estas sugestões."));
            buscaCorpo.appendChild(vazio);
            const s = blocoFila("Sugestões para você", sugestoes());
            if (s) buscaCorpo.appendChild(s);
            return;
        }

        achados.forEach(jogo => {
            const b = el("button", "busca-item");
            b.type = "button";
            const img = document.createElement("img");
            img.src = jogo.capa;
            img.alt = "";
            img.loading = "lazy";
            const info = el("span", "busca-item-info");
            info.appendChild(el("span", "busca-item-titulo", jogo.titulo));
            const sub = el("span", "busca-item-sub", tituloDaCategoria(jogo.categoria));
            const txtTempo = typeof formatarTempo === "function" && typeof tempoDe === "function" ? formatarTempo(tempoDe(jogo.id)) : "";
            if (txtTempo) sub.appendChild(el("span", "busca-item-tempo", "⏱ " + txtTempo));
            info.appendChild(sub);
            const seta = el("span", "busca-item-seta");
            seta.innerHTML = svgIcone("seta");
            b.appendChild(img);
            b.appendChild(info);
            b.appendChild(seta);
            b.addEventListener("click", () => abrirJogoDaBusca(jogo.id));
            buscaCorpo.appendChild(b);
        });
    }

    function atualizarBusca() {
        const termo = buscaInput.value.trim();
        buscaLimpar.hidden = !termo;
        if (termo) desenharResultados(termo);
        else desenharInicio();
        buscaCorpo.scrollTop = 0;
    }

    function abrirBusca() {
        if (!buscaOverlay) return;
        prepararNova();
        buscaInput.value = "";
        atualizarBusca();
        buscaOverlay.hidden = false;
        marcarAba("buscar");
        abrirCamada("busca", () => {
            buscaOverlay.hidden = true;
            buscaInput.blur();
            marcarAba("inicio");
        });
        setTimeout(() => buscaInput.focus(), 60);
    }

    if (buscaOverlay) {
        buscaInput.addEventListener("input", atualizarBusca);
        buscaLimpar.addEventListener("click", () => { buscaInput.value = ""; atualizarBusca(); buscaInput.focus(); });
        buscaVoltar.addEventListener("click", () => fecharCamada("busca"));
        buscaInput.closest("form") && buscaInput.closest("form").addEventListener("submit", e => e.preventDefault());
        buscaInput.addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); buscaInput.blur(); }
        });
    }

    $$("[data-busca-abrir]").forEach(b => b.addEventListener("click", abrirBusca));

    /* ---------- Barra inferior ---------- */

    const nav = document.getElementById("navInferior");

    function marcarAba(nome) {
        if (!nav) return;
        $$("button[data-nav]", nav).forEach(b => {
            const ativo = b.dataset.nav === nome;
            b.classList.toggle("ativo", ativo);
            if (ativo) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
        });
    }

    if (nav) {
        nav.addEventListener("click", e => {
            const b = e.target.closest("button[data-nav]");
            if (!b) return;
            const acao = b.dataset.nav;

            if (acao === "inicio") {
                if (limparCamadas()) history.go(-1);
                window.scrollTo({ top: 0, behavior: "smooth" });
                marcarAba("inicio");
            } else if (acao === "categorias") {
                abrirCategorias();
            } else if (acao === "area") {
                const gatilho = $(".btn-area-hub[data-area-abrir]") || $("[data-area-abrir]");
                if (!gatilho) return;
                // a área empilha o próprio estado no histórico: espera o nosso sair antes
                if (limparCamadas()) {
                    let aberto = false;
                    const abrir = () => {
                        if (aberto) return;
                        aberto = true;
                        window.removeEventListener("popstate", abrir);
                        gatilho.click();
                    };
                    window.addEventListener("popstate", abrir);
                    setTimeout(abrir, 500);
                    history.go(-1);
                } else {
                    gatilho.click();
                }
            } else if (acao === "buscar") {
                abrirBusca();
            } else if (acao === "perfil") {
                if (limparCamadas()) history.go(-1);
                const avatar = document.getElementById("sessaoAvatar");
                const entrar = document.getElementById("sessaoEntrar");
                const alvo = avatar && !avatar.classList.contains("d-none") ? avatar : entrar;
                if (alvo) alvo.click();
            }
        });
        marcarAba("inicio");
    }

    document.addEventListener("keydown", e => {
        if (e.key !== "Escape" || !camadas.length) return;
        if (document.querySelector(".modal.show")) return; // o modal fecha primeiro
        fecharCamada(camadas[camadas.length - 1].nome);
    });

    /* ---------- Player em tela cheia ---------- */

    const playerOverlay = document.getElementById("playerOverlay");
    const playerIframe = document.getElementById("playerIframe");
    const botaoFlutuante = document.getElementById("playerFlutuante");

    let timerApagar = null;
    let jogoNoPlayer = null;

    function jogoDoPlayer() {
        if (!playerIframe) return null;
        const src = playerIframe.getAttribute("src") || "";
        if (!src) return null;
        return GAMES.find(j => j.link && j.link !== "#" && (src === j.link || playerIframe.src === j.link || src.indexOf(j.link) === 0)) || null;
    }

    function acordarBotao() {
        if (!botaoFlutuante) return;
        botaoFlutuante.classList.remove("apagado");
        clearTimeout(timerApagar);
        timerApagar = setTimeout(() => botaoFlutuante.classList.add("apagado"), 3000);
    }

    function tentarTelaCheia() {
        if (!ehMobile() || !window.matchMedia("(pointer: coarse)").matches) return Promise.resolve(false);
        const alvo = playerOverlay;
        const pedir = alvo.requestFullscreen
            ? alvo.requestFullscreen({ navigationUI: "hide" })
            : (alvo.webkitRequestFullscreen ? alvo.webkitRequestFullscreen() : null);
        return Promise.resolve(pedir).then(() => true).catch(() => false);
    }

    function sairTelaCheia() {
        try {
            if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } catch (e) { /* ignora */ }
    }

    function aoAbrirPlayer() {
        jogoNoPlayer = jogoDoPlayer();
        if (!ehMobile()) return;
        acordarBotao();

        tentarTelaCheia();
    }

    function aoFecharPlayer() {
        clearTimeout(timerApagar);
        sairTelaCheia();
        jogoNoPlayer = null;
    }

    if (playerOverlay) {
        let estavaAberto = !playerOverlay.classList.contains("d-none");
        new MutationObserver(() => {
            const aberto = !playerOverlay.classList.contains("d-none");
            if (aberto === estavaAberto) return;
            estavaAberto = aberto;
            if (aberto) aoAbrirPlayer(); else aoFecharPlayer();
        }).observe(playerOverlay, { attributes: true, attributeFilter: ["class"] });
    }

    if (botaoFlutuante) {
        // arrastável (os jogos têm HUD em cantos diferentes); toque curto sai do jogo
        let arrasto = null;

        botaoFlutuante.addEventListener("pointerdown", e => {
            acordarBotao();
            const r = botaoFlutuante.getBoundingClientRect();
            arrasto = { x: e.clientX, y: e.clientY, ox: r.left, oy: r.top, moveu: false };
            try { botaoFlutuante.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
        });
        botaoFlutuante.addEventListener("pointermove", e => {
            if (!arrasto) return;
            const dx = e.clientX - arrasto.x;
            const dy = e.clientY - arrasto.y;
            if (!arrasto.moveu && Math.hypot(dx, dy) < 8) return;
            arrasto.moveu = true;
            const w = botaoFlutuante.offsetWidth;
            const x = Math.min(Math.max(4, arrasto.ox + dx), window.innerWidth - w - 4);
            const y = Math.min(Math.max(4, arrasto.oy + dy), window.innerHeight - w - 4);
            botaoFlutuante.style.left = x + "px";
            botaoFlutuante.style.top = y + "px";
            botaoFlutuante.style.right = "auto";
        });
        function soltou() {
            if (!arrasto) return;
            const foiArrasto = arrasto.moveu;
            arrasto = null;
            if (!foiArrasto && typeof fecharPlayer === "function") fecharPlayer();
        }
        botaoFlutuante.addEventListener("pointerup", soltou);
        botaoFlutuante.addEventListener("pointercancel", () => { arrasto = null; });
        // teclado (Enter/Espaço) também sai
        botaoFlutuante.addEventListener("keydown", e => {
            if ((e.key === "Enter" || e.key === " ") && typeof fecharPlayer === "function") {
                e.preventDefault();
                fecharPlayer();
            }
        });
    }

    /* ---------- Início ---------- */

    atualizarRotulosArea();

    // ao trocar de sessão o script.js redesenha as capas: reaplica as notas
    const atualizarSessaoOriginal = window.atualizarTelaPorSessao;
    if (typeof atualizarSessaoOriginal === "function") {
        window.atualizarTelaPorSessao = function () {
            const r = atualizarSessaoOriginal.apply(this, arguments);
            atualizarNotas();
            atualizarRotulosArea();
            return r;
        };
    }

    // para testes e manutenção
    window.OldNowMobile = { abrirBusca: abrirBusca, abrirCategorias: abrirCategorias, abrirMenuJogo: abrirMenuJogo };
})();