document.addEventListener('DOMContentLoaded', () => {
  const navbarContainer = document.getElementById('mobilenavbar');

  if (navbarContainer) {
    fetch('/mobilenavbar.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        navbarContainer.innerHTML = data;

        // Initialize menu toggle functionality
        initializeNavbar();
      })
      .catch(error => console.error('Error loading navbar:', error));
  } else {
    console.error('Error: Element with ID "mobilenavbar" not found.');
  }
});

function initializeNavbar() {
  const sideNavbar = document.getElementById('sideNavbar');
  const closeButton = document.getElementById('closeButton');
  const toggleButton = document.getElementById('toggleButton');
  const overlay = document.getElementById('overlay');

  if (!sideNavbar || !toggleButton) {
    console.error('Error: Required navbar elements not found.');
    return;
  }

  // ---- ENSURE NAVBAR STARTS CLOSED ----
  sideNavbar.classList.remove('open');
  sideNavbar.setAttribute('aria-hidden', 'true');
  toggleButton.setAttribute('aria-expanded', 'false');
  closeButton.style.display = 'none';
  toggleButton.style.display = 'flex';
  if (overlay) overlay.classList.remove('active');

  // ---- OPEN/CLOSE FUNCTIONS ----
  function openNavbar() {
    sideNavbar.classList.add('open');
    sideNavbar.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    closeButton.style.display = 'flex';
    toggleButton.style.display = 'none';
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function closeNavbar() {
    sideNavbar.classList.remove('open');
    sideNavbar.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
    closeButton.style.display = 'none';
    toggleButton.style.display = 'flex';
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Close all dropdowns
    document.querySelectorAll('.mobile-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      const btn = dropdown.querySelector('.mobile-dropdown-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  // ---- EVENT LISTENERS FOR TOGGLE BUTTONS ----
  toggleButton.addEventListener('click', openNavbar);
  if (closeButton) closeButton.addEventListener('click', closeNavbar);

  // ---- CLOSE ON OVERLAY CLICK ----
  if (overlay) {
    overlay.addEventListener('click', closeNavbar);
  }

  // ---- CLOSE WHEN CLICKING OUTSIDE ----
  document.addEventListener('click', (event) => {
    if (sideNavbar.classList.contains('open')) {
      const isClickInNavbar = sideNavbar.contains(event.target);
      const isClickOnToggle = toggleButton.contains(event.target);
      
      if (!isClickInNavbar && !isClickOnToggle) {
        closeNavbar();
      }
    }
  });

  // ---- MOBILE DROPDOWN TOGGLE ----
  const dropdownToggles = sideNavbar.querySelectorAll('.mobile-dropdown-toggle');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      const parent = toggle.closest('.mobile-dropdown');
      const isOpen = parent.classList.contains('open');
      
      // Close other dropdowns
      dropdownToggles.forEach(btn => {
        const node = btn.closest('.mobile-dropdown');
        if (node !== parent) {
          node.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle current dropdown
      if (!isOpen) {
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        parent.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // ---- CLOSE DROPDOWN ON ITEM CLICK ----
  const dropdownItems = sideNavbar.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      closeNavbar();
    });
  });

  // ---- HIGHLIGHT ACTIVE PAGE ----
  highlightActivePage();

  // ---- KEYBOARD NAVIGATION (ESC TO CLOSE) ----
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideNavbar.classList.contains('open')) {
      closeNavbar();
    }
  });
}

function highlightActivePage() {
  const sideNavbar = document.getElementById('sideNavbar');
  if (!sideNavbar) return;

  const path = window.location.pathname.toLowerCase();
  const navLinks = sideNavbar.querySelectorAll('.data-sideNavbar-icon a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href').toLowerCase();
    
    // Check if current path matches link
    if (href !== '/' && path.startsWith(href)) {
      link.classList.add('active-page');
      
      // Auto-open dropdown if link is in dropdown
      const dropdown = link.closest('.mobile-dropdown');
      if (dropdown) {
        dropdown.classList.add('open');
        const button = dropdown.querySelector('.mobile-dropdown-toggle');
        if (button) button.setAttribute('aria-expanded', 'true');
      }
    } else {
      link.classList.remove('active-page');
    }
  });

  // Highlight home if on root
  if (path === '/' || path.endsWith('/index.html')) {
    const homeLink = sideNavbar.querySelector('.data-sideNavbar-icon a[href="/"]');
    if (homeLink) homeLink.classList.add('active-page');
  }
}