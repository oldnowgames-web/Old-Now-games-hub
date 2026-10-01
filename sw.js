/* =========================================================
   OldNow Games — Service Worker

   - HTML / CSS / JS do hub  -> REDE PRIMEIRO: sempre busca a versão
     nova na internet; o cache só entra se estiver offline (ou lento).
     Assim, novo jogo ou ajuste de layout aparece sem você mexer aqui.
   - Imagens, fontes e libs (Bootstrap etc.) -> CACHE PRIMEIRO: abre
     rápido e economiza dados.

   QUANDO SUBIR A VERSÃO (v1 -> v2):
   - trocou uma imagem MANTENDO O MESMO NOME (ex.: capa nova);
   - adicionou um arquivo novo que deve abrir offline (inclua em SHELL).
   Se a imagem tiver nome novo, não precisa mexer aqui.
   ========================================================= */

const VERSAO = "v1";
const CACHE_SHELL = `oldnow-shell-${VERSAO}`;
const CACHE_ASSETS = `oldnow-assets-${VERSAO}`;

// Arquivos essenciais para o hub abrir offline (caminhos relativos a este arquivo)
const SHELL = [
    "./",
    "index.html",
    "estilo.css",
    "script.js",
    "tela-inicial.js",
    "pwa.js",
    "manifest.webmanifest",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "img/old_now-logo.jpeg"
];

// Origens externas que o hub usa e podem ser guardadas em cache.
// Os jogos (oldnowgames-web.github.io) ficam de fora: carregam direto da internet.
const HOSTS_EXTERNOS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

// Se a rede demorar mais que isso, usa a cópia guardada (se existir)
const TIMEOUT_REDE_MS = 4000;

/* ---------- Instalação: guarda o "esqueleto" do hub ---------- */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_SHELL).then(cache =>
            // um arquivo faltando não derruba a instalação inteira
            Promise.allSettled(
                SHELL.map(url => cache.add(new Request(url, { cache: "reload" })))
            )
        )
    );
    // Não chama skipWaiting aqui: a versão nova espera o usuário tocar em "Atualizar"
});

/* ---------- Ativação: apaga caches de versões antigas ---------- */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(chaves => Promise.all(
                chaves
                    .filter(c => c.startsWith("oldnow-") && c !== CACHE_SHELL && c !== CACHE_ASSETS)
                    .map(c => caches.delete(c))
            ))
            .then(() => self.clients.claim())
    );
});

/* ---------- Botão "Atualizar" do aviso de nova versão ---------- */
self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* ---------- Requisições ---------- */
self.addEventListener("fetch", event => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    const mesmaOrigem = url.origin === self.location.origin;
    if (!mesmaOrigem && !HOSTS_EXTERNOS.includes(url.hostname)) return; // deixa o navegador cuidar

    if (mesmaOrigem && (req.mode === "navigate" || ehArquivoDoShell(url))) {
        event.respondWith(redePrimeiro(req, url));
    } else {
        event.respondWith(cachePrimeiro(req));
    }
});

function ehArquivoDoShell(url) {
    return /\.(html|css|js|webmanifest)$/i.test(url.pathname);
}

function comTimeout(promessa, ms) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("timeout")), ms);
        promessa.then(
            r => { clearTimeout(t); resolve(r); },
            e => { clearTimeout(t); reject(e); }
        );
    });
}

async function redePrimeiro(req, url) {
    const cache = await caches.open(CACHE_SHELL);
    // navegações com ?jogo=... usam a mesma entrada de cache da página
    const chave = req.mode === "navigate" ? new Request(url.origin + url.pathname) : req;

    try {
        const resp = await comTimeout(fetch(req), TIMEOUT_REDE_MS);
        if (resp && resp.status === 200 && !resp.redirected) {
            cache.put(chave, resp.clone()).catch(() => {});
        }
        return resp;
    } catch (erro) {
        const guardado = await cache.match(chave, { ignoreSearch: true });
        if (guardado) return guardado;
        if (req.mode === "navigate") {
            return (await cache.match("index.html")) || (await cache.match("./")) || Response.error();
        }
        return Response.error();
    }
}

async function cachePrimeiro(req) {
    const cache = await caches.open(CACHE_ASSETS);
    const guardado = await cache.match(req);
    if (guardado) return guardado;

    try {
        const resp = await fetch(req);
        // 200 normal ou "opaque" (recursos de CDN sem CORS). Ignora 206 (parcial) e erros.
        if (resp && (resp.status === 200 || resp.type === "opaque")) {
            cache.put(req, resp.clone()).catch(() => {});
        }
        return resp;
    } catch (erro) {
        return Response.error();
    }
}