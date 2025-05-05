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

                const navbarItems = document.querySelectorAll('.nav-item');
                const tipsButton = document.getElementById('tips');
                const section3 = document.querySelector('#section3');

                function updateActiveNav() {
                    const currentPath = window.location.pathname; // Get the current path
                    navbarItems.forEach(item => {
                        const img = item.querySelector('img');
                        const itemPath = new URL(item.getAttribute('href'), window.location.origin).pathname; // Normalize the href path
                        item.classList.remove('active');

                        if (itemPath === currentPath) {
                            item.classList.add('active');
                            if (img) {
                                img.src = img.src.replace('_FFFFFF_', '_F75454_'); // Replace part of the filename for active state
                            }
                        } else {
                            if (img) {
                                img.src = img.src.replace('_F75454_', '_FFFFFF_'); // Revert to default image
                            }
                        }
                    });
                }

                // Observe #section3 to update the "Tips" button style
                if (section3 && tipsButton) {
                    const observer = new IntersectionObserver(
                        (entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    tipsButton.classList.add('active');
                                    const img = tipsButton.querySelector('img');
                                    if (img) {
                                        img.src = img.src.replace('_FFFFFF_', '_F75454_');
                                    }
                                } else {
                                    tipsButton.classList.remove('active');
                                    const img = tipsButton.querySelector('img');
                                    if (img) {
                                        img.src = img.src.replace('_F75454_', '_FFFFFF_');
                                    }
                                }
                            });
                        },
                        { threshold: 0.5 } // Trigger when 50% of the section is visible
                    );

                    observer.observe(section3);
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