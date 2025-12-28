function loadFooter() {
    const footerContainer = document.getElementById('footer-container'); // Ensure this ID exists in your HTML

    if (footerContainer) {
        fetch('/footer.html') // Path to your footer.html file
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load footer: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                footerContainer.innerHTML = data; // Insert the footer content
            })
            .catch(error => console.error('Error loading footer:', error));
    } else {
        console.error('Footer container not found. Make sure an element with ID "footer-container" exists.');
    }
}

// Call the function to load the footer
document.addEventListener('DOMContentLoaded', loadFooter);