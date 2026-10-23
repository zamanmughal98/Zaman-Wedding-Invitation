import { urdu } from '../config/urdu.js';

export function languageFrom(value) {
  return value === 'ur' ? 'ur' : 'en';
}

// Only authored interface copy is translated. Never send page contents, names,
// form drafts or private moderation data to a translation service.
export function translateGuestText(value, language = 'en', extra = {}) {
  if (language !== 'ur' || !value.trim()) return value;
  const text = value.replace(/\s+/gu, ' ').trim();
  let translated = extra[text] || urdu[text];
  if (!translated)
    for (const [template, replacement] of Object.entries(extra)) {
      if (!template.includes('{')) continue;
      const names = [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
      const pattern = template
        .split(/\{\w+\}/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('(.*?)');
      const match = text.match(new RegExp('^' + pattern + '$', 'u'));
      if (match) {
        translated = replacement.replace(/\{(\w+)\}/g, (_, name) => {
          const value = match[names.indexOf(name) + 1];
          return name === 'event' ? translateGuestText(value, language, extra) : value;
        });
        break;
      }
    }
  if (!translated && /^“.*”$/u.test(text)) {
    const inner = text.slice(1, -1);
    const result = translateGuestText(inner, language, extra);
    if (result !== inner) translated = '“' + result + '”';
  }
  if (!translated && text.startsWith('View '))
    translated = 'دیکھیں: ' + translateGuestText(text.slice(5), language, extra);
  if (!translated && text.startsWith('Address: '))
    translated =
      'پتہ: ' +
      text
        .slice(9)
        .split(', ')
        .map((part) => translateGuestText(part, language, extra))
        .join('، ');
  if (!translated && text.startsWith('Our wedding date is '))
    translated =
      'ہماری شادی کی تاریخ: ' +
      translateGuestText(text.slice(20).replace(/\.$/, ''), language, extra);
  if (!translated && text.endsWith(' Your wish is still in the form.'))
    translated =
      translateGuestText(
        text.slice(0, -' Your wish is still in the form.'.length),
        language,
        extra,
      ) +
      ' ' +
      urdu['Your wish is still in the form.'];
  if (!translated && text.endsWith(' Your completed uploads are safe.'))
    translated =
      translateGuestText(
        text.slice(0, -' Your completed uploads are safe.'.length),
        language,
        extra,
      ) +
      ' ' +
      (extra['Your completed uploads are safe.'] || 'مکمل بھیجی گئی فائلیں محفوظ ہیں۔');
  // Dates continue to come from the one canonical wedding configuration.
  if (
    !translated &&
    /\d/.test(text) &&
    /January|February|March|April|May|June|July|August|September|October|November|December|\bNov\b/.test(
      text,
    )
  ) {
    const words = {
      January: 'جنوری',
      February: 'فروری',
      March: 'مارچ',
      April: 'اپریل',
      May: 'مئی',
      June: 'جون',
      July: 'جولائی',
      August: 'اگست',
      September: 'ستمبر',
      October: 'اکتوبر',
      November: 'نومبر',
      December: 'دسمبر',
      Nov: 'نومبر',
      Monday: 'پیر',
      Tuesday: 'منگل',
      Wednesday: 'بدھ',
      Thursday: 'جمعرات',
      Friday: 'جمعہ',
      Saturday: 'ہفتہ',
      Sunday: 'اتوار',
      PM: 'شام',
      AM: 'صبح',
      pm: 'شام',
      am: 'صبح',
    };
    translated = text.replace(/\b[A-Za-z]+\b/g, (word) => words[word] || word);
  }
  if (!translated && /^\d{1,2}:\d{2}\s[AP]M$/i.test(text))
    translated = text.replace(/pm/i, 'شام').replace(/am/i, 'صبح');
  if (!translated && text.includes(' · ')) {
    const parts = text.split(' · ').map((part) => translateGuestText(part, language, extra));
    if (parts.join(' · ') !== text) translated = parts.join(' · ');
  }
  if (!translated) return value;
  return value.match(/^\s*/u)[0] + translated + value.match(/\s*$/u)[0];
}

// Translate in place so a language switch keeps videos, music, dialogs, scratch
// progress, typed input and event listeners intact. Remember each source node to
// make switching back lossless, including asynchronously updated controls.
export function createGuestLocalizer(root, { language = 'en', extra = {} } = {}) {
  const sources = new WeakMap();
  const attributes = new WeakMap();
  const skip =
    'script, style, svg, textarea, .photo-name, [data-no-translate], [data-user-content]';
  function text(node) {
    if (!node.parentElement || node.parentElement.closest(skip)) return;
    const old = sources.get(node);
    const source =
      old && (node.nodeValue === old.target || node.nodeValue === old.source)
        ? old.source
        : node.nodeValue;
    const target = translateGuestText(source, language, extra);
    sources.set(node, { source, target });
    if (node.nodeValue !== target) node.nodeValue = target;
  }
  function element(node) {
    if (node.closest(skip)) return;
    if (node.matches('input:not([type]), textarea') && !node.hasAttribute('dir')) node.dir = 'auto';
    const saved = attributes.get(node) || {};
    for (const key of ['aria-label', 'title', 'alt', 'placeholder']) {
      if (!node.hasAttribute(key)) continue;
      const value = node.getAttribute(key);
      const old = saved[key];
      const source = old && (value === old.target || value === old.source) ? old.source : value;
      const target = translateGuestText(source, language, extra);
      saved[key] = { source, target };
      if (value !== target) node.setAttribute(key, target);
    }
    attributes.set(node, saved);
  }
  function visit(node) {
    if (node.nodeType === 3) return text(node);
    if (node.nodeType !== 1) return;
    element(node);
    if (node.matches(skip)) return;
    for (const child of node.childNodes) visit(child);
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') text(mutation.target);
      else if (mutation.type === 'attributes') element(mutation.target);
      else for (const node of mutation.addedNodes) visit(node);
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title', 'alt', 'placeholder'],
  });
  root.addEventListener(
    'invalid',
    (event) => {
      if (language === 'ur' && event.target.validity?.valueMissing)
        event.target.setCustomValidity(urdu['Please fill in this field.']);
    },
    true,
  );
  root.addEventListener('input', (event) => event.target.setCustomValidity?.(''));
  visit(root);
  return {
    setLanguage(value) {
      language = languageFrom(value);
      root
        .querySelectorAll('input,textarea,select')
        .forEach((field) => field.setCustomValidity?.(''));
      visit(root);
    },
    translate(value) {
      return translateGuestText(value, language, extra);
    },
    disconnect() {
      observer.disconnect();
    },
  };
}
