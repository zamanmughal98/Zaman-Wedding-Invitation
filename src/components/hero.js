import { assetUrl, coupleNames, escapeHtml as e, formatDate, initials } from '../utils.js';
import { botanical, flourish, scene } from './artwork.js';
import { heading, icon } from './shared.js';

export function hero(w) {
  const picture = assetUrl(w.invitation.heroPhoto);
  return /* HTML */ `
    <section class="hero section" id="home" aria-labelledby="hero-title">
      <div class="hero-topline">
        <span>With love & blessings</span>
        <span>
          ${e(formatDate(w.invitation.date, w.site, { day: '2-digit', month: '2-digit', year: 'numeric' }))}
        </span>
      </div>
      <div class="hero-arch ${picture ? 'has-photo' : ''}">
        ${picture ? `<img class="hero-photo" src="${e(picture)}" alt="${e(coupleNames(w))}" style="object-position:${e(w.invitation.heroPhotoPosition)}" fetchpriority="high" />` : ''}
        <div class="arch-border" aria-hidden="true"></div>
        ${botanical('hero-sprig hero-sprig-left')}${botanical('hero-sprig hero-sprig-right')}
        <div class="hero-inner">
          <p class="arabic" lang="ar" dir="rtl">${e(w.invitation.arabic)}</p>
          <p class="bismillah-translation">${e(w.invitation.transliteration)}</p>
          <div class="hero-monogram" aria-hidden="true">${e(initials(w, ''))}</div>
          <p class="eyebrow">${e(w.invitation.eyebrow)}</p>
          <h1 id="hero-title">
            <span>${e(w.couple.bride.name)}</span>
            <span class="hero-and">&</span>
            <span>${e(w.couple.groom.name)}</span>
          </h1>
          <p class="together">${e(w.invitation.together)}</p>
          ${flourish()}
          <p class="hero-date">${e(formatDate(w.invitation.date, w.site, { weekday: 'long' }))}</p>
          <p class="hero-city">${e(w.invitation.city)}</p>
          <blockquote class="hero-verse">
            “${e(w.invitation.verse)}”
            <cite>${e(w.invitation.verseSource)}</cite>
          </blockquote>
        </div>
        ${!picture ? scene('palace', 'hero-palace') : ''}
      </div>
      <a
        class="scroll-cue"
        href="#${e(w.sections.find((s) => s.enabled && s.id !== 'home')?.id || 'main')}"
      >
        <span>The celebration awaits</span>
        <span class="scroll-cue-line"></span>
      </a>
    </section>
  `;
}

export function countdown(w) {
  return /* HTML */ `
    <section class="section countdown-section" id="countdown">
      ${heading(w.countdown.eyebrow, w.countdown.title, w.countdown.message)}
      <div class="countdown reveal" role="timer" aria-label="Time until the wedding" data-countdown>
        ${[
          ['days', 'Days'],
          ['hours', 'Hours'],
          ['minutes', 'Minutes'],
          ['seconds', 'Seconds'],
        ]
          .map(
            ([key, label]) => /* HTML */ `
              <div class="countdown-unit">
                <span data-time="${key}">00</span>
                <small>${label}</small>
              </div>
            `,
          )
          .join('')}
      </div>
      <p class="countdown-date reveal">
        ${icon('calendar')}${e(formatDate(w.invitation.date, w.site, { weekday: 'long' }))}
      </p>
    </section>
  `;
}

export function saveTheDate(w) {
  return /* HTML */ `
    <section class="section save-date-section" id="save-the-date">
      ${heading('A day to remember', 'Save our date', 'A little surprise, sealed with love.')}
      <div class="scratch-card reveal">
        <div class="scratch-reveal">
          <p class="eyebrow">Our forever begins</p>
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
