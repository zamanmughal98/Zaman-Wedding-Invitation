import { countdownParts } from '../utils.js';

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
