import { escapeHtml as e, formatDate, formatTime } from '../utils.js';
import { scene } from './artwork.js';
import { heading, icon, mapLink } from './shared.js';

export function celebrations(w) {
  return /* HTML */ `
    <section class="section celebrations-section" id="celebrations">
      ${heading('Sacred wedding ceremonies', 'The wedding festivities', 'A few beautiful days. A lifetime of memories.')}
      <div class="event-list">
        ${w.events
          .map(
            (event, index) => /* HTML */ `
              <article class="event-card tone-${e(event.tone)} reveal" id="event-${e(event.id)}">
                <div class="event-illustration">
                  ${scene(event.illustration)}
                  <span class="event-number">0${index + 1}</span>
                  <span class="event-urdu" lang="ur" dir="rtl">${e(event.urdu)}</span>
                </div>
                <div class="event-content">
                  <p class="eyebrow">${e(event.eyebrow)}</p>
                  <h3>${e(event.name)}</h3>
                  <p class="event-description">${e(event.description)}</p>
                  <dl class="event-details">
                    <div>
                      <dt>Date</dt>
                      <dd>${e(formatDate(event.start, w.site, { weekday: 'short' }))}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>${e(formatTime(event.start, w.site))} onwards</dd>
                    </div>
                    <div class="event-venue">
                      <dt>Venue</dt>
                      <dd>${e(event.venue)}</dd>
                    </div>
                  </dl>
                  <p class="event-dress">${e(event.dressCode)}</p>
                  <div class="event-actions">
                    ${mapLink(event)}
                    <button class="text-link" type="button" data-calendar="${e(event.id)}">
                      ${icon('calendar')}Add to calendar
                    </button>
                  </div>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  `;
}
