export function initEnvelope() {
  const dialog = document.getElementById('envelope-dialog');
  if (!dialog) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cover = dialog.querySelector('[data-envelope-cover]');
  const seal = dialog.querySelector('.wax-seal');
  const film = dialog.querySelector('[data-opening-film]');
  const video = dialog.querySelector('[data-opening-video]');
  const toggle = dialog.querySelector('[data-toggle-film]');
  const skip = dialog.querySelector('[data-open-invitation]');
  const status = dialog.querySelector('[data-film-status]');
  const progress = dialog.querySelector('[data-film-progress]');
  let phase = 'closed';
  let version = 0;
  let transitionTimer, closingTimer;
  let returnFocus;

  function setStatus(message, visible = false) {
    status.textContent = message;
    status.classList.toggle('sr-only', !visible);
  }
  function updatePlayback() {
    if (!toggle) return;
    toggle.textContent = video.paused ? 'Play film' : 'Pause film';
    toggle.setAttribute('aria-label', video.paused ? 'Play opening film' : 'Pause opening film');
  }
  function prepareFilm() {
    if (!video || video.hasAttribute('src')) return;
    video.preload = 'auto';
    if (video.dataset.poster) video.poster = video.dataset.poster;
    const connection = navigator.connection;
    const useLight = window.matchMedia('(max-width: 700px)').matches ||
      connection?.saveData || (connection?.downlink > 0 && connection.downlink < 3);
    video.src = (useLight && video.dataset.lightSrc) || video.dataset.src;
    video.load();
  }
  function warmFilm() {
    const connection = navigator.connection;
    if (
      phase !== 'envelope' ||
      reduced.matches ||
      connection?.saveData ||
      connection?.effectiveType !== '4g' ||
      (connection.downlink > 0 && connection.downlink < 3) || connection.rtt > 300
    )
      return;
    prepareFilm();
  }
  function enter() {
    if (phase === 'closed' || phase === 'leaving') return;
    phase = 'leaving';
    version++;
    clearTimeout(transitionTimer);
    const releaseFilm = video && !video.ended;
    video?.pause();
    if (!returnFocus) window.scrollTo({ top: 0, behavior: 'instant' });
    dialog.classList.add('is-leaving');
    closingTimer = setTimeout(
      () => {
        phase = 'closed';
        dialog.close();
        if (releaseFilm) {
          video.preload = 'none';
          video.removeAttribute('src');
          video.load();
        }
        const target =
          returnFocus || document.getElementById('hero-title') || document.getElementById('main');
        if (target) {
          if (!returnFocus) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      },
      reduced.matches ? 0 : 500,
    );
  }
  async function play() {
    if (phase !== 'film' || document.hidden) return;
    const attempt = ++version;
    if (video.error) {
      video.removeAttribute('src');
      prepareFilm();
    }
    toggle.disabled = true;
    setStatus('The film is loading. You can skip to the invitation at any time.', true);
    try {
      await video.play();
      if (attempt !== version || phase !== 'film') return;
      setStatus('Opening film playing. You can skip to the invitation at any time.');
    } catch {
      if (attempt === version && phase === 'film') playbackFailed();
    } finally {
      if (attempt === version) {
        toggle.disabled = false;
        updatePlayback();
      }
    }
  }
  function playbackFailed() {
    version++;
    video.pause();
    toggle.disabled = false;
    updatePlayback();
    setStatus('The film could not play. Select Play film to try again, or skip to the invitation.', true);
  }
  function startFilm(manual = false) {
    if (phase !== 'envelope') return;
    if (!video) {
      enter();
      return;
    }
    phase = 'transition';
    cover.inert = true;
    seal.disabled = true;
    skip.focus({ preventScroll: true });
    dialog.classList.add('is-unsealed');
    prepareFilm();
    video.currentTime = 0;
    film.style.setProperty('--film-zoom', '0');
    if (progress) progress.style.transform = 'scaleX(0)';
    transitionTimer = setTimeout(
      () => {
        if (phase !== 'transition') return;
        cover.hidden = true;
        film.hidden = false;
        film.inert = false;
        dialog.classList.add('is-film');
        dialog.setAttribute('aria-labelledby', 'opening-film-title');
        phase = 'film';
        document.getElementById('opening-film-title').focus({ preventScroll: true });
        updatePlayback();
        void play();
      },
      manual || reduced.matches ? 0 : 500,
    );
  }
  function show(trigger) {
    version++;
    clearTimeout(transitionTimer);
    clearTimeout(closingTimer);
    video?.pause();
    phase = 'envelope';
    returnFocus = trigger;
    dialog.classList.remove('is-unsealed', 'is-film', 'is-leaving');
    dialog.setAttribute('aria-labelledby', 'envelope-title');
    cover.hidden = false;
    cover.inert = false;
    seal.disabled = false;
    if (film) {
      film.hidden = true;
      film.inert = true;
      toggle.disabled = false;
      setStatus('');
    }
    if (!dialog.open) dialog.showModal();
    seal.focus({ preventScroll: true });
    const image = cover.querySelector('img');
    if (image.complete) setTimeout(warmFilm, 300);
    else image.addEventListener('load', () => setTimeout(warmFilm, 300), { once: true });
  }
  dialog
    .querySelectorAll('[data-unseal]')
    .forEach((button) => button.addEventListener('click', () => startFilm()));
  skip.addEventListener('click', enter);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    enter();
  });
  document.querySelector('[data-replay-envelope]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    show();
  });
  document.querySelector('[data-replay-film]')?.addEventListener('click', (event) => {
    show(event.currentTarget);
    startFilm(true);
  });
  if (video) {
    video.addEventListener('timeupdate', () => {
      // Keep both people visible as they approach; move closer after they meet on phones.
      film.style.setProperty(
        '--film-zoom',
        String(reduced.matches ? 0 : Math.min(1, Math.max(0, (video.currentTime - 4.5) / 1.4))),
      );
      if (progress && Number.isFinite(video.duration) && video.duration > 0) {
        progress.style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`;
      }
    });
    toggle.addEventListener('click', () => {
      if (video.paused) void play();
      else {
        version++;
        video.pause();
        setStatus('Film paused.');
      }
    });
    video.addEventListener('play', updatePlayback);
    video.addEventListener('pause', updatePlayback);
    video.addEventListener('playing', () => {
      if (phase !== 'film' || document.hidden) return;
      toggle.disabled = false;
      setStatus('Opening film playing. You can skip to the invitation at any time.');
    });
    video.addEventListener('waiting', () => {
      if (phase !== 'film' || video.paused || document.hidden) return;
      setStatus('The film is buffering. You can skip to the invitation at any time.', true);
    });
    video.addEventListener('ended', enter);
    video.addEventListener('error', () => {
      if (phase === 'film') playbackFailed();
    });
    const pauseWhenHidden = () => {
      if (phase !== 'film') return;
      version++;
      video.pause();
      toggle.disabled = false;
      setStatus('Film paused. Select Play film to continue.');
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseWhenHidden();
    });
    window.addEventListener('pagehide', pauseWhenHidden);
    reduced.addEventListener('change', () => {
      if (reduced.matches) pauseWhenHidden();
    });
  }
  // Refreshing still presents the envelope, while direct section links skip the intro.
  const isReload = window.performance.getEntriesByType('navigation')[0]?.type === 'reload';
  if (isReload || !window.location.hash) show();
}
