import { assetUrl } from '../utils.js';
import { icon } from '../components/shared.js';
import { toast } from './interactions.js';

// Play the supplied track after an invitation tap; the sound button always controls playback.
export function initMusic(w) {
  const button = document.querySelector('[data-toggle-music]');
  if (!button) return;
  let audio,
    context,
    master,
    interval,
    mediaSource,
    playing = false,
    introStartAttempted = false,
    playbackVersion = 0;
  const oscillators = new Set();
  const configuredVolume = Number(w.music.volume);
  const volume = Math.max(
    0,
    Math.min(0.5, Number.isFinite(configuredVolume) ? configuredVolume : 0.15),
  );
  function update() {
    button.innerHTML = icon(playing ? 'sound' : 'mute');
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Mute background music' : 'Play background music');
  }
  function audioContext() {
    if (context && context.state !== 'closed') return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
    return context;
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
    const version = ++playbackVersion;
    const src = assetUrl(w.music.src);
    if (src) {
      if (!audio) {
        audio = new Audio();
        audio.preload = 'none';
        audio.loop = true;
        audio.src = src;
      }
      if (audioContext()) {
        if (!mediaSource) {
          // GainNode also provides soft volume on mobile browsers with fixed media volume.
          mediaSource = context.createMediaElementSource(audio);
          mediaSource.connect(master);
        }
        // Call both synchronously during the tap, before yielding to the browser.
        await Promise.all([context.resume(), audio.play()]);
      } else {
        audio.volume = volume;
        await audio.play();
      }
    } else if (w.music.ambientFallback) {
      if (!audioContext()) throw new Error('Audio is unavailable in this browser.');
      await context.resume();
      if (version === playbackVersion && !document.hidden) {
        chime();
        interval = setInterval(chime, 7000);
      }
    } else {
      throw new Error('Music will be added soon.');
    }
    // Leaving or hiding the page while audio is loading must still cancel playback.
    if (version !== playbackVersion || document.hidden) {
      await stop();
      return;
    }
    playing = true;
    update();
  }
  async function stop() {
    playbackVersion++;
    playing = false;
    update();
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
  }
  async function setPlayback(shouldPlay) {
    if (button.disabled) return;
    button.disabled = true;
    try {
      if (shouldPlay) await start();
      else await stop();
    } catch {
      await stop();
      toast('Music could not start. Tap again or continue enjoying the invitation.');
    } finally {
      button.disabled = false;
    }
  }
  button.addEventListener('click', () => {
    introStartAttempted = true;
    void setPlayback(!playing);
  });
  if (w.music.startOnOpen) {
    document.querySelectorAll('[data-unseal], [data-open-invitation]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        if (introStartAttempted) return;
        introStartAttempted = true;
        if (!playing) void setPlayback(true);
      });
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (playing || button.disabled)) void stop();
  });
  window.addEventListener('pagehide', (event) => {
    stop();
    if (!event.persisted) context?.close();
  });
  update();
}
