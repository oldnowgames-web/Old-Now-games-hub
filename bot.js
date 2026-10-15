/* =========================================================
   OldNow Games — bot.js  (Old bot v2)
   Assistente do hub, 100% no navegador (sem IA externa).

   O que ele faz:
   - entende frases livres: pontua várias intenções e escolhe a melhor
   - corrige erros de digitação ("corida", "farmin") e abreviações (vc, pq, vlw)
   - busca jogos por título, tags, sinônimos, descrição e categoria
   - recomenda de forma personalizada (favoritos, mais jogados, notas)
   - lembra do contexto ("outro", "esse", "parecido com ele", "sim")
   - mostra mini cards de jogos dentro do chat
   - executa ações: abrir jogo, favoritar, avaliar, abrir Minha área,
     instalar o app, ir para uma seção, abrir o Instagram
   - guarda a conversa durante a visita (sessionStorage)

   Para ensinar algo novo ao bot, edite as tabelas lá embaixo:
   TAGS (palavras por jogo), SINONIMOS (grupos de palavras),
   FAQS (perguntas frequentes) e PIADAS / CURIOSIDADES.
   ========================================================= */

(function assistenteOldNow() {
    "use strict";

    const toggle = document.getElementById("botToggle");
    const painel = document.getElementById("botPainel");
    const fechar = document.getElementById("botFechar");
    const mensagens = document.getElementById("botMensagens");
    const form = document.getElementById("botForm");
    const input = document.getElementById("botInput");
    if (!toggle || !painel || !form || !mensagens || !input) return;
    if (typeof GAMES === "undefined" || !Array.isArray(GAMES)) return;

    /* ---------- Acesso seguro às funções do script.js ---------- */

    function seguro(fn, padrao) {
        try { const v = fn(); return v === undefined ? padrao : v; } catch (e) { return padrao; }
    }
    const favoritosIds = () => seguro(() => getFavoritos(), []);
    const jogadasMap = () => seguro(() => getJogadas(), {});
    const avaliacoesMap = () => seguro(() => getAvaliacoes(), {});
    const temposMap = () => seguro(() => (typeof getTempos === "function" ? getTempos() : {}), {});
    const fmtTempo = ms => seguro(() => (typeof formatarTempo === "function" ? formatarTempo(ms) : ""), "");
    const recentesIds = () => seguro(() => lerJSON(LS_KEYS.recentes, []), []);
    const nomeJogador = () => seguro(() => window.OldNowSessao && window.OldNowSessao.nome(), null);
    const CATS = seguro(() => CATEGORIAS_INFO, []);
    const catTitulo = id => { const c = CATS.find(x => x.id === id); return c ? c.titulo : "outras"; };
    const ehMobile = () => window.matchMedia && window.matchMedia("(max-width: 991px)").matches;

    const DISPONIVEIS = GAMES.filter(j => j.link && j.link !== "#");
    const jogoPorId = id => GAMES.find(j => j.id === id);

    /* =========================================================
       CONHECIMENTO (edite aqui)
       ========================================================= */

    // Palavras de cada jogo (além do título, descrição e categoria).
    // Chave = id do jogo no GAMES. Se um jogo tiver `tags: [...]` no script.js, elas também entram.
    const TAGS = {
        "city-mind": "construir cidade vilarejo minerar garimpar ouro casas moveis recursos economia sandbox explorar vender comprar relaxante",
        "battle-night": "horda sobreviver sobrevivencia noite inimigos batalha acao classes funcao zumbi lutar",
        "farming-now": "fazenda animais plantar frutas verduras legumes laticinios vender gerenciar relaxante agricultura",
        "marte": "marte espaco planeta explorar dirigir terreno descobrir exploracao espacial pixel",
        "wow-balls": "bolas esferas fisica 3d obstaculos desafio habilidade desafiador",
        "quebra-meteoro": "meteoros meteoro clique cliques reflexo rapido casual destruir espaco",
        "pixel-saga": "lua lunar espaco exploracao pixel explorar astronauta",
        "space-clicker": "clicker clicar cliques galaxia espaco idle incremental relaxante casual",
        "burguer-now": "hamburgueria hamburguer lanchonete gerenciar restaurante comida cozinha negocio vender",
        "crazy-8": "baralho cartas carta uno classico",
        "pixel-fish": "pesca pescar peixes peixe vender dinheiro relaxante casual",
        "motoart-grau": "moto motos manobras grau wheelie empinar dirigir corrida",
        "neo-drop": "encaixe reflexo desafiador logica blocos neon pensar",
        "old-snake": "cobrinha cobra snake retro classico arcade rapido casual",
        "pixel-jump": "pular pulo plataforma pixel inimigos aventura",
        "polar-jump": "urso polar gelo neve nanuk ilha pular correr aventura fofo",
        "dead-hunter3d": "zumbi zumbis zombie armas tiro atirar 3d terror sobrevivencia planeta",
        "capi-knight": "capivara cavaleiro aventura explorar inimigos medieval fofo",
        "zenite-zero": "sobreviver batalhas personagem inimigos evoluir fortalecer acao desafiador",
        "aethelstar-neon": "meteoros espaco neon desviar nave reflexo",
        "car-tape": "corrida carro carros manobras radicais racing velocidade",
        "pixel-cars": "carros carro desviar correr corrida pixel racing reflexo rapido",
        "old-racers": "corrida carros carro classica racers racing 3d paisagem velocidade",
        "sinuca-boteco": "sinuca bilhar boteco bar bolas mesa taco",
        "aethelstar": "espaco nave fliperama arcade classico atirar",
        "astro-pong": "pong raquete classico espaco arcade rapido",
        "star-train": "trem espaco estrelas jornada trilhos viagem",
        "guacuano-soccer": "futebol bola fisica esferas partida gol soccer maluca",
        "street-basquete": "basquete basket quadra rua cesta bola",
        "golf-game": "golfe golf mira buracos bolas tacada relaxante",
        "block-star": "blocos empilhar pixel acao rapido",
        "xadrez": "xadrez estrategia mente pensar classico tabuleiro chess",
        "damas": "damas tradicional estrategia tabuleiro classico pensar",
        "memory-barbarian": "memoria vikings viking barbaro cartas pares casual",
        "tic-tac-chaos": "velha caos tictactoe casual rapido tabuleiro",
        "pixel-dash": "pixel frenetica acao correr rapido reflexo",
        "labirinto-cartografico": "labirinto mapa cartografia desafio logica pensar puzzle"
    };

    // Grupos de palavras que significam o mesmo (ou parecido). Tudo sem acento.
    const SINONIMOS = [
        ["corrida", "correr", "racing", "racers", "carro", "carros", "automovel", "velocidade", "pista", "dirigir", "pilotar"],
        ["moto", "motos", "motocicleta", "grau", "wheelie", "empinar"],
        ["tiro", "atirar", "arma", "armas", "shooter", "fps", "mira"],
        ["zumbi", "zumbis", "zombie", "zombies", "morto", "mortos", "terror", "horror", "assustador"],
        ["espaco", "espacial", "nave", "naves", "galaxia", "planeta", "astronauta", "estrela", "estrelas", "foguete"],
        ["fazenda", "farm", "plantar", "plantacao", "agricultura", "lavoura", "roca"],
        ["cidade", "construir", "construcao", "vilarejo", "build", "urbano"],
        ["pesca", "pescar", "peixe", "peixes", "pescaria"],
        ["futebol", "soccer", "gol", "bola", "bolas"],
        ["basquete", "basket", "cesta", "nba"],
        ["golfe", "golf", "tacada"],
        ["sinuca", "bilhar", "snooker", "taco"],
        ["xadrez", "chess"],
        ["damas", "dama", "checkers"],
        ["baralho", "carta", "cartas", "uno", "naipe"],
        ["memoria", "pares", "memorizar", "lembrar"],
        ["labirinto", "maze", "mapa", "cartografia"],
        ["puzzle", "enigma", "raciocinio", "logica", "pensar", "inteligencia", "quebra", "cabeca", "mente"],
        ["relaxar", "relaxante", "calmo", "tranquilo", "chill", "zen", "suave", "descansar", "paz"],
        ["dificil", "desafio", "desafiador", "hardcore", "complicado", "desafiar"],
        ["rapido", "curto", "rapidinho", "fast", "reflexo", "reflexos", "agil", "frenetico", "frenetica"],
        ["pixel", "pixelart", "8bit"],
        ["classico", "retro", "antigo", "tradicional", "nostalgia", "nostalgico", "velho"],
        ["aventura", "explorar", "exploracao", "descobrir", "jornada", "viagem"],
        ["luta", "batalha", "guerra", "combate", "lutar", "horda", "sobreviver", "sobrevivencia", "inimigo", "inimigos"],
        ["clicker", "clicar", "clique", "cliques", "idle", "incremental"],
        ["cobra", "cobrinha", "snake"],
        ["pong", "raquete", "tenis"],
        ["pular", "pulo", "plataforma", "jump", "saltar"],
        ["dinheiro", "vender", "comprar", "economia", "gerenciar", "administrar", "negocio", "lucro", "ganhar"],
        ["comida", "hamburguer", "hamburgueria", "lanchonete", "restaurante", "cozinha", "cozinhar"],
        ["capivara", "cavaleiro", "medieval", "knight", "castelo"],
        ["viking", "vikings", "barbaro", "barbarian"],
        ["urso", "polar", "gelo", "neve", "frio"],
        ["3d", "tridimensional"],
        ["esfera", "esferas", "bola", "bolas"],
        ["velha", "tictactoe", "tic"],
        ["fofo", "fofinho", "cute", "bonitinho", "animal", "animais"],
        ["estrategia", "estrategico", "tatica", "planejar"],
        ["cavar", "minerar", "mineracao", "garimpar", "garimpo", "ouro"]
    ];

    // Palavras que o bot "conhece" além dos jogos (ajudam a corrigir erros de digitação)
    const VOCAB_EXTRA = ("favoritos favorito recomenda recomendar recomendacao sugestao sugerir novidades novidade ajuda recentes " +
        "ranking surpreenda surpreende aleatorio instalar celular compartilhar compartilhe avaliar avaliacao estrelas parceiros " +
        "instagram sessao area categoria categorias secao obrigado obrigada tchau parecido semelhante similar jogados jogado " +
        "quantos jogos jogo gratis baixar internet offline piada curiosidade melhor melhores pior limpar conversa historico " +
        "continuar proximo anterior abrir jogar favoritar remover desfavoritar quebrou travou travando carrega funciona " +
        "multiplayer amigos amigo tela cheia fullscreen sobre quem criou equipe contato rodape topo inicio aplicativo " +
        "estrategia aventura simulacao tabuleiro arcade puzzle esporte esportes").split(" ");

    const ABREV = {
        vc: "voce", vcs: "voces", pq: "porque", q: "que", tb: "tambem", tbm: "tambem", blz: "beleza",
        obg: "obrigado", obgd: "obrigado", vlw: "valeu", flw: "tchau", td: "tudo", msm: "mesmo", n: "nao",
        pfv: "por favor", pf: "por favor", oq: "o que", oque: "o que", mt: "muito", mto: "muito",
        hj: "hoje", jg: "jogo", jgs: "jogos", cel: "celular", nd: "nada", dnv: "de novo", s: "sim",
        sla: "nao sei", ngm: "ninguem", tmb: "tambem", fav: "favorito", favs: "favoritos", ss: "sim", nn: "nao"
    };

    const STOP = new Set(("a o as os um uma uns umas de do da dos das em no na nos nas por pra para com sem sobre e ou mas que se " +
        "eu me meu minha meus minhas voce voces seu sua seus suas te tu ele ela eles elas isso isto esse essa esses essas este esta " +
        "estes estas aquele aquela ai aqui la ja so ate entre mais menos muito muita muitos muitas pouco bem bom boa legal massa tipo " +
        "coisa coisas algo alguma algum alguns algumas qualquer todo toda todos todas quero queria quer querer gostaria gosto gosta " +
        "gostar preciso precisa procuro procurando busco buscar buscando tem tenho ter tinha existe ha haver ser sou eh foi era vai " +
        "vou ir fazer faz faca fala falar diz dizer mostra mostrar mostre da dar acha achar ache encontra encontrar encontre abre " +
        "abrir abra joga jogar jogue jogo jogos game games favor pode poderia consegue consigo ver veja ve lista listar quais qual " +
        "quem como onde quando porque quanto quantos quantas hoje agora apenas tambem outro outra outros outras mesmo ainda entao " +
        "pois tal talvez sera diferente novo nova novos novas ta tao nao sim vez vezes pouco bastante demais besta " +
        "ok oi ola eai opa hey salve beleza obrigado obrigada valeu tchau por favor pls queria uns " +
        "recomenda recomende recomendo recomendar recomendacao recomendacoes sugere sugira sugerir sugestao sugestoes " +
        "indica indique indicar indicacao favorita favoritar favorite favoritei avaliar avaliacao avalia avalie " +
        "parecido parecidos semelhante similar estilo leva leve levar rola rolar desce sobe pula secao parte " +
        "melhor melhores pior piores divertido divertidos interessante interessantes bacana jogado jogados joguei jogou jogando " +
        "ultimo ultimos ultima ultimas primeiro primeira proximo anterior horas hora tempo minutos minuto").split(" "));

    const PIADAS = [
        "Por que o programador nunca passa de fase? Porque ele só pensa em bugs, não em checkpoints! 🐛",
        "O que a cobrinha disse pro Wi-Fi? \"Não me deixa cair!\" 🐍",
        "Por que o jogador de damas nunca se perde? Porque sempre segue em diagonal. ♟️",
        "O que o zumbi pediu no restaurante? Cérebro… com batata frita! 🧟",
        "Por que a moto foi ao médico? Porque estava dando muito grau! 🏍️",
        "Qual é o jogo favorito do relógio? O tempo-ra-ri-o… quer dizer, o Tic Tac! ⏰"
    ];

    function curiosidades() {
        const total = GAMES.length;
        const cats = CATS.length;
        return [
            `O hub tem ${total} jogos espalhados em ${cats} categorias — e continua crescendo. 🎮`,
            "A OldNow Games começou em 2025 na ETEC Pedro Ferreira Alves, em Mogi Mirim, para uma feira de tecnologia chamada Expoete. 🚀",
            "O primeiro jogo do projeto foi o Pixel Saga, uma aventura espacial em pixel art. 👾",
            "Dá pra instalar o hub como app no celular e abrir os jogos direto da tela inicial. 📲",
            "Na \"Minha área\" você monta sua própria prateleira de jogos e troca o fundo e o espaçamento. 🧩"
        ];
    }

    /* =========================================================
       UTILIDADES DE TEXTO
       ========================================================= */

    function normalizar(txt) {
        return String(txt || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/([a-z])\1{2,}/g, "$1")
            .replace(/\s+/g, " ")
            .trim();
    }

    function radical(p) {
        if (p.length > 4 && /(oes|aes)$/.test(p)) return p.slice(0, -3) + "ao";
        if (p.length > 3 && p.endsWith("s")) return p.slice(0, -1);
        return p;
    }

    function aleatorio(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function distancia(a, b, max) {
        if (a === b) return 0;
        const la = a.length, lb = b.length;
        if (Math.abs(la - lb) > max) return max + 1;
        let antes2 = null;
        let antes = Array.from({ length: lb + 1 }, (_, i) => i);
        for (let i = 1; i <= la; i++) {
            const atual = [i];
            let minLinha = i;
            for (let j = 1; j <= lb; j++) {
                const custo = a[i - 1] === b[j - 1] ? 0 : 1;
                let v = Math.min(antes[j] + 1, atual[j - 1] + 1, antes[j - 1] + custo);
                if (antes2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                    v = Math.min(v, antes2[j - 2] + 1);
                }
                atual[j] = v;
                if (v < minLinha) minLinha = v;
            }
            if (minLinha > max) return max + 1;
            antes2 = antes;
            antes = atual;
        }
        return antes[lb];
    }

    function pluralJogos(n) { return n === 1 ? "1 jogo" : n + " jogos"; }

    /* =========================================================
       ÍNDICE DOS JOGOS (título, tags, descrição, categoria)
       ========================================================= */

    const CAT_PALAVRAS = {
        "aventura-acao": "aventura acao",
        "simulacao-estrategia": "simulacao estrategia",
        "esporte-racing": "esporte racing",
        "puzzle": "puzzle",
        "arcade": "arcade fliperama",
        "tabuleiro": "tabuleiro mesa"
    };

    const SIN_IDX = new Map();           // radical -> índices de grupos
    const SIN_GRUPOS = SINONIMOS.map(g => g.map(p => radical(normalizar(p))));
    SIN_GRUPOS.forEach((g, i) => g.forEach(p => {
        if (!SIN_IDX.has(p)) SIN_IDX.set(p, []);
        SIN_IDX.get(p).push(i);
    }));

    function sinonimosDe(rad) {
        const out = new Set();
        (SIN_IDX.get(rad) || []).forEach(i => SIN_GRUPOS[i].forEach(p => { if (p !== rad) out.add(p); }));
        return out;
    }

    function tokensDe(texto) {
        return normalizar(texto).split(" ").filter(p => p.length >= 2 && !STOP.has(p));
    }

    const ENTRADAS = new Map();
    const FREQ_TAG = new Map();
    const VOCAB = new Set(VOCAB_EXTRA.map(normalizar));
    SINONIMOS.forEach(g => g.forEach(p => VOCAB.add(normalizar(p))));

    GAMES.forEach(jogo => {
        const tagsTexto = (TAGS[jogo.id] || "") + " " + (Array.isArray(jogo.tags) ? jogo.tags.join(" ") : "");
        const tituloTokens = tokensDe(jogo.titulo);
        const tagTokens = tokensDe(tagsTexto);
        const descTokens = tokensDe(jogo.descricao || "");
        const catTokens = tokensDe(CAT_PALAVRAS[jogo.categoria] || "");

        [...tituloTokens, ...tagTokens, ...descTokens, ...catTokens].forEach(p => VOCAB.add(p));

        const e = {
            jogo,
            tituloLista: tituloTokens.map(radical),
            titulo: new Set(tituloTokens.map(radical)),
            tags: new Set(tagTokens.map(radical)),
            desc: new Set(descTokens.map(radical)),
            cat: new Set(catTokens.map(radical)),
            tagsLista: Array.from(new Set(tagTokens.map(radical)))
        };
        ENTRADAS.set(jogo.id, e);
        e.tagsLista.forEach(t => FREQ_TAG.set(t, (FREQ_TAG.get(t) || 0) + 1));
    });

    const idf = tag => 1 / Math.log(2 + (FREQ_TAG.get(tag) || 1));
    const VOCAB_LISTA = Array.from(VOCAB).filter(p => p.length >= 4);

    /* ---------- Correção de digitação ---------- */

    // Palavras que o bot usa para entender frases: nunca são "corrigidas" (evita trocar "ultimo" por "ultima")
    const CONHECIDAS = new Set(("horas hora tempo minutos minuto passei jogadas jogado abre abrir acha ache adeus adicion adorei agora agradec aham ajuda ajudar aleatorio algo algum alguma alta amanha amei amigo amigos ampliar android anterior apag apaga aparece aplicativo apoiadores apoio area assinatura assistente atualizacao atualizacoes avali bacana baix beleza bobo bora bota brigad burro busco cadastrar cadastro carrega celular certo chama chat cheia claro cobran coisa coloc comandos comecar comeco como compartilh compativel conexao congel consigo conta contato continu continuar conversa convidar cria criador criar criou curiosidade curioso curti curtidos custa custo dado decide deixa deleta depois desce descricao desenvolveu desfavorit detalhes diferente divertido dois download engracad entendi entrar enviar equipe erro escolhe esta estatisticas estilo estrelas etec exclu existe existem explica expoete fala falar falou fato favor favorit fechado feedback fica ficam final fullscreen funciona fundo games gostaria gostei graca grande gratis gratuito guardad hello help historia historico horrivel humano humor ideia idiota igual incrivel indeciso indic inicia inicial iniciar inicio insta instagram instal interessante internet inutil iphone isso joga jogado jogadores jogados jogando jogar jogo jogos jogou jogue joguei junto lancamentos legal lembra lento leva limpa link lista lixo logar login logo mais manda mandar marc maximizar melhor melhores mesmo meus minha minhas mobile monta mostra mudar muito multiplayer negativo nenhum noite nome nope nota notas nova novidade novidades novo novos obrigad obrigado odeio offline oldnow onde online otimo outra outro outros paga pagar pagina pago para parceir parecid parei parou parte partiu patrocin perd perfeito perfil personalizar piada plataforma play pode positivo posso prateleira preciso preco preta primeira primeiro problema procurar procuro progresso proxima proximo pula quais qual qualquer quantos quebrou quem queria quero ranking recentes reclamacao recomecar recomend redes reiniciar remov repete repetir retira robo roda rodape rodar rola sabe sabia sair salv salve secao semelhante senha serve sessao sessoes show similar site sobe sobre some somem somos sortear sortei stats sugest sugir surpreend tablet tanto tarde tchau tela telefone thanks tipo tira todas todos topo toque touch trava travando travou traz troca trocar tudo uhum ultima ultimas ultimo ultimos usuario valeu vamos voce voces wifi zerar").split(" "));

    // frequência de cada palavra nos jogos (usada para desempatar correções)
    const FREQ_PALAVRA = new Map();
    function contarPalavra(p) { FREQ_PALAVRA.set(p, (FREQ_PALAVRA.get(p) || 0) + 1); }
    ENTRADAS.forEach(e => {
        e.titulo.forEach(contarPalavra); e.tags.forEach(contarPalavra); e.desc.forEach(contarPalavra);
    });
    SIN_GRUPOS.forEach(g => g.forEach(contarPalavra));

    function corrigir(tokens) {
        return tokens.map(tk => {
            if (tk.length < 5 || VOCAB.has(tk) || STOP.has(tk) || CONHECIDAS.has(tk) || /\d/.test(tk)) return tk;
            const lim = tk.length >= 8 ? 2 : 1;
            let melhorD = 99, candidatos = [];
            for (const v of VOCAB_LISTA) {
                if (Math.abs(v.length - tk.length) > lim) continue;
                const d = distancia(tk, v, lim);
                if (d > lim) continue;
                if (d < melhorD) { melhorD = d; candidatos = [v]; }
                else if (d === melhorD) candidatos.push(v);
            }
            if (!candidatos.length) return tk;
            if (candidatos.length > 1) {
                // 1º desempate: letra faltando/sobrando ("corida" -> "corrida") vale mais que letra trocada ("comida")
                const faltaOuSobra = candidatos.filter(v => v.length !== tk.length);
                if (faltaOuSobra.length >= 1 && faltaOuSobra.length < candidatos.length) candidatos = faltaOuSobra;
            }
            if (candidatos.length > 1) {
                // 2º desempate: palavra mais usada nos jogos
                candidatos.sort((a, b) => (FREQ_PALAVRA.get(radical(b)) || 0) - (FREQ_PALAVRA.get(radical(a)) || 0));
                const f0 = FREQ_PALAVRA.get(radical(candidatos[0])) || 0;
                const f1 = FREQ_PALAVRA.get(radical(candidatos[1])) || 0;
                if (f0 === f1) return tk;
            }
            return candidatos[0];
        });
    }

    function preparar(texto) {
        // "jogos de mesa" é o nome novo da categoria "tabuleiro"
        let toks = normalizar(texto).replace(/\bjogos? de mesa\b/g, "tabuleiro").split(" ").filter(Boolean);
        toks = toks.flatMap(tk => ABREV[tk] ? ABREV[tk].split(" ") : [tk]);
        toks = toks.filter(tk => !/^(k+|(ha){2,}h?|(he){2,}h?|rs+)$/.test(tk));
        toks = corrigir(toks);
        return {
            original: texto,
            t: toks.join(" "),
            toks,
            conteudo: toks.filter(tk => tk.length >= 2 && !STOP.has(tk))
        };
    }

    /* =========================================================
       BUSCA E RECOMENDAÇÃO
       ========================================================= */

    const CONFIANCA = 2.4;   // nota mínima para o bot confiar numa busca
    const CAMPOS = [["titulo", 5], ["tags", 3.5], ["cat", 2], ["desc", 1.5]];

    function pontuarJogos(conteudo) {
        if (!conteudo.length) return [];
        const lista = [];
        ENTRADAS.forEach(e => {
            if (!e.jogo.link || e.jogo.link === "#") return;
            let total = 0, casou = 0;
            conteudo.forEach(tk => {
                const rad = radical(tk);
                const sins = sinonimosDe(rad);
                let pt = 0;
                CAMPOS.forEach(([campo, peso]) => {
                    if (e[campo].has(rad)) pt += peso;
                    else if ([...sins].some(s => e[campo].has(s))) pt += peso * 0.75;
                });
                if (pt > 0) casou++;
                total += pt;
            });
            if (!casou) return;
            total *= 0.6 + 0.4 * (casou / conteudo.length);
            lista.push({ jogo: e.jogo, score: total });
        });
        return lista.sort((a, b) => b.score - a.score);
    }

    function pontuarTitulo(e, conteudo) {
        if (!conteudo.length || !e.tituloLista.length) return 0;
        const q = conteudo.map(radical);
        const qCasou = q.filter(r => e.titulo.has(r)).length;
        if (!qCasou) return 0;
        const tCasou = e.tituloLista.filter(r => q.includes(r)).length;
        return qCasou * 3 + (tCasou / e.tituloLista.length) * 3 + (qCasou === q.length ? 2 : 0);
    }

    const PRONOME = /\b(esse|essa|esse ai|este|esta|ele|ela|isso|aquele|aquela)\b/;

    function resolverJogo(t, conteudo) {
        if (conteudo.length) {
            const porTitulo = [];
            ENTRADAS.forEach(e => {
                const s = pontuarTitulo(e, conteudo);
                if (s > 0) porTitulo.push({ jogo: e.jogo, s });
            });
            porTitulo.sort((a, b) => b.s - a.s);
            if (porTitulo.length && porTitulo[0].s >= 5) {
                const empatados = porTitulo.filter(x => porTitulo[0].s - x.s < 1.2);
                if (empatados.length === 1) return { jogo: empatados[0].jogo, forca: "titulo" };
                return { ambiguos: empatados.slice(0, 6).map(x => x.jogo), forca: "ambiguo" };
            }
            const busca = pontuarJogos(conteudo);
            if (busca.length && busca[0].score >= 5 && (busca.length === 1 || busca[0].score >= 1.5 * busca[1].score)) {
                return { jogo: busca[0].jogo, forca: "busca" };
            }
        }
        if (PRONOME.test(t) && ctx.ultimoJogo) return { jogo: ctx.ultimoJogo, forca: "pronome" };
        return null;
    }

    const CAT_RX = [
        ["aventura-acao", /\b(aventura|acao|action)\b/],
        ["simulacao-estrategia", /\b(simulacao|simulador|estrategia)\b/],
        ["esporte-racing", /\b(esportes?|racing)\b/],
        ["puzzle", /\b(puzzles?|quebra cabecas?|enigmas?)\b/],
        ["arcade", /\b(arcade|fliperama)\b/],
        ["tabuleiro", /\b(tabuleiros?)\b/]
    ];
    function categoriaExplicita(t) {
        const achada = CAT_RX.find(([, rx]) => rx.test(t));
        return achada ? achada[0] : null;
    }

    /* ---------- Gostos do jogador ---------- */

    function perfilGostos() {
        const jog = jogadasMap();
        const favs = new Set(favoritosIds());
        const aval = avaliacoesMap();
        const tempos = temposMap();
        const pesoTag = new Map(), pesoCat = new Map(), base = [];
        DISPONIVEIS.forEach(j => {
            let p = 0;
            if (jog[j.id]) p += Math.log2(1 + jog[j.id]);
            if (tempos[j.id]) p += Math.min(3, tempos[j.id] / 1800000);
            if (favs.has(j.id)) p += 3;
            if (aval[j.id]) p += (aval[j.id] - 3) * 1.5;
            if (!p) return;
            base.push({ j, p });
            pesoCat.set(j.categoria, (pesoCat.get(j.categoria) || 0) + p);
            const tags = ENTRADAS.get(j.id).tagsLista;
            tags.forEach(tg => pesoTag.set(tg, (pesoTag.get(tg) || 0) + p / Math.sqrt(tags.length || 1)));
        });
        return { jog, favs, aval, pesoTag, pesoCat, base, temHistorico: base.length > 0 };
    }

    function pontuarGosto(j, perfil) {
        const tags = ENTRADAS.get(j.id).tagsLista;
        let s = 0;
        tags.forEach(tg => { s += (perfil.pesoTag.get(tg) || 0) * idf(tg); });
        s /= Math.sqrt(tags.length || 1);
        return s + (perfil.pesoCat.get(j.categoria) || 0) * 0.4;
    }

    function tagsEmComum(a, b) {
        const ta = new Set(ENTRADAS.get(a.id).tagsLista);
        return ENTRADAS.get(b.id).tagsLista.filter(x => ta.has(x)).length;
    }

    function rankPersonalizado(cat) {
        const perfil = perfilGostos();
        const recentes = recentesIds().slice(0, 3);
        const ranked = DISPONIVEIS
            .filter(j => !cat || j.categoria === cat)
            .map(j => {
                let s = perfil.temHistorico ? pontuarGosto(j, perfil) : 0;
                // recomendação = coisa nova: o que já foi jogado/favoritado só aparece depois do resto
                if (perfil.jog[j.id]) s -= 50;
                if (perfil.favs.has(j.id)) s -= 20;
                if (recentes.includes(j.id)) s -= 5;
                if (j.novo) s += 1;
                return { j, s: s + Math.random() * 1.2 };
            })
            .sort((a, b) => b.s - a.s);
        return { perfil, lista: ranked.map(r => r.j) };
    }

    function motivoDe(j, perfil) {
        if (!perfil || !perfil.temHistorico) return null;
        let melhor = null, ms = 0;
        perfil.base.forEach(b => {
            if (b.p <= 0 || b.j.id === j.id) return;
            const sc = tagsEmComum(j, b.j) * Math.min(b.p, 4);
            if (sc > ms) { ms = sc; melhor = b.j; }
        });
        if (melhor && ms >= 3) return `Parecido com ${melhor.titulo}, que você curtiu.`;
        if ((perfil.pesoCat.get(j.categoria) || 0) >= 2) return `Combina com o que você tem jogado em ${catTitulo(j.categoria)}.`;
        return null;
    }

    function parecidosCom(jogo, n, excluir) {
        const ref = ENTRADAS.get(jogo.id);
        const refTags = new Set(ref.tagsLista);
        return DISPONIVEIS
            .filter(j => j.id !== jogo.id && !(excluir && excluir.has(j.id)))
            .map(j => {
                const e = ENTRADAS.get(j.id);
                let s = 0;
                e.tagsLista.forEach(tg => { if (refTags.has(tg)) s += 2 * idf(tg) * 3; });
                if (j.categoria === jogo.categoria) s += 1.5;
                return { j, s };
            })
            .filter(x => x.s > 1.5)
            .sort((a, b) => b.s - a.s)
            .slice(0, n)
            .map(x => x.j);
    }

    /* =========================================================
       ESTADO DA CONVERSA (contexto)
       ========================================================= */

    const ctx = {
        ultimoJogo: null,
        ultimaAcao: null,
        pendenteSim: null,
        vistos: new Map(),     // consulta -> jogos já mostrados nela
        falhas: 0
    };

    /* =========================================================
       INTERFACE (mensagens, cards, chips, "digitando…")
       ========================================================= */

    const CHAVE_HIST = "oldnow_bot_hist";
    const CHAVE_DUVIDAS = "oldnow_bot_duvidas";
    const reduzMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hist = [];

    mensagens.setAttribute("role", "log");
    mensagens.setAttribute("aria-live", "polite");
    mensagens.setAttribute("aria-relevant", "additions");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "botPainel");
    input.setAttribute("enterkeyhint", "send");
    input.setAttribute("autocapitalize", "sentences");

    function formatar(texto) {
        return String(texto)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    }

    function rolar() { mensagens.scrollTop = mensagens.scrollHeight; }

    function lerHist() {
        try {
            const h = JSON.parse(sessionStorage.getItem(CHAVE_HIST));
            if (h && h.nome === (nomeJogador() || "") && Array.isArray(h.msgs)) return h.msgs;
        } catch (e) { /* ignora */ }
        return [];
    }
    function salvarHist() {
        try {
            hist = hist.slice(-40);
            sessionStorage.setItem(CHAVE_HIST, JSON.stringify({ nome: nomeJogador() || "", msgs: hist }));
        } catch (e) { /* ignora */ }
    }

    function addMensagem(texto, tipo, semSalvar) {
        const div = document.createElement("div");
        div.className = "bot-msg " + tipo;
        div.innerHTML = formatar(texto);
        mensagens.appendChild(div);
        rolar();
        if (!semSalvar) { hist.push({ tipo, texto }); salvarHist(); }
    }

    function removerChips() {
        mensagens.querySelectorAll(".bot-chips").forEach(el => el.remove());
    }

    function addChips(chips) {
        if (!chips || !chips.length) return;
        const wrap = document.createElement("div");
        wrap.className = "bot-chips";
        chips.forEach(c => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "bot-chip";
            b.textContent = c.texto;
            b.addEventListener("click", () => {
                wrap.remove();
                addMensagem(c.texto, "user");
                setTimeout(() => c.acao(), 120);
            });
            wrap.appendChild(b);
        });
        mensagens.appendChild(wrap);
        rolar();
    }

    function resumo(txt, max) {
        const s = String(txt || "").trim();
        return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
    }

    function criarCard(item) {
        const jogo = item.jogo;
        const card = document.createElement("div");
        card.className = "bot-card";

        const img = document.createElement("img");
        img.src = jogo.capa;
        img.alt = "";
        img.loading = "lazy";
        img.addEventListener("error", () => { img.style.visibility = "hidden"; });
        card.appendChild(img);

        const info = document.createElement("div");
        info.className = "bot-card-info";

        const titulo = document.createElement("span");
        titulo.className = "bot-card-titulo";
        titulo.textContent = jogo.titulo;
        info.appendChild(titulo);

        const cat = document.createElement("span");
        cat.className = "bot-card-cat";
        cat.textContent = catTitulo(jogo.categoria) + (jogo.novo ? " · NOVO" : "");
        info.appendChild(cat);

        const desc = document.createElement("span");
        desc.className = "bot-card-motivo";
        desc.textContent = item.motivo || resumo(jogo.descricao, 80);
        info.appendChild(desc);

        const acoes = document.createElement("div");
        acoes.className = "bot-card-acoes";

        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "bot-card-btn principal";
        abrir.textContent = "🎮 Abrir";
        abrir.addEventListener("click", () => abrirJogo(jogo.id));
        acoes.appendChild(abrir);

        const fav = document.createElement("button");
        fav.type = "button";
        fav.className = "bot-card-btn";
        const pintarFav = () => {
            const ativo = favoritosIds().includes(jogo.id);
            fav.textContent = ativo ? "♥ Favorito" : "♡ Favoritar";
            fav.setAttribute("aria-pressed", ativo ? "true" : "false");
        };
        pintarFav();
        fav.addEventListener("click", () => {
            seguro(() => toggleFavorito(jogo.id));
            pintarFav();
        });
        acoes.appendChild(fav);

        info.appendChild(acoes);
        card.appendChild(info);
        return card;
    }

    function addDigitando() {
        const div = document.createElement("div");
        div.className = "bot-msg bot bot-digitando";
        div.setAttribute("aria-label", "O assistente está digitando");
        div.innerHTML = "<span></span><span></span><span></span>";
        mensagens.appendChild(div);
        rolar();
        return div;
    }

    let fila = Promise.resolve();

    function responder(resp) {
        if (Array.isArray(resp)) { resp.forEach(r => responder(r)); return; }
        if (!resp) return;
        if (typeof resp === "string") resp = { texto: resp };
        fila = fila.then(() => mostrarResposta(resp)).catch(() => {});
    }

    function mostrarResposta(resp) {
        return new Promise(resolve => {
            const ind = addDigitando();
            const espera = reduzMovimento ? 80 : Math.min(950, 360 + (resp.texto ? resp.texto.length : 40) * 5);
            setTimeout(() => {
                ind.remove();
                removerChips();
                if (resp.texto) addMensagem(resp.texto, "bot");
                if (resp.jogos && resp.jogos.length) {
                    resp.jogos.forEach(it => mensagens.appendChild(criarCard(it)));
                    ctx.ultimoJogo = resp.jogos[0].jogo;
                    hist.push({ tipo: "bot", texto: "🎮 " + resp.jogos.map(i => i.jogo.titulo).join(", ") });
                    salvarHist();
                }
                if (resp.chips) addChips(resp.chips);
                ctx.pendenteSim = resp.sim || null;
                rolar();
                if (typeof resp.depois === "function") setTimeout(() => seguro(resp.depois), 250);
                resolve();
            }, espera);
        });
    }

    /* ---------- Dúvidas que o bot não entendeu (só neste aparelho) ---------- */

    function armazemDuvidas() {
        return seguro(() => (window.OldNowSessao ? window.OldNowSessao.storage() : localStorage), null);
    }
    function registrarDuvida(texto) {
        const arm = armazemDuvidas();
        if (!arm) return;
        try {
            const lista = JSON.parse(arm.getItem(CHAVE_DUVIDAS) || "[]");
            lista.push({ q: String(texto).slice(0, 120), t: Date.now() });
            arm.setItem(CHAVE_DUVIDAS, JSON.stringify(lista.slice(-30)));
        } catch (e) { /* ignora */ }
    }

    /* =========================================================
       AÇÕES NO HUB
       ========================================================= */

    function fecharSeMobile() { if (ehMobile()) fecharPainel(); }

    function abrirJogo(id) {
        const j = jogoPorId(id);
        if (j) ctx.ultimoJogo = j;
        fecharPainel();
        if (typeof abrirJogoPeloId === "function") abrirJogoPeloId(id);
    }

    function irPara(secaoId) {
        if (secaoId === "topo") {
            fecharSeMobile();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return true;
        }
        const el = secaoId === "rodape" ? document.querySelector("footer.rodape, footer") : document.getElementById(secaoId);
        if (!el) return false;
        fecharSeMobile();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
    }

    function clicar(seletor, fechar) {
        const el = document.querySelector(seletor);
        if (!el) return false;
        if (fechar) fecharPainel();
        el.click();
        return true;
    }

    const jaInstalado = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
    const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

    function instalarApp() {
        const item = document.querySelector("[data-instalar-app]:not(.d-none)");
        if (!item) return false;
        fecharPainel();
        (item.querySelector("a") || item).click();
        return true;
    }

    /* =========================================================
       RESPOSTAS (os "assistentes" de cada assunto)
       ========================================================= */

    const oiNome = () => { const n = nomeJogador(); return n ? `Oi, ${n}!` : "Oi!"; };

    function chipsPadrao() {
        return [
            { texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) },
            { texto: "❓ O que você faz?", acao: () => responder(rAjuda()) }
        ];
    }

    function desambiguar(lista, fn, pergunta) {
        return {
            texto: pergunta,
            chips: lista.slice(0, 6).map(j => ({ texto: j.titulo, acao: () => responder(fn(j)) }))
        };
    }

    function semPalavrasDeCategoria(toks) {
        return toks.filter(tk => !CAT_RX.some(([, rx]) => rx.test(tk)));
    }

    function listaDe(consulta) {
        const sem = semPalavrasDeCategoria(consulta.toks || []);
        if (sem.length) {
            let res = pontuarJogos(sem);
            if (consulta.cat) {
                const f = res.filter(r => r.jogo.categoria === consulta.cat);
                if (f.length) res = f;
            }
            const topo = res.length ? res[0].score : 0;
            res = res.filter(r => r.score >= Math.max(2, 0.35 * topo));
            return { lista: res.map(r => r.jogo), pontos: new Map(res.map(r => [r.jogo.id, r.score])), buscou: true };
        }
        return { lista: DISPONIVEIS.filter(j => !consulta.cat || j.categoria === consulta.cat), pontos: new Map(), buscou: false };
    }

    /* ---------- Recomendar ---------- */

    function sugerir(consulta) {
        const rotulo = consulta.rotulo || (consulta.cat ? catTitulo(consulta.cat) : "");
        let lista, pontos = new Map(), perfil = null;
        const base = listaDe(consulta);

        if (base.buscou) {
            lista = base.lista;
            pontos = base.pontos;
        } else {
            const r = rankPersonalizado(consulta.cat);
            lista = r.lista;
            perfil = r.perfil;
        }

        if (!lista.length) {
            return {
                texto: `Não encontrei jogos para **${rotulo || "isso"}**. Tenta outras palavras (ex.: corrida, puzzle, fazenda, zumbi) ou escolhe uma opção:`,
                chips: chipsPadrao()
            };
        }

        const vistos = vistosDe(consulta);
        const novos = lista.filter(j => !vistos.has(j.id));
        if (!novos.length) {
            return {
                texto: "Já te mostrei tudo o que achei pra isso 😅. Quer rever a lista ou tentar outra coisa?",
                chips: [
                    { texto: "🔄 Recomeçar", acao: () => { vistos.clear(); responder(sugerir(consulta)); } },
                    { texto: "🎲 Surpreenda-me", acao: () => responder(recomendarPersonalizado()) }
                ]
            };
        }

        let escolha = novos[0];
        if (base.buscou) {
            const topo = pontos.get(novos[0].id) || 0;
            const candidatos = novos.slice(0, 3).filter(j => (pontos.get(j.id) || 0) >= 0.85 * topo);
            escolha = aleatorio(candidatos);
        }
        vistos.add(escolha.id);
        const restantes = novos.length - 1;

        let texto;
        if (base.buscou) {
            texto = aleatorio([
                `Pra **${rotulo}**, separei esse:`,
                `Achei esse que combina com **${rotulo}**:`,
                `Olha esse pra **${rotulo}**:`
            ]);
        } else if (consulta.cat) {
            texto = `Separei um de **${catTitulo(consulta.cat)}**:`;
        } else {
            texto = aleatorio(["Que tal esse?", "Acho que você vai gostar desse:", "Separei esse pra você:"]);
        }

        const chips = [];
        if (restantes > 0) chips.push({ texto: "🎲 Outro", acao: () => { if (ctx.ultimaAcao) ctx.ultimaAcao(); } });
        chips.push({ texto: "🔁 Parecidos", acao: () => responder(rParecidos(escolha)) });
        if (lista.length >= 3 && (base.buscou || consulta.cat)) chips.push({ texto: `📋 Ver ${lista.length} opções`, acao: () => responder(rLista(consulta)) });

        ctx.ultimaAcao = () => responder(sugerir(consulta));
        return { texto, jogos: [{ jogo: escolha, motivo: motivoDe(escolha, perfil) }], chips };
    }

    function vistosDe(consulta) {
        const chave = (consulta.cat || "") + "|" + semPalavrasDeCategoria(consulta.toks || []).map(radical).sort().join(",");
        if (!ctx.vistos.has(chave)) ctx.vistos.set(chave, new Set());
        return ctx.vistos.get(chave);
    }

    function recomendarPersonalizado(cat) {
        return sugerir({ toks: [], cat: cat || null, rotulo: "" });
    }

    // Usa as palavras como a pessoa escreveu (com acento); se havia erro de digitação, usa a corrigida
    function rotuloDe(info) {
        const originais = String(info.original || "").split(/\s+/).filter(Boolean);
        const mapa = new Map();
        originais.forEach(w => { const n = normalizar(w); if (n && !mapa.has(n)) mapa.set(n, w.replace(/[^\p{L}\p{N}-]/gu, "")); });
        return semPalavrasDeCategoria(info.conteudo).map(tk => mapa.get(tk) || tk).join(" ");
    }

    function consultaDe(info) {
        return {
            toks: info.conteudo,
            cat: info.cat,
            rotulo: rotuloDe(info) || (info.cat ? catTitulo(info.cat) : "")
        };
    }

    function rLista(consulta) {
        const { lista } = listaDe(consulta);
        const rotulo = consulta.rotulo || (consulta.cat ? catTitulo(consulta.cat) : "todas as categorias");
        if (!lista.length) return { texto: `Não achei jogos para **${rotulo}**.`, chips: chipsPadrao() };
        const chips = lista.slice(0, 8).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }));
        if (consulta.cat) chips.push({ texto: "Ver seção", acao: () => irPara(consulta.cat) });
        return {
            texto: `**${rotulo}**: ${pluralJogos(lista.length)}${lista.length > 8 ? " (mostro 8)" : ""}. Toca num nome pra abrir:`,
            chips
        };
    }

    function rParecidos(jogo, offset) {
        const ini = offset || 0;
        const todos = parecidosCom(jogo, 6);
        const lote = todos.slice(ini, ini + 3);
        if (!lote.length) {
            return { texto: `Não achei nada muito parecido com **${jogo.titulo}**. Quer uma surpresa?`, chips: chipsPadrao() };
        }
        const chips = [];
        if (todos.length > ini + 3) chips.push({ texto: "➕ Mais parecidos", acao: () => responder(rParecidos(jogo, ini + 3)) });
        chips.push({ texto: "🎲 Surpreenda-me", acao: () => responder(recomendarPersonalizado()) });
        return {
            texto: ini ? "Mais alguns:" : `Se você curte **${jogo.titulo}**, olha esses:`,
            jogos: lote.map(j => ({ jogo: j })),
            chips
        };
    }

    /* ---------- Listas do jogador ---------- */

    function rFavoritos() {
        const jogos = favoritosIds().map(jogoPorId).filter(Boolean);
        if (!jogos.length) {
            return {
                texto: "Você ainda não favoritou nenhum jogo. Toca no ♡ de um card (ou me diga \"favorita o Xadrez\") e ele aparece aqui.",
                chips: [{ texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) }]
            };
        }
        const resto = jogos.slice(3).map(j => j.titulo);
        return {
            texto: `Seus favoritos (${jogos.length}):` + (resto.length ? `\nE mais: ${resto.slice(0, 6).join(", ")}${resto.length > 6 ? "…" : ""}` : ""),
            jogos: jogos.slice(0, 3).map(j => ({ jogo: j })),
            chips: [{ texto: "Ver seção", acao: () => irPara("favoritos") }]
        };
    }

    function rRecentes() {
        const jogos = recentesIds().map(jogoPorId).filter(Boolean);
        if (!jogos.length) {
            return { texto: "Você ainda não jogou nada por aqui. Quer uma recomendação?", chips: chipsPadrao() };
        }
        return {
            texto: "Continue de onde parou:",
            jogos: jogos.slice(0, 2).map(j => ({ jogo: j })),
            chips: [{ texto: "Ver seção", acao: () => irPara("continuar-jogando") }]
        };
    }

    function rMaisJogados() {
        const jog = jogadasMap();
        const jogos = GAMES.filter(j => jog[j.id]).sort((a, b) => jog[b.id] - jog[a.id]).slice(0, 5);
        if (!jogos.length) return { texto: "Ainda não tenho estatísticas suas. Joga alguns jogos e eu começo a contar!" };
        const tmp = temposMap();
        return {
            texto: "Seus mais jogados:\n" + jogos.map((j, i) => { const t = fmtTempo(tmp[j.id]); return `${i + 1}. ${j.titulo} (${jog[j.id]}x${t ? " · " + t : ""})`; }).join("\n"),
            chips: jogos.slice(0, 3).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }))
        };
    }

    function rMelhoresNotas() {
        const aval = avaliacoesMap();
        const jogos = GAMES.filter(j => aval[j.id]).sort((a, b) => aval[b.id] - aval[a.id]).slice(0, 5);
        if (!jogos.length) {
            return { texto: "Você ainda não avaliou nenhum jogo. Abra um jogo e toque nas estrelas, ou me diga: \"dou 5 estrelas pro Xadrez\"." };
        }
        return {
            texto: "Suas notas:\n" + jogos.map(j => `${"★".repeat(aval[j.id])}${"☆".repeat(5 - aval[j.id])}  ${j.titulo}`).join("\n"),
            chips: jogos.slice(0, 3).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }))
        };
    }

    function rTempo(info) {
        if (typeof formatarTempo !== "function") {
            return { texto: "Ainda não consigo contar o tempo jogado nesta versão do hub." };
        }
        const tempos = temposMap();
        const ref = info && info.ref;
        if (ref && ref.jogo && ref.forca !== "pronome") {
            const t = fmtTempo(tempos[ref.jogo.id]);
            return {
                texto: t ? `Você jogou **${ref.jogo.titulo}** por **${t}**.` : `Ainda não tenho tempo registrado em **${ref.jogo.titulo}**.`,
                jogos: [{ jogo: ref.jogo }]
            };
        }
        const lista = GAMES.filter(j => (tempos[j.id] || 0) >= 10000).sort((a, b) => tempos[b.id] - tempos[a.id]);
        if (!lista.length) {
            return {
                texto: "Ainda não tenho tempo registrado. Ele conta enquanto você joga no player do hub (jogos abertos em nova aba não entram na conta).",
                chips: chipsPadrao()
            };
        }
        const total = Object.values(tempos).reduce((a, b) => a + (Number(b) || 0), 0);
        return {
            texto: `Você já jogou **${fmtTempo(total)}** no total. Onde mais passou tempo:\n` +
                lista.slice(0, 5).map((j, i) => `${i + 1}. ${j.titulo} — ${fmtTempo(tempos[j.id])}`).join("\n"),
            chips: lista.slice(0, 3).map(j => ({ texto: j.titulo, acao: () => abrirJogo(j.id) }))
        };
    }

    function rNovidades() {
        const novos = GAMES.filter(j => j.novo);
        if (!novos.length) {
            return {
                texto: "Nenhum jogo está com a etiqueta NOVO agora. Mas posso te sugerir algo que você ainda não jogou!",
                chips: [{ texto: "🎲 Surpreenda-me", acao: () => responder(recomendarPersonalizado()) }]
            };
        }
        return {
            texto: `Novidades no hub (${novos.length}):`,
            jogos: novos.slice(0, 3).map(j => ({ jogo: j })),
            chips: novos.length > 3 ? [{ texto: "Ver todos os novos", acao: () => irPara("todos") }] : []
        };
    }

    /* ---------- Ações com jogos ---------- */

    function rAbrir(info) {
        const ref = info.ref;
        if (!ref) return sugerir(consultaDe(info));
        if (ref.forca === "ambiguo") {
            return desambiguar(ref.ambiguos, j => ({ texto: `Abrindo **${j.titulo}**… bom jogo! 🎮`, depois: () => abrirJogo(j.id) }), "Qual desses você quer abrir?");
        }
        const j = ref.jogo;
        if (ref.forca === "busca") {
            return {
                texto: `Acho que você quer o **${j.titulo}**. Abro pra você?`,
                jogos: [{ jogo: j }],
                sim: () => ({ texto: `Abrindo **${j.titulo}**… 🎮`, depois: () => abrirJogo(j.id) })
            };
        }
        return { texto: `Abrindo **${j.titulo}**… bom jogo! 🎮`, jogos: [], depois: () => abrirJogo(j.id) };
    }

    function rInfoJogo(info) {
        const ref = info.ref;
        if (!ref) return sugerir(consultaDe(info));
        if (ref.forca === "ambiguo") {
            return desambiguar(ref.ambiguos, j => rInfoDe(j), "Sobre qual deles?");
        }
        return rInfoDe(ref.jogo);
    }

    function rInfoDe(j) {
        const vezes = jogadasMap()[j.id];
        const nota = avaliacoesMap()[j.id];
        let extra = "";
        const tempoTxt = fmtTempo(temposMap()[j.id]);
        if (vezes) extra += `\nVocê já jogou ${vezes}x${tempoTxt ? " (" + tempoTxt + ")" : ""}.`;
        if (nota) extra += ` Sua nota: ${"★".repeat(nota)}${"☆".repeat(5 - nota)}`;
        return {
            texto: `**${j.titulo}** · ${catTitulo(j.categoria)}\n${j.descricao}${extra}`,
            jogos: [{ jogo: j }],
            chips: [{ texto: "🔁 Parecidos", acao: () => responder(rParecidos(j)) }]
        };
    }

    function aplicarFavorito(j, remover) {
        const ja = favoritosIds().includes(j.id);
        if (remover && !ja) return { texto: `**${j.titulo}** nem estava nos seus favoritos.` };
        if (!remover && ja) return { texto: `**${j.titulo}** já está nos seus favoritos ♥`, chips: [{ texto: "❤️ Ver favoritos", acao: () => responder(rFavoritos()) }] };
        seguro(() => toggleFavorito(j.id));
        ctx.ultimoJogo = j;
        return remover
            ? { texto: `Tirei **${j.titulo}** dos favoritos.` }
            : { texto: `Pronto! **${j.titulo}** foi pros favoritos ♥`, chips: [{ texto: "🔁 Parecidos", acao: () => responder(rParecidos(j)) }, { texto: "❤️ Ver favoritos", acao: () => responder(rFavoritos()) }] };
    }

    function rFavoritosIntent(t, info) {
        const remover = /\b(tira\w*|remov\w+|desfavorit\w+|retira\w*|exclu\w+|deleta\w*|nao quero mais)\b/.test(t);
        const adicionar = /\b(favorit(a|ar|e|ei|ou)|curti\w*|adicion\w+|salv(a|ar|e)|coloc\w+|bota\w*|marc(a|ar))\b/.test(t);
        const ref = info.ref;
        if (ref && (remover || adicionar)) {
            if (ref.forca === "ambiguo") {
                return desambiguar(ref.ambiguos, j => aplicarFavorito(j, remover), remover ? "Qual deles você quer tirar?" : "Qual deles você quer favoritar?");
            }
            return aplicarFavorito(ref.jogo, remover);
        }
        if ((remover || adicionar) && !ref) {
            return { texto: "Qual jogo? Diga o nome, por exemplo: \"favorita o Xadrez\"." };
        }
        return rFavoritos();
    }

    function rAvaliar(t, info) {
        const ref = info.ref;
        if (ref && info.nota) {
            if (ref.forca === "ambiguo") {
                return desambiguar(ref.ambiguos, j => darNota(j, info.nota), `Qual deles recebe ${info.nota}★?`);
            }
            return darNota(ref.jogo, info.nota);
        }
        if (/\b(meus|minhas|que eu|melhores|ranking)\b/.test(t)) return rMelhoresNotas();
        return {
            texto: "Você pode dar de 1 a 5 estrelas dentro do jogo (toca num card e marca as estrelas). Ou me diga: \"dou 5 estrelas pro Xadrez\".",
            chips: [{ texto: "⭐ Minhas notas", acao: () => responder(rMelhoresNotas()) }]
        };
    }

    function darNota(j, nota) {
        seguro(() => avaliarJogo(j.id, nota));
        ctx.ultimoJogo = j;
        return { texto: `Anotado! **${j.titulo}**: ${"★".repeat(nota)}${"☆".repeat(5 - nota)}` };
    }

    function rParecidosIntent(info) {
        const ref = info.ref;
        if (ref && ref.forca === "ambiguo") return desambiguar(ref.ambiguos, j => rParecidos(j), "Parecido com qual deles?");
        const jogo = ref ? ref.jogo : ctx.ultimoJogo;
        if (!jogo) return { texto: "Parecido com qual jogo? Diga o nome, por exemplo: \"parecido com o Xadrez\"." };
        return rParecidos(jogo);
    }

    /* ---------- Navegação e funções do hub ---------- */

    const SECOES = [
        ["favoritos", /\bfavorit/],
        ["continuar-jogando", /\b(continu\w+|recentes?)\b/],
        ["em-alta", /\bem alta\b/],
        ["quem-somos", /\bquem somos\b/],
        ["parceiros", /\bparceir/],
        ["rodape", /\b(rodape|final da pagina)\b/],
        ["topo", /\b(topo|inicio da pagina|comeco da pagina)\b/],
        ["todos", /\b(todos|todas)\b/],
        ...CAT_RX
    ];
    const secaoDe = t => { const s = SECOES.find(([, rx]) => rx.test(t)); return s ? s[0] : null; };

    function rSecao(t) {
        const id = secaoDe(t);
        const nome = id === "quem-somos" ? "Quem somos" : id === "topo" ? "o topo" : id === "rodape" ? "o rodapé" : (CATS.find(c => c.id === id) || {}).titulo || id;
        return { texto: `Te levando para **${nome}**… 👇`, depois: () => { if (!irPara(id)) responder("Não encontrei essa seção na página."); } };
    }

    function rArea(t) {
        if (/\b(o que e|como (funciona|faz|cria|usa|monta)|pra que serve|serve)\b/.test(t)) {
            return {
                texto: "A **Minha área** é uma tela só sua: você escolhe quais jogos entram, eles aparecem lado a lado com a capa (tipo uma área de apps), e dá pra trocar o fundo (cor ou imagem) e o espaçamento.",
                chips: [{ texto: "🧩 Abrir Minha área", acao: () => responder(rAreaAbrir()) }]
            };
        }
        return rAreaAbrir();
    }
    function rAreaAbrir() {
        return { texto: "Abrindo a **Minha área**… 🧩", depois: () => { if (!clicar("[data-area-abrir]", ehMobile())) responder("Não consegui abrir a área agora. Tenta pelo botão \"Minha área\" do hub."); } };
    }

    function rInstagram() {
        return { texto: "Abrindo o Instagram da OldNow… 📸", depois: () => { if (!clicar("[data-social-abrir]", true)) responder("Não achei o botão do Instagram nesta tela."); } };
    }

    function rInstalar() {
        if (jaInstalado()) return { texto: "Você já está usando o app instalado! 🎉" };
        const disponivel = !!document.querySelector("[data-instalar-app]:not(.d-none)");
        if (disponivel) {
            return {
                texto: "Não precisa baixar nada pra jogar — os jogos rodam no navegador. Mas se quiser, dá pra **instalar o hub como app**, com ícone na tela inicial.",
                chips: [{ texto: "📲 Instalar agora", acao: () => { if (!instalarApp()) responder("O navegador não liberou a instalação agora."); } }]
            };
        }
        if (ehIOS()) {
            return { texto: "Os jogos rodam direto no navegador, sem baixar nada. Pra instalar o hub no iPhone: toque em **Compartilhar** e depois em **Adicionar à Tela de Início**." };
        }
        return { texto: "Os jogos rodam direto no navegador, sem baixar nada. O botão **Instalar app** aparece quando o seu navegador permite instalar o hub (no Chrome/Edge costuma ficar no menu). Se não aparecer, pode ser que já esteja instalado ou que o navegador não suporte." };
    }

    function rSessao(t) {
        const n = nomeJogador();
        const quer = /\b(trocar|mudar|sair|nova|entrar|outra|criar)\b/.test(t);
        const base = n
            ? `Você está na sessão de **${n}**. Favoritos, recentes e notas ficam salvos neste aparelho.`
            : "Você está **sem sessão**: seus dados ficam só enquanto a página estiver aberta. Com uma sessão, favoritos, recentes e notas continuam salvos neste aparelho (sem senha).";
        const abrir = () => seguro(() => window.OldNowSessao.abrirEntrada({ podeFechar: true }));
        if (quer) return { texto: "Abrindo a tela de sessão…", depois: () => { fecharPainel(); abrir(); } };
        return { texto: base, chips: [{ texto: n ? "🔁 Trocar de sessão" : "👤 Iniciar sessão", acao: () => responder({ texto: "Abrindo a tela de sessão…", depois: () => { fecharPainel(); abrir(); } }) }] };
    }

    /* ---------- Conversa ---------- */

    function rAjuda() {
        return {
            texto: "Posso te ajudar com:\n• Recomendar jogos (\"quero algo de corrida\", \"jogo relaxante\", \"tipo xadrez\")\n• Abrir, favoritar e avaliar jogos pelo nome\n• Mostrar favoritos, recentes, mais jogados, notas e tempo jogado\n• Achar jogos parecidos com outro\n• Abrir a Minha área, o Instagram, instalar o app\n• Levar você até uma seção do site\n• Tirar dúvidas (grátis? celular? offline? sessão?)",
            chips: [
                { texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) },
                { texto: "❤️ Meus favoritos", acao: () => responder(rFavoritos()) },
                { texto: "🧩 Minha área", acao: () => responder(rAreaAbrir()) }
            ]
        };
    }

    function rSobreBot() {
        return {
            texto: "Eu sou o **Old bot**, o assistente da OldNow Games. Não sou uma IA conectada à internet: funciono com regras e conheço os jogos do hub, por isso às vezes erro. Se eu não entender, tenta com outras palavras!",
            chips: [{ texto: "❓ O que você faz?", acao: () => responder(rAjuda()) }]
        };
    }

    function rSobreHub() {
        return {
            texto: `A **OldNow Games** é um hub de jogos grátis de navegador. Começou em 2025 na ETEC Pedro Ferreira Alves (Mogi Mirim), com o Pixel Saga apresentado na Expoete, e hoje reúne ${GAMES.length} jogos, sem baixar nada.`,
            chips: [
                { texto: "Ver \"Quem somos\"", acao: () => irPara("quem-somos") },
                { texto: "🤝 Parceiros", acao: () => irPara("parceiros") }
            ]
        };
    }

    function rQuantos() {
        const partes = CATS.map(c => `• ${c.titulo}: ${GAMES.filter(j => j.categoria === c.id).length}`).join("\n");
        return {
            texto: `O hub tem **${GAMES.length} jogos**:\n${partes}`,
            chips: CATS.slice(0, 3).map(c => ({ texto: c.titulo, acao: () => responder(rLista({ toks: [], cat: c.id, rotulo: c.titulo })) }))
        };
    }

    const FAQS = [
        { id: "gratis", rx: /\b(gratis|gratuito|pago|paga|pagar|custa|custo|preco|assinatura|cobran\w+|de graca)\b/, peso: 4,
          resp: () => ({ texto: "Tudo aqui é **grátis**! Sem cadastro, sem anúncio de compra e sem baixar nada. 😄" }) },
        { id: "celular", rx: /\b(celular|mobile|android|iphone|ios|tablet|toque|touch|telefone)\b/, peso: 2.5, extra: /\b(funciona|roda|da pra|posso|compativel|serve|joga\w*|rodar)\b/, pesoExtra: 2,
          resp: () => ({ texto: "Os jogos abrem no navegador, tanto no celular quanto no PC. Alguns, principalmente os de ação, podem ficar mais confortáveis com teclado. Dica: use o botão **⛶ tela cheia** do player, e se algum não responder bem ao toque, abra em **nova aba**." }) },
        { id: "dados", rx: /\b(perd\w+|somem|some|apag\w+|ficam salv\w+|onde (fica|ficam)|progresso|guardad\w+)\b/, peso: 4,
          resp: () => ({ texto: "Seus favoritos, recentes e notas ficam salvos **só neste aparelho**. Com uma sessão, continuam depois que você fecha o site; **sem sessão**, somem quando a página é fechada." }) },
        { id: "compartilhar", rx: /\b(compartilh\w+|mandar (o )?link|enviar (o )?link|link do jogo|convidar)\b/, peso: 4,
          resp: () => ({ texto: "Abre o jogo (toca no card) e usa o botão **🔗 Compartilhar**: ele copia um link que abre direto naquele jogo. É só colar pro seu amigo!" }) },
        { id: "telacheia", rx: /\b(tela cheia|fullscreen|tela grande|maximizar|ampliar)\b/, peso: 4,
          resp: () => ({ texto: "Dentro do jogo, use o botão **⛶** no canto da barra de cima. No iPhone o navegador pode não permitir tela cheia de verdade, mas o jogo já abre ocupando a tela toda." }) },
        { id: "offline", rx: /\b(offline|sem internet|sem net|sem wifi|sem conexao)\b/, peso: 4,
          resp: () => ({ texto: "Depois da primeira visita, o **hub** abre mesmo sem internet (principalmente instalado como app). Mas os **jogos** carregam da internet, então precisam de conexão." }) },
        { id: "bug", rx: /\b(bug|erro|travou|travando|trava|nao (abre|carrega|funciona|roda|aparece|consigo)|lento|lag|quebrou|problema|tela preta|congel\w+)\b/, peso: 4,
          resp: () => ({
              texto: "Poxa, desculpa o problema! Tenta isso, na ordem:\n1. Recarregar a página\n2. Abrir o jogo em **nova aba** (botão no card)\n3. Atualizar o app, se o aviso \"Nova versão\" aparecer\n4. Testar em outro navegador\nSe continuar, conta pra equipe no Instagram!",
              chips: [{ texto: "📸 Falar com a equipe", acao: () => responder(rInstagram()) }] }) },
        { id: "parceiros", rx: /\b(parceir\w+|patrocin\w+|apoio|apoiadores)\b/, peso: 4,
          resp: () => ({ texto: "Nossos parceiros: Guaçuano, Julio Motos, Infonacci, Urim, ADM, Mogilandi, Superwatts e Car Tape. 🤝", chips: [{ texto: "Ver seção", acao: () => irPara("parceiros") }] }) },
        { id: "contato", rx: /\b(contato|instagram|insta|redes|feedback|reclamacao|falar com (voces|a equipe))\b/, peso: 4,
          resp: () => rInstagram() },
        { id: "multi", rx: /\b(multiplayer|dois jogadores|2 jogadores|com amigo|com amigos|jogar junto|online com)\b/, peso: 4,
          resp: () => ({ texto: "Ainda não marquei quais jogos têm modo para dois jogadores. Os **jogos de mesa** (Xadrez, Damas, Crazy 8, Tic Tac Chaos) costumam ser ótimos pra jogar com alguém. Dá uma olhada dentro do jogo pra ver as opções!", chips: [{ texto: "🃏 Ver jogos de mesa", acao: () => responder(rLista({ toks: [], cat: "tabuleiro", rotulo: "Jogos de Mesa" })) }] }) }
    ];

    /* =========================================================
       INTENÇÕES (cada uma dá uma nota; vence a maior)
       ========================================================= */

    const R = (rx, peso) => t => (rx.test(t) ? peso : 0);
    const soma = (...fns) => (t, info) => fns.reduce((a, f) => a + f(t, info), 0);

    const INTENCOES = [
        { id: "ajuda", pontos: R(/\b(ajuda|ajudar|help|comandos?|o que (voce )?(sabe|faz|pode)|como (te )?uso|como funciona (o )?(bot|assistente))\b/, 4),
          tratar: () => rAjuda() },
        { id: "sobre-bot", pontos: R(/\b(quem e voce|voce e (um )?(robo|bot|ia|humano)|seu nome|como (voce )?(se chama|chama)|e uma ia|e um robo)\b/, 4),
          tratar: () => rSobreBot() },
        { id: "sobre-hub", pontos: R(/\b(oldnow|old now|hub|plataforma|etec|expoete|criou|criador\w*|desenvolveu|quem somos|historia do)\b/, 3.5),
          tratar: () => rSobreHub() },
        { id: "quantos", pontos: R(/\bquantos jogos\b|\bquantos (tem|existem)\b/, 4),
          tratar: () => rQuantos(), combinavel: true },
        { id: "agradecimento", pontos: R(/\b(obrigad\w*|valeu|agradec\w+|thanks|brigad\w*)\b/, 4),
          tratar: () => aleatorio([{ texto: "Por nada! 😄 Qualquer coisa, é só chamar." }, { texto: "Disponha! Bom jogo! 🎮" }, { texto: "Tamo junto! 🙌" }]) },
        { id: "despedida", pontos: R(/\b(tchau|ate mais|ate logo|falou|adeus|bye|ate amanha)\b/, 4),
          tratar: () => aleatorio([{ texto: "Até mais! Bom jogo! 👋" }, { texto: "Tchau! Volta sempre! 🎮" }]) },
        { id: "piada", pontos: R(/\b(piada|me faz rir|engracad\w+|humor)\b/, 4),
          tratar: () => ({ texto: aleatorio(PIADAS), chips: [{ texto: "😂 Outra piada", acao: () => responder({ texto: aleatorio(PIADAS) }) }] }) },
        { id: "curiosidade", pontos: R(/\b(curiosidade|sabia que|fato curioso|conta algo|me conta algo|novidade sobre voce)\b/, 4),
          tratar: () => ({ texto: aleatorio(curiosidades()), chips: [{ texto: "🤓 Outra curiosidade", acao: () => responder({ texto: aleatorio(curiosidades()) }) }] }) },
        { id: "elogio", pontos: (t, info) => (/\b(top|incrivel|show|otimo|perfeito|gostei|amei|adorei|muito bom|legal)\b/.test(t) && info.conteudo.length <= 2 ? 2.5 : 0),
          tratar: () => aleatorio([{ texto: "Fico feliz! 😊 Quer que eu ache mais jogos assim?" }, { texto: "Que bom! 🎉 Posso sugerir outro?" }]) },
        { id: "ofensa", pontos: R(/\b(burro|idiota|inutil|lixo|bobo|horrivel|odeio)\b/, 4),
          tratar: () => ({ texto: "Poxa, desculpa se não consegui ajudar. 😅 Me diz de outro jeito o que você procura e eu tento de novo.", chips: chipsPadrao() }) },
        { id: "limpar", pontos: R(/\b(limpa\w*|apaga\w* (o )?(chat|conversa)|recomecar|reiniciar|zerar (o )?chat)\b/, 4),
          tratar: () => { limparConversa(); return null; } },

        ...FAQS.map(f => ({
            id: "faq-" + f.id,
            pontos: soma(R(f.rx, f.peso), f.extra ? R(f.extra, f.pesoExtra || 1.5) : () => 0),
            tratar: () => f.resp()
        })),

        { id: "sessao", pontos: soma(R(/\b(sessao|sessoes|perfil|conta|login|logar|cadastro|cadastrar|senha|nome de usuario)\b/, 3.5), R(/\b(trocar|mudar|sair|entrar|nova|criar)\b/, 0.5)),
          tratar: t => rSessao(t) },
        { id: "instalar", pontos: R(/\b(instal\w+|aplicativo|app|pwa|tela inicial|baix\w+|download)\b/, 3.5),
          tratar: () => rInstalar() },
        { id: "area", pontos: soma(R(/\b(minha area|criar area|criar minha area|area de (jogos|games)|personalizar (a )?area|fundo da area|prateleira)\b/, 4), R(/\barea\b/, 1.5)),
          tratar: t => rArea(t) },
        { id: "surpreenda", pontos: R(/\b(surpreend\w+|aleatorio|sortei\w*|sortear|dado|tanto faz|qualquer (um|jogo|coisa)|nao sei (o que|qual)|indeciso|sem ideia|escolhe (pra|por) mim|decide)\b/, 4),
          tratar: () => { const r = recomendarPersonalizado(); return r; } },
        { id: "novidades", pontos: R(/\b(novidades?|lancamentos?|atualizacoes?|atualizacao|novos jogos|jogos novos|o que (tem de )?novo|ultimos jogos)\b/, 4),
          tratar: () => rNovidades(), combinavel: true },
        { id: "tempo", pontos: R(/\b(quanto tempo|quantas horas|horas jogadas|tempo jogado|tempo de jogo|horas de jogo|minutos jogados|passei jogando)\b/, 4.5),
          tratar: (t, info) => rTempo(info), combinavel: true },
        { id: "recentes", pontos: R(/\b(recentes?|continuar|ultimo jogo|ultimos jogados|onde parei|de onde parei|joguei por ultimo|historico de jogos)\b/, 3.5),
          tratar: () => rRecentes(), combinavel: true },
        { id: "mais-jogados", pontos: R(/\b(mais jogados?|top jogos|ranking|estatisticas?|stats|que mais jogo|mais joguei)\b/, 3.5),
          tratar: () => rMaisJogados(), combinavel: true },
        { id: "favoritos", pontos: soma(R(/\b(favorit\w+|curtidos)\b/, 3), R(/\b(meus|minhas|quais|lista|ver|mostra)\b/, 0.8)),
          tratar: (t, info) => rFavoritosIntent(t, info), combinavel: true },
        { id: "avaliar", pontos: (t, info) => (/\b(avali\w+|nota|notas|estrelas?|dou|dei)\b/.test(t) ? 3 + (info.ref && info.nota ? 2 : 0) : 0),
          tratar: (t, info) => rAvaliar(t, info) },
        { id: "secao", pontos: (t) => { const s = secaoDe(t); return s && /\b(ir|vai|va|leva\w*|rola\w*|desce|sobe|pula\w*|secao|parte do site)\b/.test(t) ? 5 : 0; },
          tratar: t => rSecao(t) },
        { id: "parecidos", pontos: (t, info) => (/\b(parecid\w+|semelhante\w*|similar\w*|igual (a|ao)|no estilo|estilo (de|do|da)|lembra|mesmo estilo)\b/.test(t) ? 4 + (info.ref ? 1 : 0) : 0),
          tratar: (t, info) => rParecidosIntent(info) },
        { id: "abrir", pontos: (t, info) => {
              if (!info.ref) return 0;
              const verbo = /\b(abr\w+|jogar|joga|jogue|iniciar|inicia|comecar|vamos|bora|partiu|play|quero jogar|entrar)\b/.test(t);
              if (!verbo) return 0;
              return 3 + (info.ref.forca === "busca" ? 1.5 : 3);
          }, tratar: (t, info) => rAbrir(info) },
        { id: "info-jogo", pontos: (t, info) => {
              if (!info.ref) return 0;
              let s = /\b(sobre|fala\w*|conta\w*|explica\w*|detalhes|descricao|como (e|joga|funciona|se joga)|o que e|que jogo e)\b/.test(t) ? 2 : 0;
              if (info.ref.forca === "titulo" || info.ref.forca === "ambiguo") s += s ? 3 : (info.conteudo.length <= 3 ? 2.5 : 0);
              else if (s) s += 1.5;
              return s;
          }, tratar: (t, info) => rInfoJogo(info) },
        { id: "listar", pontos: (t, info) => {
              if (!/\b(quais|lista\w*|todos os|todas as|tem quais|que jogos)\b/.test(t)) return 0;
              return 2.5 + (/\bjogos\b/.test(t) ? 1 : 0) + (info.cat ? 1.5 : 0);
          }, tratar: (t, info) => rLista(consultaDe(info)) },
        { id: "recomendar", pontos: (t, info) => {
              let s = 0;
              if (/\b(recomend\w*|sugir\w*|sugest\w*|indic\w*)\b/.test(t)) s += 4;
              if (/\b(quero|queria|procuro|busco|preciso|bora|vamos)\b/.test(t) && /\b(jogo|jogos|jogar)\b/.test(t)) s += 3;
              if (/\b(que|qual)\b.*\b(jogo|jogos|jogar)\b/.test(t)) s += 2.5;
              if (/\b(tem|existe)\b.*\bjogos?\b/.test(t)) s += 2;
              if (/\bjogos? (de|do|da|com|sobre|tipo|para|pra)\b/.test(t)) s += 2.5;
              if (/\b(me da|me mostra|me acha|me ache|manda|traz)\b/.test(t)) s += 2;
              if (/\b(melhor|melhores|mais divertido|mais legal)\b/.test(t) && /\bjogos?\b/.test(t)) s += 2;
              if (info.cat && /\bjogo/.test(t)) s += 1;
              if (info.conteudo.length) {
                  const top = pontuarJogos(info.conteudo)[0];
                  if (top && top.score >= CONFIANCA) s += 1.5;
              }
              return s;
          }, tratar: (t, info) => sugerir(consultaDe(info)) },
        { id: "outro", pontos: (t, info) => {
              if (!ctx.ultimaAcao) return 0;
              let s = /\b(outro|outra|outros|mais um|mais uma|proximo|proxima|de novo|repete|repetir|nao gostei|nao curti|diferente|troca|trocar|mais algum|mais alguma|e mais)\b/.test(t) ? 3 : 0;
              if (s && info.conteudo.length === 0) s += 1.5;
              return s;
          }, tratar: () => { ctx.ultimaAcao(); return null; } },
        { id: "ack", pontos: R(/^(ok|certo|entendi|blz|show|top|beleza|ta bom|tudo certo)$/, 3),
          tratar: () => ({ texto: "Beleza! 😄 Se quiser, é só pedir um jogo.", chips: chipsPadrao() }) }
    ];

    /* =========================================================
       INTERPRETAÇÃO
       ========================================================= */

    const SAUDACAO_RX = /\b(oi+|ola|eai|e ai|e ae|opa|salve|hey|hello|bom dia|boa tarde|boa noite|fala ai|tudo bem|como vai|como voce esta|como voce vai)\b/g;
    const SIM_RX = /^(sim|claro|pode|pode sim|bora|vamos|quero|quero sim|isso|ok|certo|fechado|manda|uhum|aham|positivo|por favor|vamos sim|abre|abrir)$/;
    const NAO_RX = /^(nao|agora nao|deixa|depois|nenhum|negativo|nope|deixa pra la|nao quero|nao obrigado)$/;

    function montarInfo(original, t) {
        const toks = t.split(" ").filter(Boolean);
        const conteudo = toks.filter(tk => tk.length >= 2 && !STOP.has(tk));
        const info = { original, t, toks, conteudo };
        info.ref = resolverJogo(t, conteudo);
        info.cat = categoriaExplicita(t);
        const m = t.match(/\b([1-5])\b/);
        info.nota = m ? parseInt(m[1], 10) : null;
        return info;
    }

    function saudacaoResposta(t) {
        if (/\b(tudo bem|como vai|como voce)\b/.test(t)) {
            return { texto: `${oiNome()} Tudo ótimo por aqui! E você? Quer uma sugestão de jogo?`, chips: chipsPadrao() };
        }
        return {
            texto: aleatorio([`${oiNome()} 👋 Quer ajuda pra escolher um jogo?`, `${oiNome()} Pronto pra jogar? Posso recomendar algo.`, `E aí! ${oiNome()} Me diz o que você curte ou pede uma recomendação.`]),
            chips: chipsPadrao()
        };
    }

    const CHAVES_POSICAO = {
        "favoritos": /favorit|curtidos/, "novidades": /novidade|lancamento|novos jogos|jogos novos|novo/,
        "recentes": /recente|continuar|ultimo|onde parei/, "mais-jogados": /mais jogad|ranking|estatistica|stats/,
        "quantos": /quantos/, "tempo": /tempo|horas/
    };
    function posicaoNaFrase(intencao, t) {
        const rx = CHAVES_POSICAO[intencao.id];
        const p = rx ? t.search(rx) : -1;
        return p < 0 ? 999 : p;
    }

    function interpretar(texto) {
        const prep = preparar(texto);
        let t = prep.t;

        // resposta curta a uma pergunta do bot ("quer abrir?" -> "sim")
        if (ctx.pendenteSim) {
            if (SIM_RX.test(t)) { const f = ctx.pendenteSim; ctx.pendenteSim = null; return f(); }
            if (NAO_RX.test(t)) { ctx.pendenteSim = null; return { texto: "Tudo bem! Se mudar de ideia, é só falar. 😉" }; }
        }

        const saudou = SAUDACAO_RX.test(t);
        SAUDACAO_RX.lastIndex = 0;
        if (saudou) {
            const resto = t.replace(SAUDACAO_RX, " ").replace(/\s+/g, " ").trim();
            SAUDACAO_RX.lastIndex = 0;
            const sobra = resto.split(" ").filter(tk => tk.length >= 2 && !STOP.has(tk));
            if (!sobra.length) { ctx.falhas = 0; return saudacaoResposta(t); }
            t = resto;
        }

        const info = montarInfo(texto, t);
        const ranking = INTENCOES
            .map(i => ({ i, s: seguro(() => i.pontos(t, info), 0) }))
            .filter(x => x.s >= 2)
            .sort((a, b) => b.s - a.s);

        let respostas = [];
        if (ranking.length) {
            ctx.falhas = 0;
            const [a, b] = ranking;
            if (a.i.combinavel && b && b.i.combinavel && b.s >= 3) {
                const par = [a, b].sort((x, y) => posicaoNaFrase(x.i, t) - posicaoNaFrase(y.i, t));
                par.forEach(x => respostas.push(x.i.tratar(t, info)));
            } else {
                respostas.push(a.i.tratar(t, info));
            }
        } else {
            respostas.push(fallback(info));
        }

        respostas = respostas.filter(Boolean);
        if (saudou && respostas.length) {
            const r0 = typeof respostas[0] === "string" ? { texto: respostas[0] } : respostas[0];
            if (Array.isArray(r0)) { /* não deve ocorrer */ }
            else if (r0.texto) r0.texto = `${oiNome()} ${r0.texto}`;
            respostas[0] = r0;
        }
        return respostas;
    }

    function fallback(info) {
        const busca = pontuarJogos(info.conteudo);
        if (busca.length && busca[0].score >= CONFIANCA) {
            ctx.falhas = 0;
            return sugerir(consultaDe(info));
        }
        ctx.falhas++;
        if (String(info.original).trim().length > 3) registrarDuvida(info.original);

        if (info.conteudo.length) {
            const chips = chipsPadrao();
            if (ctx.falhas >= 2) chips.push({ texto: "📸 Falar com a equipe", acao: () => responder(rInstagram()) });
            return {
                texto: `Não achei jogos com **${info.conteudo.slice(0, 4).join(" ")}**. Tenta outras palavras (corrida, puzzle, fazenda, zumbi, espaço…) ou escolhe uma opção:`,
                chips
            };
        }
        const chips = [
            { texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) },
            { texto: "❤️ Meus favoritos", acao: () => responder(rFavoritos()) },
            { texto: "❓ Ajuda", acao: () => responder(rAjuda()) }
        ];
        if (ctx.falhas >= 2) chips.push({ texto: "📸 Falar com a equipe", acao: () => responder(rInstagram()) });
        return { texto: "Não entendi muito bem. Reformule ou escolha uma opção:", chips };
    }

    function processar(texto) {
        removerChips();
        addMensagem(texto, "user");
        try {
            responder(interpretar(texto));
        } catch (erro) {
            console.warn("[Old bot] erro ao responder:", erro);
            responder({ texto: "Ops, me atrapalhei aqui. 😅 Tenta de outro jeito ou escolhe uma opção:", chips: chipsPadrao() });
        }
    }

    /* =========================================================
       ABRIR / FECHAR / HISTÓRICO
       ========================================================= */

    function boasVindas() {
        const chips = [];
        if (recentesIds().length) chips.push({ texto: "⏯️ Continuar de onde parei", acao: () => responder(rRecentes()) });
        chips.push({ texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) });
        if (!favoritosIds().length) chips.push({ texto: "❤️ Como favoritar?", acao: () => responder({ texto: "Toca no ♡ no canto de um card e ele vai pros seus favoritos. Ou me diga: \"favorita o Xadrez\"." }) });
        else chips.push({ texto: "❤️ Meus favoritos", acao: () => responder(rFavoritos()) });
        if (GAMES.some(j => j.novo)) chips.push({ texto: "✨ Novidades", acao: () => responder(rNovidades()) });
        chips.push({ texto: "❓ O que você faz?", acao: () => responder(rAjuda()) });
        responder({
            texto: `${oiNome()} Sou o **Old bot**. Posso recomendar jogos, abrir, favoritar, achar parecidos e tirar dúvidas. Como quer começar?`,
            chips: chips.slice(0, 4)
        });
    }

    function restaurar() {
        const salvo = lerHist();
        if (!salvo.length) return false;
        hist = salvo;
        salvo.forEach(m => addMensagem(m.texto, m.tipo, true));
        addChips([
            { texto: "🎲 Recomende um jogo", acao: () => responder(recomendarPersonalizado()) },
            { texto: "❓ Ajuda", acao: () => responder(rAjuda()) }
        ]);
        return true;
    }

    function limparConversa() {
        mensagens.innerHTML = "";
        hist = [];
        try { sessionStorage.removeItem(CHAVE_HIST); } catch (e) { /* ignora */ }
        ctx.vistos.clear();
        ctx.ultimaAcao = null;
        ctx.pendenteSim = null;
        ctx.ultimoJogo = null;
        ctx.falhas = 0;
        boasVindas();
    }

    let iniciado = false;

    function abrirPainel() {
        painel.classList.remove("d-none");
        toggle.setAttribute("aria-expanded", "true");
        if (!iniciado) {
            iniciado = true;
            if (!restaurar()) boasVindas();
        }
        ajustarTeclado();
        if (!ehMobile()) setTimeout(() => input.focus(), 60);
    }

    function fecharPainel() {
        const estavaAberto = !painel.classList.contains("d-none");
        painel.classList.add("d-none");
        toggle.setAttribute("aria-expanded", "false");
        if (estavaAberto && document.activeElement && painel.contains(document.activeElement)) toggle.focus({ preventScroll: true });
    }

    // Ajusta o painel quando o teclado do celular abre
    function ajustarTeclado() {
        const vv = window.visualViewport;
        if (!vv || painel.classList.contains("d-none") || !ehMobile()) return;
        const tecladoAlt = window.innerHeight - vv.height - vv.offsetTop;
        if (tecladoAlt > 80) {
            painel.style.bottom = (tecladoAlt + 8) + "px";
            painel.style.height = Math.min(520, vv.height - 16) + "px";
        } else {
            painel.style.bottom = "";
            painel.style.height = "";
        }
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", ajustarTeclado);
        window.visualViewport.addEventListener("scroll", ajustarTeclado);
    }

    toggle.addEventListener("click", () => {
        painel.classList.contains("d-none") ? abrirPainel() : fecharPainel();
    });
    fechar.addEventListener("click", fecharPainel);

    form.addEventListener("submit", e => {
        e.preventDefault();
        const txt = input.value.trim();
        if (!txt) return;
        input.value = "";
        processar(txt.slice(0, 200));
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !painel.classList.contains("d-none")) fecharPainel();
    });

    // Troca de sessão: a conversa antiga não vale mais
    const atualizarOriginal = window.atualizarTelaPorSessao;
    if (typeof atualizarOriginal === "function") {
        window.atualizarTelaPorSessao = function () {
            atualizarOriginal.apply(this, arguments);
            if (iniciado && hist.length && lerHist().length === 0) { limparConversa(); }
        };
    }

    /* ---------- Pequena API para testes e manutenção (console) ---------- */
    window.OldNowBot = {
        abrir: abrirPainel,
        perguntar: processar,
        duvidas: () => {
            const arm = armazemDuvidas();
            try { return JSON.parse((arm && arm.getItem(CHAVE_DUVIDAS)) || "[]"); } catch (e) { return []; }
        },
        limparDuvidas: () => { const arm = armazemDuvidas(); if (arm) arm.removeItem(CHAVE_DUVIDAS); },
        _interpretar: interpretar
    };
})();