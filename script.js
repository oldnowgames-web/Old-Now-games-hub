/* ---------- Sempre iniciar no topo da página (slide inicial do banner) ---------- */

(function iniciarNoTopo() {
    // impede o navegador de restaurar a posição de rolagem anterior (reload, voltar, etc.)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    // remove âncora (#favoritos etc.) da URL ao abrir, pra não pular direto pra uma seção
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);

    // "instant" ignora o scroll-behavior: smooth do CSS
    const irParaTopo = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    irParaTopo();

    // reforça depois do load (alguns navegadores restauram a rolagem nesse momento),
    // mas só se a pessoa ainda não mexeu na página
    let usuarioRolou = false;
    ["wheel", "touchstart", "keydown"].forEach(ev =>
        window.addEventListener(ev, () => { usuarioRolou = true; }, { once: true, passive: true })
    );
    window.addEventListener("load", () => { if (!usuarioRolou) irParaTopo(); });

    // voltar pra página pelo cache do navegador (bfcache)
    window.addEventListener("pageshow", e => { if (e.persisted) irParaTopo(); });
})();

// A tela de abertura (intro com o gif) agora é controlada pelo tela-inicial.js

// Base de dados dos jogos do hub.
// categoria: 'aventura-acao' | 'simulacao-estrategia' | 'esporte-racing' | 'puzzle' | 'arcade' | 'tabuleiro' | null
// novo: false mostra a tag "NOVO" no card
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
        categorias: ["explorador-espaco"],
        novo: false
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
        id: "quebra-meteoro",
        titulo: "Quebra Meteoro",
        descricao: "Desafie suas habilidades de clique destruindo os meteoros da tela! .",
        capa: "capas/quebrameteor.png",
        imgs: ["quebrameteoro/meteor.png", "quebrameteoro/meteor.png", "quebrameteoro/meteor.png"],
        link: "https://oldnowgames-web.github.io/Qubra-Meteoro/",
        categoria: "aventura-acao",
        novo: false
    },
    {
        id: "pixel-saga",
        titulo: "Pixel Saga: Exploração na Lua",
        descricao: "Explore a lua e colete os fragmentos da missão.",
        capa: "capas/PixelSaga-lunar_exploration.png",
        imgs: ["pixelsagalua/lua1.png", "pixelsagalua/lua2.png", "pixelsagalua/lua3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Saga-Exploracao-na-Lua/",
        categoria: "simulacao-estrategia",
        categorias: ["explorador-espaco"],
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
        id: "burguer-now",
        titulo: "Burguer Now",
        descricao: "Gerencie sua hamburgueria, vire o mestre dos hamburgueres!",
        capa: "capas/burguer.png",
        imgs: ["burguer/burguer1.png", "burguer/burguer2.png", "burguer/burguer3.png"],
        link: "https://oldnowgames-web.github.io/Burguer-Now/",
        categoria: "simulacao-estrategia",
        novo: false
    },

         {
        id: "merge strike",
        titulo: "Merge Strike",
        descricao: "Compre torres e evolua para derrotar monstros",
        capa: "capas/merge.png",
        imgs: ["merge/merge1.png", "merge/merge2.png", "merge/merge3.png"],
        link: "https://oldnowgames-web.github.io/Merge-Strike/",
        categoria: "simulacao-estrategia",
        novo: false
    },

       {
        id: "pixelsaga-mercury",
        titulo: "Pixel Saga: Exploração em Mercúrio",
        descricao: "Explore e aprenda sobre o planeta Mercúrio, faça novas descobertas.",
        capa: "capas/mercury.png",
        imgs: ["mercury/mercury1.png", "mercury/mercury2.png", "mercury/mercury3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Saga-Exploracao-em-mercurio/",
        categoria: "simulacao-estrategia",
        categorias: ["explorador-espaco"],
        novo: false
    },

     {
        id: "crazy-8",
        titulo: "Crazy 8",
        descricao: "O clássico jogo de baralho !",
        capa: "capas/crazy.jpeg",
        imgs: ["crazy/crazy1.png", "crazy/crazy2.png", "crazy/crazy3.png"],
        link: "https://oldnowgames-web.github.io/Crazy-8/",
        categoria: "tabuleiro",
        novo: false
    },

    
     {
        id: "paciencia",
        titulo: "Paciência",
        descricao: "O clássico jogo de paciência agora em pixel art.",
        capa: "capas/paciencia.png",
        imgs: ["paciencia/paciencia1.png", "paciencia/paciencia2.png", "paciencia/paciencia3.png"],
        link: "https://oldnowgames-web.github.io/Paciencia/",
        categoria: "tabuleiro",
        novo: false
    },

       {
        id: "domino",
        titulo: "Dominó",
        descricao: "O jogo de dominó, escolha entre vários estilos e jogue o clássico !",
        capa: "capas/domino.png",
        imgs: ["domino/domino1.png", "domino/domino2.png", "domino/domino3.jpeg"],
        link: "https://oldnowgames-web.github.io/Domino/",
        categoria: "tabuleiro",
        novo: false
    },

       {
        id: "pixel-fish",
        titulo: "Pixel Fish",
        descricao: "Pesque e venda peixes no Pixel Fish, descubra diferentes peixes e ganhe dinheiro.",
        capa: "capas/pixelfish.png",
        imgs: ["pixelfish/fish1.jpeg", "pixelfish/fish2.jpeg", "pixelfish/fish3.jpeg"],
        link: "https://oldnowgames-web.github.io/Pixel-Fish/",
        categoria: "simulacao-estrategia",
        categorias: ["multiplayer"],
        novo: false
    },

     {
        id: "2048",
        titulo: "2048",
        descricao: "Combine os números até chegar no 2048.",
        capa: "capas/2048.png",
        imgs: ["2048/2048-1.png", "2048/2048-2.png", "2048/2048-3.png"],
        link: "https://oldnowgames-web.github.io/2048/",
        categoria: "puzzle",
        novo: false
    },

    {
        id: "bubble-shooter",
        titulo: "Bubble Shooter",
        descricao: "Atire e exploda as bolas no Bubble Shooter",
        capa: "capas/shooter.png",
        imgs: ["shooter/shooter1.png", "shooter/shooter2.png", "shooter/shooter3.png"],
        link: "https://oldnowgames-web.github.io/Bubble-Shooter/",
        categoria: "puzzle",
        novo: false
    },

    {
        id: "flow-sort",
        titulo: "Flow Sort",
        descricao: "Organize e complete as cores nos frascos.",
        capa: "capas/flowsort.png",
        imgs: ["flowsort/flowsort1.png", "flowsort/flowsort2.png", "flowsort/flowsort3.png"],
        link: "https://oldnowgames-web.github.io/Flow-Sort/",
        categoria: "puzzle",
        novo: false
    },

     {
        id: "connect-four",
        titulo: "Connect Four",
        descricao: "Ligue 4 peças em uma linha para vencer.",
        capa: "capas/four.png",
        imgs: ["four/four1.png", "four/four2.png", "four/four1.png"],
        link: "https://oldnowgames-web.github.io/Connect-Four/",
        categoria: "puzzle",
        novo: false
    },

    {
        id: "quebra-cabeca",
        titulo: "Quebra Cabeça",
        descricao: "Conecte as peças para chegar em uma imagem.",
        capa: "capas/quebracabeca.png",
        imgs: ["quebracabeca/cabeca1.png", "quebracabeca/cabeca2.png", "quebracabeca/cabeca3.png"],
        link: "https://oldnowgames-web.github.io/Quebra-cabe-a/",
        categoria: "puzzle",
        novo: false
    },

     {
        id: "interesting-fruits",
        titulo: "Interesting Fruits",
        descricao: "Combine e corte as frutas no Interesting Fruits",
        capa: "capas/interestingfruits.png",
        imgs: ["intefruits/intefruits1.png", "intefruits/intefruits2.png", "intefruits/intefruits3.png"],
        link: "https://oldnowgames-web.github.io/Interesting-Fruits/",
        categoria: "puzzle",
        novo: false
    },

     {
        id: "motoart-grau",
        titulo: "Moto Art Grau",
        descricao: "Faça manobras incríveis de moto, explore e dirija loucamente.",
        capa: "capas/grau.png",
        imgs: ["grau/grau1.png", "grau/grau3.png", "grau/grau3.png"],
        link: "https://oldnowgames-web.github.io/Moto-Art-Grau/",
        categoria: "esporte-racing",
        novo: false
    },

    {
        id: "ping-pong",
        titulo: "Ping Pong 3D",
        descricao: "Jogue ping pong em 3d, uma simulação realista, treine e se tore o mestre !",
        capa: "capas/pingpong.png",
        imgs: ["pingpong/pingpong1.png", "pingpong/pingpong2.png", "pingpong/pingpong3.png"],
        link: "https://oldnowgames-web.github.io/Ping-Pong/",
        categoria: "esporte-racing",
        novo: false
    },

    {
        id: "swim-ball",
        titulo: "Swim Ball",
        descricao: "Entre nessa incrível jogada, barcos jogando futebol numa piscina, só no Swim Ball.",
        capa: "capas/swimball.png",
        imgs: ["swimball/swimball1.png", "swimball/swimball2.png", "swimball/swimball3.png"],
        link: "https://oldnowgames-web.github.io/Swim-Ball/",
        categoria: "esporte-racing",
        categorias: ["multiplayer"],
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
        categoria: "aventura-acao",
        novo: false
    },

     {
        id: "stickman-battle",
        titulo: "Stickman Battle",
        descricao: "Lute e sobreviva as ondas, escolha seu mapa e batalhe !.",
        capa: "capas/stickman.png",
        imgs: ["stickman/stick1.png", "stickman/stick2.png", "stickman/stick3.png"],
        link: "https://oldnowgames-web.github.io/Stickman-Battle/",
        categoria: "aventura-acao",
        novo: false
    },

    {
        id: "shark-bite",
        titulo: "Shark Bite",
        descricao: "Conquiste os mares, coma e cresça se tornando um poderoso tubarão.",
        capa: "capas/shark.png",
        imgs: ["shark/shark1.png", "shark/shark2.png", "shark/shark3.png"],
        link: "https://oldnowgames-web.github.io/Shark-Bite/",
        categoria: "aventura-acao",
        novo: false
    },
     {
        id: "hyde-seek",
        titulo: "Hyde & Seek: o mistério",
        descricao: "Embarque no suspense do estranho caso de investigação de Seek.",
        capa: "capas/hyde&seek.png",
        imgs: ["hyde/hyde1.png", "hyde/hyde2.png", "hyde/hyde3.png"],
        link: "https://oldnowgames-web.github.io/Hyde-Seek/",
        categoria: "aventura-acao",
        novo: false
    },

       {
        id: "pixel-jump",
        titulo: "Pixel Jump",
        descricao: "Entre numa aventura pixel, pule e derrote inimigos?.",
        capa: "capas/pixeljump.png",
        imgs: ["pixeljump/pixeljump1.png", "pixeljump/pixeljump2.png", "pixeljump/pixeljump3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Jump/",
        categoria: "aventura-acao",
        novo: false
    },

    
       {
        id: "polar-jump",
        titulo: "Polar Jump",
        descricao: "Embarque na grande aventura de Nanuk, um urso polar em busca da ilha do norte.",
        capa: "capas/polarjump.png",
        imgs: ["polarjump/polar1.png", "polarjump/polar2.png", "polarjump/polar3.png"],
        link: "https://oldnowgames-web.github.io/Polar-Jump/",
        categoria: "aventura-acao",
        novo: false
    },

      {
        id: "dead-hunter3d",
        titulo: "Dead Hunter 3D",
        descricao: "Derrote zombies poderosos, conquiste novas armas para salvar o planeta.",
        capa: "capas/deadhunter.png",
        imgs: ["deadhunter/deadhunter1.png", "deadhunter/deadhunter2.png", "deadhunter/deadhunter3.png"],
        link:"https://oldnowgames-web.github.io/Dead-Hunter-3d/",
        categoria: "aventura-acao",
        novo: false
    },
    


        {
        id: "capi-knight",
        titulo: "Capi Knight",
        descricao: "Uma aventura com uma capivara cavaleiro, explore novos lugares e derrote poderosos inimigos.",
        capa: "capas/Capi-Knight.jpeg",
        imgs: ["capi/capi1.png", "capi/capi2.png", "capi/capi3.png"],
        link: "https://oldnowgames-web.github.io/Capi-Knight/",
        categoria: "aventura-acao",
        novo: false
    },

        {
        id: "zenite-zero",
        titulo: "Zênite Zero",
        descricao: "Sobreviva às batalhas, escolha seu personagem, derrote inimigos e fique mais forte. ",
        capa: "capas/zenite-zero.png",
        imgs: ["zenite/zenite1.png", "zenite/zenite2.png", "zenite/zenite3.png"],
        link: "https://oldnowgames-web.github.io/Zenite-Zero/",
        categoria: "aventura-acao",
        novo: false
    },

    {
        id: "aethelstar-neon",
        titulo: "Aethelstar Neon",
        descricao: "Desvie dos meteoros, uma nova aventura no espaço neon!.",
        capa: "capas/aethelstar-neon.png",
        imgs: ["naveneon/naveneon1.png", "naveneon/naveneon2.png", "naveneon/naveneon3.png"],
        link: "https://oldnowgames-web.github.io/Aethestar-Neon/",
        categoria: "aventura-acao",
        novo: false
    },


    {
        id: "car-tape",
        titulo: "Car Tape: The Last Race",
        descricao: "Ação frenética de corrida e manobras radicais.",
        capa: "capas/CarTape.png",
        imgs: ["cartape/cartape1.png", "cartape/cartape2.png", "cartape/cartape3.png"],
        link: "https://oldnowgames-web.github.io/Car-Tape-the-last-race/",
        categoria: "esporte-racing",
        novo: false
    },

       {
        id: "pixel-cars",
        titulo: "Pixel Cars",
        descricao: "Desvie dos carros e corra!",
        capa: "capas/pixelcars.png",
        imgs: ["pixelcars/pixelcar1.png", "pixelcars/pixelcar2.png", "pixelcars/pixelcar3.png"],
        link: "https://oldnowgames-web.github.io/Pixel-Cars/",
        categoria: "esporte-racing",
        novo: false
    },

      {
        id: "soccer-disk",
        titulo: "Soccer Disk",
        descricao: "Entre na grande competição de futebol de discos, que começe o jogo !",
        capa: "capas/soccerdisk.png",
        imgs: ["soccerdisk/soccer1.png", "soccerdisk/soccer2.png", "soccerdisk/soccer3.png"],
        link: "https://oldnowgames-web.github.io/Soccer-Disk/",
        categoria: "esporte-racing",
        categorias: ["multiplayer"],
        novo: false
    },

         {
        id: "old-racers",
        titulo: "Old Racers",
        descricao: "Uma corrida clássica, aproveite a vista e vença a corrida!",
        capa: "capas/oldracers.png",
        imgs: ["oldcars/oldcars1.png", "oldcars/oldcars2.png", "oldcars/oldcars3.png"],
        link: "https://oldnowgames-web.github.io/Old-Racers/",
        categoria: "esporte-racing",
        categorias: ["multiplayer"],
        novo: false
    },


    



       {
        id: "sinuca-boteco",
        titulo: "Sinuca de Boteco",
        descricao: "O clássico jogo de sinuca agora onde voçê estiver, jogue com os amigos e divirta-se.",
        capa: "capas/sinuca.jpeg",
        imgs: ["sinuca/sinuca1.png", "sinuca/sinuca2.png", "sinuca/sinuca3.png"],
        link: "https://oldnowgames-web.github.io/Sinuca-de-Buteco/",
        categoria: "esporte-racing",
        novo: false
    },

    {
        id: "aethelstar",
        titulo: "Aethelstar",
        descricao: "Uma aventura no espaço no estilo clássico de fliperama.",
        capa: "capas/aethelstar.png",
        imgs: ["capas/aethelstar.png", "capas/aethelstar.png", "capas/aethelstar.png"],
        link: "https://oldnowgames-web.github.io/Aethelstar/",
        categoria: "arcade",
        novo: false
    },

       {
        id: "astro-pong",
        titulo: "Astro Pong",
        descricao: "O clássico jogo pong agora na Old Now games.",
        capa: "capas/AstroPong.png",
        imgs: ["astropong/astropong1.png", "astropong/astropong2.png", "astropong/astropong3.png"],
        link: "https://oldnowgames-web.github.io/AstroPong/",
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
        id: "golf-game",
        titulo: "A Little Golf",
        descricao: "Demonstre suas habilidades na mira, acerte as bolas nos buracos.",
        capa: "capas/aLittleGolf.png",
        imgs: ["golfe/golfe1.png","golfe/golfe2.png","golfe/golfe3.png"],
        link: "https://oldnowgames-web.github.io/A-Little-golf/",
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
        categoria: "tabuleiro",
        novo: false
    },

     {
        id: "ludo",
        titulo: "Ludo",
        descricao: "O clássico jogo de ludo, teste suas habilidades.",
        capa: "capas/ludo.png",
        imgs: ["ludo/ludo1.png", "ludo/ludo2.png", "ludo/ludo3.png"],
        link: "https://oldnowgames-web.github.io/Ludo/",
        categoria: "tabuleiro",
        novo: false
    },


    {
        id: "damas",
        titulo: "Damas",
        descricao: "O tradicional jogo de damas em uma versão digital.",
        capa: "capas/Damas.png",
        imgs: ["damas/dama1.jpeg", "damas/dama2.jpeg", "damas/dama3.jpeg"],
        link: "https://oldnowgames-web.github.io/Damas/",
        categoria: "tabuleiro",
        novo: false
    },

        {
        id: "memory-barbarian",
        titulo: "Barbarian memory game",
        descricao: "Um jogo da memória com tema de vikings.",
        capa: "capas/barbarian-memory.jpeg",
        imgs: ["memory/memory1.png", "memory/memory2.png", "memory/memory3.png"],
        link: "https://oldnowgames-web.github.io/Barbarian-Memory-game/",
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
        categoria: "tabuleiro",
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
        novo: false
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
    },


      {
        id: "conect-color",
        titulo: "Conect Color",
        descricao: "Ligue os fios da mesma cor.",
        capa: "capas/conectcolor.png",
        imgs: ["conectcolor/color1.png", "conectcolor/color2.png", "conectcolor/color3.png"],
        link: "https://oldnowgames-web.github.io/Conect-color/",
        categoria: "puzzle",
        novo: false
    }
];

const CATEGORIAS_INFO = [
    { id: "aventura-acao", titulo: "Aventura e Ação" },
    { id: "simulacao-estrategia", titulo: "Simulação e Estratégia" },
    { id: "esporte-racing", titulo: "Esporte e Racing" },
    { id: "puzzle", titulo: "Puzzle" },
    { id: "arcade", titulo: "Arcade" },
    { id: "tabuleiro", titulo: "Jogos de Mesa" },
    // Categorias ADICIONAIS: o jogo continua na categoria principal (campo "categoria")
    // e também aparece aqui pelo campo "categorias". "primeiro" fixa um jogo no começo.
    { id: "explorador-espaco", titulo: "Explorador do Espaço", adicional: true },
    { id: "multiplayer", titulo: "Multiplayer", adicional: true, primeiro: "swim-ball" }
];

// true se o jogo pertence à categoria (principal ou adicional)
function jogoEstaNaCategoria(jogo, catId) {
    return jogo.categoria === catId || (Array.isArray(jogo.categorias) && jogo.categorias.includes(catId));
}

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

// Onde os dados do jogador ficam: sessão salva -> localStorage (permanente);
// "sem sessão" -> sessionStorage (somem ao fechar). Quem decide é o tela-entrada.js.
function armazenamento() {
    if (window.OldNowSessao) return window.OldNowSessao.storage();
    return localStorage;
}

function lerJSON(chave, padrao) {
    try {
        const valor = armazenamento().getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch (e) {
        return padrao;
    }
}

function salvarJSON(chave, valor) {
    try {
        armazenamento().setItem(chave, JSON.stringify(valor));
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
    const estavaFavoritado = favoritos.includes(id);
    if (estavaFavoritado) {
        favoritos = favoritos.filter(f => f !== id);
    } else {
        favoritos.push(id);
    }
    salvarJSON(LS_KEYS.favoritos, favoritos);
    atualizarCoracoes(id);
    renderFavoritos();
    tocarSomFavorito(!estavaFavoritado);
}

/* ---------- Feedback sonoro sutil ao favoritar ---------- */

let audioCtxFavorito = null;

function tocarSomFavorito(favoritando) {
    try {
        const AudioContextClasse = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClasse) return;
        if (!audioCtxFavorito) audioCtxFavorito = new AudioContextClasse();
        if (audioCtxFavorito.state === "suspended") audioCtxFavorito.resume();

        const agora = audioCtxFavorito.currentTime;
        const osc = audioCtxFavorito.createOscillator();
        const gain = audioCtxFavorito.createGain();

        osc.type = "sine";
        if (favoritando) {
            osc.frequency.setValueAtTime(700, agora);
            osc.frequency.exponentialRampToValueAtTime(1100, agora + 0.08);
        } else {
            osc.frequency.setValueAtTime(500, agora);
            osc.frequency.exponentialRampToValueAtTime(280, agora + 0.1);
        }

        gain.gain.setValueAtTime(0.07, agora);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.15);

        osc.connect(gain);
        gain.connect(audioCtxFavorito.destination);
        osc.start(agora);
        osc.stop(agora + 0.16);
    } catch (e) {
        // Reprodução de áudio indisponível (política do navegador etc.) — ignora silenciosamente
    }
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
        <div class="bloco" data-bs-toggle="modal" data-bs-target="#modalJogo" data-id="${jogo.id}" data-titulo="${jogo.titulo}" onmouseenter="iniciarPreviewHover(this, '${jogo.id}')" onmouseleave="pararPreviewHover(this)">
            ${badgeNovo}
            <button type="button" class="btn-favorito ${favoritoAtivo ? "ativo" : ""}" data-id="${jogo.id}" title="Favoritar" onclick="event.stopPropagation(); toggleFavorito('${jogo.id}');">${favoritoAtivo ? "♥" : "♡"}</button>
            <div class="bloco-img-wrap">
                <img src="${jogo.capa}" alt="${jogo.titulo}" loading="lazy" onload="this.parentElement.classList.add('carregado')" onerror="this.parentElement.classList.add('carregado')">
            </div>
        </div>`;
}

/* Preview animado: alterna entre a capa e os slides do jogo ao passar o mouse */
function iniciarPreviewHover(el, id) {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return; // ignora em telas touch
    const jogo = GAMES.find(j => j.id === id);
    if (!jogo || !jogo.imgs || !jogo.imgs.length) return;
    const img = el.querySelector(".bloco-img-wrap img");
    if (!img) return;

    const sequencia = [jogo.capa, ...jogo.imgs];
    let idx = 0;
    el.dataset.previewOriginal = jogo.capa;

    if (el._previewTimer) clearInterval(el._previewTimer);
    el._previewTimer = setInterval(() => {
        idx = (idx + 1) % sequencia.length;
        img.src = sequencia[idx];
    }, 700);
}

function pararPreviewHover(el) {
    if (el._previewTimer) {
        clearInterval(el._previewTimer);
        el._previewTimer = null;
    }
    const img = el.querySelector(".bloco-img-wrap img");
    const original = el.dataset.previewOriginal;
    if (img && original) img.src = original;
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
    const jogosCategoria = GAMES.filter(j => jogoEstaNaCategoria(j, catId));
    const select = document.querySelector(`.filtro-ordenacao[data-categoria="${catId}"]`);
    const criterio = select ? select.value : "nome";
    let ordenados = ordenarJogos(jogosCategoria, criterio);
    const info = CATEGORIAS_INFO.find(c => c.id === catId);
    if (info && info.primeiro && criterio === "nome") {
        const fixo = ordenados.find(j => j.id === info.primeiro);
        if (fixo) ordenados = [fixo, ...ordenados.filter(j => j !== fixo)];
    }
    renderSecao(`wrapper-${catId}`, ordenados, `contagem-${catId}`);
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

/* Chamada pelo tela-entrada.js quando o jogador entra, troca de sessão ou sai:
   redesenha tudo que depende de favoritos, recentes e jogadas */
function atualizarTelaPorSessao() {
    renderTodos();
    renderTodasCategorias();
    renderFavoritos();
    renderContinuarJogando();
}
window.atualizarTelaPorSessao = atualizarTelaPorSessao;

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
    const bsTopCarousel = new bootstrap.Carousel(topCarousel, {
        interval: 3500,
        ride: "carousel"
    });
    // Garante que o primeiro slide mostrado seja sempre o oldnow-capa.png,
    // mesmo se o navegador restaurar um estado diferente (ex: voltar página)
    bsTopCarousel.to(0);
}

/* Faz todos os slides do banner ficarem do mesmo tamanho do slide 1.
   O slide 1 (oldnow-capa.png) mantém a proporção real dele, sem esticar
   (por isso o fator de altura foi removido). Os outros slides seguem
   essa mesma altura, mas usando object-fit: cover (corta a imagem para
   preencher o espaço) em vez de "fill" (que esticava/distorcia). */
(function igualarSlidesAoSlide1() {
    if (!topCarousel) return;

    const todasImagens = topCarousel.querySelectorAll(".carousel-banner-img");
    const imgReferencia = todasImagens[0]; // slide 1 = oldnow-capa.png
    if (!imgReferencia || todasImagens.length < 2) return;

    function aplicarAltura() {
        if (!imgReferencia.naturalWidth) return;
        const proporcao = imgReferencia.naturalHeight / imgReferencia.naturalWidth;
        // Celular/tablet: slide um pouco mais alto (+28%); PC mantém a altura exata do slide 1
        const fator = window.matchMedia("(max-width: 991px)").matches ? 1.28 : 1;
        const alturaAlvo = Math.round(topCarousel.offsetWidth * proporcao * fator);

        todasImagens.forEach(img => {
            img.style.height = alturaAlvo + "px";
            img.style.objectFit = "cover";
        });
    }

    if (imgReferencia.complete) {
        aplicarAltura();
    } else {
        imgReferencia.addEventListener("load", aplicarAltura);
    }
    window.addEventListener("resize", aplicarAltura);
})();

/* ---------- Modal Dinâmico com Slider Automático ---------- */

const modalJogo = document.getElementById("modalJogo");
const carouselModalElem = document.getElementById("carouselModalJogo");
let bsCarouselModal = null;

function preencherModal(jogo) {
    if (!jogo) return;

    modalJogo.dataset.jogoAtual = jogo.id;
    modalJogo.querySelector(".modal-title").textContent = jogo.titulo;
    modalJogo.querySelector("#modalDescricao").textContent = jogo.descricao;

    // Badge de categoria (clicável, leva até a seção da categoria)
    const badgeCategoria = document.getElementById("modalCategoriaBadge");
    if (badgeCategoria) {
        const catInfo = CATEGORIAS_INFO.find(c => c.id === jogo.categoria);
        if (catInfo) {
            badgeCategoria.textContent = catInfo.titulo;
            badgeCategoria.href = `#${catInfo.id}`;
            badgeCategoria.classList.remove("d-none");
            badgeCategoria.onclick = () => {
                bootstrap.Modal.getInstance(modalJogo)?.hide();
            };
        } else {
            badgeCategoria.classList.add("d-none");
        }
    }

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
}

