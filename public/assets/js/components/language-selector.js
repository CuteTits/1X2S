// Language Selector Component
(function() {
  console.log('🌍 Language selector script loaded');

  function initLanguageSelector() {
    const toggleBtn = document.getElementById('languageToggleBtn');
    const languageMenu = document.getElementById('languageMenu');
    const languageItems = document.querySelectorAll('.language-menu-item');
    const currentLanguageCode = document.getElementById('currentLanguageCode');

    if (!toggleBtn || !languageMenu || languageItems.length === 0) {
      console.warn('⚠️ Language selector elements not found. Retrying...');
      setTimeout(initLanguageSelector, 100);
      return;
    }

    if (!window.translator) {
      console.warn('⚠️ Translator not available yet. Retrying...');
      setTimeout(initLanguageSelector, 100);
      return;
    }

    console.log('✅ Language selector initializing. Available languages:', window.translator.getAvailableLanguages());

    // Update current language display
    const updateLanguageDisplay = () => {
      const lang = window.translator.getLanguage();
      console.log('📝 Current language:', lang);
      currentLanguageCode.textContent = lang.toUpperCase();
      
      // Update active state
      languageItems.forEach(item => {
        if (item.dataset.lang === lang) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    };

    // Toggle menu
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.language-selector-container')) {
        languageMenu.classList.remove('active');
      }
    });

    // Language selection
    languageItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const lang = item.dataset.lang;

        console.log('🔄 Switching to language:', lang);

        // Update client-side language
        window.translator.setLanguage(lang);

        // Save to server
        try {
          const response = await fetch('/api/set-language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang })
          });

          if (response.ok) {
            console.log(`✅ Language changed to ${lang}`);
            
            // Update display
            updateLanguageDisplay();
            
            // Retranslate page
            window.translator.translatePage();
            
            // Show subtle feedback
            toggleBtn.style.backgroundColor = 'var(--accent-color, #4CAF50)';
            setTimeout(() => {
              toggleBtn.style.backgroundColor = '';
            }, 500);
          } else {
            console.error('Server error:', response.status);
          }
        } catch (err) {
          console.error('❌ Error setting language:', err);
        }

        languageMenu.classList.remove('active');
      });
    });

    // Initialize display
    updateLanguageDisplay();
    console.log('✅ Language selector fully initialized');
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSelector);
  } else {
    // DOM already loaded
    initLanguageSelector();
  }
})();
