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
fetch('/navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar').innerHTML = data;

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
  })
  .catch(error => console.error('Error loading navbar:', error));
