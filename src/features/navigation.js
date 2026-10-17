export function initNavigation() {
  const sections = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('.site-header nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!active) return;
        links.forEach((link) => {
          if (link.hash === '#' + active.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      },
      { rootMargin: '-10% 0px -65% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
  }
  const bar = document.querySelector('.reading-progress span');
  let scheduled = false;
  function progress() {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0})`;
    scheduled = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(progress);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', progress, { passive: true });
  progress();

  // Natural browser scrolling remains available when motion or JS is disabled.
  if (
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const reveals = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          reveals.unobserve(entry.target);
        });
      },
      { threshold: 0.06 },
    );
    document.querySelectorAll('.reveal').forEach((element) => reveals.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
}
