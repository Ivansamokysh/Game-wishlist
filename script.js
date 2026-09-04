document.addEventListener('DOMContentLoaded', () => {

    const API_KEY = '250ff70572f54c47ba15fc8fa203da58';
    const URL = `https://api.rawg.io/api/games?key=${API_KEY}&search=${SearchQuery}&genres=${genres.join(',')}&platforms=${platforms.join(',')}&sort=${sortBy}`;

    const gamesContainer = document.querySelector('.games-container');
    const searchInput = document.querySelector('.search-input');
    const genreCheckboxes = document.querySelectorAll('.genre-checkbox');
    const platformCheckboxes = document.querySelectorAll('.platform-checkbox');
    const sortSelect = document.getElementById('sort-select');

    let searchTimeot = null;

  const loginBtn = document.querySelector('.btn-login');
  const signupBtn = document.querySelector('.btn-signup');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

  async function GamesFilter(SearchQuery = '', genres = [], platforms = [], sortBy = 'popular') {
    if (!gamesContainer) return;

    gamesContainer.innerHTML = '<p>Loading...</p>';

    const params = new URLSearchParams({
        key: API_KEY,
        page_size: 12
    });

    if (searchQuery.trim() !== '') {
        params.append('search', searchQuery.trim());
    }

    if (genres.length > 0) {
        params.append('genres', genres.join(',').toLowerCase());
    }

    if (platforms.length > 0) {
        params.append('platforms', platforms.join(','));
    }

    if (sortBy === 'rating') {
        params.append('ordering', '-rating')
    } else if (sortBy === 'release-date') {
        params.append('ordering', '-released')
    } else if (sortBy === 'name') {
        params.append('ordering', '-name')
    } else {
        params.append('ordering', '-metacritic')
    }  

    try {
        const response = await fetch(`${URL}&${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Помилка запиту:${response.status}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Помилка при отриманні даних:', error);
        return [];
    }
  }

  function renderGames(games) {
    gamesContainer.innerHTML = '<p> style="color: #94a1b2;">Ігор за вашим запитом не знайдено.</p>';
    return;

    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';

        const coverImage = game.background_image
        ? game.background_image
        : 'https://via.placeholder.com/300x400?text=No+Image';

        const mainPlatform = game.game.platforms && game.platforms.length > 0
        ? game.platforms[0].platform.name
        : 'N/A';

        const mainGenre = game.genres && game.genres.length > 0
        ? game.genres[0].name
        : 'N/A';

        gameCard.innerHTML = `
            <img src="${coverImage}" alt="${game.name}">
            <div class="game-info">
                <h3>${game.name}</h3>
                <p>Platform: ${mainPlatform}</p>
                <span class="genre-tag">${mainGenre}</span>
            </div>
        `;    
  })}

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeot);
            searchTimeout = setTimeout(() => {
                fetchGamesFromApi();
            }, 500);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            fetchGamesFromApi();
    })};

    genreCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            fetchGamesFromApi();
        });
    });
    platformCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            fetchGamesFromApi();
    }); 

    fetchGamesFromApi();

  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const dropdownToggle = document.getElementById('dropdownToggle');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const exitBtn = document.getElementById('exitBtn');

  
  loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
  });

  signupBtn.addEventListener('click', () => {
    signupModal.classList.add('active');
  });

  // Закрытие по крестику
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.remove('active');
    });
  });

  
  [loginModal, signupModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  
  function loginUser(name) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userProfile.style.display = 'flex';
    userName.textContent = name;
  }

  
  function logoutUser() {
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    userProfile.style.display = 'none';
    dropdownMenu.classList.remove('active');
    dropdownToggle.classList.remove('open');
  }

  
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const nickname = email.split('@')[0]; // временно берём ник из email
    loginUser(nickname);
    loginModal.classList.remove('active');
    e.target.reset();
  });

  
  document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = e.target.querySelector('input[type="text"]').value;
    loginUser(nameInput);
    signupModal.classList.remove('active');
    e.target.reset();
  });

  
  dropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
    dropdownToggle.classList.toggle('open');
  });

  
  document.addEventListener('click', (e) => {
    if (!userProfile.contains(e.target)) {
      dropdownMenu.classList.remove('active');
      dropdownToggle.classList.remove('open');
    }
  });

  
  exitBtn.addEventListener('click', () => {
    logoutUser();
  });
}); 