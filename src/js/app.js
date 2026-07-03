// ==========================================
// CONFIGURAÇÃO DA API DO TMDB
// ==========================================
const API_KEY = 'a6e95254254e0bf24eb333b2b1fbf262'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Usaremos uma nova chave de armazenamento para não misturar com o progresso antigo
let myShows = JSON.parse(localStorage.getItem('maratona_tv_time_v2')) || [];

const myShowsContainer = document.getElementById('my-shows-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResultsSection = document.getElementById('search-results-section');
const searchResultsContainer = document.getElementById('search-results-container');

searchBtn.addEventListener('click', searchShow);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchShow();
});

// BUSCAR SÉRIE
async function searchShow() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        renderSearchResults(data.results);
    } catch (error) {
        console.error("Erro ao buscar série:", error);
    }
}

function renderSearchResults(results) {
    searchResultsContainer.innerHTML = '';
    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<p style="color:var(--text-secondary); padding: 10px;">Nenhuma série encontrada.</p>';
        searchResultsSection.style.display = 'block';
        return;
    }

    results.slice(0, 5).forEach(show => {
        const posterPath = show.poster_path ? `${IMAGE_URL}${show.poster_path}` : 'https://via.placeholder.com/150x200?text=Sem+Foto';
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

// ADICIONAR SÉRIE (Começando no S01E01)
async function addShowToList(id, name, poster) {
    if (myShows.some(s => s.id === id)) {
        alert("Esta série já está na sua lista!");
        return;
    }

    const newShow = {
        id: id,
        title: name,
        poster: poster,
        currentSeason: 1,
        currentEpisode: 1,
        episodeName: "Carregando informações...",
        isCompleted: false
    };

    myShows.push(newShow);
    saveData();
    
    // Busca o nome do primeiro episódio imediatamente
    await fetchEpisodeDetails(newShow);
    
    renderMyShows();
    searchResultsSection.style.display = 'none';
    searchInput.value = '';
}

// BUSCA DETALHES DO EPISÓDIO ATUAL (Nome e se ele existe)
async function fetchEpisodeDetails(show) {
    if (show.isCompleted) return;

    try {
        const response = await fetch(`${BASE_URL}/tv/${show.id}/season/${show.currentSeason}/episode/${show.currentEpisode}?api_key=${API_KEY}&language=pt-BR`);
        
        if (response.ok) {
            const episodeData = await response.json();
            show.episodeName = episodeData.name || `Episódio ${show.currentEpisode}`;
        } else if (response.status === 404) {
            // Se o episódio 1 da próxima temporada não existir, tenta ver se a série acabou
            if (show.currentEpisode === 1) {
                show.isCompleted = true;
                show.episodeName = "Todos os episódios assistidos! 🎉";
            } else {
                // Se o próximo episódio não existe nesta temporada, pula para a próxima temporada, episódio 1
                show.currentSeason++;
                show.currentEpisode = 1;
                await fetchEpisodeDetails(show);
            }
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes do episódio:", error);
        show.episodeName = "Clique em +1 para atualizar";
    }
    saveData();
}

// AVANÇAR UM EPISÓDIO (+1)
window.watchEpisode = async function(showId) {
    const show = myShows.find(s => s.id === showId);
    if (!show) return;

    if (show.isCompleted) {
        // Resetar caso queira reassistir
        show.currentSeason = 1;
        show.currentEpisode = 1;
        show.isCompleted = false;
        show.episodeName = "Carregando...";
        await fetchEpisodeDetails(show);
        renderMyShows();
        return;
    }

    // Passa de forma otimista para o próximo número de episódio
    show.currentEpisode++;
    show.episodeName = "Atualizando...";
    renderMyShows(); // Atualiza o texto na tela enquanto baixa da API

    // Verifica se o episódio existe ou se muda de temporada
    await fetchEpisodeDetails(show);
    renderMyShows();
};

// RENDERIZAR MINI-PAINEL ESTILO TV TIME
function renderMyShows() {
    myShowsContainer.innerHTML = '';

    if (myShows.length === 0) {
        myShowsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 40px; font-size: 15px;">Sua lista está vazia. Adicione séries acima!</p>';
        return;
    }

    myShows.forEach(show => {
        const card = document.createElement('div');
        card.className = 'show-card';
        
        // Formata o código do episódio no estilo S01E05 (Season 1, Episode 5)
        const seasonCode = String(show.currentSeason).padStart(2, '0');
        const episodeCode = String(show.currentEpisode).padStart(2, '0');
        const fullCode = `T${seasonCode}E${episodeCode}`;

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteShow(${show.id})">Remover</button>
            <img class="show-poster" src="${show.poster}" alt="Poster">
            <div class="show-info">
                <div>
                    <h3 class="show-title">${show.title}</h3>
                    
                    <!-- Novo painel de info do episódio -->
                    <div class="tvtime-episode-box">
                        ${show.isCompleted ? '' : `<span class="ep-code">${fullCode}</span>`}
                        <span class="ep-name">${show.episodeName}</span>
                    </div>
                </div>
                
                <div class="action-zone" style="margin-top: 15px;">
                    <span class="episode-badge">
                        ${show.isCompleted ? '🎉 Completa!' : `Próximo episódio`}
                    </span>
                    <button class="check-btn ${show.isCompleted ? 'watched' : ''}" onclick="watchEpisode(${show.id})">
                        ${show.isCompleted ? '✓' : '+1'}
                    </button>
                </div>
            </div>
        `;
        myShowsContainer.appendChild(card);
    });
}

window.deleteShow = function(showId) {
    if(confirm("Deseja remover esta série?")) {
        myShows = myShows.filter(s => s.id !== showId);
        saveData();
        renderMyShows();
    }
};

function saveData() {
    localStorage.setItem('maratona_tv_time_v2', JSON.stringify(myShows));
}

// Inicializa e carrega os nomes dos episódios salvos se necessário
async function init() {
    for (let show of myShows) {
        if (show.episodeName === "Carregando informações..." || show.episodeName === "Atualizando...") {
            await fetchEpisodeDetails(show);
        }
    }
    renderMyShows();
}

init();
