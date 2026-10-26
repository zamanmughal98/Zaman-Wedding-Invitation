import { createGuestLocalizer, languageFrom } from '../localization.js';
import { readStored, writeStored } from '../utils.js';
import { loadUrduFont } from './fonts.js';

export function initLanguage(w) {
  const key = w.id + ':language';
  const params = new URLSearchParams(location.search);
  const requested = params.get('lang');
  let language = languageFrom(
    ['en', 'ur'].includes(requested) ? requested : readStored(key, w.site.language),
  );
  const localizer = createGuestLocalizer(document.body, { language });
  const englishTitle = document.title;
  function apply() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    loadUrduFont(language);
    document.title = language === 'ur' ? 'ضمن مغل اور نمرہ شفیق — شادی کی تقریبات' : englishTitle;
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    localizer.setLanguage(language);
    // These are separate Apps Script documents. Their input drafts are saved on
    // each keystroke by that service before changing the public language URL.
    document.querySelectorAll('[data-guest-service]').forEach((element) => {
      const attribute = element.tagName === 'IFRAME'
        ? (element.hasAttribute('data-src') ? 'data-src' : 'src')
        : 'href';
      const value = element.getAttribute(attribute);
      if (!value) return;
      const current = new URL(value, location.href);
      const url = new URL(current.href);
      if (language === 'ur') url.searchParams.set('lang', 'ur');
      else url.searchParams.delete('lang');
      if (url.href !== current.href) {
        if (attribute === 'src' && element.matches('.wishes-widget') && url.searchParams.has('embedChannel'))
          url.searchParams.set('embedChannel', crypto.randomUUID());
        element.setAttribute(attribute, url.href);
      }
    });
    document.dispatchEvent(new CustomEvent('wedding:language', { detail: { language } }));
  }
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      language = languageFrom(button.dataset.language);
      writeStored(key, language);
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
      apply();
    });
  });
  if (['en', 'ur'].includes(requested)) writeStored(key, language);
  apply();
  return localizer;
}
