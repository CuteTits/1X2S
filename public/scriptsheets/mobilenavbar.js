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

                if (typeof initializeNavbar === 'function') {
                    initializeNavbar(); // Ensure the function exists before calling it
                }

                window.scrollTo(0, 0); // Scroll to the top of the page

                const navbarItems = document.querySelectorAll('.nav-item');

                function updateActiveNav() {
                    const currentHash = window.location.hash || '/index.html'; // Default to index.html if no hash is present
                    navbarItems.forEach(item => {
                        item.classList.remove('active'); 
                        if (item.getAttribute('href') === currentHash) {
                            item.classList.add('active');
                        }
                    });
                }

                // Update active nav on page load
                updateActiveNav();

                // Update active nav on hash change
                window.addEventListener('hashchange', updateActiveNav);
            })
            .catch(error => console.error('Error loading navbar:', error));
    } else {
        console.error('Error: Element with ID "mobilenavbar" not found.');
    }

    const homeButton = document.getElementById('nav-home');

    homeButton.addEventListener('click', (event) => {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});