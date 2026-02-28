// Global Translation Utility
class Translator {
  constructor() {
    this.translations = null;
    this.currentLanguage = localStorage.getItem('language') || 'en';
  }

  // Load translations from server
  async init() {
    try {
      const response = await fetch('/locales/translations.json');
      this.translations = await response.json();
      return true;
    } catch (err) {
      console.error('Failed to load translations:', err);
      return false;
    }
  }

  // Get translated text
  t(key) {
    if (!this.translations) {
      console.warn('Translations not loaded');
      return key;
    }
    return this.translations[this.currentLanguage]?.[key] || key;
  }

  // Set language
  setLanguage(lang) {
    if (this.translations && this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      return true;
    }
    return false;
  }

  // Get current language
  getLanguage() {
    return this.currentLanguage;
  }

  // Get available languages
  getAvailableLanguages() {
    return this.translations ? Object.keys(this.translations) : [];
  }

  // Check if loaded
  isLoaded() {
    return this.translations !== null && Object.keys(this.translations).length > 0;
  }

  // Translate all elements with data-i18n attribute
  translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Also handle placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  }
}

// Global instance
window.translator = new Translator();

console.log('📦 Translator instance created, initializing...');

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔄 DOMContentLoaded - initializing translator...');
    const result = await window.translator.init();
    if (result) {
      window.translator.translatePage();
      console.log('✅ Translation system fully initialized. Available languages:', window.translator.getAvailableLanguages());
      // Fire ready event
      window.dispatchEvent(new Event('translatorReady'));
      console.log('🔔 translatorReady event dispatched');
    } else {
      console.error('❌ Failed to initialize translator');
    }
  });
} else {
  // DOM already loaded
  console.log('🔄 DOM already loaded - initializing translator immediately...');
  window.translator.init().then(result => {
    if (result) {
      window.translator.translatePage();
      console.log('✅ Translation system fully initialized. Available languages:', window.translator.getAvailableLanguages());
      // Fire ready event
      window.dispatchEvent(new Event('translatorReady'));
      console.log('🔔 translatorReady event dispatched');
    } else {
      console.error('❌ Failed to initialize translator');
    }
  });
}
