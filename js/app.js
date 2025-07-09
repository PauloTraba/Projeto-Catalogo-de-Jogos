// --- MAPEAMENTO DOS ELEMENTOS DO HTML ---
// Guardando os elementos do DOM em constantes para não precisar buscá-los toda hora. Melhora a performance.
const listaJogos = document.getElementById("listaJogos");
const menuAbas = document.getElementById("menuAbas");
const campoBusca = document.getElementById("campoBusca");
const ordenacao = document.getElementById("ordenacao");
const filtroGenero = document.getElementById("filtroGenero");
const filtroLoja = document.getElementById("filtroLoja");
const loading = document.getElementById("loading");
const installButton = document.getElementById('installAppBt');


// --- VARIÁVEIS GLOBAIS ---
// Arrays que vão guardar os dados vindos das APIs para podermos manipular.
let todosJogos = [];
let jogosPromocao = [];
let lojasDisponiveis = [];
// Pega os favoritos salvos no navegador. Se não houver nenhum, cria um array vazio.
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let abaAtual = "all"; // Controla qual aba está ativa


// --- APIs ---
// Links das APIs de onde vamos buscar os dados.
const API_GRATUITOS = "https://corsproxy.io/?https://www.freetogame.com/api/games";
const API_PROMO = "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&sortBy=Deal%20Rating";
const API_LOJAS = "https://www.cheapshark.com/api/1.0/stores";


// --- FUNÇÕES DE CARREGAMENTO DE DADOS (API) ---

// Função assíncrona para buscar os jogos gratuitos. "async" permite usar o "await".
async function carregarJogosGratuitos() {
  loading.classList.remove("d-none"); // Mostra o spinner de carregamento
  listaJogos.innerHTML = ""; // Limpa a lista de jogos antiga para dar lugar à nova

  // O bloco try/catch/finally é para tratamento de erros.
  try {
    // 1. Tenta fazer a requisição para a API. "await" pausa a função até a resposta chegar.
    const resposta = await fetch(API_GRATUITOS);
    if (!resposta.ok) { // Se a resposta não for um sucesso (ex: erro 404, 500), lança um erro.
      throw new Error(`HTTP error! status: ${resposta.status}`);
    }
    // 2. Converte a resposta da API (que vem em formato de texto JSON) para um objeto JavaScript.
    todosJogos = await resposta.json();
    // 3. Com os dados em mãos, chama as funções para montar a tela.
    preencherFiltroGenero();
    renderizarJogosGratuitos();
  } catch (e) {
    // 4. Se qualquer coisa no bloco "try" der errado, o "catch" é executado.
    console.error("Erro ao carregar jogos gratuitos:", e);
    listaJogos.innerHTML = `<p class="text-danger text-center">Erro ao carregar os jogos.</p>`;
  } finally {
    // 5. O "finally" é executado sempre no final, dando certo ou errado. Perfeito para esconder o spinner.
    loading.classList.add("d-none");
  }
}

async function carregarPromocoes() {
  try {
    const resposta = await fetch(API_PROMO);
    jogosPromocao = await resposta.json();
  } catch (e) {
    console.error("Erro ao carregar promoções:", e);
  }
}

async function carregarLojas() {
  try {
    const resposta = await fetch(API_LOJAS);
    lojasDisponiveis = await resposta.json();
    lojasDisponiveis.forEach(loja => {
      const opt = document.createElement("option");
      opt.value = loja.storeID;
      opt.textContent = loja.storeName;
      filtroLoja.appendChild(opt);
    });
  } catch (e) {
    console.error("Erro ao carregar lojas:", e);
  }
}


// --- FUNÇÕES DE RENDERIZAÇÃO (Montar o HTML) ---

function preencherFiltroGenero() {
  const generosUnicos = [...new Set(todosJogos.map(j => j.genre))];
  generosUnicos.sort().forEach(genero => {
    const opt = document.createElement("option");
    opt.value = genero.toLowerCase();
    opt.textContent = genero;
    filtroGenero.appendChild(opt);
  });
}

