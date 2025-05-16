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

                const toggleButton = document.getElementById('toggleButton');
                const sideNavbar = document.getElementById('sideNavbar');
                const masterElement = document.querySelector('master'); // Select the <master> element

                if (toggleButton && sideNavbar) {
                    toggleButton.addEventListener('click', function () {
                        if (sideNavbar.style.left === '0px') {
                            sideNavbar.style.left = '-250px';
                            toggleButton.textContent = '☰'; // Change to hamburger icon
                            document.body.classList.remove('no-scroll'); // Enable scrolling
                            if (masterElement) {
                                masterElement.style.filter = 'none'; // Remove blur effect
                            }
                        } else {
                            sideNavbar.style.left = '0px';
                            toggleButton.textContent = '✖'; // Change to "X" icon
                            document.body.classList.add('no-scroll'); // Disable scrolling
                            if (masterElement) {
                                masterElement.style.filter = 'blur(2px)'; // Add blur effect
                            }
                        }
                    });

                    // Close the navbar when clicking outside of it
                    document.addEventListener('click', (event) => {
                        if (
                            sideNavbar.style.left === '0px' &&
                            !sideNavbar.contains(event.target) &&
                            !toggleButton.contains(event.target)
                        ) {
                            sideNavbar.style.left = '-250px';
                            toggleButton.textContent = '☰'; // Change to hamburger icon
                            document.body.classList.remove('no-scroll'); // Enable scrolling
                            if (masterElement) {
                                masterElement.style.filter = 'none'; // Remove blur effect
                            }
                        }
                    });
                } else {
                    console.error('Error: toggleButton or sideNavbar not found.');
                }

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

    if (homeButton) {
        homeButton.addEventListener('click', (event) => {
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
});