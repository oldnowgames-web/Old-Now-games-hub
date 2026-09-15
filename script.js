// Base de dados dos jogos do hub.
// categoria: 'aventura-acao' | 'simulacao-estrategia' | 'esporte-racing' | 'puzzle' | 'arcade' | null
// novo: true mostra a tag "NOVO" no card
const GAMES = [
    {
        id: "city-mind",
        titulo: "City Mind",
        descricao: "Explore, minere, garimpe e construa, crie sua cidade ou vilarejo, compre objetos e venda recursos, garimpe ouro, construa casas e móveis, tudo isso em um só jogo.",
        capa: "capas/CityMind.png",
        imgs: ["citymind/citymind1.png", "citymind/citymind2.png", "citymind/citymind3.png"],
        link: "https://oldnowgames-web.github.io/City-Mind/",
        categoria: "simulacao-estrategia",
        novo: false
    },
    {
        id: "battle-night",
        titulo: "Battle Night: Sobreviva à Horda",
        descricao: "Entre em uma aventura, escolha sua função e sobreviva às hordas de inimigos na batalha noturna.",
        capa: "capas/battlenight.png",
        imgs: ["battle/battle1.png", "battle/battle2.png", "battle/battle3.png"],
        link: "https://oldnowgames-web.github.io/Battle-Night-sobreviva-horda/",
        categoria: "aventura-acao",
        novo: false
    },
    {
        id: "farming-now",
        titulo: "Farming Now",
        descricao: "Gerencie sua fazenda! Crie animais, plante frutas, verduras e legumes, fabrique laticínios e venda produtos.",
        capa: "capas/FarmingNow.png",
        imgs: ["farming/farming1.png", "farming/farming2.png", "farming/farming3.png"],
        link: "https://oldnowgames-web.github.io/Farming-Now/",
        categoria: "simulacao-estrategia",
        novo: false
    },
    {
        id: "marte",
        titulo: "Pixel Saga: Exploração em Marte",
        descricao: "Explore o vasto planeta Marte, conheça diferentes lugares, dirija pelo terreno e descubra.",
        capa: "capas/marte.png",
        imgs: ["marte/marte1.png" , "marte/marte2.png" , "marte/marte3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Saga-Exploracao-em-Marte/",
        categoria: "simulacao-estrategia",
        novo: true
    },
    {
        id: "wow-balls",
        titulo: "Wow Balls 3D",
        descricao: "Desafie suas habilidades com física e esferas em um desafio 3D cheio de obstáculos.",
        capa: "capas/WowBalls.jpeg",
        imgs: ["wowball/wow1.png", "wowball/wow2.png", "wowball/wow3.png"],
        link: "https://oldnowgames-web.github.io/Wow-Balls-3D/",
        categoria: "aventura-acao",
        novo: false
    },
    {
        id: "pixel-saga",
        titulo: "Pixel Saga: Exploração na Lua",
        descricao: "Exploração lunar épica em pixel art.",
        capa: "capas/PixelSaga-lunar_exploration.png",
        imgs: ["pixelsagalua/lua1.png", "pixelsagalua/lua2.png", "pixelsagalua/lua3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Saga-Exploracao-na-Lua/",
        categoria: "aventura-acao",
        novo: false
    },
    {
        id: "space-clicker",
        titulo: "Space Clicker",
        descricao: "Conquiste a galáxia um clique de cada vez.",
        capa: "capas/Space_clicker.png",
        imgs: ["click/click1.png", "click/click2.png", "click/click1.png"],
        link: "https://oldnowgames-web.github.io/Space-clicker/",
        categoria: "simulacao-estrategia",
        novo: false
    },
    {
        id: "neo-drop",
        titulo: "Neo Drop",
        descricao: "Jogo desafiador de encaixe e reflexo.",
        capa: "capas/NeoDrop.png",
        imgs: ["neodrop/neo1.png", "neodrop/neo2.png", "neodrop/neo3.png"],
        link: "https://oldnowgames-web.github.io/NeoDrop/",
        categoria: "puzzle",
        novo: false
    },
    {
        id: "old-snake",
        titulo: "Old Snake",
        descricao: "O clássico jogo da cobrinha, agora com um visual retrô.",
        capa: "capas/OldSnake.png",
        imgs: ["snake/snake1.png", "snake/snake2.png", "snake/snake3.png"],
        link: "https://oldnowgames-web.github.io/Old-Snake/",
        categoria: "puzzle",
        novo: false
    },
    {
        id: "car-tape",
        titulo: "Car Tape: The Last Race",
        descricao: "Ação frenética de corrida em pixel art. Chegue primeiro antes que a fita acabe.",
        capa: "capas/CarTape.png",
        imgs: ["cartape/cartape1.png", "cartape/cartape2.png", "cartape/cartape3.png"],
        link: "https://oldnowgames-web.github.io/Car-Tape-the-last-race/",
        categoria: "esporte-racing",
        novo: false
    },
    {
        id: "aethelstar",
        titulo: "Aethelstar",
        descricao: "Aventura épica num mundo de fantasia.",
        capa: "capas/aethelstar.png",
        imgs: ["capas/aethelstar.png", "capas/aethelstar.png", "capas/aethelstar.png"],
        link: "https://oldnowgames-web.github.io/Aethelstar/",
        categoria: "arcade",
        novo: false
    },
    {
        id: "star-train",
        titulo: "Star Train",
        descricao: "Embarque em uma jornada espacial sobre trilhos entre as estrelas.",
        capa: "capas/StarTrain.png",
        imgs: ["startrain/startrain1.png", "startrain/startrain2.png", "startrain/startrain3.png"],
        link: "https://oldnowgames-web.github.io/Star-Train/",
        categoria: "arcade",
        novo: false
    },
    {
        id: "guacuano-soccer",
        titulo: "Guaçuano Soccer Game",
        descricao: "Desafie suas habilidades com física e esferas em uma partida de futebol maluca.",
        capa: "capas/guaçuano.png",
        imgs: ["guaçuano/guaçuano1.png", "guaçuano/guaçuano2.png", "guaçuano/guaçuano3.png"],
        link: "https://oldnowgames-web.github.io/Gua-uano-soccer-game/",
        categoria: "esporte-racing",
        novo: false
    },
    {
        id: "street-basquete",
        titulo: "Street Basquete",
        descricao: "Mostre suas habilidades nas quadras de basquete de rua.",
        capa: "capas/StreetBasquet.jpeg",
        imgs: ["basquet/basquet1.png", "basquet/basquet2.png", "basquet/basquet3.png"],
        link: "https://oldnowgames-web.github.io/Street-Basquete/",
        categoria: "esporte-racing",
        novo: false
    },
    {
        id: "block-star",
        titulo: "Block Star",
        descricao: "Ação frenética em pixel art empilhando blocos.",
        capa: "capas/BlockStar.png",
        imgs: ["capas/BlockStar.png", "capas/BlockStar.png", "capas/BlockStar.png"],
        link: "https://oldnowgames-web.github.io/Block-Star/",
        categoria: "arcade",
        novo: false
    },
    {
        id: "xadrez",
        titulo: "Xadrez",
        descricao: "O clássico jogo de xadrez, desafie sua mente.",
        capa: "capas/XADREZ.png",
        imgs: ["xadrez/xadrez1.png", "xadrez/xadrez2.png", "xadrez/xadrez3.png"],
        link: "https://oldnowgames-web.github.io/Xadrez-/",
        categoria: "puzzle",
        novo: false
    },
    {
        id: "damas",
        titulo: "Damas",
        descricao: "O tradicional jogo de damas em uma versão digital.",
        capa: "capas/Damas.png",
        imgs: ["damas/dama1.jpeg", "damas/dama2.jpeg", "damas/dama3.jpeg"],
        link: "https://oldnowgames-web.github.io/Damas/",
        categoria: "puzzle",
        novo: false
    },
    {
        id: "tic-tac-chaos",
        titulo: "Tic Tac Chaos",
        descricao: "O jogo da velha com um toque de caos.",
        capa: "capas/JogoVelha.jpeg",
        imgs: ["tictac/tictac1.png", "tictac/tictac2.png", "tictac/tictac3.png"],
        link: "https://oldnowgames-web.github.io/Tic-Tac-Chaos/",
        categoria: "puzzle",
        novo: false
    },
    {
        id: "pixel-dash",
        titulo: "Pixel Dash",
        descricao: "Ação frenética em pixel art.",
        capa: "capas/PixelDash.png",
        imgs: ["pixeldash/pixeldash1.png", "pixeldash/pixeldash2.png", "pixeldash/pixeldash3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Dash/",
        categoria: "aventura-acao",
        novo: true
    },
    {
        id: "labirinto-cartografico",
        titulo: "Labirinto Cartográfico",
        descricao: "Desvende labirintos cartográficos cheios de desafios.",
        capa: "capas/labirinto.png",
        imgs: ["labirinto/lab1.png", "labirinto/lab2.png", "labirinto/lab3.png"],
        link: "https://oldnowgames-web.github.io/Labirinto-cartografico/",
        categoria: "puzzle",
        novo: false
    }
];

const CATEGORIAS_INFO = [
    { id: "aventura-acao", titulo: "Aventura e Ação" },
    { id: "simulacao-estrategia", titulo: "Simulação e Estratégia" },
    { id: "esporte-racing", titulo: "Esporte e Racing" },
    { id: "puzzle", titulo: "Puzzle" },
    { id: "arcade", titulo: "Arcade" }
];

/* =========================================================
   OldNow Games — script.js
   Depende de games-data.js (GAMES, CATEGORIAS_INFO) estar
   carregado ANTES deste arquivo.
   ========================================================= */

/* ---------- Armazenamento local (favoritos, recentes, avaliações, jogadas) ---------- */

const LS_KEYS = {
    favoritos: "oldnow_favoritos",
    recentes: "oldnow_recentes",
    avaliacoes: "oldnow_avaliacoes",
    jogadas: "oldnow_jogadas"
};

function lerJSON(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch (e) {
        return padrao;
    }
}

function salvarJSON(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
        // localStorage indisponível (modo privado, cookies bloqueados etc.)
    }
}

function getFavoritos() {
    return lerJSON(LS_KEYS.favoritos, []);
}

function isFavorito(id) {
    return getFavoritos().includes(id);
}

function toggleFavorito(id) {
    let favoritos = getFavoritos();
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(f => f !== id);
    } else {
        favoritos.push(id);
    }
    salvarJSON(LS_KEYS.favoritos, favoritos);
    atualizarCoracoes(id);
    renderFavoritos();
}

function getJogadas() {
    return lerJSON(LS_KEYS.jogadas, {});
}

function registrarJogada(id) {
    const jogadas = getJogadas();
    jogadas[id] = (jogadas[id] || 0) + 1;
    salvarJSON(LS_KEYS.jogadas, jogadas);

    let recentes = lerJSON(LS_KEYS.recentes, []);
    recentes = recentes.filter(r => r !== id);
    recentes.unshift(id);
    recentes = recentes.slice(0, 12);
    salvarJSON(LS_KEYS.recentes, recentes);

    renderContinuarJogando();
}

function getAvaliacoes() {
    return lerJSON(LS_KEYS.avaliacoes, {});
}

function avaliarJogo(id, nota) {
    const avaliacoes = getAvaliacoes();
    avaliacoes[id] = nota;
    salvarJSON(LS_KEYS.avaliacoes, avaliacoes);
}

/* ---------- Construção dos cards ---------- */

function criarCardHTML(jogo) {
    const favoritoAtivo = isFavorito(jogo.id);
    const badgeNovo = jogo.novo ? '<span class="badge-novo">NOVO</span>' : "";

    return `
        <div class="bloco" data-bs-toggle="modal" data-bs-target="#modalJogo" data-id="${jogo.id}" data-titulo="${jogo.titulo}">
            ${badgeNovo}
            <button type="button" class="btn-favorito ${favoritoAtivo ? "ativo" : ""}" data-id="${jogo.id}" title="Favoritar" onclick="event.stopPropagation(); toggleFavorito('${jogo.id}');">${favoritoAtivo ? "♥" : "♡"}</button>
            <div class="bloco-img-wrap">
                <img src="${jogo.capa}" alt="${jogo.titulo}" loading="lazy" onload="this.parentElement.classList.add('carregado')" onerror="this.parentElement.classList.add('carregado')">
            </div>
        </div>`;
}

function atualizarCoracoes(id) {
    document.querySelectorAll(`.btn-favorito[data-id="${id}"]`).forEach(btn => {
        const ativo = isFavorito(id);
        btn.classList.toggle("ativo", ativo);
        btn.textContent = ativo ? "♥" : "♡";
    });
}

/* ---------- Renderização das seções ---------- */

function renderSecao(wrapperId, jogos, contadorId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    wrapper.innerHTML = jogos.map(criarCardHTML).join("");
    wrapper.style.transform = "translateX(0px)";

    if (contadorId) {
        const contadorEl = document.getElementById(contadorId);
        if (contadorEl) {
            contadorEl.textContent = jogos.length ? `· ${jogos.length} jogo${jogos.length === 1 ? "" : "s"}` : "";
        }
    }
}

function renderTodos() {
    renderSecao("wrapper-todos", GAMES, "contagem-todos");
}

function ordenarJogos(jogos, criterio) {
    const jogadas = getJogadas();
    const copia = [...jogos];
    if (criterio === "jogados") {
        copia.sort((a, b) => (jogadas[b.id] || 0) - (jogadas[a.id] || 0));
    } else {
        copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    }
    return copia;
}

function renderCategoria(catId) {
    const jogosCategoria = GAMES.filter(j => j.categoria === catId);
    const select = document.querySelector(`.filtro-ordenacao[data-categoria="${catId}"]`);
    const criterio = select ? select.value : "nome";
    renderSecao(`wrapper-${catId}`, ordenarJogos(jogosCategoria, criterio), `contagem-${catId}`);
}

function renderTodasCategorias() {
    CATEGORIAS_INFO.forEach(cat => renderCategoria(cat.id));
}

function renderFavoritos() {
    const favIds = getFavoritos();
    const jogosFav = favIds.map(id => GAMES.find(j => j.id === id)).filter(Boolean);

    const vazio = document.getElementById("favoritos-vazio");
    const controles = document.getElementById("controles-favoritos");
    if (vazio) vazio.classList.toggle("d-none", jogosFav.length > 0);
    if (controles) controles.classList.toggle("d-none", jogosFav.length === 0);

    renderSecao("wrapper-favoritos", jogosFav, "contagem-favoritos");
}

function renderContinuarJogando() {
    const secao = document.getElementById("continuar-jogando");
    if (!secao) return;

    const recentes = lerJSON(LS_KEYS.recentes, []);
    const jogosRecentes = recentes.map(id => GAMES.find(j => j.id === id)).filter(Boolean);

    secao.classList.toggle("d-none", jogosRecentes.length === 0);
    renderSecao("wrapper-continuar-jogando", jogosRecentes, null);
}

/* Renderiza tudo que depende dos dados (chamado no carregamento da página) */
renderTodos();
renderTodasCategorias();
renderFavoritos();
renderContinuarJogando();

document.querySelectorAll(".filtro-ordenacao").forEach(select => {
    select.addEventListener("change", () => renderCategoria(select.dataset.categoria));
});

/* ---------- Avaliação por estrelas ---------- */

function renderEstrelas(id) {
    const container = document.getElementById("modalEstrelas");
    if (!container) return;
    const notaSalva = getAvaliacoes()[id] || 0;
    container.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
        const span = document.createElement("span");
        span.className = "estrela" + (i <= notaSalva ? " marcada" : "");
        span.textContent = "★";
        span.addEventListener("click", () => {
            avaliarJogo(id, i);
            renderEstrelas(id);
        });
        container.appendChild(span);
    }
}

