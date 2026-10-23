import { assetUrl, coupleNames, escapeHtml as e } from '../utils.js';
import { icon, monogram, languageSwitch } from './shared.js';

export function envelope(w) {
  if (!w.envelope.enabled) return '';
  const film = assetUrl(w.envelope.film?.src);
  const poster = assetUrl(w.envelope.film?.poster);
  return /* HTML */ `
    <dialog class="envelope-intro" id="envelope-dialog" aria-labelledby="envelope-title">
      ${languageSwitch('intro-language')}
      <h2 class="sr-only" id="envelope-title">An invitation to our wedding</h2>
      <div class="envelope-glow" aria-hidden="true"></div>
      <div class="envelope-cover" data-envelope-cover>
        <div class="envelope-stage">
          <div class="envelope-paper">
            <img
              src="${e(assetUrl(w.envelope.image))}"
              alt="An ivory wedding envelope with embossed flowers and an antique gold border"
              width="1024"
              height="1536"
              fetchpriority="high"
            />
          </div>
          <button class="wax-seal" type="button" data-unseal aria-label="Open the wax seal">
            ${monogram(w, 'wax-seal-logo')}
          </button>
        </div>
        <div class="envelope-caption">
          <p class="eyebrow">A little envelope. A lifetime of love.</p>
          <button class="envelope-prompt" type="button" data-unseal>
            ✦ &nbsp; Tap the seal to open &nbsp; ✦
          </button>
        </div>
      </div>
      ${
        film
          ? /* HTML */ `
              <div class="opening-film" data-opening-film hidden inert>
                <div class="opening-film-heading">
                  <p class="eyebrow">Our new beginning</p>
                  <h2 class="opening-film-title" id="opening-film-title" tabindex="-1">
                    ${e(coupleNames(w))}
                  </h2>
                </div>
                <div class="opening-film-scene">
                  <video
                    data-opening-video
                    data-src="${e(film)}"
                    data-poster="${e(poster)}"
                    muted
                    playsinline
                    preload="none"
                    width="1280"
                    height="718"
                    aria-label="Our wedding opening film"
                    aria-describedby="opening-film-description"
                  ></video>
                </div>
                <p class="sr-only" id="opening-film-description">
                  A couple walk towards each other in a flower-filled hall, then sit together on the
                  wedding stage.
                </p>
                <div class="opening-film-controls">
                  <button class="text-link" type="button" data-toggle-film>Pause film</button>
                  ${w.music.enabled ? `<button class="icon-button opening-film-sound" type="button" data-toggle-music aria-label="Play background music" aria-pressed="false">${icon('mute')}</button>` : ''}
                </div>
                <p class="sr-only" role="status" data-film-status></p>
                <div class="opening-film-progress" aria-hidden="true">
                  <span data-film-progress></span>
                </div>
              </div>
            `
          : ''
      }
      <button class="intro-skip" type="button" data-open-invitation>
        Skip to invitation ${icon('arrow')}
      </button>
    </dialog>
  `;
}
