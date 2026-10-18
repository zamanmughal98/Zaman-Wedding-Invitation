import { assetUrl, coupleNames, escapeHtml as e, formatDate } from '../utils.js';
import { botanical, flourish } from './artwork.js';
import { heading, icon } from './shared.js';

function coupleMedia(w) {
  const video = assetUrl(w.invitation.heroVideo);
  const picture = assetUrl(w.invitation.heroPhoto);
  const poster = assetUrl(w.invitation.heroVideoPoster || w.invitation.heroPhoto);
  if (video)
    return `<div class="couple-media" data-couple-media><video class="couple-video" src="${e(video)}" ${poster ? `poster="${e(poster)}"` : ''} muted loop playsinline preload="metadata" aria-label="Zaman and Nimra’s wedding animation"></video><button class="video-toggle text-link" type="button" data-toggle-video aria-label="Play wedding animation">Play animation</button></div>`;
  if (picture)
    return `<div class="couple-media"><img class="couple-photograph" src="${e(picture)}" alt="${e(coupleNames(w))}" style="object-position:${e(w.invitation.heroPhotoPosition)}" data-photo-fallback="arch" fetchpriority="high" /></div>`;
  return '';
}

export function hero(w) {
  return /* HTML */ `
    <section class="hero section" id="home" aria-labelledby="hero-title">
      <div class="hero-topline">
        <span>With love & blessings</span>
        <span>${e(w.invitation.period || formatDate(w.invitation.date, w.site))}</span>
      </div>
      <div class="hero-arch">
        <div class="arch-border" aria-hidden="true"></div>
        ${botanical('hero-sprig hero-sprig-left')}${botanical('hero-sprig hero-sprig-right')}
        <div class="hero-inner">
          <p class="arabic" lang="ar" dir="rtl">${e(w.invitation.arabic)}</p>
          <p class="hero-hosts">${e(w.invitation.hosts || w.invitation.together)}</p>
          <p class="host-message">${e(w.invitation.hostMessage || w.invitation.eyebrow)}</p>
          <h1 id="hero-title">
            <span>${e(w.couple.groom.fullName)}</span>
            <span class="hero-and">&</span>
            <span>${e(w.couple.bride.fullName)}</span>
          </h1>
          ${coupleMedia(w)} ${flourish()}
          <p class="eyebrow">Wedding celebrations</p>
          <p class="hero-date">
            ${e(w.invitation.period || formatDate(w.invitation.date, w.site))}
          </p>
          <p class="hero-city">${e(w.invitation.city)}</p>
          <p class="hero-message">${e(w.invitation.message)}</p>
          <blockquote class="hero-verse">
            “${e(w.invitation.verse)}”
            <cite>${e(w.invitation.verseSource)}</cite>
          </blockquote>
        </div>
      </div>
      ${w.sections.some((section) => section.id === 'celebrations' && section.enabled) ? '<a class="scroll-cue" href="#celebrations"><span>Our celebrations</span><span class="scroll-cue-line"></span></a>' : ''}
    </section>
  `;
}

export function countdown(w) {
  return /* HTML */ `
    <section class="section countdown-section" id="countdown">
      ${heading(w.countdown.eyebrow, w.countdown.title, w.countdown.message)}
      <div class="countdown reveal" role="timer" aria-label="Time until our Walima" data-countdown>
        ${[
          ['days', 'Days'],
          ['hours', 'Hours'],
          ['minutes', 'Minutes'],
          ['seconds', 'Seconds'],
        ]
          .map(
            ([key, label]) =>
              `<div class="countdown-unit"><span data-time="${key}">00</span><small>${label}</small></div>`,
          )
          .join('')}
      </div>
      <p class="countdown-date reveal">
        ${icon('calendar')}${e(formatDate(w.countdown.targetDate || w.invitation.date, w.site, { weekday: 'long' }))}
      </p>
    </section>
  `;
}

export function saveTheDate(w) {
  return /* HTML */ `
    <section class="section save-date-section" id="save-the-date">
      ${heading('A day to remember', 'Save our date', 'Our Nikah & Barat · A little surprise, sealed with love.')}
      <div class="scratch-card reveal">
        <div class="scratch-reveal">
          <p class="eyebrow">Nikah & Barat</p>
          <p class="scratch-date">${e(formatDate(w.invitation.date, w.site))}</p>
          <p>${e(w.invitation.greeting)}</p>
          ${flourish()}
        </div>
        <canvas id="scratch-canvas" aria-hidden="true"></canvas>
      </div>
      <button class="text-link scratch-button" type="button" data-reveal-date>
        Scratch above, or tap to reveal ${icon('arrow')}
      </button>
      <p class="scratch-status sr-only" role="status"></p>
    </section>
  `;
}
