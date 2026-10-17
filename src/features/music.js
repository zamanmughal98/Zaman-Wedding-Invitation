import { safeUrl } from '../utils.js';
import { icon } from '../components/shared.js';
import { toast } from './interactions.js';

// A personal MP3 can replace the soft, original ambient chimes through config.
export function initMusic(w) {
  const button = document.querySelector('[data-toggle-music]');
  if (!button) return;
  let audio,
    context,
    master,
    interval,
    playing = false;
  const oscillators = new Set();
  const configuredVolume = Number(w.music.volume);
  const volume = Math.max(0, Math.min(0.5, Number.isFinite(configuredVolume) ? configuredVolume : 0.15));
  function update() {
    button.innerHTML = icon(playing ? 'sound' : 'mute');
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Mute background music' : 'Play background music');
  }
  function chime() {
    const now = context.currentTime;
    [174.61, 261.63, 349.23, 440].forEach((frequency, index) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.09, now + index * 0.65 + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.65 + 5.5);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + index * 0.65);
      oscillator.stop(now + index * 0.65 + 6);
      oscillators.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        oscillators.delete(oscillator);
      };
    });
  }
  async function start() {
    const src = safeUrl(w.music.src);
    if (src) {
      audio ||= new Audio(src);
      audio.loop = true;
      audio.volume = volume;
      await audio.play();
    } else if (w.music.ambientFallback) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio is unavailable in this browser.');
      if (!context || context.state === 'closed') {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = volume;
        master.connect(context.destination);
      }
      await context.resume();
      chime();
      interval = setInterval(chime, 7000);
    } else {
      throw new Error('Music will be added soon.');
    }
    playing = true;
    update();
  }
  async function stop() {
    clearInterval(interval);
    audio?.pause();
    for (const oscillator of oscillators) {
      try {
        oscillator.stop();
      } catch {
        /* Already finished. */
      }
    }
    if (context && context.state !== 'closed') await context.suspend();
    playing = false;
    update();
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      if (playing) await stop();
      else await start();
    } catch {
      await stop();
      toast('Music could not start. Tap again or continue enjoying the invitation.');
    } finally {
      button.disabled = false;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop();
  });
  window.addEventListener('pagehide', (event) => {
    stop();
    if (!event.persisted) context?.close();
  });
  update();
}
