// ==========================================
        // CONFIGURAÇÃO DA API - COLOQUE SUA CHAVE AQUI!
        // ==========================================
        const API_KEY = 'SUA_API_KEY_AQUI'; 
        const BASE_URL = 'https://api.themoviedb.org/3';
        const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

        // Carrega as séries salvas localmente ou começa com uma lista vazia
        let myShows = JSON.parse(localStorage.getItem('api_tv_time_data')) || [];

        // Elementos do DOM
        const myShowsContainer = document.getElementById('my-shows-container');
        const searchInput = document.getElementById('search-input');
        const searchResultsSection = document.getElementById('search-results-section');
        const searchResultsContainer = document.getElementById('search-results-container');

        // Permite buscar pressionando a tecla 'Enter'
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchShow();
        });

        // --- FUNÇÃO 1: BUSCAR SÉRIE NA API ---
        async function searchShow() {
            const query = searchInput.value.trim();
            if (!query) return;

            if (API_KEY === 'SUA_API_KEY_AQUI') {
                alert('Por favor, configure sua chave da API do TMDB no código!');
                return;
            }

            try {
                // Requisição para buscar séries de TV no TMDB
                const response = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                renderSearchResults(data.results);
            } catch (error) {
                console.error("Erro ao buscar série:", error);
                alert("Erro ao conectar com o serviço do TMDB.");
            }
        }

        // Renderiza as opções encontradas pela busca
        function renderSearchResults(results) {
            searchResultsContainer.innerHTML = '';
            if (results.length === 0) {
                searchResultsContainer.innerHTML = '<p style="color:var(--text-secondary)">Nenhuma série encontrada.</p>';
            }

            results.slice(0, 5).forEach(show => {
                const posterPath = show.poster_path ? `${IMAGE_URL}${show.poster_path}` : 'https://via.placeholder.com/150x200?text=Sem+Foto';
                
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <img src="${posterPath}" alt="${show.name}">
                    <p>${show.name}</p>
                    <button class="add-btn" onclick="addShowToList(${show.id}, '${show.name.replace(/'/g, "\\'")}', '${posterPath}')">Adicionar</button>
                `;
                searchResultsContainer.appendChild(item);
            });

            searchResultsSection.style.display = 'block';
        }

        // --- FUNÇÃO 2: ADICIONAR SÉRIE À MINHA LISTA (Com detalhes de episódios) ---
        async function addShowToList(id, name, poster) {
            // Evita adicionar duplicado
            if (myShows.some(s => s.id === id)) {
                alert("Esta série já está na sua lista!");
                return;
            }

            try {
                // Fazemos uma nova busca usando o ID específico da série para saber o total exato de episódios
                const response = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=pt-BR`);
                const details = await response.json();
                
                const totalEpisodes = details.number_of_episodes || 10; // Fallback se não achar

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
                
                // Esconde a área de busca e limpa o campo
                searchResultsSection.style.display = 'none';
                searchInput.value = '';
            } catch (error) {
                console.error("Erro ao obter detalhes da série:", error);
                alert("Não foi possível carregar os detalhes da série.");
            }
        }

        // --- FUNÇÃO 3: RENDERIZAR SÉRIES DA MINHA LISTA ---
        function renderMyShows() {
            myShowsContainer.innerHTML = '';

            if (myShows.length === 0) {
                myShowsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 20px;">Sua lista está vazia. Use a barra acima para adicionar séries!</p>';
                return;
            }

            myShows.forEach(show => {
                const progressPercent = show.totalEpisodes > 0 ? (show.currentEpisode / show.totalEpisodes) * 100 : 0;
                const isCompleted = show.currentEpisode === show.totalEpisodes && show.totalEpisodes > 0;

                const card = document.createElement('div');
                card.className = 'show-card';
                card.innerHTML = `
                    <button class="delete-btn" onclick="deleteShow(${show.id})">Remover</button>
                    <img class="show-poster" src="${show.poster}" alt="Poster" onerror="this.src='https://via.placeholder.com/100x150?text=Sem+Foto'">
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
        window.watchEpisode = function(showId) {
            const show = myShows.find(s => s.id === showId);
            if (show) {
                if (show.currentEpisode < show.totalEpisodes) {
                    show.currentEpisode++;
                } else {
                    show.currentEpisode = 0; // Reseta se clicar após concluído
                }
                saveData();
                renderMyShows();
            }
        }

        window.deleteShow = function(showId) {
            if(confirm("Tem certeza que deseja remover esta série da sua lista?")) {
                myShows = myShows.filter(s => s.id !== showId);
                saveData();
                renderMyShows();
            }
        }

        function saveData() {
            localStorage.setItem('api_tv_time_data', JSON.stringify(myShows));
        }

        // Inicialização automática
        renderMyShows();