import { calendarFile, countdownParts, downloadFile, formatDate } from '../utils.js';
import { photo } from '../components/shared.js';
import { scene } from '../components/artwork.js';

let toastTimer;
export function toast(message) {
  const element = document.querySelector('.toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.hidden = true;
  }, 4500);
}

export function initCountdown(w) {
  const container = document.querySelector('[data-countdown]');
  if (!container) return;
  let timer;
  function tick() {
    const parts = countdownParts(w.countdown.targetDate || w.invitation.date);
    for (const [key, value] of Object.entries(parts))
      container.querySelector(`[data-time="${key}"]`).textContent = String(value).padStart(2, '0');
    if (Date.now() >= new Date(w.countdown.targetDate || w.invitation.date).getTime()) {
      document.querySelector('#countdown h2').textContent = w.countdown.completed;
      clearInterval(timer);
    }
  }
  function start() {
    clearInterval(timer);
    tick();
    if (Date.now() < new Date(w.countdown.targetDate || w.invitation.date).getTime())
      timer = setInterval(tick, 1000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else start();
  });
  start();
}

export function initScratch(w) {
  const canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  const card = canvas.closest('.scratch-card');
  const button = document.querySelector('[data-reveal-date]');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    canvas.hidden = true;
    button.hidden = true;
    return;
  }
  let revealed = false,
    drawing = false,
    previous;
  function draw() {
    if (revealed) return;
    const width = card.clientWidth,
      height = card.clientHeight;
    canvas.width = width * 2;
    canvas.height = height * 2;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.globalCompositeOperation = 'source-over';
    const styles = getComputedStyle(document.documentElement);
    const cover = styles.getPropertyValue('--scratch-cover').trim();
    const shade = styles.getPropertyValue('--scratch-cover-shade').trim();
    const ink = styles.getPropertyValue('--scratch-cover-ink').trim();
    const accent = styles.getPropertyValue('--scratch-cover-accent').trim();
    const foil = context.createLinearGradient(0, 0, width, height);
    foil.addColorStop(0, cover);
    foil.addColorStop(1, shade);
    context.fillStyle = foil;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = accent;
    context.lineWidth = 0.7;
    context.strokeRect(11, 11, width - 22, height - 22);
    context.strokeRect(16, 16, width - 32, height - 32);
    context.fillStyle = accent;
    context.textAlign = 'center';
    context.font = '25px "Cormorant Garamond", Georgia, serif';
    context.fillText('✧', width / 2, 76);
    context.fillStyle = ink;
    context.font = `${width < 330 ? 29 : 34}px "Great Vibes", cursive`;
    context.fillText('A date written for us', width / 2, 122);
    context.fillStyle = accent;
    context.font = '9px "Jost", sans-serif';
    context.fillText('SCRATCH TO REVEAL OUR DATE', width / 2, 160);
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    drawing = false;
    card.classList.add('is-revealed');
    button.textContent = 'A date to keep close to your heart ✧';
    button.disabled = true;
    document.querySelector('.scratch-status').textContent =
      `Our wedding date is ${formatDate(w.invitation.date, w.site)}.`;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function erase(next) {
    context.globalCompositeOperation = 'destination-out';
    context.lineWidth = 42;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    previous = next;
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (revealed) return;
    drawing = true;
    previous = point(event);
    canvas.setPointerCapture(event.pointerId);
    erase(previous);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (drawing) erase(point(event));
  });
  function finish() {
    if (!drawing) return;
    drawing = false;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0,
      total = 0;
    for (let i = 3; i < pixels.length; i += 64) {
      total++;
      if (pixels[i] < 100) clear++;
    }
    if (clear / total > 0.28) reveal();
  }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  button.addEventListener('click', reveal);
  new ResizeObserver(draw).observe(card);
  document.fonts?.ready.then(draw);
  draw();
}

export function initGallery(w) {
  const dialog = document.getElementById('gallery-dialog');
  if (!dialog || !w.gallery.photos.length) return;
  let current = 0;
  function display(index) {
    current = (index + w.gallery.photos.length) % w.gallery.photos.length;
    const item = w.gallery.photos[current];
    dialog.querySelector('.lightbox-image').innerHTML = photo(item);
    dialog.querySelector('#gallery-dialog-caption').textContent = item.caption;
    dialog.querySelector('[data-gallery-counter]').textContent =
      `${current + 1} / ${w.gallery.photos.length}`;
  }
  document.querySelectorAll('[data-gallery]').forEach((button) =>
    button.addEventListener('click', () => {
      display(Number(button.dataset.gallery));
      dialog.showModal();
    }),
  );
  dialog
    .querySelector('[data-gallery-previous]')
    .addEventListener('click', () => display(current - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => display(current + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      display(current - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      display(current + 1);
    }
  });
}

export function initSharedInteractions(w) {
  document
    .querySelectorAll('[data-close-dialog]')
    .forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog:not(.envelope-intro)').forEach((dialog) =>
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }),
  );
  document.querySelectorAll('[data-calendar]').forEach((button) =>
    button.addEventListener('click', () => {
      const event = w.events.find((item) => item.id === button.dataset.calendar);
      if (event)
        downloadFile(
          `${event.id}-invitation.ics`,
          calendarFile(event, w),
          'text/calendar;charset=utf-8',
        );
    }),
  );
  document.querySelectorAll('[data-copy-address]').forEach((button) =>
    button.addEventListener('click', async () => {
      const event = w.events.find((item) => item.id === button.dataset.copyAddress);
      if (!event) return;
      try {
        await navigator.clipboard.writeText(
          [event.venue, event.address].filter(Boolean).join(', '),
        );
        toast('The address is copied. See you there!');
      } catch {
        toast(`Address: ${[event.venue, event.address].filter(Boolean).join(', ')}`);
      }
    }),
  );
  document.addEventListener(
    'error',
    (event) => {
      const image = event.target;
      if (image instanceof HTMLImageElement && image.hasAttribute('data-portrait-photo')) {
        // Keep the matching monogram visible if a personal photo cannot load.
        image.remove();
        return;
      }
      if (image instanceof HTMLImageElement && image.hasAttribute('data-photo-fallback')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'illustrated-photo';
        placeholder.innerHTML = scene(image.dataset.photoFallback);
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', image.alt || 'Wedding illustration');
        image.replaceWith(placeholder);
      }
      if (image instanceof HTMLImageElement && image.classList.contains('hero-photo')) {
        image.closest('.hero-arch').classList.remove('has-photo');
        image.remove();
      }
    },
    true,
  );
  // Some cached image errors precede the event listener.
  document
    .querySelectorAll('img[data-photo-fallback], img[data-portrait-photo], img.hero-photo')
    .forEach((image) => {
      if (image.complete && !image.naturalWidth) image.dispatchEvent(new Event('error'));
    });
}