if (modalJogo) {
    modalJogo.addEventListener("show.bs.modal", event => {
        const blocoClicado = event.relatedTarget;
        if (!blocoClicado) return; // acionado programaticamente (ex.: link compartilhado) — já preenchido antes
        const id = blocoClicado.getAttribute("data-id");
        const jogo = GAMES.find(j => j.id === id);
        preencherModal(jogo);
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

/* ---------- Compartilhar jogo (copia link direto) ---------- */

document.getElementById("modalCompartilhar")?.addEventListener("click", e => {
    const id = modalJogo.dataset.jogoAtual;
    if (!id) return;

    const url = `${location.origin}${location.pathname}?jogo=${id}`;
    const btn = e.currentTarget;
    const textoOriginal = btn.textContent;

    const mostrarFeedback = () => {
        btn.textContent = "✅ Link copiado!";
        setTimeout(() => { btn.textContent = textoOriginal; }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(mostrarFeedback).catch(() => {
            window.prompt("Copie o link do jogo:", url);
        });
    } else {
        window.prompt("Copie o link do jogo:", url);
    }
});

/* ---------- Abre o jogo direto se a URL tiver ?jogo=id (link compartilhado) ---------- */

function abrirJogoPeloId(id) {
    const jogo = GAMES.find(j => j.id === id);
    if (!jogo || !modalJogo) return;
    preencherModal(jogo);
    bootstrap.Modal.getOrCreateInstance(modalJogo).show();
}

(function verificarLinkDireto() {
    const parametros = new URLSearchParams(window.location.search);
    const idJogo = parametros.get("jogo");
    if (idJogo) abrirJogoPeloId(idJogo);
})();

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
    const mensagemVazia = document.getElementById("buscaVazia");
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

/* ---------- Rodapé: ano atual ---------- */

const anoAtualEl = document.getElementById("anoAtual");
if (anoAtualEl) {
    anoAtualEl.textContent = new Date().getFullYear();
}

/* ---------- Scrollspy: destaca a categoria ativa nos botões de atalho ---------- */

const linksCategorias = document.querySelectorAll(".categories a");

if (linksCategorias.length) {
    const secoesCategorias = Array.from(linksCategorias)
        .map(link => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const observerScrollspy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const linkAtivo = document.querySelector(`.categories a[href="#${entry.target.id}"]`);
            if (!linkAtivo) return;
            linksCategorias.forEach(l => l.classList.remove("active"));
            linkAtivo.classList.add("active");
        });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });

    secoesCategorias.forEach(secao => observerScrollspy.observe(secao));
}

/* ---------- Botão "voltar ao topo" ---------- */

const btnTopo = document.getElementById("btnTopo");
if (btnTopo) {
    window.addEventListener("scroll", () => {
        btnTopo.classList.toggle("visivel", window.scrollY > 500);
    });
    btnTopo.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* ---------- Atalhos de teclado ---------- */

document.addEventListener("keydown", e => {
    const tagAtivo = document.activeElement ? document.activeElement.tagName : "";
    const digitando = tagAtivo === "INPUT" || tagAtivo === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable);

    // "/" foca a barra de busca visível (desktop ou mobile, dependendo da tela)
    if (e.key === "/" && !digitando) {
        e.preventDefault();
        const inputVisivel = Array.from(document.querySelectorAll(".input-busca")).find(el => el.offsetParent !== null);
        if (inputVisivel) inputVisivel.focus();
    }

    // "Esc" fecha o player interno (o modal do Bootstrap já fecha sozinho com Esc)
    if (e.key === "Escape") {
        const overlay = document.getElementById("playerOverlay");
        if (overlay && !overlay.classList.contains("d-none")) {
            fecharPlayer();
        }
    }
});

/* ---------- Micro-animações: seções e cards entrando na viewport ---------- */

const elementosAnimados = document.querySelectorAll(".secao-carrossel, .container-sobre, .parceiros, .rodape");

if (elementosAnimados.length) {
    elementosAnimados.forEach(el => el.classList.add("pre-anim"));

    const observerAnimacao = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visivel");
                observerAnimacao.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    elementosAnimados.forEach(el => observerAnimacao.observe(el));
}

/* ---------- Botão "Me surpreenda": abre um jogo aleatório ---------- */

(function botaoSurpreenda() {
    const btn = document.getElementById("btnSurpreenda");
    if (!btn) return;

    let ultimoSorteado = null;

    btn.addEventListener("click", () => {
        // só jogos que já têm link (ignora os "Em breve")
        const disponiveis = GAMES.filter(j => j.link && j.link !== "#");
        if (!disponiveis.length) return;

        // evita sortear o mesmo jogo duas vezes seguidas
        let opcoes = disponiveis.filter(j => j.id !== ultimoSorteado);
        if (!opcoes.length) opcoes = disponiveis;
        const sorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
        ultimoSorteado = sorteado.id;

        // animação rápida do dado antes de abrir o modal
        btn.disabled = true;
        btn.classList.add("rolando");
        setTimeout(() => {
            btn.classList.remove("rolando");
            btn.disabled = false;
            abrirJogoPeloId(sorteado.id);
        }, 500);
    });
})();