/* ---------- Player interno (iframe em tela cheia) ---------- */

function abrirPlayer(url, titulo) {
    const overlay = document.getElementById("playerOverlay");
    const iframe = document.getElementById("playerIframe");
    const tituloEl = document.getElementById("playerTitulo");
    if (!overlay || !iframe) return;

    iframe.src = url;
    if (tituloEl) tituloEl.textContent = titulo || "";
    overlay.classList.remove("d-none");
    document.body.style.overflow = "hidden";
}

function fecharPlayer() {
    const overlay = document.getElementById("playerOverlay");
    const iframe = document.getElementById("playerIframe");
    if (overlay) overlay.classList.add("d-none");
    if (iframe) iframe.src = "";
    document.body.style.overflow = "";
}

document.getElementById("playerFecharBtn")?.addEventListener("click", fecharPlayer);
document.getElementById("playerFullscreenBtn")?.addEventListener("click", () => {
    const iframe = document.getElementById("playerIframe");
    if (iframe && iframe.requestFullscreen) {
        iframe.requestFullscreen().catch(() => {});
    }
});

/* ---------- Inicializa o carrossel do topo automaticamente ---------- */

const topCarousel = document.querySelector("#carouselExample");
if (topCarousel) {
    new bootstrap.Carousel(topCarousel, {
        interval: 3500,
        ride: "carousel"
    });
}

