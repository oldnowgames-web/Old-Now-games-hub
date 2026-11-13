/* =========================================================
   OldNow Games — dados.js
   Base dos recursos novos (conquistas, perfil, desafio do dia,
   "jogar depois", coleções). Não coleta nada novo além de:
     - os dias em que o jogador jogou (para a sequência / streak)
     - o desafio do dia cumprido
     - a lista "jogar depois"
     - as conquistas já desbloqueadas
   O resto sai de jogadas, tempos, favoritos e avaliações,
   que o hub já guarda. Tudo na mesma sessão do jogador.

   Carregar DEPOIS de script.js, tempo.js, area.js e mobile.js.
   Expõe window.OldNowDados.
   ========================================================= */
(function dadosExtras() {
    "use strict";

    if (typeof GAMES === "undefined" || typeof lerJSON !== "function"
        || typeof salvarJSON !== "function" || typeof LS_KEYS === "undefined") return;

    Object.assign(LS_KEYS, {
        dias: "oldnow_dias",             // ["2026-11-05", ...] dias em que jogou
        desafios: "oldnow_desafios",     // { "2026-11-05": true } desafios cumpridos
        depois: "oldnow_depois",         // ["id1", "id2"] lista "jogar depois"
        conquistas: "oldnow_conquistas", // { "id-da-conquista": timestamp }
        colecoes: "oldnow_colecoes"      // [{ id, nome, jogos: [], criadaEm }]
    });

    /* ---------- Utilidades ---------- */

    const $ = id => document.getElementById(id);

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto != null) e.textContent = texto;
        return e;
    }

    function normalizar(txt) {
        return String(txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    const jogaveis = () => GAMES.filter(j => j.link && j.link !== "#");
    const jogoPorId = id => GAMES.find(j => j.id === id);

    function fmtTempo(ms) {
        const min = Math.floor((ms || 0) / 60000);
        if (min < 1) return "0 min";
        if (min < 60) return min + " min";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m ? h + "h " + m + "min" : h + "h";
    }

    function emitir() {
        document.dispatchEvent(new Event("oldnow:dados"));
    }

    // avisos específicos (o mascote reage a eles; qualquer outro recurso também pode ouvir)
    function avisar(nome, detalhe) {
        document.dispatchEvent(new CustomEvent("oldnow:" + nome, { detail: detalhe || {} }));
    }

    /* ---------- Ícones (traço, herdam a cor do texto) ---------- */

    const ICONES = {
        controle: '<path d="M6 11h4"/><path d="M8 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z"/>',
        bussola: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
        relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        coracao: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
        estrela: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
        chama: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
        alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        pasta: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
        marcador: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
        grade: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        trofeu: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3"/><path d="M17 6h3v1a3 3 0 0 1-3 3"/>',
        raio: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
        cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        compartilhar: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/>',
        baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
        mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
        lapis: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
        lixeira: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        ok: '<path d="M20 6 9 17l-5-5"/>',
        voltar: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
        fechar: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
        tocar: '<path d="M7 4.5v15l12-7.5z"/>'
    };

    function icone(nome, classe) {
        return '<svg class="' + (classe || "icone-x") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[nome] || "") + "</svg>";
    }

    /* ---------- Datas, sequência (streak) e desafio do dia ---------- */

    const dois = n => (n < 10 ? "0" : "") + n;
    const fmtData = d => d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate());
    const hoje = () => fmtData(new Date());

    function partes(str) {
        const p = String(str).split("-").map(Number);
        return new Date(p[0], p[1] - 1, p[2], 12); // meio-dia: horário de verão não atrapalha
    }
    function addDias(str, n) {
        const d = partes(str);
        d.setDate(d.getDate() + n);
        return fmtData(d);
    }
    function diffDias(a, b) {
        return Math.round((partes(b) - partes(a)) / 86400000);
    }

    function getDias() {
        const lista = lerJSON(LS_KEYS.dias, []);
        return Array.isArray(lista) ? lista.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort() : [];
    }

    function registrarDia() {
        const dias = getDias();
        const h = hoje();
        if (dias.includes(h)) return false;
        dias.push(h);
        salvarJSON(LS_KEYS.dias, dias.slice(-400));
        return true; // primeiro jogo deste dia
    }

    function streak() {
        const dias = getDias();
        if (!dias.length) return { atual: 0, melhor: 0, jogouHoje: false };
        const conjunto = new Set(dias);

        let melhor = 1;
        let corrente = 1;
        for (let i = 1; i < dias.length; i++) {
            corrente = diffDias(dias[i - 1], dias[i]) === 1 ? corrente + 1 : 1;
            if (corrente > melhor) melhor = corrente;
        }

        const h = hoje();
        const ontem = addDias(h, -1);
        let dia = conjunto.has(h) ? h : (conjunto.has(ontem) ? ontem : null);
        let atual = 0;
        while (dia && conjunto.has(dia)) { atual++; dia = addDias(dia, -1); }

        return { atual: atual, melhor: Math.max(melhor, atual), jogouHoje: conjunto.has(h) };
    }

    function hashStr(s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    // O mesmo jogo para todo mundo no mesmo dia (sorteio pela data)
    function desafioDe(data) {
        const lista = jogaveis().sort((a, b) => (a.id < b.id ? -1 : 1));
        if (!lista.length) return null;
        const n = lista.length;
        let i = hashStr("oldnow:" + data) % n;
        const ontem = hashStr("oldnow:" + addDias(data, -1)) % n;
        if (n > 1 && i === ontem) i = (i + 1) % n; // nunca repete o de ontem
        return lista[i];
    }
    const desafioDoDia = () => desafioDe(hoje());

    function desafioCumprido(data) {
        return !!lerJSON(LS_KEYS.desafios, {})[data || hoje()];
    }
    function totalDesafios() {
        return Object.keys(lerJSON(LS_KEYS.desafios, {})).length;
    }

    /* ---------- Jogar depois ---------- */

    function getDepois() {
        const l = lerJSON(LS_KEYS.depois, []);
        return Array.isArray(l) ? l.filter((id, i) => l.indexOf(id) === i && jogoPorId(id)) : [];
    }
    const isDepois = id => getDepois().includes(id);

    function addDepois(id) {
        const j = jogoPorId(id);
        if (!j || !j.link || j.link === "#") return false;
        const l = getDepois();
        if (l.includes(id)) return true;
        l.push(id);
        salvarJSON(LS_KEYS.depois, l.slice(-60));
        emitir();
        avaliarConquistas();
        return true;
    }
    function removerDepois(id) {
        const l = getDepois();
        if (!l.includes(id)) return;
        salvarJSON(LS_KEYS.depois, l.filter(x => x !== id));
        emitir();
    }
    function toggleDepois(id) {
        if (isDepois(id)) { removerDepois(id); return false; }
        return addDepois(id);
    }

    /* ---------- Estatísticas ---------- */

    const lerSeguro = (fn, padrao) => { try { const v = fn(); return v == null ? padrao : v; } catch (e) { return padrao; } };

    function catDoJogo(j, catId) {
        if (typeof jogoEstaNaCategoria === "function") return jogoEstaNaCategoria(j, catId);
        return j.categoria === catId;
    }

    function stats() {
        const jogadas = lerSeguro(() => getJogadas(), {});
        const tempos = lerSeguro(() => getTempos(), {});
        const favoritos = lerSeguro(() => getFavoritos(), []);
        const avaliacoes = lerSeguro(() => getAvaliacoes(), {});
        const cats = lerSeguro(() => CATEGORIAS_INFO, []);

        const ids = Object.keys(jogadas).filter(id => jogadas[id] > 0 && jogoPorId(id));
        const partidas = ids.reduce((a, id) => a + jogadas[id], 0);
        const totalMs = lerSeguro(() => tempoTotal(), 0);

        let maisJogado = null;
        ids.forEach(id => {
            if (!maisJogado || jogadas[id] > maisJogado.vezes
                || (jogadas[id] === maisJogado.vezes && (tempos[id] || 0) > (tempos[maisJogado.id] || 0))) {
                maisJogado = { id: id, vezes: jogadas[id], ms: tempos[id] || 0 };
            }
        });

        let categoriaFavorita = null;
        let categoriasJogadas = 0;
        cats.forEach(c => {
            const vezes = ids.filter(id => catDoJogo(jogoPorId(id), c.id)).reduce((a, id) => a + jogadas[id], 0);
            if (vezes > 0) categoriasJogadas++;
            if (vezes > 0 && (!categoriaFavorita || vezes > categoriaFavorita.vezes)) {
                categoriaFavorita = { id: c.id, titulo: c.titulo, vezes: vezes };
            }
        });

        const porTempo = Object.keys(tempos).filter(id => jogoPorId(id) && tempos[id] > 0)
            .sort((a, b) => tempos[b] - tempos[a]);
        const porVezes = ids.slice().sort((a, b) => jogadas[b] - jogadas[a]);
        const top = (porTempo.length ? porTempo : porVezes).slice(0, 3)
            .map(id => ({ id: id, ms: tempos[id] || 0, vezes: jogadas[id] || 0 }));

        const s = streak();
        const area = lerSeguro(() => window.OldNowArea && window.OldNowArea.existe(), false);

        return {
            distintos: ids.length,
            partidas: partidas,
            totalMs: totalMs,
            maisJogado: maisJogado,
            maxJogadasUmJogo: maisJogado ? maisJogado.vezes : 0,
            categoriaFavorita: categoriaFavorita,
            categoriasJogadas: categoriasJogadas,
            totalCategorias: cats.length,
            top: top,
            favoritos: favoritos.length,
            avaliacoes: Object.keys(avaliacoes).length,
            streak: s,
            desafios: totalDesafios(),
            areaCriada: area ? 1 : 0,
            colecoes: lerJSON(LS_KEYS.colecoes, []).length,
            depois: getDepois().length
        };
    }

    /* ---------- Conquistas ---------- */

    const HORA = 3600000;

    const CONQUISTAS = [
        { id: "primeira-partida", titulo: "Primeira partida", desc: "Jogue o seu primeiro jogo", icone: "controle", meta: 1, valor: s => s.distintos },
        { id: "jogos-10", titulo: "Jogou 10 jogos diferentes", desc: "Experimente 10 jogos diferentes", icone: "bussola", meta: 10, valor: s => s.distintos },
        { id: "jogos-25", titulo: "Explorador", desc: "Experimente 25 jogos diferentes", icone: "bussola", meta: 25, valor: s => s.distintos },
        { id: "tempo-1h", titulo: "1 hora total", desc: "Some 1 hora de jogo", icone: "relogio", meta: HORA, valor: s => s.totalMs, formato: fmtTempo },
        { id: "tempo-5h", titulo: "5 horas de diversão", desc: "Some 5 horas de jogo", icone: "relogio", meta: 5 * HORA, valor: s => s.totalMs, formato: fmtTempo },
        { id: "tempo-20h", titulo: "Veterano", desc: "Some 20 horas de jogo", icone: "relogio", meta: 20 * HORA, valor: s => s.totalMs, formato: fmtTempo },
        { id: "fav-5", titulo: "Favoritou 5", desc: "Favorite 5 jogos", icone: "coracao", meta: 5, valor: s => s.favoritos },
        { id: "fav-15", titulo: "Coração de colecionador", desc: "Favorite 15 jogos", icone: "coracao", meta: 15, valor: s => s.favoritos },
        { id: "aval-3", titulo: "Avaliou 3", desc: "Dê nota para 3 jogos", icone: "estrela", meta: 3, valor: s => s.avaliacoes },
        { id: "aval-10", titulo: "Crítico", desc: "Dê nota para 10 jogos", icone: "estrela", meta: 10, valor: s => s.avaliacoes },
        { id: "generos-4", titulo: "Viajante de gêneros", desc: "Jogue em 4 categorias diferentes", icone: "bussola", meta: 4, valor: s => s.categoriasJogadas },
        { id: "generos-todos", titulo: "Todos os gêneros", desc: "Jogue pelo menos 1 jogo de cada categoria", icone: "trofeu", meta: 99, metaDin: s => s.totalCategorias || 8, valor: s => s.categoriasJogadas },
        { id: "viciado", titulo: "Viciado", desc: "Jogue o mesmo jogo 10 vezes", icone: "raio", meta: 10, valor: s => s.maxJogadasUmJogo },
        { id: "streak-3", titulo: "3 dias seguidos", desc: "Jogue 3 dias seguidos", icone: "chama", meta: 3, valor: s => s.streak.melhor },
        { id: "streak-7", titulo: "Uma semana inteira", desc: "Jogue 7 dias seguidos", icone: "chama", meta: 7, valor: s => s.streak.melhor },
        { id: "desafio-1", titulo: "Aceitou o desafio", desc: "Cumpra um desafio do dia", icone: "alvo", meta: 1, valor: s => s.desafios },
        { id: "desafio-5", titulo: "Caçador de desafios", desc: "Cumpra 5 desafios do dia", icone: "alvo", meta: 5, valor: s => s.desafios },
        { id: "area", titulo: "Decorador", desc: "Crie a sua Minha área", icone: "grade", meta: 1, valor: s => s.areaCriada },
        { id: "colecao", titulo: "Curador", desc: "Crie uma coleção", icone: "pasta", meta: 1, valor: s => s.colecoes },
        { id: "depois-3", titulo: "Planejador", desc: "Guarde 3 jogos em Jogar depois", icone: "marcador", meta: 3, valor: s => s.depois }
    ];

    const metaDe = (c, s) => (c.metaDin ? c.metaDin(s) : c.meta);

    function lerDesbloqueadas() {
        const d = lerJSON(LS_KEYS.conquistas, null);
        return d && typeof d === "object" && !Array.isArray(d) ? d : null;
    }

    function estadoConquistas() {
        const s = stats();
        const salvas = lerDesbloqueadas() || {};
        return CONQUISTAS.map(c => {
            const meta = metaDe(c, s);
            const valor = Math.min(c.valor(s), meta);
            const quando = salvas[c.id] || null;
            const desbloqueada = !!quando || c.valor(s) >= meta;
            return {
                def: c, meta: meta, valor: valor,
                progresso: meta ? Math.min(1, c.valor(s) / meta) : 0,
                desbloqueada: desbloqueada, quando: quando
            };
        });
    }

    let toastTimer = null;
    function toast(texto, nomeIcone) {
        let t = $("toastExtra");
        if (!t) {
            t = el("div", "toast-extra");
            t.id = "toastExtra";
            t.setAttribute("role", "status");
            document.body.appendChild(t);
        }
        t.innerHTML = "";
        if (nomeIcone) t.insertAdjacentHTML("beforeend", icone(nomeIcone, "icone-x"));
        t.appendChild(el("span", "", texto));
        t.classList.remove("visivel");
        void t.offsetWidth; // reinicia a animação
        t.classList.add("visivel");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("visivel"), 3600);
    }

    let primeiraAvaliacao = true;
    let fila = Promise.resolve();

    // Confere o que foi desbloqueado; avisa só das novas (a primeira conferência da visita é silenciosa)
    function avaliarConquistas() {
        const estado = estadoConquistas();
        const salvas = lerDesbloqueadas();
        const novas = estado.filter(e => e.desbloqueada && !e.quando);

        if (!novas.length) {
            if (!salvas) salvarJSON(LS_KEYS.conquistas, {});
            primeiraAvaliacao = false;
            return [];
        }

        const mapa = Object.assign({}, salvas || {});
        const agora = Date.now();
        novas.forEach(e => { mapa[e.def.id] = agora; });
        salvarJSON(LS_KEYS.conquistas, mapa);

        const silencioso = !salvas && primeiraAvaliacao; // primeira vez deste jogador: não enche a tela de avisos
        primeiraAvaliacao = false;
        if (!silencioso) {
            novas.forEach(e => {
                fila = fila.then(() => new Promise(ok => {
                    toast("Conquista desbloqueada: " + e.def.titulo, e.def.icone);
                    avisar("conquista", { id: e.def.id, titulo: e.def.titulo });
                    setTimeout(ok, 3800);
                }));
            });
        }
        emitir();
        return novas.map(e => e.def);
    }

    /* ---------- Ganchos: registrar partida, favoritar, avaliar ---------- */

    function aoJogar(id) {
        const novoDia = registrarDia();
        const d = desafioDoDia();
        let cumpriuAgora = false;
        if (d && d.id === id && !desafioCumprido()) {
            const feitos = lerJSON(LS_KEYS.desafios, {});
            feitos[hoje()] = true;
            salvarJSON(LS_KEYS.desafios, feitos);
            cumpriuAgora = true;
        }
        if (novoDia) {
            const s = streak();
            if (s.atual >= 2) avisar("sequencia", { dias: s.atual });
        }
        if (cumpriuAgora) avisar("desafio-cumprido", { id: id });
        removerDepois(id); // jogou: sai da lista "jogar depois"
        emitir();
        avaliarConquistas();
    }

    function envolver(nome, depois) {
        const original = window[nome];
        if (typeof original !== "function") return;
        window[nome] = function () {
            const r = original.apply(this, arguments);
            try { depois.apply(null, arguments); } catch (e) { /* não atrapalha o hub */ }
            return r;
        };
    }
    envolver("registrarJogada", aoJogar);
    envolver("toggleFavorito", id => {
        emitir();
        avaliarConquistas();
        const ativo = lerSeguro(() => isFavorito(id), false);
        avisar("favorito", { id: id, ativo: ativo, total: lerSeguro(() => getFavoritos().length, 0) });
    });
    envolver("avaliarJogo", () => { emitir(); avaliarConquistas(); });

    // o tempo jogado soma enquanto o player está aberto: confere ao fechar e de tempos em tempos
    const playerOverlay = $("playerOverlay");
    if (playerOverlay) {
        new MutationObserver(() => {
            if (playerOverlay.classList.contains("d-none")) setTimeout(avaliarConquistas, 400);
        }).observe(playerOverlay, { attributes: true, attributeFilter: ["class"] });
    }
    setInterval(() => { if (document.visibilityState === "visible") avaliarConquistas(); }, 20000);

    /* ---------- Diálogo simples (nome, confirmação, avisos) ---------- */

    const pilhaDialogos = [];

    function dialogo(opcoes) {
        const fundo = el("div", "extra-dialogo-fundo");
        const caixa = el("div", "extra-dialogo");
        caixa.setAttribute("role", "dialog");
        caixa.setAttribute("aria-modal", "true");
        fundo.appendChild(caixa);

        if (opcoes.titulo) caixa.appendChild(el("h2", "extra-dialogo-titulo", opcoes.titulo));
        if (opcoes.texto) caixa.appendChild(el("p", "extra-dialogo-texto", opcoes.texto));
        if (opcoes.conteudo) caixa.appendChild(opcoes.conteudo);

        let campo = null;
        if (opcoes.input) {
            campo = el("input", "extra-dialogo-input");
            campo.type = "text";
            campo.maxLength = opcoes.input.max || 24;
            campo.value = opcoes.input.valor || "";
            campo.placeholder = opcoes.input.placeholder || "";
            campo.setAttribute("aria-label", opcoes.input.rotulo || opcoes.titulo || "Nome");
            campo.autocomplete = "off";
            caixa.appendChild(campo);
        }

        const rodape = el("div", "extra-dialogo-botoes");
        let principal = null;

        const eu = {};
        function fechar() {
            document.removeEventListener("keydown", teclas, true);
            const i = pilhaDialogos.indexOf(eu);
            if (i >= 0) pilhaDialogos.splice(i, 1);
            fundo.remove();
            if (opcoes.aoFechar) opcoes.aoFechar();
        }
        function teclas(e) {
            if (pilhaDialogos[pilhaDialogos.length - 1] !== eu) return; // só o de cima responde
            if (e.key === "Escape") { e.stopPropagation(); fechar(); }
            else if (e.key === "Enter" && campo && document.activeElement === campo && principal) { e.preventDefault(); principal.click(); }
        }

        (opcoes.botoes || [{ texto: "Ok", principal: true }]).forEach(b => {
            const btn = el("button", "extra-btn" + (b.principal ? " principal" : "") + (b.perigo ? " perigo" : ""), b.texto);
            btn.type = "button";
            btn.addEventListener("click", () => {
                const r = b.acao ? b.acao(campo ? campo.value.trim() : null) : undefined;
                if (r !== false) fechar();
            });
            if (b.principal) principal = btn;
            rodape.appendChild(btn);
        });
        caixa.appendChild(rodape);

        fundo.addEventListener("click", e => { if (e.target === fundo) fechar(); });
        pilhaDialogos.push(eu);
        document.addEventListener("keydown", teclas, true);
        // Com a janela do jogo (Bootstrap) aberta, ela prende o foco do teclado:
        // o diálogo nasce dentro dela para o campo de texto funcionar.
        const hospedeiro = document.querySelector(".modal.show");
        (hospedeiro || document.body).appendChild(fundo);
        if (hospedeiro) hospedeiro.addEventListener("hidden.bs.modal", fechar, { once: true });
        setTimeout(() => { if (campo) { campo.focus(); campo.select(); } else if (principal) principal.focus(); }, 40);
        return { fechar: fechar, caixa: caixa };
    }

    /* ---------- Telas cheias (mesmo visual da Minha área) ---------- */

    function fecharMenuMobile() {
        const menu = $("menuMobileDireita");
        if (menu && window.bootstrap) {
            const inst = bootstrap.Offcanvas.getInstance(menu);
            if (inst) inst.hide();
        }
    }

    // Se a Minha área estiver aberta, fecha e só então segue (ela mexe no histórico do navegador)
    function aposFecharArea(depois) {
        const abertaArea = document.documentElement.classList.contains("area-aberta");
        const voltar = $("areaVoltar");
        if (!abertaArea || !voltar) { depois(); return; }
        let feito = false;
        const rodar = () => {
            if (feito) return;
            feito = true;
            window.removeEventListener("popstate", rodar);
            depois();
        };
        window.addEventListener("popstate", rodar);
        setTimeout(rodar, 500);
        voltar.click();
    }

    function criarTela(nome, titulo, opcoes) {
        opcoes = opcoes || {};
        const overlay = el("div", "area-overlay extra-overlay d-none");
        overlay.id = nome + "Overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", titulo);

        const topo = el("div", "area-topbar");
        const voltar = el("button", "area-btn");
        voltar.type = "button";
        voltar.innerHTML = icone("voltar", "icone-x") + '<span class="area-btn-texto">Hub</span>';
        voltar.setAttribute("aria-label", "Voltar");
        const tit = el("span", "area-titulo", titulo);
        const acoes = el("div", "extra-topo-acoes");
        topo.appendChild(voltar);
        topo.appendChild(tit);
        topo.appendChild(acoes);

        const corpo = el("div", "area-corpo");
        overlay.appendChild(topo);
        overlay.appendChild(corpo);
        document.body.appendChild(overlay);

        let aberta = false;
        const tela = {
            overlay: overlay, topo: topo, voltar: voltar, titulo: tit, acoes: acoes, corpo: corpo,
            aberta: () => aberta,
            definirTitulo: t => { tit.textContent = t; overlay.setAttribute("aria-label", t); },
            abrir: function () {
                if (aberta) return;
                fecharMenuMobile();
                aposFecharArea(() => {
                    if (window.OldNowCamadas) window.OldNowCamadas.preparar();
                    overlay.classList.remove("d-none");
                    document.documentElement.classList.add("extra-aberta");
                    aberta = true;
                    if (window.OldNowCamadas) window.OldNowCamadas.abrir(nome, interno);
                    if (opcoes.aoAbrir) opcoes.aoAbrir();
                });
            },
            fechar: function () {
                if (!aberta) return;
                if (window.OldNowCamadas) window.OldNowCamadas.fechar(nome);
                else interno();
            },
            fecharAgora: function () { if (aberta) interno(); }
        };

        function interno() {
            if (!aberta) return;
            aberta = false;
            overlay.classList.add("d-none");
            document.documentElement.classList.remove("extra-aberta");
            if (opcoes.aoFechar) opcoes.aoFechar();
        }

        voltar.addEventListener("click", () => {
            if (opcoes.aoVoltar && opcoes.aoVoltar() === false) return; // a tela tratou (voltou uma etapa)
            tela.fechar();
        });
        return tela;
    }

    // trocar de sessão: cada sessão tem os seus dados
    const sessaoOriginal = window.atualizarTelaPorSessao;
    if (typeof sessaoOriginal === "function") {
        window.atualizarTelaPorSessao = function () {
            const r = sessaoOriginal.apply(this, arguments);
            primeiraAvaliacao = true;
            avaliarConquistas();
            emitir();
            return r;
        };
    }

    avaliarConquistas(); // linha de base silenciosa

    window.OldNowDados = {
        el: el, icone: icone, ICONES: ICONES, normalizar: normalizar, fmtTempo: fmtTempo,
        jogaveis: jogaveis, jogoPorId: jogoPorId,
        hoje: hoje, streak: streak, desafioDoDia: desafioDoDia, desafioDe: desafioDe, desafioCumprido: desafioCumprido,
        getDepois: getDepois, isDepois: isDepois, addDepois: addDepois, removerDepois: removerDepois, toggleDepois: toggleDepois,
        stats: stats, conquistas: estadoConquistas, avaliarConquistas: avaliarConquistas,
        toast: toast, dialogo: dialogo, criarTela: criarTela, fecharMenuMobile: fecharMenuMobile, aposFecharArea: aposFecharArea
    };
})();