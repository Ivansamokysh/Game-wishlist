document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '250ff70572f54c47ba15fc8fa203da58';
  const BASE_URL = 'https://api.rawg.io/api/games';

  const gamesContainer = document.querySelector('.games-container');
  const filterSidebar = document.querySelector('.filter-sidebar');
  const searchInput = document.querySelector('.search-box input');
  
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

  function getWishlist() {
    return JSON.parse(localStorage.getItem('my_game_wishlist') || '[]');
  }

  function saveWishlist(wishlist) {
    localStorage.setItem('my_game_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }

  function toggleWishlistGame(gameObj) {
    let wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === gameObj.id);

    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(gameObj);
    }

    saveWishlist(wishlist);
    renderWishlistModalItems();
    
    // Обновляем сердечки на карточках
    document.querySelectorAll(`.card-wishlist-toggle[data-id="${gameObj.id}"]`).forEach(btn => {
      const inWish = wishlist.some(item => item.id === gameObj.id);
      btn.innerHTML = inWish ? '❤️' : '🤍';
    });
  }

  let wishlistSidebarContainer = document.getElementById('wishlist-sidebar-container');
  let wishlistSidebarBtn = document.getElementById('wishlist-sidebar-btn');

  if (!wishlistSidebarContainer && filterSidebar) {
    wishlistSidebarContainer = document.createElement('div');
    wishlistSidebarContainer.id = 'wishlist-sidebar-container';
    wishlistSidebarContainer.className = 'wishlist-sidebar-container';

    wishlistSidebarBtn = document.createElement('button');
    wishlistSidebarBtn.id = 'wishlist-sidebar-btn';
    wishlistSidebarBtn.className = 'btn btn-login wishlist-sidebar-btn';
    wishlistSidebarBtn.innerHTML = `💚 My Wishlist (<span id="wishlist-count">0</span>)`;

    wishlistSidebarContainer.appendChild(wishlistSidebarBtn);
    filterSidebar.appendChild(wishlistSidebarContainer);
  }

  let wishlistModal = document.getElementById('wishlistModal');
  if (!wishlistModal) {
    wishlistModal = document.createElement('div');
    wishlistModal.id = 'wishlistModal';
    wishlistModal.className = 'modal-overlay';
    wishlistModal.innerHTML = `
      <div class="modal-content wishlist-modal-content">
        <span class="close-btn" data-close>&times;</span>
        <div class="wishlist-header-modal">
          <h2>💚 My Wishlist (<span id="wishlist-modal-count">0</span>)</h2>
        </div>
        <div id="wishlist-modal-body" class="wishlist-modal-body"></div>
      </div>
    `;
    document.body.appendChild(wishlistModal);
  }

  function updateWishlistUI() {
    const wishlist = getWishlist();
    const countSpan = document.getElementById('wishlist-count');
    const modalCountSpan = document.getElementById('wishlist-modal-count');

    if (countSpan) countSpan.textContent = wishlist.length;
    if (modalCountSpan) modalCountSpan.textContent = wishlist.length;

    if (wishlistSidebarBtn) {
      if (wishlist.length > 0) {
        wishlistSidebarBtn.classList.add('has-items');
      } else {
        wishlistSidebarBtn.classList.remove('has-items');
      }
    }
  }

  function renderWishlistModalItems() {
    const bodyContainer = document.getElementById('wishlist-modal-body');
    if (!bodyContainer) return;

    const wishlist = getWishlist();

    if (wishlist.length === 0) {
      bodyContainer.innerHTML = '<p style="color: #94a1b2; text-align: center; padding: 40px; font-size: 16px;">Ваш список бажань порожній.</p>';
      return;
    }

    bodyContainer.innerHTML = wishlist.map(item => `
      <div class="wishlist-item-card">
        <img src="${item.cover}" alt="${item.name}" class="wishlist-item-img" />
        <div class="wishlist-item-info">
          <h3>${item.name}</h3>
          <div class="wishlist-item-meta">⭐ Рейтинг: ${item.rating} | 🎮 ${item.genre} | 💻 ${item.platform}</div>
          <p class="wishlist-item-desc">${item.description || 'Натисніть "Деталі", щоб дізнатися більше про цю гру.'}</p>
        </div>
        <div class="wishlist-item-actions">
          <button class="btn btn-login view-details-btn" data-id="${item.id}" style="padding: 8px 14px; font-size: 13px;">Деталі</button>
          <button class="remove-wishlist-btn" data-id="${item.id}">Видалити 🗑️</button>
        </div>
      </div>
    `).join('');

    bodyContainer.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const wishlist = getWishlist();
        const itemToRemove = wishlist.find(i => i.id === id);
        if (itemToRemove) toggleWishlistGame(itemToRemove);
      });
    });

    bodyContainer.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        wishlistModal.classList.remove('active');
        fetchGameDetails(id);
      });
    });
  }

  if (wishlistSidebarBtn && wishlistModal) {
    wishlistSidebarBtn.addEventListener('click', () => {
      renderWishlistModalItems();
      wishlistModal.classList.add('active');
    });
  }

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

    const genreMap = {
      'rpg': '5', 'action': '4', 'strategy': '10', 'shooter': '2',
      'adventure': '3', 'puzzle': '7', 'sports': '15', 'racing': '1'
    };
    
    const selectedGenres = Array.from(genreCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => genreMap[cb.value.toLowerCase().trim()] || cb.value)
      .filter(Boolean).join(',');

    const selectedPlatforms = Array.from(platformCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => platformMap[cb.value.toLowerCase().trim()] || cb.value)
      .filter(Boolean).join(',');

    const sortBy = sortSelect ? sortSelect.value : 'popular';

    const params = new URLSearchParams({
      key: API_KEY,
      page_size: 15,
      page: currentPage
    });

    if (searchQuery) params.append('search', searchQuery);
    if (selectedGenres) params.append('genres', selectedGenres);
    if (selectedPlatforms) params.append('platforms', selectedPlatforms);

    if (sortBy === 'rating') params.append('ordering', '-rating');
    else if (sortBy === 'release-date') params.append('ordering', '-released');
    else if (sortBy === 'name') params.append('ordering', 'name');
    else params.append('ordering', '-added');

    try {
      const response = await fetch(`${BASE_URL}?${params.toString()}`);
      if (!response.ok) throw new Error(`Помилка запиту: ${response.status}`);

      const data = await response.json();
      renderGames(data.results, isNextPage);

      if (loadMoreBtn) {
        loadMoreBtn.style.display = data.next ? 'inline-block' : 'none';
        loadMoreBtn.textContent = 'Load More';
      }
    } catch (error) {
      console.error('Помилка при отриманні даних:', error);
      if (!isNextPage) gamesContainer.innerHTML = '<p style="color: #ff5c5c;">Не вдалося завантажити ігри.</p>';
    } finally {
      isLoading = false;
    }
  }

  function renderGames(games, isNextPage = false) {
    if (!isNextPage) gamesContainer.innerHTML = '';

    if ((!games || games.length === 0) && !isNextPage) {
      gamesContainer.innerHTML = '<p style="color: #94a1b2;">Ігор за вашим запитом не знайдено.</p>';
      return;
    }

    const wishlist = getWishlist();

    games.forEach(game => {
      const gameCard = document.createElement('div');
      gameCard.className = 'game-card clickable-card';
      gameCard.setAttribute('data-id', game.id);

      const coverImage = game.background_image || 'https://via.placeholder.com/300x400/16161a/ffffff?text=No+Image';
      const mainPlatform = game.platforms && game.platforms.length > 0 ? game.platforms[0].platform.name : 'N/A';
      const mainGenre = game.genres && game.genres.length > 0 ? game.genres[0].name : 'Game';
      const isWishlisted = wishlist.some(item => item.id === game.id);

      gameCard.innerHTML = `
        <button class="card-wishlist-toggle" data-id="${game.id}" title="Додати у вишлист">
          ${isWishlisted ? '❤️' : '🤍'}
        </button>
        <img src="${coverImage}" alt="${game.name}" class="game-cover" />
        <div class="game-info">
          <h3>${game.name}</h3>
          <p>Platform: ${mainPlatform} | Rating: ⭐ ${game.rating || 'N/A'}</p>
          <span class="genre-tag">${mainGenre}</span>
        </div>

        <div class="card-rating-widget">
          <div class="stars-container">
            <div class="star-item" data-value="1"><span class="star-icon">★</span><span class="star-num">1</span></div>
            <div class="star-item" data-value="2"><span class="star-icon">★</span><span class="star-num">2</span></div>
            <div class="star-item" data-value="3"><span class="star-icon">★</span><span class="star-num">3</span></div>
            <div class="star-item" data-value="4"><span class="star-icon">★</span><span class="star-num">4</span></div>
            <div class="star-item" data-value="5"><span class="star-icon">★</span><span class="star-num">5</span></div>
          </div>
          <div class="rating-msg">Відгук прийнятий!</div>
        </div>
      `;

      const wishlistToggle = gameCard.querySelector('.card-wishlist-toggle');
      wishlistToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlistGame({
          id: game.id,
          name: game.name,
          cover: coverImage,
          rating: game.rating || 'N/A',
          platform: mainPlatform,
          genre: mainGenre,
          description: `Платформи: ${mainPlatform}. Жанр: ${mainGenre}. Рейтинг: ⭐ ${game.rating || 'N/A'}`
        });
      });

      gameCard.addEventListener('click', (e) => {
        if (e.target.closest('.card-rating-widget') || e.target.closest('.card-wishlist-toggle')) return;
        fetchGameDetails(game.id);
      });

      gamesContainer.appendChild(gameCard);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => fetchGamesFromApi(), 500);
    });
  }

  if (sortSelect) sortSelect.addEventListener('change', () => fetchGamesFromApi());
  genreCheckboxes.forEach(cb => cb.addEventListener('change', () => fetchGamesFromApi()));
  platformCheckboxes.forEach(cb => cb.addEventListener('change', () => fetchGamesFromApi()));

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      fetchGamesFromApi(true);
    });
  }

  fetchGamesFromApi();
  updateWishlistUI();

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

  function loginUser(name) {
    localStorage.setItem('userName', name);
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (userName) userName.textContent = name;
  }

  function logoutUser() {
    localStorage.removeItem('userName');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (userProfile) userProfile.style.display = 'none';
    if (dropdownMenu) dropdownMenu.classList.remove('active');
    if (dropdownToggle) dropdownToggle.classList.remove('open');
  }

  const savedUser = localStorage.getItem('userName');
  if (savedUser) loginUser(savedUser);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = e.target.querySelector('input[type="email"]');
      if (emailInput) loginUser(emailInput.value.split('@')[0]);
      if (loginModal) loginModal.classList.remove('active');
      e.target.reset();
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = e.target.querySelector('input[type="text"]');
      if (nameInput) loginUser(nameInput.value);
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

  if (exitBtn) exitBtn.addEventListener('click', () => logoutUser());

  async function fetchGameDetails(gameId) {
    const gameModal = document.getElementById('gameModal');
    const modalDetails = document.getElementById('gameModalDetails');

    if (!gameModal || !modalDetails) return;

    modalDetails.innerHTML = '<p style="color: #94a1b2; text-align: center; padding: 60px; font-size: 18px;">Завантаження...</p>';
    gameModal.classList.add('active');

    try {
      const response = await fetch(`${BASE_URL}/${gameId}?key=${API_KEY}`);
      if (!response.ok) throw new Error('Помилка завантаження даних');

      const game = await response.json();
      const wishlist = getWishlist();
      const isWishlisted = wishlist.some(item => item.id === game.id);

      const platformsStr = game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A';
      const genresStr = game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A';
      const publishersStr = game.publishers && game.publishers.length > 0 ? game.publishers.map(p => p.name).join(', ') : 'N/A';

      modalDetails.innerHTML = `
        <div class="game-modal-body">
          <div class="game-modal-banner-container">
            <img src="${game.background_image || 'https://via.placeholder.com/1200x600'}" alt="${game.name}" class="game-modal-banner" />
            <div class="game-modal-banner-overlay"></div>
          </div>

          <div class="game-modal-header">
            <h2 class="game-modal-title">${game.name}</h2>
            <button id="modal-wishlist-btn" class="modal-wishlist-btn ${isWishlisted ? 'active' : ''}">
              ${isWishlisted ? '❤️ В бажаному' : '🤍 Додати у вишлист'}
            </button>
          </div>

          <div class="game-modal-meta-grid">
            <div class="game-meta-item">
              <span class="game-meta-label">Рейтинг</span>
              <span class="game-meta-value rating">⭐ ${game.rating || 'N/A'} / 5 (${game.ratings_count || 0} голосів)</span>
            </div>
            <div class="game-meta-item">
              <span class="game-meta-label">Дата релізу</span>
              <span class="game-meta-value">📅 ${game.released || 'N/A'}</span>
            </div>
            <div class="game-meta-item">
              <span class="game-meta-label">Жанри</span>
              <span class="game-meta-value">🎮 ${genresStr}</span>
            </div>
            <div class="game-meta-item">
              <span class="game-meta-label">Платформи</span>
              <span class="game-meta-value">💻 ${platformsStr}</span>
            </div>
            <div class="game-meta-item">
              <span class="game-meta-label">Видавець</span>
              <span class="game-meta-value">🏢 ${publishersStr}</span>
            </div>
          </div>

          <div class="game-modal-description">
            <h3>Про гру</h3>
            ${game.description || '<p>Опис відсутній.</p>'}
          </div>
        </div>
      `;

      const modalWishlistBtn = document.getElementById('modal-wishlist-btn');
      if (modalWishlistBtn) {
        modalWishlistBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const cleanDesc = game.description 
            ? game.description.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...'
            : 'Детальний опис доступний у картці гри.';

          toggleWishlistGame({
            id: game.id,
            name: game.name,
            cover: game.background_image || 'https://via.placeholder.com/300x400/16161a/ffffff?text=No+Image',
            rating: game.rating || 'N/A',
            platform: game.platforms && game.platforms.length > 0 ? game.platforms[0].platform.name : 'N/A',
            genre: game.genres && game.genres.length > 0 ? game.genres[0].name : 'Game',
            description: cleanDesc
          });

          const updatedWish = getWishlist().some(item => item.id === game.id);
          if (updatedWish) {
            modalWishlistBtn.classList.add('active');
            modalWishlistBtn.innerHTML = '❤️ В бажаному';
          } else {
            modalWishlistBtn.classList.remove('active');
            modalWishlistBtn.innerHTML = '🤍 Додати у вишлист';
          }
        });
      }

    } catch (error) {
      console.error('Помилка завантаження модалки:', error);
      modalDetails.innerHTML = '<p style="color: #ff5c5c; text-align: center; padding: 40px;">Не вдалося завантажити інформацію про гру.</p>';
    }
  }

  document.addEventListener('click', (e) => {
    const starItem = e.target.closest('.star-item');
    if (starItem) {
      e.stopPropagation();

      const widget = starItem.closest('.card-rating-widget');
      const selectedRating = parseInt(starItem.getAttribute('data-value'));
      const allStars = widget.querySelectorAll('.star-item');
      const msg = widget.querySelector('.rating-msg');

      allStars.forEach((star) => {
        const val = parseInt(star.getAttribute('data-value'));
        if (val <= selectedRating) star.classList.add('active');
        else star.classList.remove('active');
      });

      msg.classList.add('show');
      clearTimeout(widget.msgTimer);
      widget.msgTimer = setTimeout(() => msg.classList.remove('show'), 2000);
      return;
    }

    if (e.target.hasAttribute('data-close') || e.target.closest('[data-close]')) {
      const activeModal = e.target.closest('.modal-overlay');
      if (activeModal) activeModal.classList.remove('active');
      return;
    }

    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
      return;
    }

    if (userProfile && !userProfile.contains(e.target)) {
      if (dropdownMenu) dropdownMenu.classList.remove('active');
      if (dropdownToggle) dropdownToggle.classList.remove('open');
    }
  });

  document.addEventListener('mouseover', (e) => {
    const starItem = e.target.closest('.star-item');
    if (starItem) {
      const widget = starItem.closest('.card-rating-widget');
      const hoverRating = parseInt(starItem.getAttribute('data-value'));
      const allStars = widget.querySelectorAll('.star-item');

      allStars.forEach((star) => {
        const val = parseInt(star.getAttribute('data-value'));
        if (val <= hoverRating) star.classList.add('hovered');
        else star.classList.remove('hovered');
      });
    }
  });

  document.addEventListener('mouseout', (e) => {
    const starItem = e.target.closest('.star-item');
    if (starItem) {
      const widget = starItem.closest('.card-rating-widget');
      widget.querySelectorAll('.star-item').forEach((star) => star.classList.remove('hovered'));
    }
  });

});