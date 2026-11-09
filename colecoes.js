/* =========================================================
   OldNow Games — colecoes.js
   - Coleções nomeadas ("Para jogar com amigos", "Relaxar"...)
   - Lista "Jogar depois" (some da lista quando a pessoa joga)
   - Botão "Salvar" no modal do jogo e no menu de toque longo
   - Compartilhar a Minha área / uma coleção por link
       ?area=id1,id2,id3            -> lista da Minha área de alguém
       ?colecao=id1,id2&nome=Relax  -> uma coleção
     Quem abre o link escolhe importar (nada é aplicado sozinho).

   Dados (por sessão): oldnow_colecoes = [{ id, nome, jogos: [], criadaEm }]
   A lista "Jogar depois" fica em oldnow_depois (dados.js).
   Carregar DEPOIS de dados.js. Expõe window.OldNowColecoes.
   ========================================================= */
(function colecoesDoJogador() {
    "use strict";

    const D = window.OldNowDados;
    if (!D || typeof GAMES === "undefined") return;

    const { el, icone, normalizar, jogoPorId, jogaveis, toast, dialogo } = D;
    const $ = id => document.getElementById(id);
    const MAX_COLECOES = 12;
    const MAX_JOGOS = 60;

    /* ---------- Dados ---------- */

    function lerColecoes() {
        const l = lerJSON(LS_KEYS.colecoes, []);
        if (!Array.isArray(l)) return [];
        return l.filter(c => c && c.id && Array.isArray(c.jogos)).map(c => ({
            id: c.id,
            nome: String(c.nome || "Coleção").slice(0, 24),
            jogos: c.jogos.filter((id, i) => c.jogos.indexOf(id) === i && jogoPorId(id)),
            criadaEm: c.criadaEm || 0
        }));
    }

    function salvarColecoes(lista) {
        salvarJSON(LS_KEYS.colecoes, lista);
        document.dispatchEvent(new Event("oldnow:dados"));
        D.avaliarConquistas();
    }

    const colecaoPorId = id => lerColecoes().find(c => c.id === id) || null;

    function criarColecao(nome, jogos) {
        const lista = lerColecoes();
        if (lista.length >= MAX_COLECOES) return null;
        const ids = (jogos || []).filter((id, i, a) => a.indexOf(id) === i && jogoPorId(id)).slice(0, MAX_JOGOS);
        const c = {
            id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            nome: (nome || "Nova coleção").trim().slice(0, 24) || "Nova coleção",
            jogos: ids,
            criadaEm: Date.now()
        };
        lista.push(c);
        salvarColecoes(lista);
        return c;
    }

    function jogosDe(idCol) {
        if (idCol === "depois") return D.getDepois();
        const c = colecaoPorId(idCol);
        return c ? c.jogos : [];
    }

    function gravarJogos(idCol, ids) {
        const limpos = ids.filter((id, i) => ids.indexOf(id) === i && jogoPorId(id)).slice(0, MAX_JOGOS);
        if (idCol === "depois") {
            salvarJSON(LS_KEYS.depois, limpos);
            document.dispatchEvent(new Event("oldnow:dados"));
            D.avaliarConquistas();
            return;
        }
        const lista = lerColecoes();
        const c = lista.find(x => x.id === idCol);
        if (!c) return;
        c.jogos = limpos;
        salvarColecoes(lista);
    }

    const nomeDe = idCol => (idCol === "depois" ? "Jogar depois" : (colecaoPorId(idCol) || {}).nome || "Coleção");

    function contagemTexto(n) { return n === 1 ? "1 jogo" : n + " jogos"; }

    /* ---------- Compartilhar por link ---------- */

    function base() { return location.origin + location.pathname; }

    function linkDaLista(tipo, ids, nome) {
        const lista = ids.join(",");
        if (tipo === "area") return base() + "?area=" + lista;
        return base() + "?colecao=" + lista + "&nome=" + encodeURIComponent(nome || "Coleção");
    }

    async function enviarLink(url, titulo, texto) {
        if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
            try {
                await navigator.share({ title: titulo, text: texto, url: url });
                return;
            } catch (e) {
                if (e && e.name === "AbortError") return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            toast("Link copiado! Mande para quem quiser.", "compartilhar");
        } catch (e) {
            dialogo({ titulo: "Copie o link", input: { valor: url, max: 2000, rotulo: "Link" }, botoes: [{ texto: "Fechar", principal: true }] });
        }
    }

    function compartilharLista(tipo, ids, nome) {
        if (!ids.length) { toast("Adicione jogos antes de compartilhar."); return; }
        const rotulo = tipo === "area" ? "a minha área da OldNow Games" : "a coleção “" + nome + "” da OldNow Games";
        enviarLink(linkDaLista(tipo, ids, nome), "OldNow Games", "Olha " + rotulo + ":");
    }

    /* ---------- Tela de coleções ---------- */

    let vista = "lista";      // lista | detalhe | editor
    let colAtual = null;      // id da coleção aberta ("depois" ou id)
    let pendente = null;      // coleção a abrir assim que a tela terminar de abrir

    const tela = D.criarTela("colecoes", "Coleções", {
        aoAbrir: () => {
            if (pendente) { const id = pendente; pendente = null; mostrarDetalhe(id); }
            else mostrarLista();
        },
        aoVoltar: () => {
            if (vista === "editor") { mostrarDetalhe(colAtual); return false; }
            if (vista === "detalhe") { mostrarLista(); return false; }
            return true;
        }
    });

    const vLista = el("div", "extra-view");
    const vDetalhe = el("div", "extra-view");
    const vEditor = el("div", "extra-view");
    [vLista, vDetalhe, vEditor].forEach(v => { v.hidden = true; tela.corpo.appendChild(v); });

    function ir(nome) {
        vista = nome;
        vLista.hidden = nome !== "lista";
        vDetalhe.hidden = nome !== "detalhe";
        vEditor.hidden = nome !== "editor";
        const rotuloVoltar = tela.voltar.querySelector(".area-btn-texto");
        if (rotuloVoltar) rotuloVoltar.textContent = nome === "lista" ? "Hub" : nome === "detalhe" ? "Coleções" : "Voltar";
    }

    function botoesTopo(lista) {
        tela.acoes.innerHTML = "";
        lista.forEach(b => {
            const btn = el("button", "area-btn" + (b.perigo ? " area-btn-perigo" : ""));
            btn.type = "button";
            btn.title = b.texto;
            btn.setAttribute("aria-label", b.texto);
            btn.innerHTML = icone(b.icone, "icone-x") + '<span class="area-btn-texto">' + b.texto + "</span>";
            btn.addEventListener("click", b.acao);
            tela.acoes.appendChild(btn);
        });
    }

    function mosaico(ids, vazioIcone) {
        const m = el("span", "colecao-mosaico");
        const capas = ids.slice(0, 4).map(jogoPorId).filter(Boolean);
        if (!capas.length) {
            m.classList.add("vazio");
            m.innerHTML = icone(vazioIcone || "pasta", "icone-x");
            return m;
        }
        capas.forEach(j => {
            const img = document.createElement("img");
            img.src = j.capa;
            img.alt = "";
            img.loading = "lazy";
            img.addEventListener("error", () => { img.style.visibility = "hidden"; });
            m.appendChild(img);
        });
        return m;
    }

    function cartao(titulo, subtitulo, ids, vazioIcone, aoClicar, classe) {
        const b = el("button", "colecao-card" + (classe ? " " + classe : ""));
        b.type = "button";
        b.appendChild(mosaico(ids, vazioIcone));
        b.appendChild(el("span", "colecao-nome", titulo));
        b.appendChild(el("span", "colecao-qtd", subtitulo));
        b.addEventListener("click", aoClicar);
        return b;
    }

    /* Lista de coleções */
    function mostrarLista() {
        ir("lista");
        colAtual = null;
        tela.definirTitulo("Coleções");
        botoesTopo([{ icone: "mais", texto: "Nova coleção", acao: () => pedirNomeENovaColecao() }]);

        vLista.innerHTML = "";
        const rolagem = el("div", "area-rolagem");
        const grade = el("div", "colecao-grade");

        const depois = D.getDepois();
        grade.appendChild(cartao("Jogar depois", contagemTexto(depois.length), depois, "marcador", () => mostrarDetalhe("depois"), "fixa"));

        const area = window.OldNowArea;
        if (area) {
            const aj = area.jogos();
            grade.appendChild(cartao("Minha área", area.existe() ? contagemTexto(aj.length) : "Criar agora", aj, "grade", () => {
                if (window.OldNowCamadas) window.OldNowCamadas.fechar("colecoes", () => area.abrir());
                else area.abrir();
            }, "fixa"));
        }

        lerColecoes().forEach(c => {
            grade.appendChild(cartao(c.nome, contagemTexto(c.jogos.length), c.jogos, "pasta", () => mostrarDetalhe(c.id)));
        });

        const nova = el("button", "colecao-card nova");
        nova.type = "button";
        nova.innerHTML = '<span class="colecao-mosaico vazio">' + icone("mais", "icone-x") + "</span>" +
            '<span class="colecao-nome">Nova coleção</span><span class="colecao-qtd">' + (lerColecoes().length >= MAX_COLECOES ? "Limite atingido" : "Dê um nome e escolha os jogos") + "</span>";
        nova.addEventListener("click", () => pedirNomeENovaColecao());
        grade.appendChild(nova);

        rolagem.appendChild(grade);
        vLista.appendChild(rolagem);
    }

    function pedirNomeENovaColecao(jogoInicial, aoCriar) {
        if (lerColecoes().length >= MAX_COLECOES) {
            toast("Limite de " + MAX_COLECOES + " coleções. Exclua uma para criar outra.");
            return;
        }
        dialogo({
            titulo: "Nova coleção",
            texto: "Escolha um nome, por exemplo “Para jogar com amigos”.",
            input: { valor: "", placeholder: "Nome da coleção", max: 24 },
            botoes: [
                { texto: "Cancelar" },
                {
                    texto: "Criar", principal: true,
                    acao: nome => {
                        if (!nome) return false;
                        const c = criarColecao(nome, jogoInicial ? [jogoInicial] : []);
                        if (!c) return;
                        if (aoCriar) { aoCriar(c); return; }
                        if (tela.aberta()) { colAtual = c.id; mostrarDetalhe(c.id); }
                    }
                }
            ]
        });
    }

    /* Detalhe de uma coleção */
    function mostrarDetalhe(idCol) {
        colAtual = idCol;
        ir("detalhe");
        const ehDepois = idCol === "depois";
        const ids = jogosDe(idCol);
        tela.definirTitulo(nomeDe(idCol));

        const botoes = [
            { icone: "compartilhar", texto: "Compartilhar", acao: () => compartilharLista("colecao", jogosDe(idCol), nomeDe(idCol)) },
            { icone: "mais", texto: "Adicionar jogos", acao: () => abrirEditor(idCol) }
        ];
        if (!ehDepois) {
            botoes.push({ icone: "lapis", texto: "Renomear", acao: () => renomear(idCol) });
            botoes.push({ icone: "lixeira", texto: "Excluir", perigo: true, acao: () => excluir(idCol) });
        }
        botoesTopo(botoes);

        vDetalhe.innerHTML = "";
        const rolagem = el("div", "area-rolagem");

        if (ehDepois) {
            rolagem.appendChild(el("p", "extra-dica", "Jogos que você guardou para mais tarde. Quando você joga um deles, ele sai daqui sozinho."));
        }

        if (!ids.length) {
            const vazio = el("div", "extra-vazio");
            vazio.innerHTML = icone(ehDepois ? "marcador" : "pasta", "icone-x");
            vazio.appendChild(el("strong", "", ehDepois ? "Nada guardado para depois" : "Coleção vazia"));
            vazio.appendChild(el("span", "", "Adicione jogos para vê-los aqui."));
            const b = el("button", "area-btn area-btn-principal", "Adicionar jogos");
            b.type = "button";
            b.addEventListener("click", () => abrirEditor(idCol));
            vazio.appendChild(b);
            rolagem.appendChild(vazio);
        } else {
            const grade = el("div", "area-grade");
            grade.dataset.espaco = "normal";
            ids.map(jogoPorId).filter(Boolean).forEach((j, i) => {
                const b = el("button", "area-card");
                b.type = "button";
                b.dataset.id = j.id;
                b.style.setProperty("--i", Math.min(i, 20));
                b.title = j.titulo;
                b.setAttribute("aria-label", j.titulo);
                const img = document.createElement("img");
                img.src = j.capa;
                img.alt = "";
                img.loading = "lazy";
                img.draggable = false;
                b.appendChild(img);
                b.addEventListener("click", () => abrirJogoPeloId(j.id));
                grade.appendChild(b);
            });
            rolagem.appendChild(grade);
        }
        vDetalhe.appendChild(rolagem);
    }

    function renomear(idCol) {
        const c = colecaoPorId(idCol);
        if (!c) return;
        dialogo({
            titulo: "Renomear coleção",
            input: { valor: c.nome, max: 24 },
            botoes: [
                { texto: "Cancelar" },
                {
                    texto: "Salvar", principal: true,
                    acao: nome => {
                        if (!nome) return false;
                        const lista = lerColecoes();
                        const alvo = lista.find(x => x.id === idCol);
                        if (alvo) { alvo.nome = nome.slice(0, 24); salvarColecoes(lista); }
                        mostrarDetalhe(idCol);
                    }
                }
            ]
        });
    }

    function excluir(idCol) {
        const c = colecaoPorId(idCol);
        if (!c) return;
        dialogo({
            titulo: "Excluir coleção?",
            texto: "“" + c.nome + "” será apagada. Os jogos continuam no hub.",
            botoes: [
                { texto: "Cancelar" },
                {
                    texto: "Excluir", perigo: true, principal: true,
                    acao: () => {
                        salvarColecoes(lerColecoes().filter(x => x.id !== idCol));
                        mostrarLista();
                    }
                }
            ]
        });
    }

    /* Editor: escolher os jogos da coleção */
    function abrirEditor(idCol) {
        colAtual = idCol;
        ir("editor");
        tela.definirTitulo("Jogos de " + nomeDe(idCol));
        botoesTopo([]);

        let escolhidos = jogosDe(idCol).slice();
        let filtroCat = "todos";
        let termo = "";

        vEditor.innerHTML = "";

        const filtros = el("div", "area-filtros-wrap");
        const busca = el("input", "area-busca");
        busca.type = "search";
        busca.placeholder = "Buscar jogos…";
        busca.setAttribute("aria-label", "Buscar jogos");
        busca.autocomplete = "off";
        filtros.appendChild(busca);

        const chips = el("div", "area-chips");
        const cats = [{ id: "todos", titulo: "Todos" }].concat(typeof CATEGORIAS_INFO !== "undefined" ? CATEGORIAS_INFO : []);
        cats.forEach(c => {
            const ch = el("button", "area-chip" + (c.id === "todos" ? " ativo" : ""), c.titulo);
            ch.type = "button";
            ch.dataset.cat = c.id;
            ch.addEventListener("click", () => {
                filtroCat = c.id;
                chips.querySelectorAll(".area-chip").forEach(x => x.classList.toggle("ativo", x === ch));
                desenhar();
            });
            chips.appendChild(ch);
        });
        filtros.appendChild(chips);
        vEditor.appendChild(filtros);

        const rolagem = el("div", "area-rolagem");
        const grade = el("div", "area-grade");
        const vazio = el("p", "area-vazio-busca", "Nenhum jogo encontrado.");
        vazio.hidden = true;
        rolagem.appendChild(grade);
        rolagem.appendChild(vazio);
        vEditor.appendChild(rolagem);

        const barra = el("div", "area-acoes-barra");
        const contagem = el("span", "area-contagem");
        const cancelar = el("button", "area-btn", "Cancelar");
        cancelar.type = "button";
        const salvar = el("button", "area-btn area-btn-principal", "Salvar");
        salvar.type = "button";
        barra.appendChild(contagem);
        barra.appendChild(cancelar);
        barra.appendChild(salvar);
        vEditor.appendChild(barra);

        const cartoes = new Map();
        jaCriadas();
        function jaCriadas() {
            jogaveis().sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")).forEach(j => {
                const b = el("button", "area-card");
                b.type = "button";
                b.dataset.id = j.id;
                b.title = j.titulo;
                b.setAttribute("aria-label", j.titulo);
                const img = document.createElement("img");
                img.src = j.capa;
                img.alt = "";
                img.loading = "lazy";
                img.draggable = false;
                const check = el("span", "area-check");
                check.innerHTML = icone("ok", "icone-x");
                b.appendChild(img);
                b.appendChild(check);
                b.addEventListener("click", () => {
                    const i = escolhidos.indexOf(j.id);
                    if (i >= 0) escolhidos.splice(i, 1);
                    else if (escolhidos.length >= MAX_JOGOS) { toast("Máximo de " + MAX_JOGOS + " jogos por coleção."); return; }
                    else escolhidos.push(j.id);
                    marcar();
                });
                cartoes.set(j.id, b);
                grade.appendChild(b);
            });
        }

        function marcar() {
            cartoes.forEach((b, id) => {
                const on = escolhidos.includes(id);
                b.classList.toggle("escolhido", on);
                b.setAttribute("aria-pressed", on ? "true" : "false");
            });
            contagem.textContent = contagemTexto(escolhidos.length) + " na coleção";
        }

        function desenhar() {
            const q = normalizar(termo);
            let visiveis = 0;
            cartoes.forEach((b, id) => {
                const j = jogoPorId(id);
                const okCat = filtroCat === "todos" || (typeof jogoEstaNaCategoria === "function" ? jogoEstaNaCategoria(j, filtroCat) : j.categoria === filtroCat);
                const okTxt = !q || normalizar(j.titulo).includes(q);
                const mostra = okCat && okTxt;
                b.hidden = !mostra;
                if (mostra) visiveis++;
            });
            vazio.hidden = visiveis > 0;
        }

        busca.addEventListener("input", () => { termo = busca.value; desenhar(); });
        cancelar.addEventListener("click", () => mostrarDetalhe(idCol));
        salvar.addEventListener("click", () => {
            gravarJogos(idCol, escolhidos);
            mostrarDetalhe(idCol);
            toast("Coleção salva", "ok");
        });

        marcar();
        desenhar();
    }

    /* ---------- "Salvar em…": escolher onde guardar um jogo ---------- */

    function escolher(idJogo) {
        const j = jogoPorId(idJogo);
        if (!j || !j.link || j.link === "#") return;

        const lista = el("div", "extra-lista");

        function linha(iconeNome, texto, marcado, aoClicar, extra) {
            const b = el("button", "extra-linha" + (marcado ? " marcado" : "") + (extra ? " " + extra : ""));
            b.type = "button";
            b.innerHTML = icone(iconeNome, "icone-x");
            b.appendChild(el("span", "extra-linha-texto", texto));
            const ck = el("span", "extra-linha-check");
            ck.innerHTML = marcado ? icone("ok", "icone-x") : "";
            b.appendChild(ck);
            b.addEventListener("click", aoClicar);
            return b;
        }

        function desenhar() {
            lista.innerHTML = "";
            lista.appendChild(linha("marcador", "Jogar depois", D.isDepois(idJogo), () => {
                const guardou = D.toggleDepois(idJogo);
                toast(guardou ? "Guardado em Jogar depois" : "Removido de Jogar depois");
                desenhar();
            }));
            if (window.OldNowArea) {
                lista.appendChild(linha("grade", "Minha área", window.OldNowArea.tem(idJogo), () => {
                    const tem = window.OldNowArea.tem(idJogo);
                    if (tem) window.OldNowArea.remover(idJogo); else window.OldNowArea.adicionar(idJogo);
                    D.avaliarConquistas();
                    desenhar();
                }));
            }
            lerColecoes().forEach(c => {
                lista.appendChild(linha("pasta", c.nome, c.jogos.includes(idJogo), () => {
                    const ids = c.jogos.slice();
                    const i = ids.indexOf(idJogo);
                    if (i >= 0) ids.splice(i, 1); else ids.push(idJogo);
                    gravarJogos(c.id, ids);
                    desenhar();
                }));
            });
            lista.appendChild(linha("mais", "Nova coleção…", false, () => {
                pedirNomeENovaColecao(idJogo, () => { toast("Coleção criada com " + j.titulo, "pasta"); desenhar(); });
            }, "nova"));
        }
        desenhar();

        dialogo({
            titulo: "Salvar “" + j.titulo + "”",
            conteudo: lista,
            botoes: [{ texto: "Pronto", principal: true }]
        });
    }

    /* ---------- Compartilhar a Minha área (botão na barra da área) ---------- */

    (function botaoCompartilharArea() {
        const topo = document.querySelector("#areaOverlay .area-topbar");
        const visao = $("areaVisao");
        if (!topo || !visao) return;

        const btn = el("button", "area-btn");
        btn.type = "button";
        btn.id = "areaCompartilhar";
        btn.title = "Compartilhar Minha área";
        btn.setAttribute("aria-label", "Compartilhar Minha área");
        btn.innerHTML = icone("compartilhar", "icone-x") + '<span class="area-btn-texto">Compartilhar</span>';
        btn.hidden = true;
        const ref = $("areaPersonalizar");
        topo.insertBefore(btn, ref || null);

        const atualizar = () => { btn.hidden = visao.hidden; };
        new MutationObserver(atualizar).observe(visao, { attributes: true, attributeFilter: ["hidden"] });
        atualizar();

        btn.addEventListener("click", () => {
            const ids = window.OldNowArea ? window.OldNowArea.jogos() : [];
            compartilharLista("area", ids, "Minha área");
        });
    })();

    /* ---------- Receber uma lista compartilhada (?area= / ?colecao=) ---------- */

    function lerListaDoLink() {
        const p = new URLSearchParams(location.search);
        const bruto = p.get("area") || p.get("colecao");
        if (!bruto) return null;
        const tipo = p.get("area") ? "area" : "colecao";
        const disponiveis = new Set(jaVaiJogar());
        const ids = bruto.split(",").map(s => s.trim()).filter((id, i, a) => id && a.indexOf(id) === i && disponiveis.has(id)).slice(0, MAX_JOGOS);
        if (!ids.length) return null;
        const nome = (p.get("nome") || "").trim().slice(0, 24);
        return { tipo: tipo, ids: ids, nome: nome };
    }
    function jaVaiJogar() { return jogaveis().map(j => j.id); }

    function limparLinkDaUrl() {
        try {
            const url = new URL(location.href);
            ["area", "colecao", "nome"].forEach(k => url.searchParams.delete(k));
            history.replaceState(history.state, "", url.pathname + (url.search || "") + url.hash);
        } catch (e) { /* ignora */ }
    }

    function mostrarImportacao(lista) {
        const conteudo = el("div", "extra-previa");
        lista.ids.slice(0, 8).map(jogoPorId).forEach(j => {
            const img = document.createElement("img");
            img.src = j.capa;
            img.alt = j.titulo;
            img.title = j.titulo;
            img.loading = "lazy";
            conteudo.appendChild(img);
        });

        const botoes = [];
        if (lista.tipo === "area") {
            botoes.push({
                texto: "Adicionar à Minha área", principal: true,
                acao: () => {
                    let novos = 0;
                    lista.ids.forEach(id => { if (window.OldNowArea && window.OldNowArea.adicionar(id) === true) novos++; });
                    D.avaliarConquistas();
                    toast(novos ? novos + " jogos adicionados à sua área" : "Esses jogos já estavam na sua área", "grade");
                    limparLinkDaUrl();
                }
            });
        }
        botoes.push({
            texto: "Salvar como coleção", principal: lista.tipo !== "area",
            acao: () => {
                const c = criarColecao(lista.nome || (lista.tipo === "area" ? "Lista de amigo" : "Coleção recebida"), lista.ids);
                if (!c) { toast("Limite de " + MAX_COLECOES + " coleções. Exclua uma e abra o link de novo."); return false; }
                toast("Coleção “" + c.nome + "” salva", "pasta");
                limparLinkDaUrl();
                setTimeout(() => abrirNaColecao(c.id), 300);
            }
        });
        botoes.push({ texto: "Agora não", acao: limparLinkDaUrl });

        dialogo({
            titulo: "Uma lista foi compartilhada com você",
            texto: lista.ids.length + (lista.ids.length === 1 ? " jogo" : " jogos") + (lista.nome ? " em “" + lista.nome + "”" : "") + ". O que você quer fazer?",
            conteudo: conteudo,
            botoes: botoes,
            aoFechar: limparLinkDaUrl
        });
    }

    (function verificarLinkCompartilhado() {
        const lista = lerListaDoLink();
        if (!lista) return;
        // espera a tela de abertura/entrada terminar (os dados vão para a sessão escolhida)
        let tentativas = 0;
        const espera = setInterval(() => {
            tentativas++;
            const ocupado = document.body.classList.contains("entrada-aberta") || !!document.getElementById("telaInicial");
            if (!ocupado) { clearInterval(espera); mostrarImportacao(lista); }
            else if (tentativas > 240) clearInterval(espera);
        }, 500);
    })();

    /* ---------- Pontos de entrada ---------- */

    document.querySelectorAll("[data-colecoes-abrir]").forEach(a => {
        a.addEventListener("click", e => { e.preventDefault(); tela.abrir(); });
    });

    // botão "Salvar" no modal do jogo
    const modal = $("modalJogo");
    const btnSalvar = $("modalSalvar");
    if (btnSalvar && modal) {
        btnSalvar.addEventListener("click", () => {
            const id = modal.dataset.jogoAtual;
            if (id) escolher(id);
        });
    }

    // quando algo muda por fora (jogou, trocou de sessão), a tela aberta se atualiza
    document.addEventListener("oldnow:dados", () => {
        if (!tela.aberta()) return;
        if (vista === "lista") mostrarLista();
        else if (vista === "detalhe" && (colAtual === "depois" || colecaoPorId(colAtual))) mostrarDetalhe(colAtual);
    });

    function abrirNaColecao(id) {
        if (tela.aberta()) { pendente = null; mostrarDetalhe(id); }
        else { pendente = id; tela.abrir(); }
    }

    window.OldNowColecoes = {
        abrir: () => { pendente = null; tela.abrir(); },
        abrirDepois: () => abrirNaColecao("depois"),
        abrirColecao: abrirNaColecao,
        escolher: escolher,
        listar: lerColecoes,
        criar: criarColecao,
        adicionar: (idCol, idJogo) => { const ids = jogosDe(idCol).slice(); if (!ids.includes(idJogo)) ids.push(idJogo); gravarJogos(idCol, ids); },
        porNome: txt => {
            const q = normalizar(txt);
            return lerColecoes().find(c => normalizar(c.nome) === q) || lerColecoes().find(c => q && normalizar(c.nome).includes(q)) || null;
        },
        compartilharArea: () => compartilharLista("area", window.OldNowArea ? window.OldNowArea.jogos() : [], "Minha área"),
        pedirNovaColecao: pedirNomeENovaColecao
    };
})();