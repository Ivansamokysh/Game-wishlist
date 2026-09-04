document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('.btn-login');
  const signupBtn = document.querySelector('.btn-signup');
  const loginModal = document.getElementById('loginModal');
  const signupModal = document.getElementById('signupModal');

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