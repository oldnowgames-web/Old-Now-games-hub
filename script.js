// Inicializa o carrossel do topo automaticamente
const topCarousel = document.querySelector('#carouselExample');
if (topCarousel) {
    new bootstrap.Carousel(topCarousel, {
        interval: 3500, // Troca de imagem a cada 3.5 segundos
        ride: 'carousel'
    });
}

// Modal Dinâmico com Slider Automático
const modalJogo = document.getElementById('modalJogo');
const carouselModalElem = document.getElementById('carouselModalJogo');
let bsCarouselModal = null;

if (modalJogo) {
    modalJogo.addEventListener('show.bs.modal', event => {
        const blocoClicado = event.relatedTarget;

        const titulo = blocoClicado.getAttribute('data-titulo');
        const descricao = blocoClicado.getAttribute('data-descricao');
        const link = blocoClicado.getAttribute('data-link');

        // Carrega as 3 imagens definidas nos data-attributes
        const img1 = blocoClicado.getAttribute('data-img1') || blocoClicado.getAttribute('data-imagem') || '';
        const img2 = blocoClicado.getAttribute('data-img2') || img1;
        const img3 = blocoClicado.getAttribute('data-img3') || img1;

        modalJogo.querySelector('.modal-title').textContent = titulo || '';
        modalJogo.querySelector('#modalDescricao').textContent = descricao || '';
        modalJogo.querySelector('#modalBotaoJogar').href = link || '#';

        modalJogo.querySelector('#modalImg1').src = img1;
        modalJogo.querySelector('#modalImg2').src = img2;
        modalJogo.querySelector('#modalImg3').src = img3;

        // Reinicia a rotação do slider no modal para começar do slide 0
        if (!bsCarouselModal) {
            bsCarouselModal = new bootstrap.Carousel(carouselModalElem, {
                interval: 3000,
                ride: 'carousel'
            });
        } else {
            bsCarouselModal.to(0);
            bsCarouselModal.cycle();
        }
    });

    // Pausa a rotação do slider ao fechar o modal
    modalJogo.addEventListener('hidden.bs.modal', () => {
        if (bsCarouselModal) {
            bsCarouselModal.pause();
        }
    });
}

// Script dos Carrosséis de Jogos
document.querySelectorAll('.secao-carrossel').forEach(secao => {
    const wrapper = secao.querySelector('.blocos-wrapper');
    const containerBlocos = secao.querySelector('.blocos');
    const nextBtn = secao.querySelector('.next');
    const prevBtn = secao.querySelector('.prev');

    let index = 0;

    function calcularPasso() {
        const bloco = secao.querySelector('.bloco');
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

    nextBtn.addEventListener('click', () => {
        const larguraTotalBloco = calcularPasso();
        const totalBlocos = wrapper.children.length;
        const larguraVisivel = containerBlocos.clientWidth;
        const blocosVisiveis = Math.floor(larguraVisivel / larguraTotalBloco) || 1;

        if (index < totalBlocos - blocosVisiveis) {
            index++;
            atualizarCarrossel();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (index > 0) {
            index--;
            atualizarCarrossel();
        }
    });

    // Touch/Swipe para mobile
    let startX = 0;
    let endX = 0;

    containerBlocos.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    containerBlocos.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 40) {
            if (diffX > 0) {
                nextBtn.click();
            } else {
                prevBtn.click();
            }
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        index = 0;
        atualizarCarrossel();
    });
});