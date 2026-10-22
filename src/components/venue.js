import { escapeHtml as e, eventDate, eventTime, formatDate } from '../utils.js';
import { heading, icon, mapLink } from './shared.js';

export function venue(w) {
  const event = w.events.find((item) => item.id === w.venue.primaryEventId) || w.events[0];
  if (!event) return '';
  return /* HTML */ `
    <section class="section venue-section" id="venue">
      ${heading('Join us for the evening', 'A place to celebrate', w.venue.message)}
      <article class="venue-card reveal">
        <p class="eyebrow">${e(event.name)}</p>
        <h3>${e(event.venue || 'Venue to be confirmed')}</h3>
        ${event.address ? `<p class="venue-address">${e(event.address)}</p>` : ''}
        <p>${e(formatDate(eventDate(event), w.site))} · ${e(eventTime(event, w.site))}</p>
        <div class="venue-actions">
          ${event.mapsUrl ? mapLink(event, 'button button-primary', 'Open in Google Maps') : ''}
          ${event.address ? `<button class="text-link" type="button" data-copy-address="${e(event.id)}">${icon('copy')}Copy venue address</button>` : ''}
        </div>
      </article>
    </section>
  `;
}
