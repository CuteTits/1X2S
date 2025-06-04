function initializeNavbar() {
    const mainNav = document.querySelector('.navigation-menu-bar-header-top-dynamic-0-desktop-1080');
    const divider = document.querySelector('.Navigational-header-expanding-element-dynamic-0');

    function handleScroll() {
        if (window.scrollY > 50) {
            mainNav.style.backdropFilter = 'blur(5px)';
            mainNav.style.webkitBackdropFilter = 'blur(5px)';
        } else {
            mainNav.style.backgroundColor = 'transparent';
            mainNav.style.webkitBackdropFilter = 'blur(0px)';
            mainNav.style.backdropFilter = 'blur(0px)';

        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();
}

// Load navbar.html and initialize everything after it's inserted
fetch('/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;

        // Now that the navbar is loaded, we can safely access its elements
        const progressBar = document.getElementById("progress-bar");

        // Attach scroll listener for the progress bar
        window.addEventListener("scroll", () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            const maxScroll = scrollHeight - clientHeight;
            const scrolledPercentage = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

            progressBar.style.width = `${scrolledPercentage}%`;
        });

        // Initialize navbar behavior
        if (typeof initializeNavbar === 'function') {
            initializeNavbar();
        }

        // Scroll to top on load
        window.scrollTo(0, 0);
    })
    .catch(error => console.error('Error loading navbar:', error));