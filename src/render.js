import { escapeHtml as e } from './utils.js';
import { icon, monogram, languageSwitch } from './components/shared.js';
import { envelope } from './components/envelope.js';
import { hero, countdown, saveTheDate } from './components/hero.js';
import { celebrations } from './components/celebrations.js';
import { couple, families } from './components/people.js';
import { gallery } from './components/memories.js';
import { photoUploads } from './components/photo-uploads.js';
import { venue, dressCode, wishes, footer } from './components/guest-details.js';

const renderers = {
  home: hero,
  countdown,
  'save-the-date': saveTheDate,
  couple,
  celebrations,
  families,
  gallery,
  venue,
  'dress-code': dressCode,
  wishes,
  'photo-uploads': photoUploads,
};

export function renderInvitation(w) {
  const enabled = new Set(
    w.sections.filter((section) => section.enabled).map((section) => section.id),
  );
  return /* HTML */ `
    ${envelope(w)}
    <div class="ambient-background" aria-hidden="true"></div>
    <div class="page-shell">
      ${w.site.preview ? '<div class="preview-ribbon">A little preview of our forever <span>Details to be personalised</span></div>' : ''}
      <header class="site-header">
        <a
          class="header-monogram"
          href="#${e(w.sections.find((section) => section.enabled)?.id || 'main')}"
          aria-label="Back to the invitation"
        >
          ${monogram(w)}
        </a>
        <nav aria-label="Invitation sections">
          ${w.navigation
            .filter((link) => enabled.has(link.section))
            .map(
              (link) => /* HTML */ `
                <a href="#${e(link.section)}">
                  ${e(link.label)}
                </a>
              `,
            )
            .join('')}
        </nav>
        ${w.music.enabled ? `<button class="icon-button music-button" type="button" data-toggle-music aria-label="Play background music" aria-pressed="false">${icon('mute')}</button>` : ''}
        ${languageSwitch()}
        <div class="reading-progress" aria-hidden="true"><span></span></div>
      </header>
      <main id="main">
        ${w.sections
          .filter((section) => section.enabled && renderers[section.id])
          .map((section) => renderers[section.id](w))
          .join('')}
      </main>
      ${footer(w)}
    </div>
    <div class="toast" role="status" aria-live="polite" hidden></div>
  `;
}
