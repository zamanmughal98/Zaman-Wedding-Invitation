import { escapeHtml as e, eventDate, formatDate } from '../utils.js';
import { flourish } from './artwork.js';
import { heading } from './shared.js';

export function dressCode(w) {
  const looks = (w.dressCode.looks || [])
    .map((look) => ({ ...look, event: w.events.find((event) => event.id === look.eventId) }))
    .filter((look) => look.event);
  return /* HTML */ `
    <section class="section dress-section" id="dress-code">
      ${heading('A little outfit inspiration', w.dressCode.title, w.dressCode.subtitle)}
      <div class="outfit-grid">
        ${looks
          .map(
            (look, index) => /* HTML */ `
          <article class="outfit-card outfit-tone-${e(look.tone)} reveal" aria-labelledby="outfit-${e(look.event.id)}">
            <div class="outfit-topline">
              <span class="outfit-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <time datetime="${e(look.event.date || look.event.start.slice(0, 10))}">${e(formatDate(eventDate(look.event), w.site, { month: 'short' }))}</time>
            </div>
            <h3 id="outfit-${e(look.event.id)}">${e(look.event.name)}</h3>
            <ul class="outfit-palette" aria-label="Illustrative outfit colours">
              ${look.palette
                .map(
                  (shade) => `
                <li class="fabric-tone-${e(shade.tone)}">
                  <span class="fabric-swatch" aria-hidden="true"></span>
                  <span class="fabric-label">${e(shade.label)}</span>
                </li>
              `,
                )
                .join('')}
            </ul>
            <p class="outfit-suggestion">${e(look.suggestion)}</p>
          </article>
        `,
          )
          .join('')}
      </div>
      ${w.dressCode.message ? `<div class="outfit-invitation reveal">${flourish()}<p>${e(w.dressCode.message)}</p></div>` : ''}
    </section>
  `;
}
