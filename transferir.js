/* =========================================================
   OldNow Games — transferir.js
   Passa os dados do hub de um aparelho para outro, SEM servidor.

   Como funciona:
   - Exportar: junta a sessão (nome, cor, foto) e os dados do jogador
     (favoritos, recentes, avaliações, jogadas, tempo, Minha área,
     coleções, jogar depois, conquistas, dias e desafios) num texto
     compactado: o "código" (ONG1.xxxxxxxx.yyyy...).
     Dá para copiar, compartilhar ou baixar como arquivo .txt.
   - Importar: cola o código (ou escolhe o arquivo), o hub mostra o que
     veio e o que será substituído neste aparelho, e só grava depois
     de a pessoa confirmar. Se algo der errado, o que existia volta.

   O código leva um selo (CRC) para detectar texto cortado/alterado.
   Só entram chaves conhecidas do hub e todo texto é limpo (<, >).

   Carregar DEPOIS do tela-entrada.js e do perfil.js.
   ========================================================= */
(function transferirDados() {
    "use strict";

    const PREFIXO_COMPACTADO = "ONG1";   // dados compactados (deflate)
    const PREFIXO_SIMPLES = "ONG0";      // sem compactar (navegador antigo)
    const CHAVE_SESSAO = "oldnow_sessao";
    const CHAVE_MODO = "oldnow_modo";
    const NOME_MAX = 20;
    const MAX_CODIGO_CHARS = 8 * 1024 * 1024;
    const MAX_JSON_BYTES = 8 * 1024 * 1024;
    const MAX_ARQUIVO_BYTES = 10 * 1024 * 1024;

    // chave -> tipo esperado
    const TIPOS = {
        oldnow_favoritos: "array",
        oldnow_recentes: "array",
        oldnow_avaliacoes: "objeto",
        oldnow_jogadas: "objeto",
        oldnow_area: "objeto",
        oldnow_tempo: "objeto",
        oldnow_colecoes: "array",
        oldnow_depois: "array",
        oldnow_conquistas: "objeto",
        oldnow_dias: "array",
        oldnow_desafios: "objeto"
    };
    const CHAVES_DADOS = Object.keys(TIPOS);

    const RX_FOTO = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+\/=]+$/i;
    const RX_IMAGEM_FUNDO = /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+\/=]+$/i;
    const RX_COR = /^#[0-9a-f]{6}$/i;

    /* ---------- Utilidades ---------- */

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto != null) e.textContent = texto;
        return e;
    }

    function ehObjeto(v) {
        return v !== null && typeof v === "object" && !Array.isArray(v);
    }

    function lerChave(storage, chave) {
        try {
            const bruto = storage.getItem(chave);
            return bruto == null ? null : JSON.parse(bruto);
        } catch (e) {
            return null;
        }
    }

    function tipoOk(valor, tipo) {
        return tipo === "array" ? Array.isArray(valor) : ehObjeto(valor);
    }

    function lerSessaoLocal() {
        const s = lerChave(localStorage, CHAVE_SESSAO);
        return ehObjeto(s) && typeof s.nome === "string" && s.nome ? s : null;
    }

    function limparNome(texto) {
        const limpo = String(texto || "")
            .replace(/[<>&"'`\\]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return Array.from(limpo).slice(0, NOME_MAX).join("").trim();
    }

    function fmtTempo(ms) {
        ms = Number(ms) || 0;
        const min = Math.floor(ms / 60000);
        if (min < 1) return ms >= 10000 ? "menos de 1 min" : "nenhum";
        if (min < 60) return min + " min";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m ? h + "h " + m + "min" : h + "h";
    }

    /* ---------- CRC32 (selo do código) ---------- */

    const TABELA_CRC = (function () {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(bytes) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
        return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, "0");
    }

    /* ---------- base64 (versão segura para URL) e compactação ---------- */

    function paraBase64Url(bytes) {
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    function deBase64Url(texto) {
        let b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }

    const temCompactacao = typeof CompressionStream === "function" && typeof DecompressionStream === "function";

    async function compactar(bytes) {
        const cs = new CompressionStream("deflate-raw");
        const w = cs.writable.getWriter();
        w.write(bytes).catch(() => {});
        w.close().catch(() => {});
        return new Uint8Array(await new Response(cs.readable).arrayBuffer());
    }

    // descompacta com limite, para um código malicioso não encher a memória
    async function descompactar(bytes) {
        const ds = new DecompressionStream("deflate-raw");
        const w = ds.writable.getWriter();
        w.write(bytes).catch(() => {});
        w.close().catch(() => {});
        const leitor = ds.readable.getReader();
        const partes = [];
        let total = 0;
        for (;;) {
            const r = await leitor.read();
            if (r.done) break;
            total += r.value.length;
            if (total > MAX_JSON_BYTES) {
                try { await leitor.cancel(); } catch (e) { /* ignora */ }
                throw new Error("grande");
            }
            partes.push(r.value);
        }
        const saida = new Uint8Array(total);
        let pos = 0;
        partes.forEach(p => { saida.set(p, pos); pos += p.length; });
        return saida;
    }

    /* ---------- Montar o pacote (exportar) ---------- */

    function armazenamentoAtual() {
        try { if (window.OldNowSessao) return window.OldNowSessao.storage(); } catch (e) { /* ignora */ }
        return localStorage;
    }

    function dadosAtuais() {
        const st = armazenamentoAtual();
        const dados = {};
        CHAVES_DADOS.forEach(chave => {
            const v = lerChave(st, chave);
            if (v !== null && tipoOk(v, TIPOS[chave])) dados[chave] = v;
        });
        return dados;
    }

    function temFotos(pacote) {
        const area = pacote.dados.oldnow_area;
        return !!(pacote.sessao.foto || (area && area.fundo && area.fundo.tipo === "imagem"));
    }

    function montarPacote(incluirFotos) {
        const s = lerSessaoLocal();
        if (!s) return null;
        const sessao = { nome: s.nome, criadaEm: Number(s.criadaEm) || Date.now() };
        if (RX_COR.test(s.cor || "")) sessao.cor = s.cor;
        if (incluirFotos && typeof s.foto === "string" && RX_FOTO.test(s.foto)) sessao.foto = s.foto;

        const dados = dadosAtuais();
        if (!incluirFotos && dados.oldnow_area && dados.oldnow_area.fundo && dados.oldnow_area.fundo.tipo === "imagem") {
            const copia = Object.assign({}, dados.oldnow_area);
            delete copia.fundo;
            dados.oldnow_area = copia;
        }
        return { app: "oldnow", v: 1, criadoEm: Date.now(), sessao: sessao, dados: dados };
    }

    async function gerarCodigo(pacote) {
        const bytes = new TextEncoder().encode(JSON.stringify(pacote));
        let prefixo = PREFIXO_SIMPLES;
        let corpo = bytes;
        if (temCompactacao) {
            try { corpo = await compactar(bytes); prefixo = PREFIXO_COMPACTADO; } catch (e) { corpo = bytes; }
        }
        return prefixo + "." + crc32(corpo) + "." + paraBase64Url(corpo);
    }

    /* ---------- Ler e validar um código (importar) ---------- */

    // limpa recursivamente: tira < e >, ignora chaves perigosas, limita tamanhos
    function higienizar(v, prof) {
        if (prof > 8) return null;
        if (typeof v === "string") return v.replace(/[<>]/g, "").slice(0, 1500000);
        if (typeof v === "number") return Number.isFinite(v) ? v : 0;
        if (typeof v === "boolean" || v === null) return v;
        if (Array.isArray(v)) return v.slice(0, 5000).map(x => higienizar(x, prof + 1));
        if (ehObjeto(v)) {
            const saida = {};
            Object.keys(v).slice(0, 5000).forEach(k => {
                if (k === "__proto__" || k === "constructor" || k === "prototype") return;
                saida[k.replace(/[<>]/g, "").slice(0, 200)] = higienizar(v[k], prof + 1);
            });
            return saida;
        }
        return null;
    }

    function validarPacote(obj) {
        if (!ehObjeto(obj) || obj.app !== "oldnow" || obj.v !== 1 || !ehObjeto(obj.sessao)) {
            throw new Error("Esse código não é do OldNow Games.");
        }
        const nome = limparNome(obj.sessao.nome);
        if (!nome) throw new Error("O código não tem um nome de sessão válido.");

        const sessao = { nome: nome, criadaEm: Number(obj.sessao.criadaEm) > 0 ? Number(obj.sessao.criadaEm) : Date.now() };
        if (RX_COR.test(obj.sessao.cor || "")) sessao.cor = String(obj.sessao.cor).toLowerCase();
        if (typeof obj.sessao.foto === "string" && obj.sessao.foto.length < 400000 && RX_FOTO.test(obj.sessao.foto)) {
            sessao.foto = obj.sessao.foto;
        }

        const dados = {};
        const bruto = ehObjeto(obj.dados) ? obj.dados : {};
        CHAVES_DADOS.forEach(chave => {
            if (!(chave in bruto) || !tipoOk(bruto[chave], TIPOS[chave])) return;
            dados[chave] = higienizar(bruto[chave], 0);
        });

        // fundo da Minha área: só imagem válida ou cor válida
        const area = dados.oldnow_area;
        if (area && area.fundo !== undefined) {
            const f = area.fundo;
            const ok = ehObjeto(f) && (
                (f.tipo === "imagem" && typeof f.valor === "string" && RX_IMAGEM_FUNDO.test(f.valor)) ||
                (f.tipo === "cor" && typeof f.valor === "string" && RX_COR.test(f.valor))
            );
            if (!ok) delete area.fundo;
        }
        return { sessao: sessao, dados: dados };
    }

    // Acha o código dentro de um texto qualquer (ex.: mensagem do WhatsApp com
    // "Meu código:" antes, "valeu!" depois ou quebras de linha no meio).
    // O selo (CRC) decide onde o código termina de verdade.
    function extrairCodigo(texto) {
        const pedacos = String(texto).split(/\s+/).filter(Boolean);
        for (let i = 0; i < pedacos.length; i++) {
            const m = pedacos[i].match(/(ONG[01])\.([0-9a-fA-F]{8})\.([A-Za-z0-9_-]*)/);
            if (!m) continue;
            const partes = [m[3]];
            // se o pedaço tinha algo depois do código (pontuação), o código acabou ali
            let aberto = pedacos[i].length === m.index + m[0].length;
            for (let j = i + 1; aberto && j < pedacos.length; j++) {
                const c = pedacos[j].match(/^[A-Za-z0-9_-]+/);
                if (!c) break;
                partes.push(c[0]);
                aberto = c[0].length === pedacos[j].length;
            }
            // tenta do mais longo para o mais curto: palavras coladas no fim (ex.: "valeu") caem fora
            for (let k = partes.length; k >= Math.max(1, partes.length - 30); k--) {
                let bytes;
                try { bytes = deBase64Url(partes.slice(0, k).join("")); } catch (e) { continue; }
                if (crc32(bytes) === m[2].toLowerCase()) return { prefixo: m[1], bytes: bytes };
            }
            return { prefixo: m[1], bytes: null };
        }
        return null;
    }

    async function lerCodigo(textoColado) {
        const texto = String(textoColado || "");
        if (!texto.trim()) throw new Error("Cole o código ou escolha o arquivo.");
        if (texto.length > MAX_CODIGO_CHARS) throw new Error("Esse texto é grande demais para ser um código do hub.");

        const achado = extrairCodigo(texto);
        if (!achado) throw new Error("Não achei um código do OldNow Games nesse texto. Ele começa com ONG1.");
        if (!achado.bytes) throw new Error("O código está incompleto ou foi alterado. Copie de novo, inteiro.");
        let bytes = achado.bytes;

        let json;
        if (achado.prefixo === PREFIXO_COMPACTADO) {
            if (!temCompactacao) throw new Error("Este navegador é antigo demais para ler o código. Atualize o navegador e tente de novo.");
            try { bytes = await descompactar(bytes); } catch (e) { throw new Error("Não consegui abrir o código. Copie de novo."); }
        } else if (bytes.length > MAX_JSON_BYTES) {
            throw new Error("Esse código é grande demais.");
        }
        try { json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch (e) { throw new Error("O conteúdo do código está danificado."); }
        return validarPacote(json);
    }

    /* ---------- Resumo (para a pessoa conferir) ---------- */

    function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

    function resumir(sessao, dados) {
        const linhas = [];
        const fav = (dados.oldnow_favoritos || []).length;
        const jogados = Object.keys(dados.oldnow_jogadas || {}).length;
        const tempoTotal = Object.keys(dados.oldnow_tempo || {}).reduce((a, k) => a + (Number(dados.oldnow_tempo[k]) || 0), 0);
        const colecoes = (dados.oldnow_colecoes || []).length;
        const conquistas = Object.keys(dados.oldnow_conquistas || {}).length;
        const area = dados.oldnow_area;
        const jogosArea = area && Array.isArray(area.jogos) ? area.jogos.length : 0;
        const avaliacoes = Object.keys(dados.oldnow_avaliacoes || {}).length;

        linhas.push("Sessão: " + (sessao ? sessao.nome : "nenhuma"));
        linhas.push(plural(fav, "favorito", "favoritos"));
        linhas.push(plural(jogados, "jogo jogado", "jogos jogados") + " · tempo total: " + fmtTempo(tempoTotal));
        linhas.push(plural(avaliacoes, "avaliação", "avaliações") + " · " + plural(conquistas, "conquista", "conquistas"));
        linhas.push(plural(colecoes, "coleção", "coleções") + " · Minha área: " + plural(jogosArea, "jogo", "jogos"));
        if (sessao && sessao.foto) linhas.push("Foto do perfil: sim");
        return linhas;
    }

    /* ---------- Gravar (substituir) ---------- */

    function aplicarImportacao(pacote) {
        // para a contagem de tempo do jogo aberto (ela gravaria por cima do que chegou)
        try { if (window.OldNowTempo && window.OldNowTempo.parar) window.OldNowTempo.parar(); } catch (e) { /* ignora */ }

        const todas = CHAVES_DADOS.concat([CHAVE_SESSAO]);
        const backup = {};
        todas.forEach(k => { try { backup[k] = localStorage.getItem(k); } catch (e) { backup[k] = null; } });
        let modoAntes = null;
        try { modoAntes = sessionStorage.getItem(CHAVE_MODO); } catch (e) { /* ignora */ }

        try {
            todas.forEach(k => localStorage.removeItem(k));
            localStorage.setItem(CHAVE_SESSAO, JSON.stringify(pacote.sessao));
            Object.keys(pacote.dados).forEach(k => localStorage.setItem(k, JSON.stringify(pacote.dados[k])));
            sessionStorage.setItem(CHAVE_MODO, "sessao");
        } catch (erro) {
            // desfaz: devolve o que existia antes
            todas.forEach(k => {
                try {
                    localStorage.removeItem(k);
                    if (backup[k] != null) localStorage.setItem(k, backup[k]);
                } catch (e) { /* ignora */ }
            });
            try {
                if (modoAntes == null) sessionStorage.removeItem(CHAVE_MODO);
                else sessionStorage.setItem(CHAVE_MODO, modoAntes);
            } catch (e) { /* ignora */ }
            throw new Error("Não deu para gravar neste navegador (armazenamento cheio ou bloqueado). Nada foi alterado.");
        }

        // dados de "sem sessão" desta visita já não valem
        CHAVES_DADOS.forEach(k => { try { sessionStorage.removeItem(k); } catch (e) { /* ignora */ } });
    }

    /* ---------- Janelinha ---------- */

    let overlay = null;
    let caixa = null;
    let corpo = null;
    let focoAnterior = null;

    function montarJanela() {
        if (overlay) return;
        overlay = el("div", "trf-overlay");
        overlay.hidden = true;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Transferir dados");

        caixa = el("div", "trf-caixa");
        const fechar = el("button", "trf-fechar", "✕");
        fechar.type = "button";
        fechar.setAttribute("aria-label", "Fechar");
        fechar.addEventListener("click", fecharJanela);
        corpo = el("div", "trf-corpo");

        caixa.appendChild(fechar);
        caixa.appendChild(corpo);
        overlay.appendChild(caixa);
        document.body.appendChild(overlay);

        let apertouFora = false;
        overlay.addEventListener("mousedown", e => { apertouFora = e.target === overlay; });
        overlay.addEventListener("click", e => { if (e.target === overlay && apertouFora) fecharJanela(); });

        // Esc fecha só esta janela (captura: roda antes dos outros ouvintes)
        document.addEventListener("keydown", e => {
            if (e.key !== "Escape" || !overlay || overlay.hidden) return;
            e.stopPropagation();
            fecharJanela();
        }, true);
    }

    function abrirJanela() {
        montarJanela();
        if (overlay.hidden) {
            focoAnterior = document.activeElement;
            overlay.hidden = false;
            document.documentElement.classList.add("trf-aberta");
        }
    }

    function fecharJanela() {
        if (!overlay || overlay.hidden) return;
        overlay.hidden = true;
        document.documentElement.classList.remove("trf-aberta");
        corpo.textContent = "";
        if (focoAnterior && typeof focoAnterior.focus === "function") {
            try { focoAnterior.focus(); } catch (e) { /* ignora */ }
        }
        focoAnterior = null;
    }

    function botao(texto, classe, aoClicar) {
        const b = el("button", "trf-btn" + (classe ? " " + classe : ""), texto);
        b.type = "button";
        b.addEventListener("click", aoClicar);
        return b;
    }

    function lista(linhas) {
        const ul = el("ul", "trf-lista");
        linhas.forEach(t => ul.appendChild(el("li", "", t)));
        return ul;
    }

    /* ----- Exportar ----- */

    async function copiarTexto(texto, areaTexto) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (e) {
            try {
                areaTexto.focus();
                areaTexto.select();
                return document.execCommand("copy");
            } catch (e2) {
                return false;
            }
        }
    }

    async function mostrarExportar() {
        const completo = montarPacote(true);
        if (!completo) { avisoSemSessao(); return; }
        abrirJanela();
        corpo.textContent = "";

        corpo.appendChild(el("h2", "trf-titulo", "Exportar meus dados"));
        corpo.appendChild(el("p", "trf-texto", "Copie o código abaixo e, no outro aparelho, toque na bolinha do perfil e em “Importar dados”."));

        let incluirFotos = true;
        let caixaFotos = null;
        if (temFotos(completo)) {
            const rotulo = el("label", "trf-check");
            caixaFotos = document.createElement("input");
            caixaFotos.type = "checkbox";
            caixaFotos.checked = true;
            rotulo.appendChild(caixaFotos);
            rotulo.appendChild(el("span", "", "Incluir fotos (perfil e fundo da Minha área)"));
            corpo.appendChild(rotulo);
        }

        const areaTexto = el("textarea", "trf-codigo");
        areaTexto.readOnly = true;
        areaTexto.rows = 5;
        areaTexto.setAttribute("aria-label", "Código para transferir");
        areaTexto.addEventListener("focus", () => areaTexto.select());
        corpo.appendChild(areaTexto);

        const info = el("p", "trf-info");
        corpo.appendChild(info);
        corpo.appendChild(lista(resumir(completo.sessao, completo.dados)));

        const acoes = el("div", "trf-acoes");
        const status = el("p", "trf-status");
        status.setAttribute("role", "status");
        let codigoAtual = "";

        const bCopiar = botao("Copiar código", "trf-btn-principal", async () => {
            if (!codigoAtual) return;
            status.textContent = (await copiarTexto(codigoAtual, areaTexto)) ? "Código copiado!" : "Não consegui copiar sozinho: segure no texto e copie.";
        });
        acoes.appendChild(bCopiar);

        if (typeof navigator.share === "function") {
            acoes.appendChild(botao("Compartilhar", "", async () => {
                if (!codigoAtual) return;
                try {
                    await navigator.share({ title: "Meus dados do OldNow Games", text: codigoAtual });
                } catch (e) { /* cancelou */ }
            }));
        }

        acoes.appendChild(botao("Baixar arquivo", "", () => {
            if (!codigoAtual) return;
            const blob = new Blob([codigoAtual], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const d = new Date();
            const dia = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
            a.href = url;
            a.download = "oldnow-dados-" + dia + ".txt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            status.textContent = "Arquivo baixado.";
        }));

        corpo.appendChild(acoes);
        corpo.appendChild(status);
        corpo.appendChild(el("p", "trf-aviso", "Não poste esse código em público: ele tem seu nome e seus dados do hub."));

        async function atualizar() {
            const pacote = montarPacote(incluirFotos);
            areaTexto.value = "Gerando…";
            codigoAtual = "";
            try {
                codigoAtual = await gerarCodigo(pacote);
                areaTexto.value = codigoAtual;
                const kb = codigoAtual.length / 1024;
                info.textContent = "Código com " + (kb < 10 ? kb.toFixed(1) : Math.round(kb)) + " KB" +
                    (kb > 200 ? " (grande por causa das imagens; se preferir, desmarque as fotos)" : "") + ".";
            } catch (e) {
                areaTexto.value = "";
                info.textContent = "Não consegui gerar o código.";
            }
        }

        if (caixaFotos) {
            caixaFotos.addEventListener("change", () => { incluirFotos = caixaFotos.checked; status.textContent = ""; atualizar(); });
        }
        await atualizar();
        bCopiar.focus();
    }

    function avisoSemSessao() {
        abrirJanela();
        corpo.textContent = "";
        corpo.appendChild(el("h2", "trf-titulo", "Exportar meus dados"));
        corpo.appendChild(el("p", "trf-texto", "Só dá para exportar com uma sessão salva. Toque em “Entrar”, crie uma sessão e use o hub um pouco antes de exportar."));
        const acoes = el("div", "trf-acoes");
        acoes.appendChild(botao("Entendi", "trf-btn-principal", fecharJanela));
        corpo.appendChild(acoes);
    }

    /* ----- Importar ----- */

    function mostrarImportar() {
        abrirJanela();
        corpo.textContent = "";

        corpo.appendChild(el("h2", "trf-titulo", "Importar dados"));
        corpo.appendChild(el("p", "trf-texto", "Cole o código gerado no outro aparelho (ou escolha o arquivo .txt)."));

        const areaTexto = el("textarea", "trf-codigo");
        areaTexto.rows = 5;
        areaTexto.placeholder = "ONG1.xxxxxxxx.…";
        areaTexto.setAttribute("aria-label", "Código para importar");
        areaTexto.autocapitalize = "off";
        areaTexto.spellcheck = false;
        corpo.appendChild(areaTexto);

        const erro = el("p", "trf-erro");
        erro.setAttribute("role", "alert");
        erro.hidden = true;
        corpo.appendChild(erro);

        const arquivo = document.createElement("input");
        arquivo.type = "file";
        arquivo.accept = ".txt,text/plain";
        arquivo.className = "trf-arquivo";
        arquivo.addEventListener("change", async () => {
            const f = arquivo.files && arquivo.files[0];
            arquivo.value = "";
            if (!f) return;
            if (f.size > MAX_ARQUIVO_BYTES) { mostrarErro("Esse arquivo é grande demais."); return; }
            try { areaTexto.value = await f.text(); erro.hidden = true; } catch (e) { mostrarErro("Não consegui ler o arquivo."); }
        });

        function mostrarErro(msg) {
            erro.textContent = msg;
            erro.hidden = false;
        }

        const acoes = el("div", "trf-acoes");
        acoes.appendChild(botao("Escolher arquivo", "", () => arquivo.click()));
        acoes.appendChild(botao("Ler código", "trf-btn-principal", async () => {
            erro.hidden = true;
            try {
                const pacote = await lerCodigo(areaTexto.value);
                mostrarConfirmacao(pacote);
            } catch (e) {
                mostrarErro(e && e.message ? e.message : "Não consegui ler o código.");
            }
        }));
        corpo.appendChild(acoes);
        corpo.appendChild(arquivo);
        corpo.appendChild(el("p", "trf-aviso", "Nada é gravado agora: primeiro você confere o que veio e confirma."));
        setTimeout(() => areaTexto.focus(), 60);
    }

    function mostrarConfirmacao(pacote) {
        corpo.textContent = "";
        corpo.appendChild(el("h2", "trf-titulo", "Conferir antes de importar"));

        corpo.appendChild(el("p", "trf-subtitulo", "Dados que estão no código"));
        corpo.appendChild(lista(resumir(pacote.sessao, pacote.dados)));

        const atual = lerSessaoLocal();
        const dadosAqui = {};
        CHAVES_DADOS.forEach(k => {
            const v = lerChave(localStorage, k);
            if (v !== null && tipoOk(v, TIPOS[k])) dadosAqui[k] = v;
        });

        const alerta = el("div", "trf-alerta");
        alerta.appendChild(el("p", "trf-alerta-titulo", "⚠ Isso vai SUBSTITUIR tudo o que está neste aparelho"));
        alerta.appendChild(el("p", "trf-texto", atual
            ? "Hoje aqui existe esta sessão, que será apagada:"
            : "Neste aparelho não existe sessão salva, então não há nada para perder."));
        if (atual) alerta.appendChild(lista(resumir(atual, dadosAqui)));
        corpo.appendChild(alerta);

        const erro = el("p", "trf-erro");
        erro.setAttribute("role", "alert");
        erro.hidden = true;
        corpo.appendChild(erro);

        const acoes = el("div", "trf-acoes");
        acoes.appendChild(botao("Voltar", "", mostrarImportar));
        const confirmar = botao("Substituir e importar", "trf-btn-perigo", () => {
            confirmar.disabled = true;
            try {
                aplicarImportacao(pacote);
            } catch (e) {
                erro.textContent = e.message;
                erro.hidden = false;
                confirmar.disabled = false;
                return;
            }
            corpo.textContent = "";
            corpo.appendChild(el("h2", "trf-titulo", "Pronto!"));
            corpo.appendChild(el("p", "trf-texto", "Dados importados. Recarregando o hub…"));
            setTimeout(() => location.reload(), 700);
        });
        acoes.appendChild(confirmar);
        corpo.appendChild(acoes);
        setTimeout(() => acoes.firstChild.focus(), 60);
    }

    /* ---------- Ligar nos botões do hub ---------- */

    function fecharMenuDoAvatar() {
        const menu = document.getElementById("sessaoMenu");
        const avatar = document.getElementById("sessaoAvatar");
        if (menu) menu.classList.add("d-none");
        if (avatar) avatar.setAttribute("aria-expanded", "false");
    }

    // 1) Menu da bolinha do perfil
    (function () {
        const trocar = document.getElementById("sessaoTrocar");
        if (!trocar || !trocar.parentNode) return;
        const bExportar = el("button", "", "Exportar meus dados");
        bExportar.type = "button";
        bExportar.setAttribute("role", "menuitem");
        bExportar.addEventListener("click", () => { fecharMenuDoAvatar(); mostrarExportar(); });
        const bImportar = el("button", "", "Importar dados");
        bImportar.type = "button";
        bImportar.setAttribute("role", "menuitem");
        bImportar.addEventListener("click", () => { fecharMenuDoAvatar(); mostrarImportar(); });
        trocar.parentNode.insertBefore(bExportar, trocar);
        trocar.parentNode.insertBefore(bImportar, trocar);
    })();

    // 2) Tela de entrada: "Importar de outro aparelho" (para quem acabou de instalar)
    (function () {
        ["nova", "retorno"].forEach(nome => {
            const view = document.querySelector('#telaEntrada [data-view="' + nome + '"]');
            if (!view) return;
            const b = el("button", "entrada-btn entrada-btn-secundario", "Importar de outro aparelho");
            b.type = "button";
            b.addEventListener("click", mostrarImportar);
            view.appendChild(b);
        });
    })();

    window.OldNowTransferir = { exportar: mostrarExportar, importar: mostrarImportar };
})();