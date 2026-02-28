// --- Initialize Navbar ---
function initializeNavbar() {
  const mainNav = document.querySelector('.navigation-menu-bar-header-top-dynamic-0-desktop-1080');

  function handleScroll() {
    if (!mainNav) return;
    if (window.scrollY > 50) {
      mainNav.style.backdropFilter = 'blur(5px)';
      mainNav.style.webkitBackdropFilter = 'blur(5px)';
      mainNav.style.backgroundColor = 'rgba(0, 0, 0, 0.41)';
    } else {
      mainNav.style.backgroundColor = 'transparent';
      mainNav.style.webkitBackdropFilter = 'blur(0px)';
      mainNav.style.backdropFilter = 'blur(0px)';
    }
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll();
}

// --- Initialize Banner ---
function initializeBanner() {
  const banner = document.getElementById('top-banner');
  const closeBtn = document.getElementById('close-banner');

  if (!banner || !closeBtn) {
    console.warn("Banner not found in DOM yet");
    return;
  }

  if (sessionStorage.getItem('bannerDismissed')) {
    banner.style.display = 'none';
    return;
  }

  closeBtn.addEventListener('click', () => {
    banner.style.display = 'none';
    sessionStorage.setItem('bannerDismissed', 'true');
  });

  console.log("✅ Banner initialized");
}

// --- Load Navbar Once and Initialize Everything ---
function loadNavbarComponent() {
  const navbarContainer = document.getElementById('navbar');
  
  if (!navbarContainer) {
    console.warn('⚠️ #navbar element not found, retrying...');
    setTimeout(loadNavbarComponent, 100);
    return;
  }

  console.log('🔄 Loading navbar component...');
  
  fetch('/navbar.html')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(data => {
      navbarContainer.innerHTML = data;
      console.log('✅ Navbar HTML loaded');

      // Initialize navbar behavior
      if (typeof initializeNavbar === 'function') initializeNavbar();

      // Progress bar setup
      const progressBar = document.getElementById("progress-bar");
      if (progressBar) {
        window.addEventListener("scroll", () => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;

        const maxScroll = scrollHeight - clientHeight;
        const scrolledPercentage = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

        progressBar.style.width = `${scrolledPercentage}%`;
      });
    }

    // Initialize banner after navbar is loaded
    initializeBanner();

    // Optional: clear session storage locally for dev
    if (window.location.hostname === "localhost") {
      console.log("🧹 Clearing sessionStorage for testing");
      sessionStorage.clear();
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // --- Check session and update navbar for logged-in users ---
    fetch('/api/session')
      .then(res => res.json())
      .then(session => {
        if (session.loggedIn && session.user) {
          // Build dropdown menu items
          let dropdownItems = `
            <li><a href="/account">Dashboard</a></li>
          `;
          
          // Add admin panel link if user is admin
          if (session.user.role === 'admin') {
            dropdownItems += `<li><a href="/admin-panel">Admin Panel</a></li>`;
          }
          
          dropdownItems += `<li><a id="logout-link-nav"><span class="material-symbols-outlined">logout</span> Logout</a></li>`;

          const userOptions = document.createElement('div');
          userOptions.className = 'navigation-menu-desktop-buttons-user-options-logged-in-true';
          userOptions.innerHTML = `
            <div class="user-profile-icon" id="user-profile-icon">
              <span class="material-symbols-outlined">account_circle</span>
              <a>Hello, <strong id="greeting">${session.user.name || 'User'}</strong></a>
            </div>
            <div class="user-options-dropdown-menu" id="user-options-dropdown-menu">
              <ul>
                ${dropdownItems}
              </ul>
            </div>
          `;
          // Replace login/signup buttons with user menu
          const btns = document.querySelector('.navigation-menu-desktop-buttons-user-options');
          if (btns && btns.parentNode) {
            btns.parentNode.replaceChild(userOptions, btns);
          }
          // Dropdown logic
          const profileIcon = userOptions.querySelector('#user-profile-icon');
          const dropdownMenu = userOptions.querySelector('#user-options-dropdown-menu');
          let dropdownOpen = false;

          function closeDropdown(e) {
            if (!userOptions.contains(e.target)) {
              userOptions.classList.remove('active');
              dropdownOpen = false;
              document.removeEventListener('mousedown', closeDropdown);
            }
          }

          profileIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownOpen = !dropdownOpen;
            if (dropdownOpen) {
              userOptions.classList.add('active');
              document.addEventListener('mousedown', closeDropdown);
            } else {
              userOptions.classList.remove('active');
              document.removeEventListener('mousedown', closeDropdown);
            }
          });

          // Add logout handler
          const logoutBtn = userOptions.querySelector('#logout-link-nav');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
              e.preventDefault();
              fetch('/api/logout', { method: 'POST' })
                .then(() => window.location.href = '/')
                .catch(() => window.location.href = '/');
            });
          }
        }
      })
      .catch(err => console.error('Session check failed:', err));
    })
    .catch(error => {
      console.error('❌ Error loading navbar:', error);
      // Retry after delay
      setTimeout(loadNavbarComponent, 1000);
    });
}

// Wait for DOM to be ready before loading navbar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNavbarComponent);
} else {
  // DOM already loaded
  setTimeout(loadNavbarComponent, 0);
}
