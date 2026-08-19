import { translations, SUPPORTED_LANGUAGES } from './translations.js';

const STORAGE_LANG_KEY = 'alsina_anchor_lang_v1';

let currentLang = 'es';

export function initI18n() {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && translations[saved]) {
      currentLang = saved;
    } else {
      const browserLang = navigator.language ? navigator.language.slice(0, 2).toLowerCase() : 'es';
      if (translations[browserLang]) {
        currentLang = browserLang;
      }
    }
  } catch (e) {
    currentLang = 'es';
  }
  applyTranslations();
  return currentLang;
}

export function getCurrentLanguage() {
  return currentLang;
}

export function getLanguageInfo(code = currentLang) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

export function t(key) {
  const dict = translations[currentLang] || translations.es;
  return dict[key] || translations.es[key] || key;
}

export function setLanguage(langCode) {
  if (!translations[langCode]) return;
  currentLang = langCode;
  try {
    localStorage.setItem(STORAGE_LANG_KEY, langCode);
  } catch (e) {
    console.error(e);
  }
  applyTranslations();
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
}

export function applyTranslations() {
  // Update text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Update titles/tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });

  // Update active language label in profile
  const currentLangLabel = document.getElementById('currentLanguageLabel');
  if (currentLangLabel) {
    const info = getLanguageInfo(currentLang);
    currentLangLabel.textContent = info.nativeName;
  }
}
