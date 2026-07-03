// ==========================================
// CONFIGURAÇÃO DA API DO TMDB
// ==========================================
const API_KEY = 'a6e95254254e0bf24eb333b2b1fbf262'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Carrega as séries salvas no LocalStorage ou começa com uma lista vazia
let myShows = JSON.parse(localStorage.getItem('api_tv_time_data')) || [];

// Elementos do DOM
const myShowsContainer = document.getElementById('my-shows-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResultsSection = document.getElementById('search-results-section');
const searchResultsContainer = document.getElementById('search-results-container');

// --- EVENTOS (LISTENERS) ---

// Dispara a busca ao clicar no botão
searchBtn.addEventListener('click', searchShow);

// Dispara a busca ao apertar 'Enter' dentro do campo de texto
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchShow();
});

// --- FUNÇÃO 1: BUSCAR SÉRIE NA API ---
async function searchShow() {
    const query = searchInput.value.trim();
    if (!query) return;

    if (API_KEY === 'a6e95254254e0bf24eb333b2b1fbf262') {
        alert('Por favor, configure sua chave da API do TMDB no arquivo app.js!');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        renderSearchResults(data.results);
    } catch (error) {
        console.error("Erro ao buscar série:", error);
        alert("Erro ao conectar com o serviço do TMDB.");
    }
}

// Renderiza na tela os cards encontrados na busca
function renderSearchResults(results) {
    searchResultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<p style="color:var(--text-secondary); padding: 10px;">Nenhuma série encontrada.</p>';
        searchResultsSection.style.display = 'block';
        return;
    }

    // Pega as primeiras 5 opções mais relevantes encontradas
    results.slice(0, 5).forEach(show => {
        const posterPath = show.poster_path ? `${IMAGE_URL}${show.poster_path}` : 'https://via.placeholder.com/150x200?text=Sem+Foto';
        // Limpa aspas simples do nome para não quebrar o parâmetro do HTML do botão
        const cleanName = show.name.replace(/'/g, "\\'");

        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${posterPath}" alt="${show.name}">
            <p title="${show.name}">${show.name}</p>
            <button class="add-btn" onclick="addShowToList(${show.id}, '${cleanName}', '${posterPath}')">Adicionar</button>
        `;
        searchResultsContainer.appendChild(item);
    });

    searchResultsSection.style.display = 'block';
}

// --- FUNÇÃO 2: ADICIONAR SÉRIE À MINHA LISTA ---
async function addShowToList(id, name, poster) {
    // Evita duplicados na lista do usuário
    if (myShows.some(s => s.id === id)) {
        alert("Esta série já está na sua lista!");
        return;
    }

    try {
        // Busca os detalhes específicos da série para conseguir o número total exato de episódios
        const response = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR`);
        const details = await response.json();
        
        const totalEpisodes = details.number_of_episodes || 0;

        const newShow = {
            id: id,
            title: name,
            poster: poster,
            totalEpisodes: totalEpisodes,
            currentEpisode: 0
        };

        myShows.push(newShow);
        saveData();
        renderMyShows();
        
        // Limpa a busca após adicionar com sucesso
        searchResultsSection.style.display = 'none';
        searchInput.value = '';
    } catch (error) {
        console.error("Erro ao obter detalhes da série:", error);
        alert("Não foi possível carregar os detalhes da série.");
    }
}

// --- FUNÇÃO 3: RENDERIZAR MINHA LISTA PRINCIPAL ---
function renderMyShows() {
    myShowsContainer.innerHTML = '';

    if (myShows.length === 0) {
        myShowsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 40px; font-size: 15px;">Sua lista está vazia. Use a barra acima para encontrar e adicionar séries!</p>';
        return;
    }

    myShows.forEach(show => {
        const progressPercent = show.totalEpisodes > 0 ? (show.currentEpisode / show.totalEpisodes) * 100 : 0;
        const isCompleted = show.currentEpisode === show.totalEpisodes && show.totalEpisodes > 0;

        const card = document.createElement('div');
        card.className = 'show-card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteShow(${show.id})">Remover</button>
            <img class="show-poster" src="${show.poster}" alt="Poster de ${show.title}" onerror="this.src='https://via.placeholder.com/100x150?text=Sem+Foto'">
            <div class="show-info">
                <div>
                    <h3 class="show-title">${show.title}</h3>
                    <div class="show-meta">Progresso: ${show.currentEpisode}/${show.totalEpisodes} episódios</div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="action-zone">
                    <span class="episode-badge">
                        ${isCompleted ? '🎉 Maratonada!' : `Faltam: <strong>${show.totalEpisodes - show.currentEpisode}</strong>`}
                    </span>
                    <button class="check-btn ${isCompleted ? 'watched' : ''}" onclick="watchEpisode(${show.id})">
                        ${isCompleted ? '✓' : '+1'}
                    </button>
                </div>
            </div>
        `;
        myShowsContainer.appendChild(card);
    });
}

// --- FUNÇÕES DE CONTROLE ---

// Incrementa os episódios assistidos (+1)
window.watchEpisode = function(showId) {
    const show = myShows.find(s => s.id === showId);
    if (show) {
        if (show.currentEpisode < show.totalEpisodes) {
            show.currentEpisode++;
        } else {
            show.currentEpisode = 0; // Reseta o progresso caso queira reassistir
        }
        saveData();
        renderMyShows();
    }
};

// Remove a série selecionada da lista do usuário
window.deleteShow = function(showId) {
    if(confirm("Tem certeza que deseja remover esta série da sua lista?")) {
        myShows = myShows.filter(s => s.id !== showId);
        saveData();
        renderMyShows();
    }
};

// Salva o estado atual no LocalStorage
function saveData() {
    localStorage.setItem('api_tv_time_data', JSON.stringify(myShows));
}

// Executa a renderização inicial assim que a página abre
renderMyShows();
