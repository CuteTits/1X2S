function initializeNavbar() {
    const mainNav = document.querySelector('.navigation-menu-bar-header-top-dynamic-0-desktop-1080');
    const divider = document.querySelector('.Navigational-header-expanding-element-dynamic-0');

    function handleScroll() {
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




document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ navbar.js loaded");

  fetch("/api/session")
    .then(res => res.json())
    .then(data => {
      console.log("Session response:", data);

      const loginBtn = document.querySelector(".loginbtn");
      const signupBtn = document.querySelector(".signupbtn");
      const userOptions = document.querySelector(".navigation-menu-desktop-buttons-user-options");

      console.log("loginBtn:", loginBtn);
      console.log("signupBtn:", signupBtn);
      console.log("userOptions:", userOptions);

if (data.loggedIn) {
    console.log("User is logged in → swapping buttons");

    if (loginBtn) loginBtn.remove();
    if (signupBtn) signupBtn.remove();

    // Create dropdown container
    const dropdownDiv = document.createElement("div");
    dropdownDiv.classList.add("user-nav-dropdown");

    // Main username button
    const usernameButton = document.createElement("div");
    usernameButton.classList.add("nav-dropdown-btn");
    usernameButton.textContent = "Loading...";

    // Dropdown content
    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("nav-dropdown-content");
    dropdownContent.innerHTML = `
        <a href="/account">Account</a>
        <a href="/dashboard">Dashboard</a>
        <span class"logout"><a href="/api/logout" id="logout-link-nav-dropdown"><span class="material-symbols-outlined">logout</span>Logout</a></span>
    `;
    

    dropdownDiv.appendChild(usernameButton);
    dropdownDiv.appendChild(dropdownContent);
    userOptions.appendChild(dropdownDiv);

    // Fetch account info
    fetch('/api/account', { credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load account info');
            return res.json();
        })
        .then(account => {
        usernameButton.innerHTML = `
        <span class="material-symbols-outlined profile-icon">account_circle</span>
        Hello, ${account.name}
        `;
        })
        .catch(err => {
            console.error('Account fetch error:', err);
            usernameButton.textContent = "Logged in";
        });

    // Logout link works normally
    document.getElementById("logout-link-nav-dropdown").addEventListener("click", (e) => {
        e.preventDefault();
        fetch("/api/logout", { method: "POST" })
            .then(() => window.location.href = "/");
    });
}


    else {
            console.log("User not logged in → keeping login/register");
        }
        })
        .catch(err => console.error("Session check failed:", err));
    });




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




