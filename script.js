document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '250ff70572f54c47ba15fc8fa203da58';
  const BASE_URL = 'https://api.rawg.io/api/games';

  const gamesContainer = document.querySelector('.games-container');
  const searchInput = document.querySelector('.search-box input');
  
  // Шукаємо чекбокси у відповідних блоках фільтрів
  const genreCheckboxes = document.querySelectorAll('.filters-group:nth-child(2) input[type="checkbox"]');
  const platformCheckboxes = document.querySelectorAll('.filters-group:nth-child(3) input[type="checkbox"]');
  const sortSelect = document.getElementById('sort-select');
  const loadMoreBtn = document.getElementById('load-more-btn');

  let searchTimeout = null;
  let currentPage = 1;
  let isLoading = false;

  const platformMap = {
    'pc': '4',
    'playstation': '18,187,16',
    'xbox': '1,186,14',
    'nintendo': '7,8,9,13,105'
  };

  async function fetchGamesFromApi(isNextPage = false) {
    if (isLoading || !gamesContainer) return;
    isLoading = true;

    if (!isNextPage) {
      currentPage = 1;
      gamesContainer.innerHTML = '<p style="color: #94a1b2;">Завантаження ігор...</p>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
      if (loadMoreBtn) loadMoreBtn.textContent = 'Loading...';
    }

    const searchQuery = searchInput ? searchInput.value.trim() : '';
    
    const selectedGenres = Array.from(genreCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value.toLowerCase())
      .join(',');

    const selectedPlatforms = Array.from(platformCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => {
        const val = cb.value.toLowerCase().trim();
        return platformMap[val] || cb.value;
      })
      .filter(Boolean)
      .join(',');

    const sortBy = sortSelect ? sortSelect.value : 'popular';

    const params = new URLSearchParams({
      key: API_KEY,
      page_size: 15,
      page: currentPage
    });

    if (searchQuery !== '') {
      params.append('search', searchQuery);
    }

    if (selectedGenres) {
      params.append('genres', selectedGenres);
    }

    if (selectedPlatforms) {
      params.append('platforms', selectedPlatforms);
    }

    if (sortBy === 'rating') {
      params.append('ordering', '-rating');
    } else if (sortBy === 'release-date') {
      params.append('ordering', '-released');
    } else if (sortBy === 'name') {
      params.append('ordering', 'name');
    } else {
      params.append('ordering', '-added');
    }  

    try {
      const response = await fetch(`${BASE_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Помилка запиту: ${response.status}`);
      }

      const data = await response.json();
      
      renderGames(data.results, isNextPage);

      if (loadMoreBtn) {
        if (data.next) {
          loadMoreBtn.style.display = 'inline-block';
          loadMoreBtn.textContent = 'Load More';
        } else {
          loadMoreBtn.style.display = 'none';
        }
      }

    } catch (error) {
      console.error('Помилка при отриманні даних:', error);
      if (!isNextPage) {
        gamesContainer.innerHTML = '<p style="color: #ff5c5c;">Не вдалося завантажити ігри.</p>';
      }
    } finally {
      isLoading = false;
    }
  }

  function renderGames(games, isNextPage = false) {
    if (!isNextPage) {
      gamesContainer.innerHTML = '';
    }

    if ((!games || games.length === 0) && !isNextPage) {
      gamesContainer.innerHTML = '<p style="color: #94a1b2;">Ігор за вашим запитом не знайдено.</p>';
      return;
    }

    games.forEach(game => {
      const gameCard = document.createElement('div');
      gameCard.className = 'game-card';

      const coverImage = game.background_image 
        ? game.background_image 
        : 'https://via.placeholder.com/300x400/16161a/ffffff?text=No+Image';

      const mainPlatform = game.platforms && game.platforms.length > 0 
        ? game.platforms[0].platform.name 
        : 'N/A';

      const mainGenre = game.genres && game.genres.length > 0 
        ? game.genres[0].name 
        : 'Game';

      gameCard.innerHTML = `
        <img src="${coverImage}" alt="${game.name}" class="game-cover" />
        <div class="game-info">
          <h3>${game.name}</h3>
          <p>Platform: ${mainPlatform} | Rating: ⭐ ${game.rating || 'N/A'}</p>
          <span class="genre-tag">${mainGenre}</span>
        </div>
      `;

      gamesContainer.appendChild(gameCard);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchGamesFromApi();
      }, 500);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      fetchGamesFromApi();
    });
  }

  genreCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      fetchGamesFromApi();
    });
  });

  platformCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      fetchGamesFromApi();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      fetchGamesFromApi(true);
    });
  }

  fetchGamesFromApi();

  const loginBtn = document.querySelector('header .btn-login') || document.querySelector('.btn-login');
  const signupBtn = document.querySelector('header .btn-signup') || document.querySelector('.btn-signup');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const dropdownToggle = document.getElementById('dropdownToggle');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const exitBtn = document.getElementById('exitBtn');

  if (loginBtn && loginModal) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.add('active');
    });
  }

  if (signupBtn && signupModal) {
    signupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signupModal.classList.add('active');
    });
  }

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  [loginModal, signupModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  function loginUser(name) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (userName) userName.textContent = name;
  }

  function logoutUser() {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (userProfile) userProfile.style.display = 'none';
    if (dropdownMenu) dropdownMenu.classList.remove('active');
    if (dropdownToggle) dropdownToggle.classList.remove('open');
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = e.target.querySelector('input[type="email"]');
      if (emailInput) {
        const nickname = emailInput.value.split('@')[0];
        loginUser(nickname);
      }
      if (loginModal) loginModal.classList.remove('active');
      e.target.reset();
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = e.target.querySelector('input[type="text"]');
      if (nameInput) {
        loginUser(nameInput.value);
      }
      if (signupModal) signupModal.classList.remove('active');
      e.target.reset();
    });
  }

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('active');
      dropdownToggle.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (userProfile && !userProfile.contains(e.target)) {
      if (dropdownMenu) dropdownMenu.classList.remove('active');
      if (dropdownToggle) dropdownToggle.classList.remove('open');
    }
  });

  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      logoutUser();
    });
  }
});