/* ---------- Modal Dinâmico com Slider Automático ---------- */

const modalJogo = document.getElementById("modalJogo");
const carouselModalElem = document.getElementById("carouselModalJogo");
let bsCarouselModal = null;

if (modalJogo) {
    modalJogo.addEventListener("show.bs.modal", event => {
        const blocoClicado = event.relatedTarget;
        const id = blocoClicado.getAttribute("data-id");
        const jogo = GAMES.find(j => j.id === id);
        if (!jogo) return;

        modalJogo.querySelector(".modal-title").textContent = jogo.titulo;
        modalJogo.querySelector("#modalDescricao").textContent = jogo.descricao;

        const loading = document.getElementById("modalLoading");
        if (loading) loading.classList.remove("d-none");

        const img1 = modalJogo.querySelector("#modalImg1");
        const img2 = modalJogo.querySelector("#modalImg2");
        const img3 = modalJogo.querySelector("#modalImg3");

        const esconderLoading = () => loading && loading.classList.add("d-none");
        img1.onload = esconderLoading;
        img1.onerror = esconderLoading;

        img1.src = jogo.imgs[0];
        img2.src = jogo.imgs[1];
        img3.src = jogo.imgs[2];

        // Botão de favoritar dentro do modal
        const btnFavModal = document.getElementById("modalFavorito");
        if (btnFavModal) {
            btnFavModal.dataset.id = jogo.id;
            const ativo = isFavorito(jogo.id);
            btnFavModal.classList.toggle("ativo", ativo);
            btnFavModal.textContent = ativo ? "♥ Favoritado" : "♡ Favoritar";
        }

        renderEstrelas(jogo.id);

        // Botão Jogar Agora / link alternativo
        const temLink = jogo.link && jogo.link !== "#";
        const btnJogar = document.getElementById("modalBotaoJogar");
        const linkNovaAba = document.getElementById("modalLinkNovaAba");

        if (btnJogar) {
            btnJogar.disabled = !temLink;
            btnJogar.textContent = temLink ? "Jogar Agora" : "Em breve";
            btnJogar.onclick = () => {
                if (!temLink) return;
                registrarJogada(jogo.id);
                bootstrap.Modal.getInstance(modalJogo)?.hide();
                abrirPlayer(jogo.link, jogo.titulo);
            };
        }
        if (linkNovaAba) {
            if (temLink) {
                linkNovaAba.href = jogo.link;
                linkNovaAba.classList.remove("d-none");
            } else {
                linkNovaAba.classList.add("d-none");
            }
        }

        if (!bsCarouselModal) {
            bsCarouselModal = new bootstrap.Carousel(carouselModalElem, {
                interval: 3000,
                ride: "carousel"
            });
        } else {
            bsCarouselModal.to(0);
            bsCarouselModal.cycle();
        }
    });

    modalJogo.addEventListener("hidden.bs.modal", () => {
        if (bsCarouselModal) bsCarouselModal.pause();
    });
}

