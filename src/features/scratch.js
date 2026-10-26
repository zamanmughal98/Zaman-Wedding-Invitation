import { formatDate } from '../utils.js';
import { translateGuestText } from '../localization.js';

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
    painted = false,
    drawing = false,
    previous;
  function draw() {
    if (revealed) return;
    const width = card.clientWidth,
      height = card.clientHeight;
    // Hidden sections can report zero size during font loading or layout changes.
    // Keep the existing bitmap so scratched progress survives until it is visible.
    if (width <= 0 || height <= 0) {
      drawing = false;
      return;
    }
    let mask;
    if (painted && canvas.width > 0 && canvas.height > 0) {
      mask = document.createElement('canvas');
      mask.width = canvas.width;
      mask.height = canvas.height;
      mask.getContext('2d').drawImage(canvas, 0, 0);
    }
    canvas.width = width * 2;
    canvas.height = height * 2;
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.globalCompositeOperation = 'source-over';
    const styles = getComputedStyle(document.documentElement);
    const urdu = document.documentElement.lang === 'ur';
    const t = (value) => translateGuestText(value, document.documentElement.lang);
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
    context.direction = urdu ? 'rtl' : 'ltr';
    context.font = urdu
      ? '23px "Noto Naskh Arabic", serif'
      : `${width < 330 ? 29 : 34}px "Great Vibes", cursive`;
    context.fillText(t('A date written for us'), width / 2, 122);
    context.fillStyle = accent;
    context.font = urdu ? '16px "Noto Naskh Arabic", serif' : '9px "Jost", sans-serif';
    context.fillText(t('SCRATCH TO REVEAL OUR DATE'), width / 2, 160);
    if (mask) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(mask, 0, 0, canvas.width, canvas.height);
      context.restore();
    }
    painted = true;
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
    if (revealed || !painted || canvas.width <= 0 || canvas.height <= 0) return;
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
    if (canvas.width <= 0 || canvas.height <= 0) return;
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
  document.addEventListener('wedding:language', draw);
  document.fonts?.ready.then(draw);
  document.fonts?.addEventListener('loadingdone', draw);
  draw();
}
