import { coupleNames, escapeHtml as e, formatDate, initials } from '../utils.js';
import { flourish } from './artwork.js';
import { icon } from './shared.js';

export function envelope(w) {
  if (!w.envelope.enabled) return '';
  return /* HTML */ `
    <dialog class="envelope-intro" id="envelope-dialog" aria-labelledby="envelope-title">
      <h2 class="sr-only" id="envelope-title">An invitation to our wedding</h2>
      <div class="envelope-glow" aria-hidden="true"></div>
      <div class="envelope-stage">
        <div class="envelope-paper">
          <img
            src="${e(w.envelope.image)}"
            alt="An ivory wedding envelope with embossed flowers and an antique gold border"
            width="1024"
            height="1536"
            fetchpriority="high"
          />
        </div>
        <button class="wax-seal" type="button" data-unseal aria-label="Open the wax seal">
          <span>${e(initials(w, ''))}</span>
        </button>
        <div class="envelope-letter" aria-hidden="true" inert>
          <p class="arabic" lang="ar" dir="rtl">${e(w.invitation.arabic)}</p>
          <p class="eyebrow">${e(w.invitation.eyebrow)}</p>
          <p class="letter-names">${e(coupleNames(w))}</p>
          ${flourish()}
          <p class="letter-date">${e(formatDate(w.invitation.date, w.site))}</p>
          <p class="letter-verse">“${e(w.invitation.verse)}”</p>
          <button class="button button-primary" type="button" data-open-invitation>
            Enter the celebration ${icon('arrow')}
          </button>
        </div>
      </div>
      <div class="envelope-caption">
        <p class="eyebrow">A little envelope. A lifetime of love.</p>
        <button class="envelope-prompt" type="button" data-unseal>
          ✦ &nbsp; Tap the seal to open &nbsp; ✦
        </button>
      </div>
      <button class="intro-skip" type="button" data-open-invitation>
        Skip to invitation ${icon('arrow')}
      </button>
    </dialog>
  `;
}