document.getElementById("modalFavorito")?.addEventListener("click", e => {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    toggleFavorito(id);
    const ativo = isFavorito(id);
    e.currentTarget.classList.toggle("ativo", ativo);
    e.currentTarget.textContent = ativo ? "♥ Favoritado" : "♡ Favoritar";
});

/* ---------- Script dos Carrosséis de Jogos (arrastar/setas) ---------- */

document.querySelectorAll(".secao-carrossel").forEach(secao => {
    const wrapper = secao.querySelector(".blocos-wrapper");
    const containerBlocos = secao.querySelector(".blocos");
    const nextBtn = secao.querySelector(".next");
    const prevBtn = secao.querySelector(".prev");
    if (!wrapper || !containerBlocos || !nextBtn || !prevBtn) return;

    let index = 0;

    function calcularPasso() {
        const bloco = secao.querySelector(".bloco");
        if (!bloco) return 0;
        const estilo = window.getComputedStyle(bloco);
        const margemEsq = parseFloat(estilo.marginLeft) || 0;
        const margemDir = parseFloat(estilo.marginRight) || 0;
        return bloco.getBoundingClientRect().width + margemEsq + margemDir;
    }

    function atualizarCarrossel() {
        const larguraTotalBloco = calcularPasso();
        if (larguraTotalBloco === 0) return;
        wrapper.style.transform = `translateX(${-index * larguraTotalBloco}px)`;
    }

    nextBtn.addEventListener("click", () => {
        const larguraTotalBloco = calcularPasso();
        const totalBlocos = wrapper.children.length;
        const larguraVisivel = containerBlocos.clientWidth;
        const blocosVisiveis = Math.floor(larguraVisivel / larguraTotalBloco) || 1;

        if (index < totalBlocos - blocosVisiveis) {
            index++;
            atualizarCarrossel();
        }
    });

    prevBtn.addEventListener("click", () => {
        if (index > 0) {
            index--;
            atualizarCarrossel();
        }
    });

    let startX = 0;
    let endX = 0;

    containerBlocos.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    containerBlocos.addEventListener("touchend", e => {
        endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        if (Math.abs(diffX) > 40) {
            if (diffX > 0) nextBtn.click();
            else prevBtn.click();
        }
    }, { passive: true });

    window.addEventListener("resize", () => {
        index = 0;
        atualizarCarrossel();
    });
});

