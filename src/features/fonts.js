/** Urdu calligraphy is optional at startup and never blocks interaction. */
export function loadUrduFont(language) {
  if (language !== 'ur' || document.getElementById('urdu-calligraphy-font')) return;
  const link = document.createElement('link');
  link.id = 'urdu-calligraphy-font';
  link.rel = 'stylesheet';
  link.media = 'print';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600&display=swap';
  link.addEventListener('load', () => { link.media = 'all'; }, { once: true });
  document.head.append(link);
}
