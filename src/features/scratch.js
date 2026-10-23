import { formatDate } from '../utils.js';

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
