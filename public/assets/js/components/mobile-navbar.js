document.addEventListener('DOMContentLoaded', () => {
  const navbarContainer = document.getElementById('mobilenavbar');
  if (!navbarContainer) return;

  fetch('/mobilenavbar.html')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then((data) => {
      navbarContainer.innerHTML = data;
      initializeNavbar();
    })
    .catch((error) => console.error('Error loading mobile navbar:', error));
});

function initializeNavbar() {
  const sideNavbar = document.getElementById('sideNavbar');
  const closeButton = document.getElementById('closeButton');
  const toggleButton = document.getElementById('toggleButton');
  const overlay = document.getElementById('overlay');
  const mq = window.matchMedia('(max-width: 770px)');

  if (!sideNavbar || !toggleButton || !closeButton || !overlay) return;

  const setBodyLock = (locked) => {
    document.body.classList.toggle('mobile-nav-open', locked);
  };

  const closeAllDropdowns = () => {
    sideNavbar.querySelectorAll('.mobile-dropdown.open').forEach((dropdown) => {
      dropdown.classList.remove('open');
      const button = dropdown.querySelector('.mobile-dropdown-toggle');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  };

  const openNavbar = () => {
    if (!mq.matches) return;
    sideNavbar.classList.add('open');
    sideNavbar.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    toggleButton.setAttribute('aria-expanded', 'true');
    setBodyLock(true);
  };

  const closeNavbar = () => {
    sideNavbar.classList.remove('open');
    sideNavbar.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    toggleButton.setAttribute('aria-expanded', 'false');
    setBodyLock(false);
    closeAllDropdowns();
  };

  closeNavbar();

  toggleButton.addEventListener('click', openNavbar);
  closeButton.addEventListener('click', closeNavbar);
  overlay.addEventListener('click', closeNavbar);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sideNavbar.classList.contains('open')) {
      closeNavbar();
    }
  });

  mq.addEventListener('change', (event) => {
    if (!event.matches) {
      closeNavbar();
    }
  });

  const dropdownToggles = sideNavbar.querySelectorAll('.mobile-dropdown-toggle');
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const parent = toggle.closest('.mobile-dropdown');
      if (!parent) return;

      const shouldOpen = !parent.classList.contains('open');

      dropdownToggles.forEach((button) => {
        const node = button.closest('.mobile-dropdown');
        if (!node) return;
        node.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      });

      if (shouldOpen) {
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  sideNavbar.querySelectorAll('.mobile-nav-link, .dropdown-item, .mobile-auth-btn').forEach((link) => {
    link.addEventListener('click', () => closeNavbar());
  });

  highlightActivePage(sideNavbar);
}

function normalizePath(pathname) {
  if (!pathname) return '/';
  const cleaned = pathname.toLowerCase().replace(/\/+$/, '');
  return cleaned || '/';
}

function highlightActivePage(sideNavbar) {
  const currentPath = normalizePath(window.location.pathname);
  const links = sideNavbar.querySelectorAll('.mobile-nav-link, .dropdown-item');

  links.forEach((link) => {
    const href = normalizePath(link.getAttribute('href'));
    const isHome = href === '/';
    const isActive = isHome ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

    link.classList.toggle('active-page', isActive);

    if (isActive) {
      const dropdown = link.closest('.mobile-dropdown');
      if (dropdown) {
        dropdown.classList.add('open');
        const button = dropdown.querySelector('.mobile-dropdown-toggle');
        if (button) button.setAttribute('aria-expanded', 'true');
      }
    }
  });
}