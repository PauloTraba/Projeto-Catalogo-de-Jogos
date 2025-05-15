const listaJogos = document.getElementById("listaJogos");
const menuAbas = document.getElementById("menuAbas");
const campoBusca = document.getElementById("campoBusca");
const ordenacao = document.getElementById("ordenacao");
const filtroGenero = document.getElementById("filtroGenero");
const filtroLoja = document.getElementById("filtroLoja");

let todosJogos = [];
let jogosPromocao = [];
let lojasDisponiveis = [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let abaAtual = "all";

const API_GRATUITOS = "https://api.allorigins.win/raw?url=https://www.freetogame.com/api/games";
const API_PROMO = "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&sortBy=Deal%20Rating";
const API_LOJAS = "https://www.cheapshark.com/api/1.0/stores";

async function carregarJogosGratuitos() {
  try {
    const resposta = await fetch(API_GRATUITOS);
    todosJogos = await resposta.json();
    preencherFiltroGenero();
    renderizarJogosGratuitos();
  } catch (e) {
    console.error("Erro ao carregar jogos gratuitos:", e);
    listaJogos.innerHTML = `<p class="text-danger">Erro ao carregar os jogos. Verifique sua conexão ou tente novamente mais tarde.</p>`;
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

function preencherFiltroGenero() {
  const generosUnicos = [...new Set(todosJogos.map(j => j.genre))];
  generosUnicos.sort().forEach(genero => {
    const opt = document.createElement("option");
    opt.value = genero.toLowerCase();
    opt.textContent = genero;
    filtroGenero.appendChild(opt);
  });
}

function renderizarJogosGratuitos() {
  listaJogos.innerHTML = "";
  filtroGenero.classList.remove("d-none");
  filtroLoja.classList.add("d-none");

  let jogos = [...todosJogos];

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

  jogos.forEach(jogo => {
   const card = document.createElement("div");
   card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4";
   card.innerHTML = `
     <div class="card h-100">
       <a href="${jogo.game_url}" target="_blank" rel="noopener noreferrer">
         <img src="${jogo.thumbnail}" class="card-img-top" alt="${jogo.title}">
       </a>
       <div class="card-body d-flex flex-column">
         <h5 class="card-title">${jogo.title}</h5>
         <p class="card-text">${jogo.short_description}</p>
         <small>${jogo.platform}</small>
         <button class="btn btn-sm btn-warning btn-fav mt-auto" onclick="toggleFavorito(${jogo.id})">
           ${favoritos.includes(jogo.id) ? "★ Favorito" : "☆ Favoritar"}
         </button>
       </div>
     </div>
   `;
   listaJogos.appendChild(card);
 });
}

function renderizarFavoritos() {
  listaJogos.innerHTML = "";
  filtroGenero.classList.add("d-none");
  filtroLoja.classList.add("d-none");

  const jogosFav = todosJogos.filter(jogo => favoritos.includes(jogo.id));

  if (jogosFav.length === 0) {
    listaJogos.innerHTML = "<p class='text-white'>Você ainda não marcou nenhum jogo como favorito.</p>";
    return;
  }

  jogosFav.forEach(jogo => {
    const card = document.createElement("div");
    card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4";
    card.innerHTML = `
      <div class="card h-100">
        <img src="${jogo.thumbnail}" class="card-img-top" alt="${jogo.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${jogo.title}</h5>
          <p class="card-text">${jogo.short_description}</p>
          <small>${jogo.platform}</small>
          <button class="btn btn-sm btn-danger btn-fav mt-auto" onclick="toggleFavorito(${jogo.id})">
            ★ Remover
          </button>
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
    listaJogos.innerHTML = "<p class='text-white'>Nenhuma promoção disponível agora.</p>";
    return;
  }

  lista.forEach(jogo => {
    const preco = parseFloat(jogo.salePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const lojaNome = lojasDisponiveis.find(l => l.storeID === jogo.storeID)?.storeName || "Loja";

    const card = document.createElement("div");
    card.className = "col-12 col-sm-6 col-md-4 col-lg-3 mb-4";
    card.innerHTML = `
      <div class="card h-100">
        <img src="${jogo.thumb}" class="card-img-top" alt="${jogo.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${jogo.title}</h5>
          <p class="card-text">Preço: ${preco}<br><small>Loja: ${lojaNome}</small></p>
          <a href="https://www.cheapshark.com/redirect?dealID=${jogo.dealID}" target="_blank" class="btn btn-sm btn-success mt-auto">Ver oferta</a>
        </div>
      </div>
    `;
    listaJogos.appendChild(card);
  });
}

function toggleFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favId => favId !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  if (abaAtual === "all") renderizarJogosGratuitos();
  if (abaAtual === "fav") renderizarFavoritos();
}

menuAbas.addEventListener("click", (e) => {
  if (e.target.classList.contains("nav-link")) {
    e.preventDefault();
    document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");

    if (e.target.id === "tabPromo") {
      abaAtual = "promo";
      renderizarPromocoes();
    } else if (e.target.id === "tabFav") {
      abaAtual = "fav";
      renderizarFavoritos();
    } else {
      abaAtual = "all";
      renderizarJogosGratuitos();
    }
  }
});

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

carregarJogosGratuitos();
carregarPromocoes();
carregarLojas();
