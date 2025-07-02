const CACHE_NAME = 'catalogo-jogos-v1';
// Lista de todos os arquivos que compõem o seu app
const arquivos = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './imagens/background.jpg',
  './imagens/icon-192.png',
  './imagens/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
];

// Evento de 'install': Salva todos os nossos arquivos em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Salvando arquivos no cache');
      return cache.addAll(arquivos);
    })
  );
});

// Evento de 'fetch': Intercepta os pedidos de rede
self.addEventListener('fetch', (e) => {
  e.respondWith(
    // Procura o recurso no cache primeiro
    caches.match(e.request).then((response) => {
      // Se encontrou no cache, retorna ele. Senão, faz o pedido real à rede.
      return response || fetch(e.request);
    })
  );
});