// Função responsável por desenhar os cards dos jogos gratuitos na tela.
function renderizarJogosGratuitos() {
  listaJogos.innerHTML = ""; // Limpa a tela antes de adicionar os novos cards
  filtroGenero.classList.remove("d-none");
  filtroLoja.classList.add("d-none");

  let jogos = [...todosJogos];

  // Lógica de filtro e ordenação...
  const termo = campoBusca.value.toLowerCase();
  if (termo) {
    jogos = jogos.filter(j => j.title.toLowerCase().includes(termo));
  }
  const generoSelecionado = filtroGenero.value;
  if (generoSelecionado) {
    jogos = jogos.filter(j => j.genre.toLowerCase() === generoSelecionado);
  }
  if (ordenacao.value === "az") {
    jogos.sort((a, b) => a.title.localeCompare(b.title));
  } else if (ordenacao.value === "za") {
    jogos.sort((a, b) => b.title.localeCompare(a.title));
  }

  // Itera sobre cada jogo do array filtrado e cria o HTML para ele.
  jogos.forEach(jogo => {
    const card = document.createElement("div");
    // Adiciona a classe de animação para o efeito de fade-in
    card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4 card-fade-in";
    // Cria o HTML do card usando template literals, que facilitam a inserção de variáveis.
    card.innerHTML = `
     <div class="card h-100">
       <a href="${jogo.game_url}" target="_blank" rel="noopener noreferrer">
         <img src="${jogo.thumbnail}" class="card-img-top" alt="${jogo.title}">
       </a>
       <div class="card-body d-flex flex-column">
         <h5 class="card-title">${jogo.title}</h5>
         <p class="card-text">${jogo.short_description}</p>
         <div class="mt-auto pt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span class="badge bg-secondary">${jogo.platform}</span>
            <button class="btn btn-sm btn-warning btn-fav" onclick="toggleFavorito(${jogo.id})">
              ${favoritos.includes(jogo.id) ? "★ Favorito" : "☆ Favoritar"}
            </button>
         </div>
       </div>
     </div>
    `;
    // Adiciona o card recém-criado na página.
    listaJogos.appendChild(card);
  });
}

function renderizarFavoritos() {
  listaJogos.innerHTML = "";
  filtroGenero.classList.add("d-none");
  filtroLoja.classList.add("d-none");

  const jogosFav = todosJogos.filter(jogo => favoritos.includes(jogo.id));

  if (jogosFav.length === 0) {
    listaJogos.innerHTML = "<p class='text-white text-center'>Você ainda não marcou nenhum jogo como favorito.</p>";
    return;
  }

  jogosFav.forEach(jogo => {
    const card = document.createElement("div");
    card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4 card-fade-in";
    card.innerHTML = `
      <div class="card h-100">
        <img src="${jogo.thumbnail}" class="card-img-top" alt="${jogo.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${jogo.title}</h5>
          <p class="card-text">${jogo.short_description}</p>
          <div class="mt-auto pt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span class="badge bg-secondary">${jogo.platform}</span>
            <button class="btn btn-sm btn-danger btn-fav" onclick="toggleFavorito(${jogo.id})">
              ★ Remover
            </button>
          </div>
        </div>
      </div>
    `;
    listaJogos.appendChild(card);
  });
}

