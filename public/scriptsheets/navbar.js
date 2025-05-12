// public/scripts/navbar.js

function initializeNavbar() {
    const mainNav = document.querySelector('.navigation-menu-bar-header-top-dynamic-0-desktop-1080');
    const divider = document.querySelector('.Navigational-header-expanding-element-dynamic-0');
  
    function handleScroll() {
        if (window.scrollY > 50) {
            mainNav.style.backdropFilter = 'blur(5px)';
            mainNav.style.webkitBackdropFilter = 'blur(5px)';
            divider.style.width = '100%';
        } else {
            mainNav.style.backgroundColor = 'transparent';
            mainNav.style.webkitBackdropFilter = 'blur(0px)';
            mainNav.style.backdropFilter = 'blur(0px)';
            divider.style.width = '20%';
        }
    }
  
    window.addEventListener('scroll', handleScroll);
  
    handleScroll();
  }
  
  fetch('/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
  
        initializeNavbar();
        window.scrollTo(0, 0);
    })
    .catch(error => console.error('Error loading navbar:', error));
  
  