/* ---------- Busca de Jogos (filtra a seção "Todos" em tempo real) ---------- */

const secaoTodos = document.getElementById("todos");

if (secaoTodos) {
    const mensagemVazia = secaoTodos.querySelector(".sem-resultados");
    const wrapperTodos = secaoTodos.querySelector(".blocos-wrapper");
    const inputsBusca = document.querySelectorAll(".input-busca");

    function filtrarJogos(termo) {
        const termoBusca = termo.trim().toLowerCase();
        const blocosTodos = secaoTodos.querySelectorAll(".bloco");
        let algumEncontrado = false;

        blocosTodos.forEach(bloco => {
            const titulo = (bloco.getAttribute("data-titulo") || "").toLowerCase();
            const corresponde = titulo.includes(termoBusca);
            bloco.style.display = corresponde ? "" : "none";
            if (corresponde) algumEncontrado = true;
        });

        if (wrapperTodos) wrapperTodos.style.transform = "translateX(0px)";

        if (mensagemVazia) {
            mensagemVazia.classList.toggle("d-none", algumEncontrado || termoBusca === "");
        }

        if (termoBusca !== "") {
            secaoTodos.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    inputsBusca.forEach(input => {
        input.addEventListener("input", () => {
            inputsBusca.forEach(outroInput => {
                if (outroInput !== input) outroInput.value = input.value;
            });
            filtrarJogos(input.value);
        });

        input.closest("form")?.addEventListener("submit", e => {
            e.preventDefault();
            filtrarJogos(input.value);
        });
    });
}