function renderizarPromocoes() {
  listaJogos.innerHTML = "";
  filtroGenero.classList.add("d-none");
  filtroLoja.classList.remove("d-none");

  let lista = [...jogosPromocao];
  const lojaSelecionada = filtroLoja.value;

  if (lojaSelecionada) {
    lista = lista.filter(jogo => jogo.storeID === lojaSelecionada);
  }

  if (lista.length === 0) {
    listaJogos.innerHTML = "<p class='text-white text-center'>Nenhuma promoção disponível agora.</p>";
    return;
  }

  lista.forEach(jogo => {
    const preco = parseFloat(jogo.salePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const lojaNome = lojasDisponiveis.find(l => l.storeID === jogo.storeID)?.storeName || "Loja";

    const card = document.createElement("div");
    card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4 card-fade-in";
    card.innerHTML = `
      <div class="card h-100">
        <img src="${jogo.thumb}" class="card-img-top" alt="${jogo.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${jogo.title}</h5>
          <p class="card-text">Preço: ${preco}<br><small>Loja: ${lojaNome}</small></p>
          
          <small class="text-white-50 d-block mb-2">Pode variar na loja</small>
          
          <a href="https://www.cheapshark.com/redirect?dealID=${jogo.dealID}" target="_blank" class="btn btn-sm btn-success mt-auto">Ver oferta</a>
        </div>
      </div>
    `;
    listaJogos.appendChild(card);
  });
}


// --- FUNÇÕES DE INTERAÇÃO ---

function toggleFavorito(id) {
  const index = favoritos.indexOf(id);
  if (index > -1) {
    favoritos.splice(index, 1); // Remove o favorito
  } else {
    favoritos.push(id); // Adiciona o favorito
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));

  // Re-renderiza a aba atual para refletir a mudança no botão ou na lista de favoritos
  if (abaAtual === "all") renderizarJogosGratuitos();
  if (abaAtual === "fav") renderizarFavoritos();
}


// --- EVENT LISTENERS (Interatividade do Usuário) ---

// Fica "escutando" por um clique no menu de abas.
menuAbas.addEventListener("click", (e) => {
  if (e.target.classList.contains("nav-link")) {
    e.preventDefault();
    document.querySelectorAll("#menuAbas .nav-link").forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");

    if (e.target.id === "tabPromo") {
      abaAtual = "promo";
      renderizarPromocoes();
    } else if (e.target.id === "tabFav") {
      abaAtual = "fav";
      renderizarFavoritos();
    } else if (e.target.dataset.plataforma === "all") {
      abaAtual = "all";
      renderizarJogosGratuitos();
    }
  }
});

// Fica "escutando" cada tecla digitada no campo de busca.
campoBusca.addEventListener("input", () => {
  if (abaAtual === "all") renderizarJogosGratuitos();
});

ordenacao.addEventListener("change", () => {
  if (abaAtual === "all") renderizarJogosGratuitos();
});

filtroGenero.addEventListener("change", () => {
  if (abaAtual === "all") renderizarJogosGratuitos();
});

filtroLoja.addEventListener("change", () => {
  if (abaAtual === "promo") renderizarPromocoes();
});


// --- LÓGICA DO PWA ---

// 1. REGISTRO DO SERVICE WORKER
// Verifica se o navegador suporta Service Workers.
if ('serviceWorker' in navigator) {
  // Adiciona um listener para registrar o service worker só depois que a página toda carregar.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => console.log('Service Worker registrado!'))
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}

// 2. LÓGICA PARA INSTALAÇÃO DO APP
let pedidoInstalacao; // Variável para guardar o "evento de instalação"

// O navegador dispara este evento se o site for "instalável".
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Previne o pop-up padrão do navegador.
  pedidoInstalacao = e; // Guarda o evento para usarmos depois.
  if (installButton) {
    installButton.style.display = 'block'; // Mostra o nosso botão personalizado.
  }
});

// Adiciona a ação de clique ao nosso botão.
if (installButton) {
    installButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (pedidoInstalacao) {
            pedidoInstalacao.prompt(); // Mostra o pop-up de instalação oficial do navegador.
            pedidoInstalacao.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuário aceitou a instalação');
                } else {
                    console.log('Usuário recusou a instalação');
                }
                installButton.style.display = 'none'; // Esconde o botão após a escolha
                pedidoInstalacao = null; // O pedido só pode ser usado uma vez.
            });
        }
    });
}


// --- INICIALIZAÇÃO ---
// Chama as funções para carregar os dados das APIs assim que o script é executado.
carregarJogosGratuitos();
carregarPromocoes();
carregarLojas();