// The supplied animation is an optional asset; no generated faces are required.
export function initCoupleMedia() {
  const video = document.querySelector('.couple-video');
  if (!video) return;
  const button = document.querySelector('[data-toggle-video]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    button.textContent = video.paused ? 'Play animation' : 'Pause animation';
    button.setAttribute(
      'aria-label',
      video.paused ? 'Play wedding animation' : 'Pause wedding animation',
    );
  }
  async function play() {
    try {
      await video.play();
    } catch {
      /* Keep the play button available when autoplay is blocked. */
    }
    update();
  }
  button.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', () => {
    video.closest('[data-couple-media]').hidden = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) video.pause();
  });
  if (!motion.matches) play();
  update();
}
