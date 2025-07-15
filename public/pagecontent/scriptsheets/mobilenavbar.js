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

        // Once loaded, attach the menu toggle functionality
        const sideNavbar = document.getElementById('sideNavbar');
        const closeButton = document.getElementById('closeButton');
        const toggleButton = document.getElementById('toggleButton');

        function openNavbar() {
          sideNavbar.style.left = '0';
          closeButton.style.display = 'block';
          toggleButton.style.display = 'none';
          document.getElementById('overlay').style.display = 'block';
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        }

        function closeNavbar() {
          sideNavbar.style.left = '-250px';
          closeButton.style.display = 'none';
          toggleButton.style.display = 'block';
          document.getElementById('overlay').style.display = 'none';
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }

        if (toggleButton) toggleButton.addEventListener('click', openNavbar);
        if (closeButton) closeButton.addEventListener('click', closeNavbar);

        // Close navbar when clicking outside of it
        document.addEventListener('mousedown', function(event) {
          if (
            sideNavbar.style.left === '0px' &&
            !sideNavbar.contains(event.target) &&
            !toggleButton.contains(event.target)
          ) {
            closeNavbar();
          }
        });

        // Highlight active page button
        const path = window.location.pathname.toLowerCase();
        let selector;
        if (path === '/' || path.includes('index.html')) {
          selector = '.data-sideNavbar-icon a[href="/"]';
        } else if (path.includes('insights')) {
          selector = '.data-sideNavbar-icon a[href="/insights"]';
        } else if (path.includes('resources')) {
          selector = '.data-sideNavbar-icon a[href="/resources"]';
        } else if (path.includes('about') || path.includes('contact')) {
          selector = '.data-sideNavbar-icon a[href="/about"]';
        }
        if (selector) {
          const activeLink = document.querySelector(selector);
          if (activeLink) activeLink.classList.add('active-page');
        }
      })
      .catch(error => console.error('Error loading navbar:', error));
  } else {
    console.error('Error: Element with ID "mobilenavbar" not found.');
  }
});