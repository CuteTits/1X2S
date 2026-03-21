// API Documentation JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lang = this.dataset.lang;
      const endpoint = this.closest('.code-examples');
      const codeBlocks = endpoint.querySelectorAll('.code-block');
      const tabs = endpoint.querySelectorAll('.tab-button');

      // Hide all code blocks
      codeBlocks.forEach(block => block.classList.remove('active'));
      // Show selected
      endpoint.querySelector(`.code-block[data-lang="${lang}"]`).classList.add('active');

      // Update tab active state
      tabs.forEach(tab => tab.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Copy functionality
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const codeBlock = this.nextElementSibling;
      const code = codeBlock.textContent;
      try {
        await navigator.clipboard.writeText(code);
        // Visual feedback
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        this.style.background = '#28a745';
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = '#007bff';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy code');
      }
    });
  });

  // Try It functionality
  const tryForms = document.querySelectorAll('.try-form');
  tryForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const endpoint = this.dataset.endpoint;
      const responseDisplay = this.nextElementSibling;
      responseDisplay.textContent = 'Loading...';

      try {
        let url, method, body;
        const inputs = this.querySelectorAll('input');
        const data = {};

        inputs.forEach(input => {
          data[input.placeholder.toLowerCase()] = input.value;
        });

        switch(endpoint) {
          case 'signup':
            url = '/api/signup';
            method = 'POST';
            body = JSON.stringify({
              email: data.email,
              password: data.password,
              country: data.country
            });
            break;
          case 'login':
            url = '/api/login';
            method = 'POST';
            body = JSON.stringify({
              email: data.email,
              password: data.password
            });
            break;
          case 'logout':
            url = '/api/logout';
            method = 'POST';
            body = null;
            break;
          case 'competitions':
            url = '/api/competitions';
            method = 'GET';
            body = null;
            break;
          case 'insights':
            url = '/api/carousel/insights';
            method = 'GET';
            body = null;
            break;
          case 'stock-price':
            url = `/api/stock-price?symbol=${data.symbol}`;
            method = 'GET';
            body = null;
            break;
          // Add cases for other endpoints
          default:
            throw new Error('Unknown endpoint');
        }

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: body
        });

        const result = await response.json();
        responseDisplay.innerHTML = `<pre><code class="language-json">${JSON.stringify(result, null, 2)}</code></pre>`;
        // Re-run Prism for new code
        Prism.highlightAll();

      } catch (error) {
        responseDisplay.textContent = `Error: ${error.message}`;
      }
    });
  });
});